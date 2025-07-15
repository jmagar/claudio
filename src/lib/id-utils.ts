// Simple ID generator to ensure uniqueness
let counter = 0;

export function generateId(): string {
  return `${Date.now()}-${++counter}`;
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