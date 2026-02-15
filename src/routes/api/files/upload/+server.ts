import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Busboy from 'busboy';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import path from 'path';
import { sanitizePath, getRelativePath, auditLog } from '$lib/server/pathUtils';

// Max upload size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

export const POST: RequestHandler = async ({ request, locals }) => {
  // Check authentication
  if (!locals.user) {
    throw error(401, 'Authentication required');
  }
  
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    throw error(400, 'Content-Type must be multipart/form-data');
  }
  
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: Object.fromEntries(request.headers),
      limits: {
        fileSize: MAX_FILE_SIZE,
        files: 10, // Max 10 files per upload
      },
    });
    
    const uploadedFiles: { name: string; path: string; size: number }[] = [];
    let parentPath = '/';
    let hasError = false;
    
    // Handle form fields
    busboy.on('field', (fieldname, value) => {
      if (fieldname === 'path') {
        parentPath = value || '/';
      }
    });
    
    // Handle file uploads
    busboy.on('file', (fieldname, file, info) => {
      const { filename } = info;
      
      if (hasError) {
        file.resume();
        return;
      }
      
      // Validate filename
      if (!filename || filename.includes('/') || filename.includes('\\')) {
        hasError = true;
        file.resume();
        return;
      }
      
      if (filename.startsWith('.')) {
        hasError = true;
        file.resume();
        return;
      }
      
      // Sanitize parent path
      const fullParentPath = sanitizePath(parentPath, locals.fileRoot, locals.user);
      if (!fullParentPath) {
        hasError = true;
        file.resume();
        auditLog('UPLOAD', locals.user?.username || null, parentPath, false, 'path_sanitization_failed');
        return;
      }
      
      const fullFilePath = path.join(fullParentPath, filename);
      const normalizedRoot = path.resolve(locals.fileRoot);
      
      // Verify destination is within root
      if (!fullFilePath.startsWith(normalizedRoot)) {
        hasError = true;
        file.resume();
        auditLog('UPLOAD', locals.user?.username || null, parentPath, false, 'outside_root');
        return;
      }
      
      // Write file
      const writeStream = createWriteStream(fullFilePath);
      let fileSize = 0;
      
      file.on('data', (data: Buffer) => {
        fileSize += data.length;
      });
      
      file.on('limit', () => {
        hasError = true;
        auditLog('UPLOAD', locals.user?.username || null, filename, false, 'file_too_large');
      });
      
      file.pipe(writeStream);
      
      writeStream.on('finish', () => {
        const relativePath = getRelativePath(fullFilePath, normalizedRoot);
        uploadedFiles.push({ name: filename, path: relativePath, size: fileSize });
        auditLog('UPLOAD', locals.user?.username || null, relativePath, true, `size_${fileSize}`);
      });
      
      writeStream.on('error', (err) => {
        hasError = true;
        console.error('Write error:', err);
        auditLog('UPLOAD', locals.user?.username || null, filename, false, 'write_error');
      });
    });
    
    busboy.on('finish', () => {
      if (hasError) {
        reject(error(400, 'Upload failed'));
      } else {
        resolve(json({
          success: true,
          message: `Uploaded ${uploadedFiles.length} file(s)`,
          files: uploadedFiles,
        }));
      }
    });
    
    busboy.on('error', (err) => {
      console.error('Busboy error:', err);
      reject(error(500, 'Upload processing failed'));
    });
    
    // Pipe request body to busboy
    if (request.body) {
      const reader = request.body.getReader();
      const pump = async (): Promise<void> => {
        const { done, value } = await reader.read();
        if (done) {
          busboy.end();
          return;
        }
        busboy.write(value);
        return pump();
      };
      pump().catch((err) => {
        console.error('Stream error:', err);
        reject(error(500, 'Stream processing failed'));
      });
    } else {
      reject(error(400, 'No request body'));
    }
  });
};
