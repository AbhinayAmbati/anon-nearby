// Client-side file transfer utilities (Ephemeral Relay)

/**
 * Generate a random one-time code
 */
export function generateOneTimeCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
  let code = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    code += chars[randomValues[i] % chars.length];
  }
  
  // Format as XXX-XXX if length is 6 or more
  if (length >= 6) {
    return `${code.slice(0, 3)}-${code.slice(3)}`;
  }
  return code;
}

/**
 * Derive an AES-GCM key from a shared code or secret
 */
export async function deriveKeyFromSecret(secret, salt = 'anon-nearby-salt') {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Derive a key from location (Quantized)
 */
export async function deriveKeyFromLocation(latitude, longitude, secretSalt = '') {
  // Quantize to ~100m (3 decimal places) or ~10m (4 decimal places)
  // User requested 3-4 decimals. Let's use 3 for ~100m tolerance.
  const lat = latitude.toFixed(3);
  const lon = longitude.toFixed(3);
  
  const locationString = `${lat},${lon}|${secretSalt}`;
  return await deriveKeyFromSecret(locationString, 'location-salt');
}

/**
 * Encrypt a chunk of data
 */
async function encryptChunk(chunk, key, chunkIndex) {
  // Use a deterministic IV based on chunk index or random?
  // If we use random IV, we need to send it with the chunk.
  // Let's use random IV for security.
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    chunk
  );
  
  // Prepend IV to encrypted data
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);
  
  return combined;
}

/**
 * Decrypt a chunk of data
 */
export async function decryptChunk(encryptedChunkWithIv, key) {
  // Extract IV
  const iv = encryptedChunkWithIv.slice(0, 12);
  const data = encryptedChunkWithIv.slice(12);
  
  return await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    data
  );
}

/**
 * Process file: Split, Encrypt, and Yield Chunks
 * @param {File} file 
 * @param {CryptoKey} key 
 * @param {Function} onChunk - Callback(chunkData, chunkIndex, totalChunks)
 */
export async function processFileAndSend(file, key, onChunk) {
  const CHUNK_SIZE = 64 * 1024; // 64KB
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  
  let offset = 0;
  let chunkIndex = 0;
  
  while (offset < file.size) {
    const chunkBlob = file.slice(offset, offset + CHUNK_SIZE);
    const chunkArrayBuffer = await chunkBlob.arrayBuffer();
    
    const encryptedBytes = await encryptChunk(chunkArrayBuffer, key, chunkIndex);
    
    await onChunk({
      fileId: `${file.name}-${file.lastModified}`,
      fileName: file.name,
      fileType: file.type,
      chunkIndex,
      totalChunks,
      encryptedBytes // This is a Uint8Array
    });
    
    offset += CHUNK_SIZE;
    chunkIndex++;
  }
}

/**
 * Convert ArrayBuffer to Base64 (for transmission over JSON/WS if binary not supported directly)
 * But Socket.io supports binary, so we might not need this if we emit buffers.
 * However, to be safe and consistent with JSON payloads, we can use Base64.
 */
export function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}
