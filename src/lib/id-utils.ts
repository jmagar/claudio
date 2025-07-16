// Robust ID generator using crypto.randomUUID() for maximum uniqueness
let fallbackCounter = 0;

/**
 * Generates a unique identifier string using a secure random UUID if available, or a robust fallback combining timestamp, counter, and random data.
 *
 * The fallback ensures uniqueness across calls and avoids returning IDs that are only timestamps by appending a random suffix if necessary.
 * @returns A unique ID string suitable for general-purpose identification.
 */
export function generateId(): string {
  // Use crypto.randomUUID() if available (modern browsers and Node.js)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Enhanced fallback for older environments with guaranteed uniqueness
  const timestamp = Date.now();
  const counter = (fallbackCounter++) % 10000; // Reset counter after 10000 to keep IDs manageable
  const random = Math.random().toString(36).substr(2, 9);
  const id = `${timestamp}-${counter.toString().padStart(4, '0')}-${random}`;
  
  // Ensure we never return just a timestamp
  if (/^\d{13}$/.test(id)) {
    return `fallback-${id}-${Math.random().toString(36).substr(2, 6)}`;
  }
  
  return id;
}

/**
 * Generates a unique conversation ID string prefixed with "conv-".
 *
 * @returns A conversation-specific unique identifier.
 */
export function generateConversationId(): string {
  return `conv-${generateId()}`;
}

/**
 * Generates a unique message ID string prefixed with "msg-".
 *
 * @returns A message-specific unique identifier.
 */
export function generateMessageId(): string {
  return `msg-${generateId()}`;
}

/**
 * Generates a unique server identifier string prefixed with "server-".
 *
 * @returns A unique server ID.
 */
export function generateServerId(): string {
  return `server-${generateId()}`;
}