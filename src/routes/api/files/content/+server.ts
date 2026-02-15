import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { sanitizePath, auditLog } from '$lib/server/pathUtils';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Blocked extensions for content viewing
const BLOCKED_EXTENSIONS = [
  '.env',
  '.pem',
  '.key',
  '.p12',
  '.pfx',
  '.crt',
  '.cer',
  '.der',
  '.sql',
  '.db',
  '.sqlite',
  '.sqlite3',
  '.bin',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
];

// Language mapping from extension
const LANGUAGE_MAP: Record<string, string> = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',
  '.json': 'json',
  '.py': 'python',
  '.rb': 'ruby',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
  '.cs': 'csharp',
  '.php': 'php',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.scala': 'scala',
  '.r': 'r',
  '.sh': 'shell',
  '.bash': 'shell',
  '.zsh': 'shell',
  '.ps1': 'powershell',
  '.md': 'markdown',
  '.mdx': 'markdown',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.xml': 'xml',
  '.sql': 'sql',
  '.graphql': 'graphql',
  '.vue': 'vue',
  '.svelte': 'svelte',
  '.dockerfile': 'dockerfile',
  '.tf': 'terraform',
};

function getLanguageFromExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return LANGUAGE_MAP[ext] || 'plaintext';
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.json': 'application/json',
    '.js': 'application/javascript',
    '.ts': 'application/typescript',
    '.html': 'text/html',
    '.css': 'text/css',
    '.xml': 'application/xml',
    '.csv': 'text/csv',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

function isTextFile(mimeType: string, filename: string): boolean {
  if (mimeType.startsWith('text/')) return true;
  if (mimeType === 'application/json') return true;
  if (mimeType === 'application/javascript') return true;
  if (mimeType === 'application/typescript') return true;
  if (mimeType === 'application/xml') return true;
  
  // Check extension for known text formats
  const textExts = ['.md', '.yml', '.yaml', '.toml', '.ini', '.conf', '.sh', '.py', '.rb', '.go', '.rs', '.java', '.c', '.cpp', '.h', '.php', '.swift', '.kt'];
  const ext = path.extname(filename).toLowerCase();
  if (textExts.includes(ext)) return true;
  
  return false;
}

export const GET: RequestHandler = async ({ url, locals }) => {
  // Check authentication
  if (!locals.user) {
    throw error(401, 'Authentication required');
  }
  
  const filePath = url.searchParams.get('path');
  
  if (!filePath) {
    throw error(400, 'Path parameter is required');
  }
  
  // Sanitize path
  const fullPath = sanitizePath(filePath, locals.fileRoot, locals.user);
  if (!fullPath) {
    auditLog('FILE_CONTENT', locals.user?.username || null, filePath, false, 'path_sanitization_failed');
    throw error(403, 'Access denied or invalid path');
  }
  
  // Check extension
  const ext = path.extname(fullPath).toLowerCase();
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    auditLog('FILE_CONTENT', locals.user?.username || null, filePath, false, 'blocked_extension');
    throw error(403, 'File type not allowed for viewing');
  }
  
  try {
    // Get file stats
    const fileStat = await stat(fullPath);
    
    if (fileStat.isDirectory()) {
      throw error(400, 'Path is a directory');
    }
    
    // Check file size
    if (fileStat.size > MAX_FILE_SIZE) {
      auditLog('FILE_CONTENT', locals.user?.username || null, filePath, false, 'file_too_large');
      throw error(413, `File too large (${(fileStat.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`);
    }
    
    const filename = path.basename(fullPath);
    const mimeType = getMimeType(filename);
    const language = getLanguageFromExtension(filename);
    const isText = isTextFile(mimeType, filename);
    
    // For text files, read and return content
    if (isText) {
      const content = await readFile(fullPath, 'utf-8');
      
      auditLog('FILE_CONTENT', locals.user?.username || null, filePath, true, `text_${language}`);
      
      return json({
        type: 'text',
        content,
        language,
        size: fileStat.size,
        mimeType,
        filename,
      });
    }
    
    // For images, return metadata (actual image served via separate endpoint if needed)
    if (mimeType.startsWith('image/')) {
      auditLog('FILE_CONTENT', locals.user?.username || null, filePath, true, 'image');
      
      return json({
        type: 'image',
        content: null,
        language: null,
        size: fileStat.size,
        mimeType,
        filename,
      });
    }
    
    // For binary files
    auditLog('FILE_CONTENT', locals.user?.username || null, filePath, true, 'binary');
    
    return json({
      type: 'binary',
      content: null,
      language: null,
      size: fileStat.size,
      mimeType,
      filename,
    });
    
  } catch (err) {
    const errorMessage = (err as Error).message;
    
    // Don't log if it's already an HTTP error
    if ((err as { status?: number }).status) {
      throw err;
    }
    
    console.error('Failed to read file:', err);
    auditLog('FILE_CONTENT', locals.user?.username || null, filePath, false, `error_${errorMessage}`);
    throw error(500, 'Failed to read file');
  }
};
