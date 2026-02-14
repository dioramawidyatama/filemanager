import type { Handle } from '@sveltejs/kit';
import { verifySSHKey, extractFingerprintFromToken, parseSSHKey } from '$lib/server/auth';
import { readFile } from 'fs/promises';

async function getUserByFingerprint(fingerprint: string, authorizedKeysPath: string) {
  try {
    const authorizedKeysContent = await readFile(authorizedKeysPath, 'utf-8');
    const authorizedKeys = authorizedKeysContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    for (const keyLine of authorizedKeys) {
      const authorized = parseSSHKey(keyLine);
      if (!authorized) continue;
      
      if (authorized.fingerprint === fingerprint) {
        const parts = keyLine.trim().split(' ');
        const comment = parts[2] || 'user';
        
        return {
          id: authorized.fingerprint.replace(/:/g, '').slice(0, 16),
          username: comment,
          fingerprint: authorized.fingerprint
        };
      }
    }
  } catch (error) {
    console.error('Failed to get user by fingerprint:', error);
  }
  return null;
}

export const handle: Handle = async ({ event, resolve }) => {
  // Set configuration from environment
  event.locals.authorizedKeysPath = process.env.AUTHORIZED_KEYS_PATH || '/home/opc/.ssh/authorized_keys';
  // CRITICAL: Root directory is /home/opc/clawd
  event.locals.fileRoot = process.env.FILE_ROOT || '/home/opc/clawd';
  
  // Check for SSH key authentication
  const authHeader = event.request.headers.get('authorization');
  const sessionKey = event.cookies.get('session');
  
  event.locals.user = null;
  
  if (authHeader?.startsWith('Bearer ')) {
    const key = authHeader.slice(7);
    const user = await verifySSHKey(key, event.locals.authorizedKeysPath);
    if (user) {
      event.locals.user = user;
    }
  } else if (sessionKey) {
    // Extract fingerprint from session token and look up user
    const fingerprint = extractFingerprintFromToken(sessionKey);
    if (fingerprint) {
      const user = await getUserByFingerprint(fingerprint, event.locals.authorizedKeysPath);
      if (user) {
        event.locals.user = user;
      }
    }
  }
  
  const response = await resolve(event);
  return response;
};
