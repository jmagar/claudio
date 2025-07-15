import { query, type SDKMessage, type McpServerConfig } from '@anthropic-ai/claude-code';

export interface ClaudeCodeOptions {
  prompt: string;
  maxTurns?: number;
  customSystemPrompt?: string;
  allowedTools?: string[];
  disallowedTools?: string[];
  mcpServers?: Record<string, McpServerConfig>;
}

export async function* runClaudeCodeQuery({
  prompt,
  maxTurns = 3,
  customSystemPrompt,
  allowedTools,
  disallowedTools,
  mcpServers,
}: ClaudeCodeOptions) {
  try {
    const abortController = new AbortController();
    
    for await (const message of query({
      prompt,
      abortController,
      options: {
        maxTurns,
        customSystemPrompt,
        allowedTools,
        disallowedTools,
        mcpServers,
      },
    })) {
      yield message;
    }
  } catch (error) {
    console.error('Claude Code SDK error:', error);
    throw error;
  }
}

export async function getClaudeCodeResponse(options: ClaudeCodeOptions): Promise<SDKMessage[]> {
  const messages: SDKMessage[] = [];
  
  try {
    for await (const message of runClaudeCodeQuery(options)) {
      messages.push(message);
    }
  } catch (error) {
    console.error('Failed to get Claude Code response:', error);
    throw error;
  }
  
  return messages;
}

export function formatClaudeMessages(messages: SDKMessage[]): string {
  return messages
    .map(message => {
      if (message.type === 'assistant' && message.message) {
        const content = message.message.content;
        
        if (typeof content === 'string') {
          return content;
        }
        
        // Handle structured content array
        if (Array.isArray(content)) {
          return content
            .map(block => {
              if (block.type === 'text') {
                return block.text;
              }
              return JSON.stringify(block, null, 2);
            })
            .join('\n');
        }
      }
      
      if (message.type === 'result') {
        if (message.subtype === 'success') {
          return message.result;
        } else {
          return `Error: ${message.subtype}`;
        }
      }
      
      // For other message types, return a summary
      return JSON.stringify(message, null, 2);
    })
    .filter(content => content && content.trim())
    .join('\n\n');
}