import { createHash } from 'crypto';
import { readFile } from 'fs/promises';
import type { User } from '$lib/types';

/**
 * Parse SSH public key and extract fingerprint
 */
export function parseSSHKey(key: string): { type: string; key: string; fingerprint: string } | null {
  try {
    const parts = key.trim().split(' ');
    if (parts.length < 2) return null;
    
    const keyType = parts[0];
    const keyData = parts[1];
    
    // Generate fingerprint (MD5 hash of key data, commonly used format)
    const fingerprint = createHash('md5')
      .update(Buffer.from(keyData, 'base64'))
      .digest('hex')
      .match(/.{2}/g)
      ?.join(':') || '';
    
    return { type: keyType, key: keyData, fingerprint };
  } catch {
    return null;
  }
}

/**
 * Verify an SSH key against authorized_keys file
 */
export async function verifySSHKey(
  providedKey: string, 
  authorizedKeysPath: string
): Promise<User | null> {
  try {
    const provided = parseSSHKey(providedKey);
    if (!provided) return null;
    
    // Read authorized_keys file
    const authorizedKeysContent = await readFile(authorizedKeysPath, 'utf-8');
    const authorizedKeys = authorizedKeysContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    for (const keyLine of authorizedKeys) {
      const authorized = parseSSHKey(keyLine);
      if (!authorized) continue;
      
      // Compare fingerprints
      if (authorized.fingerprint === provided.fingerprint) {
        // Extract username from comment if present
        const parts = keyLine.trim().split(' ');
        const comment = parts[2] || 'user';
        
        return {
          id: authorized.fingerprint.replace(/:/g, '').slice(0, 16),
          username: comment,
          fingerprint: authorized.fingerprint
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('SSH key verification failed:', error);
    return null;
  }
}

/**
 * Generate a session token from SSH key
 * Stores fingerprint (without colons) + timestamp for later verification
 * Format: base64url(fingerprint_no_colons:timestamp)
 */
export function generateSessionToken(key: string): string {
  const parsed = parseSSHKey(key);
  if (!parsed) throw new Error('Invalid SSH key');
  
  // Create a session token - remove colons from fingerprint since they conflict with delimiter
  const timestamp = Date.now();
  const fingerprintNoColons = parsed.fingerprint.replace(/:/g, '');
  const data = `${fingerprintNoColons}:${timestamp}`;
  return Buffer.from(data).toString('base64url');
}

/**
 * Extract fingerprint from session token
 * Returns fingerprint WITH colons (MD5 format)
 */
export function extractFingerprintFromToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    const fingerprintNoColons = parts[0];
    if (!fingerprintNoColons) return null;
    
    // Add colons back to make it MD5 fingerprint format
    return fingerprintNoColons.match(/.{2}/g)?.join(':') || null;
  } catch {
    return null;
  }
}
