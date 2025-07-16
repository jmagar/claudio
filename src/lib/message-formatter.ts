/**
 * Message formatting utilities for Claude Code SDK responses
 */

import type { ClaudeMessage, FormattedMessage } from '@/types';

/**
 * Aggregates and formats unique text content from an array of Claude Code SDK messages.
 *
 * Extracts and deduplicates text from 'assistant' messages and successful 'result' messages, handling both string and block array formats. Returns a single string with unique, trimmed message contents separated by double newlines.
 *
 * @param messages - The array of ClaudeMessage objects to process
 * @returns A formatted string containing unique message contents
 */
export function formatMessages(messages: ClaudeMessage[]): string {
  const seenContent = new Set<string>();
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
      
      const trimmedContent = textContent.trim();
      if (trimmedContent && !seenContent.has(trimmedContent)) {
        seenContent.add(trimmedContent);
        uniqueContent.push(trimmedContent);
      }
    } else if (message.type === 'result' && message.subtype === 'success') {
      const resultContent = (message.result || '').trim();
      if (resultContent && !seenContent.has(resultContent)) {
        seenContent.add(resultContent);
        uniqueContent.push(resultContent);
      }
    }
  }
  
  return uniqueContent.join('\n\n');
}

/**
 * Formats a single ClaudeMessage into a structured object with content, type, code presence, and emptiness status.
 *
 * Distinguishes between text, code, mixed, and JSON message types, and detects code blocks within the message content.
 *
 * @param message - The ClaudeMessage to format
 * @returns A FormattedMessage object containing the trimmed content, type, code presence flag, and empty status
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
 * Removes duplicate and empty messages from an array, preserving only unique messages based on their type and formatted content.
 *
 * @param messages - The array of ClaudeMessage objects to deduplicate
 * @returns An array of unique, non-empty ClaudeMessage objects
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
 * Parses a string to extract all fenced code blocks, returning their language, code content, and line number range.
 *
 * Each code block is identified by triple backticks (```) and may specify a language after the opening fence.
 *
 * @param content - The formatted message content to parse for code blocks
 * @returns An array of objects, each containing the language, code string, and the start and end line numbers of the code block
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
 * Estimates the reading time for the given content, adjusting for the presence of code.
 *
 * Splits the content into words, detects code by searching for backticks, and calculates reading time using a slower speed if code is present.
 *
 * @param content - The text to analyze for reading time
 * @returns An object containing the word count, estimated reading time in minutes (minimum 1), and a flag indicating if code is present
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