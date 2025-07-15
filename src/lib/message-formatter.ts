/**
 * Message formatting utilities for Claude Code SDK responses
 */

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

/**
 * Formats Claude Code SDK messages by extracting unique text content
 * and removing duplicates that can occur in streaming responses
 */
export function formatMessages(messages: ClaudeMessage[]): string {
  const uniqueContent: string[] = [];
  
  for (const message of messages) {
    if (message.type === 'assistant' && message.message) {
      const content = message.message.content;
      let textContent = '';
      
      if (typeof content === 'string') {
        textContent = content;
      } else if (Array.isArray(content)) {
        textContent = content
          .map(block => block.type === 'text' ? block.text : JSON.stringify(block, null, 2))
          .join('\n');
      }
      
      if (textContent.trim() && !uniqueContent.some(existing => existing.includes(textContent.trim()))) {
        uniqueContent.push(textContent);
      }
    } else if (message.type === 'result' && message.subtype === 'success') {
      const resultContent = message.result || '';
      if (resultContent.trim() && !uniqueContent.some(existing => existing.includes(resultContent.trim()))) {
        uniqueContent.push(resultContent);
      }
    }
  }
  
  return uniqueContent.join('\n\n');
}

/**
 * Formats a single message with detailed analysis
 */
export function formatSingleMessage(message: ClaudeMessage): FormattedMessage {
  let content = '';
  let hasCode = false;
  let type: FormattedMessage['type'] = 'text';
  
  if (message.type === 'assistant' && message.message) {
    const messageContent = message.message.content;
    
    if (typeof messageContent === 'string') {
      content = messageContent;
      hasCode = messageContent.includes('```') || messageContent.includes('`');
      type = hasCode ? 'mixed' : 'text';
    } else if (Array.isArray(messageContent)) {
      const parts = messageContent.map(block => {
        if (block.type === 'text') {
          return block.text || '';
        } else if (block.type === 'code') {
          hasCode = true;
          return `\`\`\`${block.language || ''}\n${block.code || ''}\n\`\`\``;
        } else {
          return JSON.stringify(block, null, 2);
        }
      });
      
      content = parts.join('\n');
      type = hasCode ? 'code' : 'mixed';
    }
  } else if (message.result) {
    content = message.result;
    try {
      JSON.parse(content);
      type = 'json';
    } catch {
      type = 'text';
    }
  }
  
  return {
    content: content.trim(),
    type,
    hasCode,
    isEmpty: !content.trim(),
  };
}

/**
 * Deduplicates messages by content
 */
export function deduplicateMessages(messages: ClaudeMessage[]): ClaudeMessage[] {
  const seen = new Set<string>();
  const deduplicated: ClaudeMessage[] = [];
  
  for (const message of messages) {
    const formatted = formatSingleMessage(message);
    const key = `${message.type}-${formatted.content}`;
    
    if (!seen.has(key) && !formatted.isEmpty) {
      seen.add(key);
      deduplicated.push(message);
    }
  }
  
  return deduplicated;
}

/**
 * Extracts code blocks from formatted message content
 */
export function extractCodeBlocks(content: string): Array<{
  language: string;
  code: string;
  startLine: number;
  endLine: number;
}> {
  const codeBlocks: Array<{
    language: string;
    code: string;
    startLine: number;
    endLine: number;
  }> = [];
  
  const lines = content.split('\n');
  let inCodeBlock = false;
  let currentBlock: {
    language: string;
    code: string[];
    startLine: number;
  } | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        // Start of code block
        const language = line.slice(3).trim() || 'text';
        currentBlock = {
          language,
          code: [],
          startLine: i + 1,
        };
        inCodeBlock = true;
      } else {
        // End of code block
        if (currentBlock) {
          codeBlocks.push({
            language: currentBlock.language,
            code: currentBlock.code.join('\n'),
            startLine: currentBlock.startLine,
            endLine: i,
          });
        }
        inCodeBlock = false;
        currentBlock = null;
      }
    } else if (inCodeBlock && currentBlock) {
      currentBlock.code.push(line);
    }
  }
  
  return codeBlocks;
}

/**
 * Estimates reading time for formatted content
 */
export function estimateReadingTime(content: string): {
  words: number;
  minutes: number;
  hasCode: boolean;
} {
  const words = content.split(/\s+/).length;
  const hasCode = content.includes('```') || content.includes('`');
  
  // Adjust reading speed for code content
  const wordsPerMinute = hasCode ? 150 : 200;
  const minutes = Math.ceil(words / wordsPerMinute);
  
  return {
    words,
    minutes: Math.max(1, minutes),
    hasCode,
  };
}