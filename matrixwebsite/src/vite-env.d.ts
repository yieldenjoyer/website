/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALCHEMY_ID: string
  readonly VITE_WALLET_CONNECT_PROJECT_ID: string
  readonly VITE_API_URL: string
  readonly VITE_ENABLE_AUDIO: string
  readonly VITE_ENABLE_3D: string
  readonly VITE_DEBUG_MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
