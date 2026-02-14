import { createHash } from 'crypto';
import { readFile } from 'fs/promises';

// Test the auth flow

/**
 * Parse SSH public key and extract fingerprint (MD5 format)
 */
export function parseSSHKey(key) {
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
 * Generate a session token from SSH key
 * Stores fingerprint (without colons) + timestamp for later verification
 */
export function generateSessionToken(key) {
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
export function extractFingerprintFromToken(token) {
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

/**
 * Verify an SSH key against authorized_keys file
 */
export async function verifySSHKey(providedKey, authorizedKeysPath) {
  try {
    const provided = parseSSHKey(providedKey);
    if (!provided) return null;
    
    console.log('  Provided key fingerprint:', provided.fingerprint);
    
    // Read authorized_keys file
    const authorizedKeysContent = await readFile(authorizedKeysPath, 'utf-8');
    const authorizedKeys = authorizedKeysContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    console.log('  Checking against', authorizedKeys.length, 'authorized keys...');
    
    for (const keyLine of authorizedKeys) {
      const authorized = parseSSHKey(keyLine);
      if (!authorized) {
        console.log('    Skipped: could not parse key line');
        continue;
      }
      
      console.log('    Authorized key fingerprint:', authorized.fingerprint);
      
      // Compare fingerprints
      if (authorized.fingerprint === provided.fingerprint) {
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

async function getUserByFingerprint(fingerprint, authorizedKeysPath) {
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

// Run tests
async function runTests() {
  const authorizedKeysPath = '/home/opc/.ssh/authorized_keys';
  
  console.log('\n=== FileManager Auth Tests ===\n');
  
  // Test 1: Read authorized_keys
  console.log('Test 1: Reading authorized_keys...');
  try {
    const content = await readFile(authorizedKeysPath, 'utf-8');
    const keys = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    console.log('✓ Found', keys.length, 'authorized keys\n');
  } catch (e) {
    console.error('✗ Failed to read authorized_keys:', e.message);
    return;
  }
  
  // Test 2: Parse an authorized key
  console.log('Test 2: Parsing authorized key...');
  const testKey = await readFile(authorizedKeysPath, 'utf-8')
    .then(c => c.split('\n').find(line => line.trim() && !line.startsWith('#')));
  
  if (testKey) {
    const parsed = parseSSHKey(testKey);
    if (parsed) {
      console.log('✓ Parsed key type:', parsed.type);
      console.log('  Fingerprint (MD5):', parsed.fingerprint);
      console.log('');
    } else {
      console.error('✗ Failed to parse authorized key\n');
    }
  }
  
  // Test 3: Full verification with same key
  console.log('Test 3: Full verification (login simulation)...');
  console.log('  Using authorized key as login attempt...');
  const user = await verifySSHKey(testKey, authorizedKeysPath);
  if (user) {
    console.log('✓ Authentication successful!');
    console.log('  User:', user.username);
    console.log('  ID:', user.id);
    console.log('');
    
    // Test 4: Session token flow
    console.log('Test 4: Session token flow...');
    const token = generateSessionToken(testKey);
    console.log('  Generated token:', token.substring(0, 30) + '...');
    
    const extractedFingerprint = extractFingerprintFromToken(token);
    console.log('  Extracted fingerprint:', extractedFingerprint);
    
    if (extractedFingerprint === user.fingerprint) {
      console.log('✓ Fingerprint matches!');
    } else {
      console.error('✗ Fingerprint mismatch!');
      console.log('  Expected:', user.fingerprint);
      console.log('  Got:', extractedFingerprint);
    }
    console.log('');
    
    // Test 5: Lookup by fingerprint (hooks.server.ts simulation)
    console.log('Test 5: User lookup by fingerprint (session validation)...');
    const userFromSession = await getUserByFingerprint(extractedFingerprint, authorizedKeysPath);
    if (userFromSession) {
      console.log('✓ User found from session fingerprint!');
      console.log('  Username:', userFromSession.username);
    } else {
      console.error('✗ User NOT found from session fingerprint!');
      console.log('  This is the bug causing the redirect loop!');
    }
    console.log('');
    
  } else {
    console.error('✗ Authentication failed!\n');
  }
  
  // Test 6: Try with wrong key
  console.log('Test 6: Rejection test (wrong key)...');
  const wrongKey = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC0InvalidKeyForTesting';
  const wrongUser = await verifySSHKey(wrongKey, authorizedKeysPath);
  if (!wrongUser) {
    console.log('✓ Correctly rejected invalid key\n');
  } else {
    console.error('✗ Should have rejected invalid key!\n');
  }
  
  console.log('=== Tests Complete ===\n');
}

runTests().catch(console.error);
