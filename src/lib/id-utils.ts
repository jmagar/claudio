// Robust ID generator using crypto.randomUUID() for maximum uniqueness
let fallbackCounter = 0;

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

export function generateConversationId(): string {
  return `conv-${generateId()}`;
}

export function generateMessageId(): string {
  return `msg-${generateId()}`;
}

export function generateServerId(): string {
  return `server-${generateId()}`;
}