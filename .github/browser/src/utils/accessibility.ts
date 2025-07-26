// Accessibility utilities and WCAG compliance helpers
export class AccessibilityManager {
  private static instance: AccessibilityManager
  private focusHistory: HTMLElement[] = []
  private currentFocusTrap?: FocusTrap
  private announcements: HTMLElement

  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager()
    }
    return AccessibilityManager.instance
  }

  constructor() {
    this.initializeAnnouncements()
    this.setupKeyboardNavigation()
    this.setupFocusManagement()
    this.setupReducedMotion()
  }

  private initializeAnnouncements() {
    // Create screen reader announcement area
    this.announcements = document.createElement('div')
    this.announcements.setAttribute('aria-live', 'polite')
    this.announcements.setAttribute('aria-atomic', 'true')
    this.announcements.setAttribute('aria-relevant', 'text')
    this.announcements.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `
    document.body.appendChild(this.announcements)
  }

  // Screen reader announcements
  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    this.announcements.setAttribute('aria-live', priority)
    this.announcements.textContent = message
    
    // Clear after announcement to allow repeated messages
    setTimeout(() => {
      this.announcements.textContent = ''
    }, 1000)
  }

  // Focus management
  trapFocus(container: HTMLElement): FocusTrap {
    const focusTrap = new FocusTrap(container)
    this.currentFocusTrap = focusTrap
    return focusTrap
  }

  releaseFocusTrap() {
    if (this.currentFocusTrap) {
      this.currentFocusTrap.release()
      this.currentFocusTrap = undefined
    }
  }

  // Save and restore focus
  saveFocus() {
    const activeElement = document.activeElement as HTMLElement
    if (activeElement && activeElement !== document.body) {
      this.focusHistory.push(activeElement)
    }
  }

  restoreFocus() {
    const lastFocused = this.focusHistory.pop()
    if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus()
    }
  }

  // Skip links
  addSkipLink(target: string, label: string) {
    const skipLink = document.createElement('a')
    skipLink.href = `#${target}`
    skipLink.textContent = label
    skipLink.className = 'skip-link'
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      z-index: 1000;
      text-decoration: none;
      transition: top 0.3s;
    `

    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px'
    })

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px'
    })

    document.body.insertBefore(skipLink, document.body.firstChild)
  }

  // Keyboard navigation
  private setupKeyboardNavigation() {
    document.addEventListener('keydown', (event) => {
      // Escape key handling
      if (event.key === 'Escape') {
        this.handleEscapeKey()
      }

      // Tab navigation enhancement
      if (event.key === 'Tab') {
        this.handleTabNavigation(event)
      }

      // Arrow key navigation for custom components
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        this.handleArrowNavigation(event)
      }
    })
  }

  private handleEscapeKey() {
    // Close modals, dropdowns, etc.
    const modals = document.querySelectorAll('[role="dialog"][aria-hidden="false"]')
    modals.forEach(modal => {
      const closeButton = modal.querySelector('[data-dismiss]') as HTMLElement
      if (closeButton) {
        closeButton.click()
      }
    })

    // Release focus traps
    this.releaseFocusTrap()
  }

  private handleTabNavigation(event: KeyboardEvent) {
    // Ensure tab navigation works within focus traps
    if (this.currentFocusTrap) {
      this.currentFocusTrap.handleTab(event)
    }
  }

  private handleArrowNavigation(event: KeyboardEvent) {
    const target = event.target as HTMLElement
    
    // Handle dropdown menus
    if (target.getAttribute('role') === 'menuitem') {
      this.navigateMenu(event)
    }

    // Handle tab lists
    if (target.getAttribute('role') === 'tab') {
      this.navigateTabList(event)
    }

    // Handle grid navigation
    if (target.closest('[role="grid"]')) {
      this.navigateGrid(event)
    }
  }

  private navigateMenu(event: KeyboardEvent) {
    const menuItem = event.target as HTMLElement
    const menu = menuItem.closest('[role="menu"]')
    if (!menu) return

    const menuItems = Array.from(menu.querySelectorAll('[role="menuitem"]')) as HTMLElement[]
    const currentIndex = menuItems.indexOf(menuItem)

    let nextIndex: number
    switch (event.key) {
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % menuItems.length
        break
      case 'ArrowUp':
        nextIndex = currentIndex === 0 ? menuItems.length - 1 : currentIndex - 1
        break
      default:
        return
    }

    event.preventDefault()
    menuItems[nextIndex].focus()
  }

  private navigateTabList(event: KeyboardEvent) {
    const tab = event.target as HTMLElement
    const tabList = tab.closest('[role="tablist"]')
    if (!tabList) return

    const tabs = Array.from(tabList.querySelectorAll('[role="tab"]')) as HTMLElement[]
    const currentIndex = tabs.indexOf(tab)

    let nextIndex: number
    switch (event.key) {
      case 'ArrowLeft':
        nextIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1
        break
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % tabs.length
        break
      default:
        return
    }

    event.preventDefault()
    tabs[nextIndex].focus()
    tabs[nextIndex].click()
  }

  private navigateGrid(event: KeyboardEvent) {
    const cell = event.target as HTMLElement
    const grid = cell.closest('[role="grid"]')
    if (!grid) return

    const rows = Array.from(grid.querySelectorAll('[role="row"]'))
    const currentRow = cell.closest('[role="row"]')
    const currentRowIndex = rows.indexOf(currentRow!)
    
    const cellsInRow = Array.from(currentRow!.querySelectorAll('[role="gridcell"]')) as HTMLElement[]
    const currentCellIndex = cellsInRow.indexOf(cell)

    let targetCell: HTMLElement | null = null

    switch (event.key) {
      case 'ArrowLeft':
        if (currentCellIndex > 0) {
          targetCell = cellsInRow[currentCellIndex - 1]
        }
        break
      case 'ArrowRight':
        if (currentCellIndex < cellsInRow.length - 1) {
          targetCell = cellsInRow[currentCellIndex + 1]
        }
        break
      case 'ArrowUp':
        if (currentRowIndex > 0) {
          const prevRow = rows[currentRowIndex - 1]
          const prevRowCells = Array.from(prevRow.querySelectorAll('[role="gridcell"]')) as HTMLElement[]
          targetCell = prevRowCells[Math.min(currentCellIndex, prevRowCells.length - 1)]
        }
        break
      case 'ArrowDown':
        if (currentRowIndex < rows.length - 1) {
          const nextRow = rows[currentRowIndex + 1]
          const nextRowCells = Array.from(nextRow.querySelectorAll('[role="gridcell"]')) as HTMLElement[]
          targetCell = nextRowCells[Math.min(currentCellIndex, nextRowCells.length - 1)]
        }
        break
    }

    if (targetCell) {
      event.preventDefault()
      targetCell.focus()
    }
  }

  private setupFocusManagement() {
    // Add focus indicators for keyboard navigation
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        document.body.classList.add('keyboard-navigation')
      }
    })

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation')
    })

    // Manage focus for dynamic content
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement
              
              // Auto-focus modals and dialogs
              if (element.getAttribute('role') === 'dialog') {
                this.saveFocus()
                this.focusFirstFocusableElement(element)
              }
            }
          })
        }
      })
    })

    observer.observe(document.body, { childList: true, subtree: true })
  }

  private setupReducedMotion() {
    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const updateMotionPreference = () => {
      if (prefersReducedMotion.matches) {
        document.documentElement.style.setProperty('--animation-duration', '0.001ms')
        document.documentElement.style.setProperty('--transition-duration', '0.001ms')
      } else {
        document.documentElement.style.removeProperty('--animation-duration')
        document.documentElement.style.removeProperty('--transition-duration')
      }
    }

    prefersReducedMotion.addEventListener('change', updateMotionPreference)
    updateMotionPreference()
  }

  // Utility methods
  focusFirstFocusableElement(container: HTMLElement) {
    const focusableElements = this.getFocusableElements(container)
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }
  }

  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[]
  }

  // Color contrast checking
  checkColorContrast(foreground: string, background: string): {
    ratio: number
    wcagAA: boolean
    wcagAAA: boolean
  } {
    const fgRgb = this.hexToRgb(foreground)
    const bgRgb = this.hexToRgb(background)
    
    if (!fgRgb || !bgRgb) {
      return { ratio: 0, wcagAA: false, wcagAAA: false }
    }

    const fgLuminance = this.getLuminance(fgRgb)
    const bgLuminance = this.getLuminance(bgRgb)
    
    const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                  (Math.min(fgLuminance, bgLuminance) + 0.05)

    return {
      ratio,
      wcagAA: ratio >= 4.5,
      wcagAAA: ratio >= 7
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  private getLuminance(rgb: { r: number; g: number; b: number }): number {
    const { r, g, b } = rgb
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  // Validate ARIA attributes
  validateAria(element: HTMLElement): string[] {
    const errors: string[] = []

    // Check required ARIA attributes
    const role = element.getAttribute('role')
    if (role) {
      const requiredAttributes = this.getRequiredAriaAttributes(role)
      requiredAttributes.forEach(attr => {
        if (!element.hasAttribute(attr)) {
          errors.push(`Missing required attribute: ${attr}`)
        }
      })
    }

    // Check ARIA references
    const ariaAttributes = Array.from(element.attributes)
      .filter(attr => attr.name.startsWith('aria-'))
      .filter(attr => attr.name.endsWith('by') || attr.name === 'aria-controls')

    ariaAttributes.forEach(attr => {
      const ids = attr.value.split(' ')
      ids.forEach(id => {
        if (!document.getElementById(id)) {
          errors.push(`ARIA reference not found: ${id}`)
        }
      })
    })

    return errors
  }

  private getRequiredAriaAttributes(role: string): string[] {
    const requirements: Record<string, string[]> = {
      'button': [],
      'checkbox': ['aria-checked'],
      'radio': ['aria-checked'],
      'tab': ['aria-selected'],
      'tabpanel': ['aria-labelledby'],
      'dialog': ['aria-labelledby'],
      'alertdialog': ['aria-labelledby'],
      'combobox': ['aria-expanded'],
      'listbox': [],
      'option': ['aria-selected'],
      'slider': ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
      'progressbar': ['aria-valuenow']
    }

    return requirements[role] || []
  }
}

// Focus trap implementation
class FocusTrap {
  private container: HTMLElement
  private firstFocusable?: HTMLElement
  private lastFocusable?: HTMLElement
  private isActive = false

  constructor(container: HTMLElement) {
    this.container = container
    this.activate()
  }

  activate() {
    const focusableElements = this.getFocusableElements()
    
    if (focusableElements.length === 0) return

    this.firstFocusable = focusableElements[0]
    this.lastFocusable = focusableElements[focusableElements.length - 1]
    this.isActive = true

    // Focus the first element
    this.firstFocusable.focus()

    // Add event listeners
    this.container.addEventListener('keydown', this.handleKeyDown)
  }

  release() {
    this.isActive = false
    this.container.removeEventListener('keydown', this.handleKeyDown)
  }

  handleTab(event: KeyboardEvent) {
    if (!this.isActive || event.key !== 'Tab') return

    const focusableElements = this.getFocusableElements()
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement)

    if (event.shiftKey) {
      // Shift + Tab (backwards)
      if (currentIndex <= 0) {
        event.preventDefault()
        this.lastFocusable?.focus()
      }
    } else {
      // Tab (forwards)
      if (currentIndex >= focusableElements.length - 1) {
        event.preventDefault()
        this.firstFocusable?.focus()
      }
    }
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    this.handleTab(event)
  }

  private getFocusableElements(): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(this.container.querySelectorAll(focusableSelectors))
      .filter((el: Element) => {
        const htmlEl = el as HTMLElement
        return htmlEl.offsetWidth > 0 && htmlEl.offsetHeight > 0
      }) as HTMLElement[]
  }
}

// React hook for accessibility
export const useAccessibility = () => {
  const accessibility = AccessibilityManager.getInstance()

  return {
    announce: (message: string, priority?: 'polite' | 'assertive') => 
      accessibility.announce(message, priority),
    
    trapFocus: (container: HTMLElement) => accessibility.trapFocus(container),
    
    releaseFocusTrap: () => accessibility.releaseFocusTrap(),
    
    saveFocus: () => accessibility.saveFocus(),
    
    restoreFocus: () => accessibility.restoreFocus(),
    
    checkColorContrast: (fg: string, bg: string) => 
      accessibility.checkColorContrast(fg, bg),
    
    validateAria: (element: HTMLElement) => accessibility.validateAria(element)
  }
}

// Utility functions that can be used without React
export const accessibilityUtils = {
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    AccessibilityManager.getInstance().announce(message, priority)
  },
  
  checkColorContrast: (fg: string, bg: string) => {
    return AccessibilityManager.getInstance().checkColorContrast(fg, bg)
  },
  
  validateAria: (element: HTMLElement) => {
    return AccessibilityManager.getInstance().validateAria(element)
  }
}

// Initialize accessibility manager
export const initializeAccessibility = () => {
  const accessibility = AccessibilityManager.getInstance()
  
  // Add skip links
  accessibility.addSkipLink('main-content', 'Skip to main content')
  accessibility.addSkipLink('navigation', 'Skip to navigation')
  
  // Add required CSS
  const style = document.createElement('style')
  style.textContent = `
    .keyboard-navigation *:focus {
      outline: 3px solid #0066cc !important;
      outline-offset: 2px !important;
    }
    
    .skip-link:focus {
      clip: auto !important;
      height: auto !important;
      margin: 0 !important;
      overflow: visible !important;
      position: absolute !important;
      width: auto !important;
      z-index: 100000 !important;
    }
    
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: var(--animation-duration, 0.001ms) !important;
        animation-iteration-count: 1 !important;
        transition-duration: var(--transition-duration, 0.001ms) !important;
        scroll-behavior: auto !important;
      }
    }
    
    @media (prefers-contrast: high) {
      * {
        filter: contrast(1.2);
      }
    }
  `
  document.head.appendChild(style)
  
  return accessibility
}
