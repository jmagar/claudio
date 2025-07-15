/**
 * Utilities for formatting and processing Claude Code messages
 */

export interface ClaudeMessage {
  type: string;
  message?: {
    content: string | Array<{ type: string; text?: string; [key: string]: any }>;
  };
  result?: string;
  subtype?: string;
  [key: string]: any;
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
 * Validates an MCP server command for security
 * @param command The command to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateMcpCommand(command: string): { isValid: boolean; error?: string } {
  if (!command.trim()) {
    return { isValid: false, error: 'Command is required' };
  }

  // Remove dangerous characters
  const sanitized = command.replace(/[;&|`$(){}[\]]/g, '');
  if (sanitized !== command) {
    return { isValid: false, error: 'Command contains dangerous characters' };
  }

  // Check for safe command patterns
  const safePatterns = [
    /^npx\s+@?[\w@\/.-]+/,           // npx packages
    /^node\s+[\w\/.-]+/,             // node scripts
    /^python3?\s+[\w\/.-]+/,         // python scripts
    /^\/[\w\/.-]+$/,                 // absolute paths
    /^\.\/[\w\/.-]+$/,               // relative paths starting with ./
  ];

  const isValidPattern = safePatterns.some(pattern => pattern.test(command));
  if (!isValidPattern) {
    return { 
      isValid: false, 
      error: 'Command should start with npx, node, python, or be a safe file path' 
    };
  }

  return { isValid: true };
}

/**
 * Validates an MCP server URL
 */
export function validateMcpUrl(url: string): { isValid: boolean; error?: string } {
  if (!url.trim()) {
    return { isValid: false, error: 'URL is required for HTTP connections' };
  }

  try {
    const urlObj = new URL(url);
    
    // Only allow safe protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
    }

    // Prevent localhost access unless explicitly localhost/127.0.0.1
    if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
      // This is actually OK for development
      return { isValid: true };
    }

    // Check for private IP ranges (basic check)
    if (urlObj.hostname.match(/^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/)) {
      return { isValid: false, error: 'Private IP addresses are not allowed' };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * Sanitizes MCP server command input
 */
export function sanitizeMcpCommand(command: string): string {
  return command.replace(/[;&|`$(){}[\]]/g, '');
}