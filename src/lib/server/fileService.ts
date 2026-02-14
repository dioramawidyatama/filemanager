import { readdir, stat } from 'fs/promises';
import path from 'path';
import type { FileNode, DirectoryListing } from '$lib/types';
import { sanitizePath, getRelativePath } from './pathUtils';

/**
 * Get MIME type from filename
 */
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
    '.zip': 'application/zip',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * List files in a directory
 */
export async function listDirectory(
  userPath: string, 
  rootPath: string
): Promise<DirectoryListing | null> {
  const fullPath = sanitizePath(userPath, rootPath);
  if (!fullPath) return null;
  
  try {
    const entries = await readdir(fullPath, { withFileTypes: true });
    const files: FileNode[] = [];
    
    for (const entry of entries) {
      // Skip hidden files
      if (entry.name.startsWith('.')) continue;
      
      const entryPath = path.join(fullPath, entry.name);
      const relativePath = getRelativePath(entryPath, rootPath);
      const entryStat = await stat(entryPath);
      
      files.push({
        id: Buffer.from(relativePath).toString('base64url'),
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
        path: relativePath,
        size: entryStat.size,
        modifiedAt: entryStat.mtime,
        createdAt: entryStat.birthtime,
        mimeType: entry.isFile() ? getMimeType(entry.name) : undefined,
      });
    }
    
    // Sort: directories first, then alphabetically
    files.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    
    return {
      path: getRelativePath(fullPath, rootPath),
      files,
    };
  } catch (error) {
    console.error('Failed to list directory:', error);
    return null;
  }
}

/**
 * Get file info
 */
export async function getFileInfo(
  userPath: string,
  rootPath: string
): Promise<FileNode | null> {
  const fullPath = sanitizePath(userPath, rootPath);
  if (!fullPath) return null;
  
  try {
    const fileStat = await stat(fullPath);
    const relativePath = getRelativePath(fullPath, rootPath);
    const filename = path.basename(fullPath);
    
    return {
      id: Buffer.from(relativePath).toString('base64url'),
      name: filename,
      type: fileStat.isDirectory() ? 'directory' : 'file',
      path: relativePath,
      size: fileStat.size,
      modifiedAt: fileStat.mtime,
      createdAt: fileStat.birthtime,
      mimeType: fileStat.isFile() ? getMimeType(filename) : undefined,
    };
  } catch (error) {
    return null;
  }
}
