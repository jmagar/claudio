/**
 * Utilities for formatting and processing Claude Code messages
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
 * Whitelist of approved MCP server packages and commands
 * This prevents arbitrary command execution by only allowing known safe packages
 */
const APPROVED_MCP_PACKAGES = [
  // Official MCP servers
  '@modelcontextprotocol/server-filesystem',
  '@modelcontextprotocol/server-git',
  '@modelcontextprotocol/server-github',
  '@modelcontextprotocol/server-gitlab',
  '@modelcontextprotocol/server-google-drive',
  '@modelcontextprotocol/server-memory',
  '@modelcontextprotocol/server-postgres',
  '@modelcontextprotocol/server-sqlite',
  '@modelcontextprotocol/server-brave-search',
  '@modelcontextprotocol/server-everything',
  '@modelcontextprotocol/server-fetch',
  '@modelcontextprotocol/server-puppeteer',
  '@modelcontextprotocol/server-sequential-thinking',
  // Community MCP servers (add as needed)
  'mcp-server-time',
  'mcp-server-docker',
  'mcp-youtube-transcript',
  'mcp-obsidian',
  'mcp-reasonet',
  'mcp-code-reviewer',
  'mcp-aws-kb',
  'mcp-hacker-news',
  'mcp-linear',
  'mcp-sentry',
  'mcp-todoist',
  'mcp-jira',
  'mcp-notion',
  'mcp-slack',
  'mcp-confluence',
  'mcp-raycast',
  'mcp-neon',
  'mcp-kubernetes',
  'mcp-bigquery',
  'mcp-cloudflare',
  'mcp-anthropic',
  'mcp-search1api',
  'mcp-email',
  'mcp-aws',
  'mcp-youtube',
  'mcp-perplexity',
  'mcp-shell',
  'mcp-pandoc',
  'mcp-google-search',
  'mcp-gdrive',
  'mcp-s3',
  'mcp-spotify',
  'mcp-twitter',
  'mcp-github-readme',
  'mcp-openai',
  'mcp-redis',
  'mcp-mongodb',
  'mcp-elasticsearch',
  'mcp-deepwiki',
  'mcp-prompt-kit',
  'mcp-searxng',
  'mcp-context7',
  'mcp-github-chat',
  'mcp-gemini-coding',
  'mcp-deep-directory-tree',
];

/**
 * Validates an MCP server command for security using whitelist approach
 * @param command The command to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateMcpCommand(command: string): { isValid: boolean; error?: string } {
  if (!command.trim()) {
    return { isValid: false, error: 'Command is required' };
  }

  // Normalize command for validation
  const normalizedCommand = command.trim().toLowerCase();
  
  // Check for dangerous characters that could enable command injection
  const dangerousChars = /[;&|`$(){}[\]<>\\'"]/;
  if (dangerousChars.test(command)) {
    return { isValid: false, error: 'Command contains dangerous characters' };
  }

  // Check for command chaining attempts
  const chainPatterns = [
    /&&/, /\|\|/, /;/, /\|/, /\n/, /\r/,
  ];
  if (chainPatterns.some(pattern => pattern.test(command))) {
    return { isValid: false, error: 'Command chaining is not allowed' };
  }

  // Validate npx commands with whitelist
  if (normalizedCommand.startsWith('npx ')) {
    const packageMatch = command.match(/^npx\s+(@?[\w@\/.-]+)(?:\s|$)/);
    if (!packageMatch) {
      return { isValid: false, error: 'Invalid npx command format' };
    }
    
    const packageName = packageMatch[1];
    const isApproved = APPROVED_MCP_PACKAGES.some(approved => 
      packageName === approved || packageName.startsWith(approved + '@'),
    );
    
    if (!isApproved) {
      return { 
        isValid: false, 
        error: `Package "${packageName}" is not in the approved MCP packages list`, 
      };
    }
    
    return { isValid: true };
  }

  // Validate node commands (only allow .js, .mjs files)
  if (normalizedCommand.startsWith('node ')) {
    const scriptMatch = command.match(/^node\s+([\w\/.-]+\.m?js)(?:\s|$)/);
    if (!scriptMatch) {
      return { isValid: false, error: 'Node command must specify a .js or .mjs file' };
    }
    
    const scriptPath = scriptMatch[1];
    // Don't allow absolute paths outside of current directory
    if (scriptPath.startsWith('/') || scriptPath.includes('..')) {
      return { isValid: false, error: 'Node scripts must be in current directory or subdirectories' };
    }
    
    return { isValid: true };
  }

  // Validate python commands (only allow .py files)
  if (normalizedCommand.startsWith('python') && (normalizedCommand.startsWith('python ') || normalizedCommand.startsWith('python3 '))) {
    const scriptMatch = command.match(/^python3?\s+([\w\/.-]+\.py)(?:\s|$)/);
    if (!scriptMatch) {
      return { isValid: false, error: 'Python command must specify a .py file' };
    }
    
    const scriptPath = scriptMatch[1];
    // Don't allow absolute paths outside of current directory
    if (scriptPath.startsWith('/') || scriptPath.includes('..')) {
      return { isValid: false, error: 'Python scripts must be in current directory or subdirectories' };
    }
    
    return { isValid: true };
  }

  // Validate direct executable paths (very restrictive)
  if (command.startsWith('./') || command.startsWith('/')) {
    // Only allow specific safe extensions
    const safeExtensions = ['.js', '.mjs', '.py', '.sh'];
    const hasValidExtension = safeExtensions.some(ext => command.endsWith(ext));
    
    if (!hasValidExtension) {
      return { isValid: false, error: 'Executable files must have .js, .mjs, .py, or .sh extension' };
    }
    
    // Don't allow path traversal
    if (command.includes('..')) {
      return { isValid: false, error: 'Path traversal is not allowed' };
    }
    
    return { isValid: true };
  }

  return { 
    isValid: false, 
    error: 'Command must start with npx, node, python, or be a safe file path', 
  };
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