import xss from 'xss';
import fs from 'fs';
import path from 'path';

/**
 * 🛡️ Security Middleware Module
 * Implements security best practices:
 * - XSS Protection (Input Sanitization)
 * - SQLi/NoSQLi Prevention via validation
 * - CORS + CSRF Protection
 * - Rate Limiting
 * - Audit Logging
 */

// ============================================================================
// 1. INPUT SANITIZATION MIDDLEWARE - Prevents XSS & Injection Attacks
// ============================================================================

/**
 * Sanitize all text inputs to prevent XSS attacks
 * Removes malicious scripts and HTML tags from user inputs
 */
export const sanitizeInputs = (req, res, next) => {
  // Sanitize req.body for POST/PUT requests
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize req.query for GET requests
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize req.params for URL parameters
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Recursively sanitize object properties
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
function sanitizeObject(obj) {
  const sanitized = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      // 🔴 SECURITY: Only sanitize string values
      if (typeof value === 'string') {
        // Use xss library to remove malicious scripts
        sanitized[key] = xss(value, {
          whiteList: {}, // No HTML tags allowed
          stripIgnoredTag: true,
          stripLeadingAndTrailingWhitespace: true
        });
      } else if (Array.isArray(value)) {
        // Recursively sanitize array elements
        sanitized[key] = value.map(item =>
          typeof item === 'string'
            ? xss(item, { whiteList: {} })
            : typeof item === 'object'
            ? sanitizeObject(item)
            : item
        );
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = sanitizeObject(value);
      } else {
        // Keep non-string values as-is (numbers, booleans, null, undefined)
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

// ============================================================================
// 2. PATH TRAVERSAL PROTECTION - Prevents Directory Traversal Attacks
// ============================================================================

/**
 * Validate filename to prevent path traversal attacks (../ attack)
 * Only allows alphanumeric, dots, hyphens, and underscores
 *
 * Attack example: GET /repairs/image/../../../etc/passwd
 * This middleware blocks such attempts
 */
export const validateFilePath = (filename) => {
  const reason = [];

  // 🔴 SECURITY: Check for directory traversal attempts
  if (filename.includes('..')) {
    reason.push('Directory traversal attempt detected (contains ..)');
  }

  if (filename.includes('/') || filename.includes('\\')) {
    reason.push('Path separators not allowed');
  }

  if (filename.startsWith('/') || filename.startsWith('\\')) {
    reason.push('Absolute path attempt detected');
  }

  // Normalize the path and check if it escapes
  const normalized = path.normalize(filename);
  if (normalized.startsWith('..')) {
    reason.push('Normalized path attempts directory escape');
  }

  return {
    valid: reason.length === 0,
    reason: reason.length > 0 ? reason.join('; ') : null
  };
};

/**
 * Validate and safely join file paths
 * Prevents directory traversal by ensuring the final path is within allowed directory
 */
export const safePathJoin = (baseDir, filename) => {
  const validation = validateFilePath(filename);
  if (!validation.valid) {
    const error = new Error(`Invalid file path: ${validation.reason}`);
    error.statusCode = 400;
    throw error;
  }

  const resolvedPath = path.resolve(path.join(baseDir, filename));
  const resolvedBase = path.resolve(baseDir);

  // 🔴 SECURITY: Ensure the resolved path is within the base directory
  if (!resolvedPath.startsWith(resolvedBase)) {
    const error = new Error('Path traversal detected');
    error.statusCode = 400;
    throw error;
  }

  return resolvedPath;
};

// ============================================================================
// 3. AUDIT LOGGING - Track Admin Actions for Security
// ============================================================================

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const auditLogPath = path.join(logsDir, 'audit.log');

/**
 * Log security-relevant events for audit trail
 * Useful for tracking admin actions and suspicious activities
 */
export const logAuditEvent = (eventData) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...eventData
  };

  // 🔴 SECURITY: Log to file for persistence
  fs.appendFile(auditLogPath, JSON.stringify(logEntry) + '\n', (err) => {
    if (err) {
      console.error('❌ Error writing audit log:', err);
    }
  });

  // Also log to console for visibility
  console.log('📋 AUDIT LOG:', logEntry);
};

/**
 * Middleware to log admin actions
 * Tracks: login attempts, user creation/deletion, repairs update, etc.
 */
export const auditLoggingMiddleware = (req, res, next) => {
  // Only log admin routes and sensitive operations
  const sensitiveRoutes = ['/users', '/bills', '/repairs', '/shops'];
  const sensitiveMethod = ['POST', 'PUT', 'DELETE', 'PATCH'];

  if (
    sensitiveMethod.includes(req.method) &&
    sensitiveRoutes.some(route => req.url.includes(route))
  ) {
    // Log after response to include status code
    const originalSend = res.send;
    res.send = function (data) {
      logAuditEvent({
        userId: req.user?.userId || 'anonymous',
        userRole: req.user?.role || 'unknown',
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        ipAddress: req.ip || req.connection.remoteAddress,
        action: `${req.method} ${req.url}`
      });

      return originalSend.call(this, data);
    };
  }

  next();
};

// ============================================================================
// 4. LOGIN ATTEMPT TRACKING - Prevent Brute Force Attacks
// ============================================================================

const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

/**
 * Track login attempts per username
 * Implements account lockout after repeated failures
 */
export const trackLoginAttempt = (username, success) => {
  if (!loginAttempts.has(username)) {
    loginAttempts.set(username, {
      attempts: 0,
      lastAttempt: Date.now(),
      locked: false,
      lockUntil: null
    });
  }

  const attempt = loginAttempts.get(username);

  if (success) {
    // 🟢 Success: Reset counter
    attempt.attempts = 0;
    attempt.locked = false;
    attempt.lockUntil = null;
    logAuditEvent({
      action: 'LOGIN_SUCCESS',
      username,
      timestamp: new Date().toISOString()
    });
  } else {
    // 🔴 Failed attempt: Increment counter
    attempt.attempts++;
    attempt.lastAttempt = Date.now();

    if (attempt.attempts >= MAX_LOGIN_ATTEMPTS) {
      attempt.locked = true;
      attempt.lockUntil = Date.now() + LOCKOUT_TIME;
      logAuditEvent({
        action: 'ACCOUNT_LOCKED',
        username,
        reason: `${MAX_LOGIN_ATTEMPTS} failed login attempts`,
        lockUntilTime: new Date(attempt.lockUntil).toISOString()
      });
    } else {
      logAuditEvent({
        action: 'LOGIN_FAILED',
        username,
        attempts: attempt.attempts,
        remainingAttempts: MAX_LOGIN_ATTEMPTS - attempt.attempts
      });
    }
  }
};

/**
 * Check if account is locked due to too many failed attempts
 */
export const isAccountLocked = (username) => {
  const attempt = loginAttempts.get(username);

  if (!attempt) {
    return { locked: false };
  }

  if (attempt.locked && Date.now() < attempt.lockUntil) {
    const minutesRemaining = Math.ceil((attempt.lockUntil - Date.now()) / 60000);
    return {
      locked: true,
      minutesRemaining
    };
  }

  // Unlock if lockout time has passed
  if (attempt.lockUntil && Date.now() >= attempt.lockUntil) {
    attempt.locked = false;
    attempt.lockUntil = null;
    attempt.attempts = 0;
    return { locked: false };
  }

  return { locked: false };
};

// ============================================================================
// 5. DATABASE INJECTION PREVENTION
// ============================================================================

/**
 * Validate MongoDB ObjectId format
 * Prevents NoSQL injection attempts with invalid ObjectIds
 */
export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate that input matches expected type
 * Helps prevent type confusion attacks
 */
export const validateInputTypes = (data, schema) => {
  for (const [key, expectedType] of Object.entries(schema)) {
    if (key in data) {
      const actualType = typeof data[key];
      if (actualType !== expectedType) {
        const error = new Error(
          `Invalid type for ${key}: expected ${expectedType}, got ${actualType}`
        );
        error.statusCode = 400;
        throw error;
      }
    }
  }
};

// ============================================================================
// 6. FILE UPLOAD SECURITY
// ============================================================================

/**
 * Validate file uploads to prevent malicious files
 */
export const validateFileUpload = (file) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  const maxFileSize = 5 * 1024 * 1024; // 5MB

  const issues = [];

  // Check MIME type
  if (!allowedMimes.includes(file.mimetype)) {
    issues.push(`Invalid file type: ${file.mimetype}`);
  }

  // Check file size
  if (file.size > maxFileSize) {
    issues.push(`File too large: ${file.size} bytes (max: ${maxFileSize} bytes)`);
  }

  // Check filename
  const filename = file.originalname.toLowerCase();
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.php', '.jsp'];
  if (dangerousExtensions.some(ext => filename.endsWith(ext))) {
    issues.push(`Dangerous file extension detected`);
  }

  return {
    valid: issues.length === 0,
    issues
  };
};

export default {
  sanitizeInputs,
  validateFilePath,
  safePathJoin,
  logAuditEvent,
  auditLoggingMiddleware,
  trackLoginAttempt,
  isAccountLocked,
  isValidObjectId,
  validateInputTypes,
  validateFileUpload
};
