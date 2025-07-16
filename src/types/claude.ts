/**
 * Claude Code SDK related types
 */


// Claude message types from SDK
export interface ClaudeMessage {
  type: string;
  message?: {
    content: string | Array<{ type: string; text?: string; [key: string]: unknown }>;
  };
  result?: string;
  subtype?: string;
  [key: string]: unknown;
}

export interface FormattedMessage {
  content: string;
  type: 'text' | 'code' | 'json' | 'mixed';
  hasCode: boolean;
  isEmpty: boolean;
}

// Claude Code SDK Options
export interface ClaudeCodeOptions {
  prompt: string;
  maxTurns?: number;
  customSystemPrompt?: string;
  allowedTools?: string[];
  disallowedTools?: string[];
  mcpServers?: Record<string, unknown>;
}