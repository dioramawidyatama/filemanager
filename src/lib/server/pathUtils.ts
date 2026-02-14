import path from 'path';

// Sensitive paths that should never be accessed
const BLOCKED_PATTERNS = [
  /^\/etc\b/,
  /^\/sys\b/,
  /^\/proc\b/,
  /^\/dev\b/,
  /^\/boot\b/,
  /^\/root\b/,
  /\.\./,  // Path traversal attempt
  /\/\.\./,  // Hidden traversal
  /\\/,  // Windows-style separators
  /\0/,  // Null byte
  /~/,  // Home directory expansion
];

// Additional blocked files/paths
const BLOCKED_EXACT = [
  '/etc/passwd',
  '/etc/shadow',
  '/etc/hosts',
  '.ssh',
  '.bashrc',
  '.bash_history',
  '.zshrc',
  '.profile',
  'id_rsa',
  'id_ed25519',
  'id_ecdsa',
  '.env',
  '.git',
];

/**
 * Sanitize and validate a file path
 * @param userPath - The path provided by the user
 * @param rootPath - The allowed root directory
 * @returns The sanitized absolute path or null if invalid
 */
export function sanitizePath(userPath: string, rootPath: string): string | null {
  // Normalize the root path
  const normalizedRoot = path.resolve(rootPath);
  
  // Normalize user path (remove .., resolve ., etc.)
  let normalizedUserPath = userPath;
  
  // Remove leading slashes and dots for relative path check
  if (normalizedUserPath.startsWith('/')) {
    normalizedUserPath = normalizedUserPath.slice(1);
  }
  
  // Check for blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(userPath)) {
      console.warn(`Blocked path pattern: ${userPath}`);
      return null;
    }
  }
  
  // Check for blocked exact matches
  const lowerPath = userPath.toLowerCase();
  for (const blocked of BLOCKED_EXACT) {
    if (lowerPath.includes(blocked.toLowerCase())) {
      console.warn(`Blocked exact path: ${userPath}`);
      return null;
    }
  }
  
  // Resolve the full path
  const fullPath = path.resolve(normalizedRoot, normalizedUserPath);
  
  // Ensure path is within root directory
  if (!fullPath.startsWith(normalizedRoot)) {
    console.warn(`Path traversal attempt: ${userPath} -> ${fullPath}`);
    return null;
  }
  
  return fullPath;
}

/**
 * Check if a path is safe for the given root
 */
export function isPathSafe(userPath: string, rootPath: string): boolean {
  return sanitizePath(userPath, rootPath) !== null;
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
