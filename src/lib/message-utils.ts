/**
 * Utilities for validating and sanitizing Claude Code messages
 */

// Re-export formatting functions from message-formatter for backward compatibility
export { 
  formatMessages, 
  formatSingleMessage, 
  deduplicateMessages, 
  extractCodeBlocks, 
  estimateReadingTime,
} from './message-formatter';

// Re-export types from centralized location
export type { ClaudeMessage, FormattedMessage } from '@/types';

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
 * Validates an MCP server command string to ensure it is safe and conforms to approved patterns.
 *
 * The function checks for empty input, dangerous characters, command chaining, and enforces strict rules for allowed command prefixes (`npx`, `node`, `python`, or direct executable paths). For `npx` commands, only approved packages are allowed. For script execution, only specific file extensions and safe paths are permitted.
 *
 * @param command - The MCP server command string to validate
 * @returns An object indicating whether the command is valid and, if invalid, an error message describing the reason
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
 * Validates whether a given URL is a safe and allowed MCP server endpoint.
 *
 * Checks that the URL is non-empty, uses HTTP or HTTPS, is not a private IP address (except for localhost or 127.0.0.1), and is properly formatted.
 *
 * @param url - The MCP server URL to validate
 * @returns An object indicating if the URL is valid and, if not, an error message
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
 * Removes potentially dangerous characters from an MCP server command string to reduce the risk of command injection.
 *
 * @param command - The input command string to sanitize
 * @returns The sanitized command string with unsafe characters removed
 */
export function sanitizeMcpCommand(command: string): string {
  return command.replace(/[;&|`$(){}[\]]/g, '');
}