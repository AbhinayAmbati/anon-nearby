// Client-side encryption utilities for file drops
// Uses Web Crypto API for secure encryption

/**
 * Generate a random encryption key
 */
export async function generateEncryptionKey() {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Derive encryption key from password
 */
export async function deriveKeyFromPassword(password, salt) {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt file data
 */
/**
 * Encrypt file data
 */
export async function encryptFile(file, password) {
  try {
    // Generate salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Derive key from password
    const key = await deriveKeyFromPassword(password, salt);

    // Read file as ArrayBuffer
    const fileData = await file.arrayBuffer();

    // Encrypt
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      fileData
    );

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

    // Convert to base64
    return await arrayBufferToBase64(combined);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt file');
  }
}

/**
 * Decrypt file data
 */
export async function decryptFile(encryptedBase64, password, fileName, fileType) {
  try {
    // Convert from base64
    const combined = await base64ToArrayBuffer(encryptedBase64);

    // Extract salt, iv, and encrypted data
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encryptedData = combined.slice(28);

    // Derive key from password
    const key = await deriveKeyFromPassword(password, salt);

    // Decrypt
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encryptedData
    );

    // Create blob from decrypted data
    const blob = new Blob([decryptedData], { type: fileType });
    return new File([blob], fileName, { type: fileType });
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt file - incorrect password or corrupted data');
  }
}

/**
 * Convert ArrayBuffer to Base64 (Async, optimized)
 */
function arrayBufferToBase64(buffer) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target.result;
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert Base64 to ArrayBuffer (Async, optimized)
 */
async function base64ToArrayBuffer(base64) {
  const res = await fetch(`data:application/octet-stream;base64,${base64}`);
  return await res.arrayBuffer();
}

/**
 * Generate a random session ID for anonymous tracking
 */
export function generateSessionId() {
  return crypto.randomUUID();
}

/**
 * Validate file before encryption
 */
export function validateFile(file, maxSize = 10 * 1024 * 1024) {
  if (!file) {
    throw new Error('No file provided');
  }

  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
  }

  // Check file type (basic validation)
  const allowedTypes = [
    'text/plain',
    'text/csv',
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/json'
  ];

  if (!allowedTypes.includes(file.type) && !file.type.startsWith('text/')) {
    console.warn('File type may not be supported:', file.type);
  }

  return true;
}
