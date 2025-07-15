export interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  streaming?: boolean;
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
  editable?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
  totalTokens: number;
  mcpServers?: Record<string, unknown>;
}

export interface McpServer {
  name: string;
  command: string;
  args?: string[];
  type?: 'stdio' | 'sse' | 'http';
  url?: string;
  enabled: boolean;
}