'use client'

const PREFIX = 'tern'

// Singleton to track style injection
const styleInjection = {
  isInjected: false,
  styleElement: null as HTMLStyleElement | null
}

export const defaultClassNames = {
  container: `${PREFIX}-container`,
  header: `${PREFIX}-header`,
  title: `${PREFIX}-title`,
  formWrapper: `${PREFIX}-formWrapper`,
  formContainer: `${PREFIX}-formContainer`,
  form: `${PREFIX}-form`,
  label: `${PREFIX}-label`,
  input: `${PREFIX}-input`,
  button: `${PREFIX}-button`,
  error: `${PREFIX}-error`
} as const

// Create styles once and cache them
function createStyleSheet(styles: Record<string, React.CSSProperties>) {
  if (typeof window === 'undefined') return defaultClassNames

  // Return early if styles are already injected
  if (styleInjection.isInjected) {
    return defaultClassNames
  }

  // Find existing style element or create new one
  let styleElement = document.querySelector<HTMLStyleElement>('[data-tern-secure]')
  
  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.setAttribute('data-tern-secure', '')
    document.head.appendChild(styleElement)
    styleInjection.styleElement = styleElement
  }

  // Create CSS rules
  const cssRules = Object.entries(styles).map(([key, rules]) => {
    const className = defaultClassNames[key as keyof typeof defaultClassNames]
    const cssProperties = Object.entries(rules).map(([prop, value]) => {
      const cssProperty = prop.replace(/([A-Z])/g, '-$1').toLowerCase()
      return `${cssProperty}: ${value};`
    }).join(' ')

    return `.${className} { ${cssProperties} }`
  }).join('\n')

  // Insert styles only once
  styleElement.textContent = cssRules
  styleInjection.isInjected = true

  return defaultClassNames
}

// Style configuration
export const styleConfig = {
  container: {
    display: 'flex',
    minHeight: '100%',
    flex: '1',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '3rem 1.5rem'
  },
  header: {
    margin: '0 auto',
    width: '100%',
    maxWidth: '28rem'
  },
  title: {
    marginTop: '1.5rem',
    textAlign: 'center',
    fontSize: '1.875rem',
    fontWeight: '700',
    lineHeight: '2.25rem',
    letterSpacing: '-0.025em',
    color: 'var(--tern-text-primary, #111827)'
  },
  formWrapper: {
    marginTop: '2.5rem',
    margin: '0 auto',
    width: '100%',
    maxWidth: '30rem'
  },
  formContainer: {
    padding: '3rem 1.5rem',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    borderRadius: '0.5rem',
    backgroundColor: 'var(--tern-background, white)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--tern-text-secondary, #374151)'
  },
  input: {
    marginTop: '0.25rem',
    display: 'block',
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid var(--tern-border, #D1D5DB)',
    backgroundColor: 'var(--tern-input-background, white)',
    color: 'var(--tern-text-primary, #111827)'
  },
  button: {
    display: 'flex',
    width: '100%',
    justifyContent: 'center',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'white',
    backgroundColor: 'var(--tern-primary, #2563EB)',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer'
  },
  error: {
    color: 'var(--tern-error, #DC2626)',
    fontSize: '0.875rem'
  }
} as const

// Export pre-created styles
export const styles = createStyleSheet(styleConfig)

