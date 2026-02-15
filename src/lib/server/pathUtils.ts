import path from 'path';

/**
 * AUDIT LOG: Log file operations for security monitoring
 */
export function auditLog(operation: string, user: string | null, path: string, success: boolean, details?: string) {
  const timestamp = new Date().toISOString();
  const status = success ? 'SUCCESS' : 'DENIED';
  const userStr = user || 'anonymous';
  console.log(`[AUDIT] ${timestamp} | ${status} | ${operation} | user=${userStr} | path=${path}${details ? ' | ' + details : ''}`);
}

// System paths that should never be accessed
const BLOCKED_SYSTEM_PATHS = [
  /^\/etc\b/,
  /^\/sys\b/,
  /^\/proc\b/,
  /^\/dev\b/,
  /^\/boot\b/,
  /^\/root\b/,
  /^\/bin\b/,
  /^\/sbin\b/,
  /^\/lib\b/,
  /^\/usr\/bin\b/,
  /^\/usr\/sbin\b/,
];

// Path traversal patterns
const TRAVERSAL_PATTERNS = [
  /\.\./,                    // Contains ..
  /\/\.\.\//,               // /../ in path
  /\\/,                      // Windows-style separators
  /\0/,                      // Null byte injection
  /~/,                       // Home directory expansion
];

// Sensitive directories within the file root
const BLOCKED_DIRECTORIES = [
  '.ssh',
  '.gnupg',
  'memory',
  'backups',
  'logs',
  'config',
  '.git',
  '.svn',
  '.hg',
  'node_modules',
  '.npm',
  '.pnpm-store',
];

// Sensitive file patterns
const BLOCKED_FILE_PATTERNS = [
  /^\./,                     // Hidden files (starting with .)
  /authorized_keys/i,
  /\.env/i,
  /\.env\.local/i,
  /\.env\.production/i,
  /\.env\.development/i,
  /id_rsa/i,
  /id_ed25519/i,
  /id_ecdsa/i,
  /id_dsa/i,
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /\.htpasswd/i,
  /shadow$/i,
  /passwd$/i,
  /secrets?/i,
  /credentials?/i,
  /password/i,
  /token/i,
  /apikey/i,
  /private/i,
];

// Allowed directories under the root - allow all except blocked
const BLOCKED_TOP_LEVEL_DIRECTORIES = [
  '.ssh',
  '.gnupg',
  'memory',
  'backups',
  'logs',
  'config',
  '.git',
  '.svn',
  '.hg',
  'node_modules',
  '.npm',
  '.pnpm-store',
];

/**
 * Check if a path contains blocked directory
 */
function containsBlockedDirectory(normalizedPath: string): boolean {
  const parts = normalizedPath.split(path.sep);
  for (const part of parts) {
    if (BLOCKED_DIRECTORIES.includes(part.toLowerCase())) {
      return true;
    }
  }
  return false;
}

/**
 * Check if filename matches blocked pattern
 */
function isBlockedFilename(filename: string): boolean {
  for (const pattern of BLOCKED_FILE_PATTERNS) {
    if (pattern.test(filename)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if path is within allowed directories
 * Root and most directories are allowed, only blocked ones are restricted
 */
function isInAllowedDirectory(relativePath: string): boolean {
  // Root is allowed
  if (relativePath === '/' || relativePath === '') {
    return true;
  }
  
  const parts = relativePath.split('/').filter(Boolean);
  if (parts.length === 0) return true;
  
  const firstDir = parts[0].toLowerCase();
  
  // Check if first directory is blocked
  return !BLOCKED_TOP_LEVEL_DIRECTORIES.includes(firstDir);
}

/**
 * Sanitize and validate a file path
 * @param userPath - The path provided by the user
 * @param rootPath - The allowed root directory
 * @param user - The authenticated user (for audit logging)
 * @returns The sanitized absolute path or null if invalid
 */
export function sanitizePath(userPath: string, rootPath: string, user?: { username: string } | null): string | null {
  // Normalize the root path
  const normalizedRoot = path.resolve(rootPath);
  
  // Normalize user path
  let normalizedUserPath = userPath;
  
  // Remove leading slashes for relative path check
  if (normalizedUserPath.startsWith('/')) {
    normalizedUserPath = normalizedUserPath.slice(1);
  }
  
  // Check system path blocks (absolute path checks)
  for (const pattern of BLOCKED_SYSTEM_PATHS) {
    if (pattern.test(userPath)) {
      auditLog('PATH_CHECK', user?.username || null, userPath, false, 'blocked_system_path');
      return null;
    }
  }
  
  // Check traversal patterns
  for (const pattern of TRAVERSAL_PATTERNS) {
    if (pattern.test(userPath)) {
      auditLog('PATH_CHECK', user?.username || null, userPath, false, 'traversal_attempt');
      return null;
    }
  }
  
  // Resolve the full path
  const fullPath = path.resolve(normalizedRoot, normalizedUserPath);
  
  // Ensure path is within root directory
  if (!fullPath.startsWith(normalizedRoot)) {
    auditLog('PATH_CHECK', user?.username || null, userPath, false, 'outside_root');
    return null;
  }
  
  // Get relative path from root
  const relativePath = fullPath.slice(normalizedRoot.length) || '/';
  
  // Check for blocked directories in the path
  if (containsBlockedDirectory(fullPath)) {
    auditLog('PATH_CHECK', user?.username || null, userPath, false, 'blocked_directory');
    return null;
  }
  
  // Check if in allowed directory
  if (!isInAllowedDirectory(relativePath)) {
    auditLog('PATH_CHECK', user?.username || null, userPath, false, 'not_in_allowed_directory');
    return null;
  }
  
  // Check filename if it's a file (has extension or is not a directory indicator)
  const filename = path.basename(fullPath);
  if (filename && filename !== '.' && filename !== '..') {
    if (isBlockedFilename(filename)) {
      auditLog('PATH_CHECK', user?.username || null, userPath, false, 'blocked_filename');
      return null;
    }
  }
  
  auditLog('PATH_CHECK', user?.username || null, userPath, true, `resolved=${relativePath}`);
  return fullPath;
}

/**
 * Check if a path is safe for the given root
 */
export function isPathSafe(userPath: string, rootPath: string, user?: { username: string } | null): boolean {
  return sanitizePath(userPath, rootPath, user) !== null;
}

/**
 * Get relative path from root
 */
export function getRelativePath(absolutePath: string, rootPath: string): string {
  const normalizedRoot = path.resolve(rootPath);
  const normalizedAbs = path.resolve(absolutePath);
  
  if (!normalizedAbs.startsWith(normalizedRoot)) {
    throw new Error('Path outside root');
  }
  
  let relative = normalizedAbs.slice(normalizedRoot.length);
  if (!relative.startsWith('/')) {
    relative = '/' + relative;
  }
  
  return relative || '/';
}

/**
 * Validate that a directory can be listed (safety check)
 */
export function canListDirectory(dirPath: string, rootPath: string, user?: { username: string } | null): boolean {
  const sanitized = sanitizePath(dirPath, rootPath, user);
  if (!sanitized) return false;
  
  // Additional check: ensure the directory is within allowed paths
  const relativePath = getRelativePath(sanitized, rootPath);
  return isInAllowedDirectory(relativePath);
}
