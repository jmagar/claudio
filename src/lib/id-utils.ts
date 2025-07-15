// Robust ID generator to ensure uniqueness
let counter = 0;
let lastTimestamp = 0;

export function generateId(): string {
  const timestamp = Date.now();
  
  // If we get the same timestamp, increment counter
  if (timestamp === lastTimestamp) {
    counter++;
  } else {
    counter = 0;
    lastTimestamp = timestamp;
  }
  
  // Add random component for extra uniqueness
  const random = Math.random().toString(36).substr(2, 4);
  return `${timestamp}-${counter}-${random}`;
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