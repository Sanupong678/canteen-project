/**
 * Token validation and cleaning utilities
 * 
 * Token State Enum:
 * - VALID: Token is valid and ready to use
 * - EXPIRED: Token has expired
 * - MALFORMED: Token format is invalid
 * - MISSING: Token is not found in storage
 */

/**
 * Token State Enum
 */
export const TokenState = {
  VALID: 'VALID',
  EXPIRED: 'EXPIRED',
  MALFORMED: 'MALFORMED',
  MISSING: 'MISSING'
}

/**
 * Validate JWT token format
 * JWT format: header.payload.signature (3 parts separated by dots)
 */
export const isValidJWTFormat = (token) => {
  if (!token || typeof token !== 'string') {
    return false
  }
  
  // Trim whitespace
  const trimmed = token.trim()
  
  // Check if empty after trim
  if (!trimmed) {
    return false
  }
  
  // JWT should have 3 parts separated by dots
  const parts = trimmed.split('.')
  if (parts.length !== 3) {
    return false
  }
  
  // Each part should not be empty
  if (parts.some(part => !part || part.length === 0)) {
    return false
  }
  
  return true
}

/**
 * Get token fingerprint for logging (first 10 chars)
 * Safe for logging without exposing full token
 */
export const getTokenFingerprint = (token) => {
  if (!token || typeof token !== 'string') {
    return 'N/A'
  }
  return token.trim().slice(0, 10) + '...'
}

/**
 * Check if token is expired (by decoding JWT payload)
 * Returns true if expired, false if valid, null if cannot decode
 */
export const isTokenExpired = (token) => {
  if (!token || !isValidJWTFormat(token)) {
    return null
  }
  
  try {
    const parts = token.split('.')
    const payload = JSON.parse(atob(parts[1]))
    const exp = payload.exp
    
    if (!exp) {
      return null // No expiration claim
    }
    
    const now = Math.floor(Date.now() / 1000)
    return exp < now
  } catch (error) {
    return null // Cannot decode
  }
}

/**
 * Get token state
 * Returns TokenState enum value
 */
export const getTokenState = (token) => {
  if (!token) {
    return TokenState.MISSING
  }
  
  // Trim whitespace
  const trimmed = token.trim()
  
  // Check if empty or invalid string
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
    return TokenState.MISSING
  }
  
  // Check format
  if (!isValidJWTFormat(trimmed)) {
    return TokenState.MALFORMED
  }
  
  // Check expiration
  const expired = isTokenExpired(trimmed)
  if (expired === true) {
    return TokenState.EXPIRED
  }
  
  return TokenState.VALID
}

/**
 * Clean and validate token
 * Returns cleaned token or null if invalid
 */
export const cleanToken = (token) => {
  if (!token) {
    return null
  }
  
  // Trim whitespace
  const trimmed = token.trim()
  
  // Check if empty after trim
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
    return null
  }
  
  // Validate JWT format
  if (!isValidJWTFormat(trimmed)) {
    return null
  }
  
  return trimmed
}

/**
 * Get token from storage with state
 * Returns { token: string | null, state: TokenState }
 */
export const getTokenWithState = () => {
  if (!process.client) {
    return { token: null, state: TokenState.MISSING }
  }
  
  // Try sessionStorage first, then localStorage
  let token = sessionStorage.getItem('token')
  if (!token) {
    token = localStorage.getItem('token')
  }
  
  if (!token) {
    return { token: null, state: TokenState.MISSING }
  }
  
  const state = getTokenState(token)
  const cleaned = state === TokenState.VALID || state === TokenState.EXPIRED 
    ? cleanToken(token) 
    : null
  
  return { token: cleaned, state }
}

/**
 * Get valid token from storage
 * Returns cleaned token or null if invalid
 * @deprecated Use getTokenWithState() instead for better state management
 */
export const getValidToken = () => {
  const { token, state } = getTokenWithState()
  return state === TokenState.VALID ? token : null
}

/**
 * Clear invalid token from storage
 */
export const clearInvalidToken = () => {
  if (!process.client) {
    return
  }
  
  // Clear from both storages
  sessionStorage.removeItem('token')
  localStorage.removeItem('token')
  sessionStorage.removeItem('isAuthenticated')
  sessionStorage.removeItem('userRole')
  
  // Clear cookies
  document.cookie = 'user_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
}

/**
 * Log token state with fingerprint (safe for logging)
 */
export const logTokenState = (state, token = null) => {
  if (process.env.NODE_ENV !== 'development') {
    return
  }
  
  const fingerprint = token ? getTokenFingerprint(token) : 'N/A'
  console.log(`[AUTH] Token state: ${state}, fingerprint: ${fingerprint}`)
}

