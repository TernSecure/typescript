import { 
  TernSecureConfig, 
  ConfigValidationResult, 
  TernSecureAdminConfig, 
  AdminConfigValidationResult
} from '@tern-secure/types'

/**
 * Loads Firebase configuration from environment variables
 * @returns {TernSecureConfig} Firebase configuration object
 */
export const loadFireConfig = (): TernSecureConfig => ({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
})

/**
 * Validates Firebase configuration
 * @param {TernSecureConfig} config - Firebase configuration object
 * @throws {Error} If required configuration values are missing
 * @returns {TernSecureConfig} Validated configuration object
 */
export const validateConfig = (config: TernSecureConfig): ConfigValidationResult => {
  const requiredFields: (keyof TernSecureConfig)[] = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ]

  const errors: string[] = []
  
  requiredFields.forEach(field => {
    if (!config[field]) {
      errors.push(`Missing required field: NEXT_PUBLIC_FIREBASE_${String(field).toUpperCase()}`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    config
  }
}

/**
 * Initializes configuration with validation
 * @throws {Error} If configuration is invalid
 */
export const initializeConfig = (): TernSecureConfig => {
  const config = loadFireConfig()
  const validationResult = validateConfig(config)

  if (!validationResult.isValid) {
    throw new Error(
      `Firebase configuration validation failed:\n${validationResult.errors.join('\n')}`
    )
  }

  return config
}

/**
 * Loads Firebase Admin configuration from environment variables
 * @returns {AdminConfig} Firebase Admin configuration object
 */
export const loadAdminConfig = (): TernSecureAdminConfig => ({
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
})

/**
 * Validates Firebase Admin configuration
 * @param {AdminConfig} config - Firebase Admin configuration object
 * @returns {ConfigValidationResult} Validation result
 */
export const validateAdminConfig = (config: TernSecureAdminConfig): AdminConfigValidationResult => {
  const requiredFields: (keyof TernSecureAdminConfig)[] = [
    'projectId',
    'clientEmail',
    'privateKey'
  ]

  const errors: string[] = []
  
  requiredFields.forEach(field => {
    if (!config[field]) {
      errors.push(`Missing required field: FIREBASE_${String(field).toUpperCase()}`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    config
  }
}

/**
 * Initializes admin configuration with validation
 * @throws {Error} If configuration is invalid
 */
export const initializeAdminConfig = (): TernSecureAdminConfig => {
  const config = loadAdminConfig()
  const validationResult = validateAdminConfig(config)

  if (!validationResult.isValid) {
    throw new Error(
      `Firebase Admin configuration validation failed:\n${validationResult.errors.join('\n')}`
    )
  }

  return config
}