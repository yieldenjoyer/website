import { CacheManager } from '../utils/performance'

export interface ApiError {
  message: string
  status: number
  code?: string
  details?: any
}

export interface ApiResponse<T> {
  data: T
  status: number
  headers: Record<string, string>
}

export class ApiClient {
  private baseUrl: string
  private defaultHeaders: Record<string, string>
  private retryAttempts: number
  private timeout: number

  constructor(options: {
    baseUrl: string
    defaultHeaders?: Record<string, string>
    retryAttempts?: number
    timeout?: number
  }) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '')
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.defaultHeaders
    }
    this.retryAttempts = options.retryAttempts || 3
    this.timeout = options.timeout || 10000
  }

  private async request<T>(
    method: string,
    endpoint: string,
    options: {
      data?: any
      headers?: Record<string, string>
      useCache?: boolean
      cacheTtl?: number
      retries?: number
    } = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const cacheKey = `api:${method}:${url}:${JSON.stringify(options.data || {})}`

    // Check cache for GET requests
    if (method === 'GET' && options.useCache !== false) {
      const cached = CacheManager.getMemoryCache<ApiResponse<T>>(cacheKey)
      if (cached) {
        return cached
      }
    }

    const headers = {
      ...this.defaultHeaders,
      ...options.headers
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    let lastError: ApiError | null = null
    const maxRetries = options.retries ?? this.retryAttempts

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers,
          body: options.data ? JSON.stringify(options.data) : undefined,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await this.parseErrorResponse(response)
          lastError = {
            message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            status: response.status,
            code: errorData.code,
            details: errorData.details
          }

          // Don't retry client errors (4xx), only server errors (5xx)
          if (response.status < 500 || attempt === maxRetries) {
            throw lastError
          }

          // Exponential backoff for retries
          await this.delay(Math.pow(2, attempt) * 1000)
          continue
        }

        const responseHeaders: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value
        })

        let data: T
        const contentType = response.headers.get('content-type')
        
        if (contentType?.includes('application/json')) {
          data = await response.json()
        } else if (contentType?.includes('text/')) {
          data = (await response.text()) as unknown as T
        } else {
          data = (await response.blob()) as unknown as T
        }

        const result: ApiResponse<T> = {
          data,
          status: response.status,
          headers: responseHeaders
        }

        // Cache successful GET requests
        if (method === 'GET' && options.useCache !== false) {
          CacheManager.setMemoryCache(cacheKey, result, options.cacheTtl)
        }

        return result

      } catch (error) {
        clearTimeout(timeoutId)

        if (error.name === 'AbortError') {
          lastError = {
            message: 'Request timeout',
            status: 408,
            code: 'TIMEOUT'
          }
        } else if (error instanceof TypeError && error.message.includes('fetch')) {
          lastError = {
            message: 'Network error - please check your connection',
            status: 0,
            code: 'NETWORK_ERROR'
          }
        } else if (error && typeof error === 'object' && 'status' in error) {
          lastError = error as ApiError
        } else {
          lastError = {
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            status: 0,
            code: 'UNKNOWN_ERROR'
          }
        }

        // Don't retry on non-network errors or if we've exhausted retries
        if (lastError.code !== 'NETWORK_ERROR' || attempt === maxRetries) {
          break
        }

        // Exponential backoff for retries
        await this.delay(Math.pow(2, attempt) * 1000)
      }
    }

    throw lastError
  }

  private async parseErrorResponse(response: Response): Promise<any> {
    try {
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        return await response.json()
      } else {
        const text = await response.text()
        return { message: text }
      }
    } catch {
      return { message: response.statusText }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // HTTP methods
  async get<T>(endpoint: string, options?: {
    headers?: Record<string, string>
    useCache?: boolean
    cacheTtl?: number
    retries?: number
  }): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, options)
  }

  async post<T>(endpoint: string, data?: any, options?: {
    headers?: Record<string, string>
    retries?: number
  }): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, { data, ...options })
  }

  async put<T>(endpoint: string, data?: any, options?: {
    headers?: Record<string, string>
    retries?: number
  }): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, { data, ...options })
  }

  async patch<T>(endpoint: string, data?: any, options?: {
    headers?: Record<string, string>
    retries?: number
  }): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, { data, ...options })
  }

  async delete<T>(endpoint: string, options?: {
    headers?: Record<string, string>
    retries?: number
  }): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, options)
  }

  // File upload with progress
  async upload<T>(
    endpoint: string,
    file: File | FormData,
    options?: {
      onProgress?: (progress: number) => void
      headers?: Record<string, string>
    }
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && options?.onProgress) {
          const progress = (event.loaded / event.total) * 100
          options.onProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const responseHeaders: Record<string, string> = {}
          xhr.getAllResponseHeaders()
            .split('\r\n')
            .forEach(line => {
              const [key, value] = line.split(': ')
              if (key && value) {
                responseHeaders[key.toLowerCase()] = value
              }
            })

          let data: T
          try {
            data = JSON.parse(xhr.responseText)
          } catch {
            data = xhr.responseText as unknown as T
          }

          resolve({
            data,
            status: xhr.status,
            headers: responseHeaders
          })
        } else {
          reject({
            message: `Upload failed: ${xhr.statusText}`,
            status: xhr.status,
            code: 'UPLOAD_ERROR'
          })
        }
      })

      xhr.addEventListener('error', () => {
        reject({
          message: 'Upload failed due to network error',
          status: 0,
          code: 'NETWORK_ERROR'
        })
      })

      xhr.addEventListener('timeout', () => {
        reject({
          message: 'Upload timeout',
          status: 408,
          code: 'TIMEOUT'
        })
      })

      xhr.open('POST', url)
      xhr.timeout = this.timeout

      // Set headers (excluding Content-Type for FormData)
      const headers = { ...this.defaultHeaders, ...options?.headers }
      if (file instanceof FormData) {
        delete headers['Content-Type']
      }
      
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value)
      })

      const formData = file instanceof FormData ? file : (() => {
        const fd = new FormData()
        fd.append('file', file)
        return fd
      })()

      xhr.send(formData)
    })
  }

  // Batch requests
  async batch<T>(requests: Array<{
    method: string
    endpoint: string
    data?: any
    headers?: Record<string, string>
  }>): Promise<Array<ApiResponse<T> | ApiError>> {
    const promises = requests.map(async (req) => {
      try {
        return await this.request<T>(req.method, req.endpoint, {
          data: req.data,
          headers: req.headers
        })
      } catch (error) {
        return error as ApiError
      }
    })

    return Promise.all(promises)
  }

  // WebSocket connection
  createWebSocket(endpoint: string, protocols?: string[]): WebSocket {
    const wsUrl = `${this.baseUrl.replace(/^http/, 'ws')}${endpoint}`
    return new WebSocket(wsUrl, protocols)
  }

  // Server-Sent Events
  createEventSource(endpoint: string): EventSource {
    const url = `${this.baseUrl}${endpoint}`
    return new EventSource(url)
  }

  // Request interceptors
  addRequestInterceptor(interceptor: (url: string, options: any) => any) {
    // Implementation would modify the request before sending
    // This is a simplified version
  }

  addResponseInterceptor(interceptor: (response: any) => any) {
    // Implementation would modify the response after receiving
    // This is a simplified version
  }
}

// Specialized API clients for different services
export class DeFiApiClient extends ApiClient {
  constructor(baseUrl: string) {
    super({
      baseUrl,
      defaultHeaders: {
        'Content-Type': 'application/json',
        'X-API-Version': '1.0'
      },
      retryAttempts: 2,
      timeout: 15000
    })
  }

  // DeFi specific methods
  async getProtocolData(protocol: string) {
    return this.get(`/protocols/${protocol}`)
  }

  async getYieldOpportunities(filters?: {
    minApy?: number
    maxRisk?: number
    protocols?: string[]
  }) {
    const params = new URLSearchParams()
    if (filters?.minApy) params.append('minApy', filters.minApy.toString())
    if (filters?.maxRisk) params.append('maxRisk', filters.maxRisk.toString())
    if (filters?.protocols) params.append('protocols', filters.protocols.join(','))
    
    return this.get(`/yields?${params.toString()}`)
  }

  async getUserPositions(userAddress: string) {
    return this.get(`/users/${userAddress}/positions`, {
      useCache: true,
      cacheTtl: 30000 // 30 seconds
    })
  }

  async executeTransaction(transactionData: any) {
    return this.post('/transactions', transactionData, {
      retries: 1 // Don't retry transactions
    })
  }
}

export class BlockchainApiClient extends ApiClient {
  constructor(rpcUrl: string) {
    super({
      baseUrl: rpcUrl,
      defaultHeaders: {
        'Content-Type': 'application/json'
      },
      retryAttempts: 3,
      timeout: 30000
    })
  }

  async getBlockNumber() {
    return this.post('', {
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
      id: 1
    })
  }

  async getBalance(address: string) {
    return this.post('', {
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [address, 'latest'],
      id: 1
    })
  }

  async call(transaction: any) {
    return this.post('', {
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [transaction, 'latest'],
      id: 1
    })
  }
}

// Global API client instances
const config = {
  defiApi: process.env.REACT_APP_DEFI_API_URL || 'https://api.polybets.com',
  rpcUrl: process.env.REACT_APP_RPC_URL || 'https://rpc.ankr.com/eth'
}

export const defiApi = new DeFiApiClient(config.defiApi)
export const blockchainApi = new BlockchainApiClient(config.rpcUrl)

// Error handling utilities
export const handleApiError = (error: ApiError) => {
  console.error('API Error:', error)
  
  // You could integrate with error reporting services here
  // analytics.track('api_error', { ...error })
  
  return {
    title: getErrorTitle(error),
    message: getErrorMessage(error),
    action: getErrorAction(error)
  }
}

const getErrorTitle = (error: ApiError): string => {
  switch (error.code) {
    case 'NETWORK_ERROR':
      return 'Connection Problem'
    case 'TIMEOUT':
      return 'Request Timeout'
    case 'UNAUTHORIZED':
      return 'Authentication Required'
    case 'FORBIDDEN':
      return 'Access Denied'
    case 'NOT_FOUND':
      return 'Not Found'
    case 'RATE_LIMITED':
      return 'Too Many Requests'
    default:
      return 'Something Went Wrong'
  }
}

const getErrorMessage = (error: ApiError): string => {
  switch (error.code) {
    case 'NETWORK_ERROR':
      return 'Please check your internet connection and try again.'
    case 'TIMEOUT':
      return 'The request took too long to complete. Please try again.'
    case 'UNAUTHORIZED':
      return 'Please connect your wallet to continue.'
    case 'FORBIDDEN':
      return 'You don\'t have permission to perform this action.'
    case 'NOT_FOUND':
      return 'The requested resource could not be found.'
    case 'RATE_LIMITED':
      return 'You\'re making requests too quickly. Please wait a moment.'
    default:
      return error.message || 'An unexpected error occurred.'
  }
}

const getErrorAction = (error: ApiError): string => {
  switch (error.code) {
    case 'NETWORK_ERROR':
      return 'Retry'
    case 'TIMEOUT':
      return 'Try Again'
    case 'UNAUTHORIZED':
      return 'Connect Wallet'
    case 'RATE_LIMITED':
      return 'Wait and Retry'
    default:
      return 'Dismiss'
  }
}
