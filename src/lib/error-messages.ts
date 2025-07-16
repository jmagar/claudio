/**
 * User-friendly error messages with actionable guidance
 */

export interface ErrorInfo {
  message: string;
  action?: string;
  details?: string;
}

export const ERROR_MESSAGES: Record<string, ErrorInfo> = {
  // Authentication errors
  'authentication': {
    message: 'Authentication required',
    action: 'Please run `claude login` in your terminal to authenticate with Claude Code',
    details: 'You need to be logged in to use Claude Code features',
  },
  
  'login': {
    message: 'Login required',
    action: 'Please run `claude login` in your terminal to authenticate',
    details: 'Your session may have expired',
  },

  // Network errors
  'network': {
    message: 'Network connection failed',
    action: 'Check your internet connection and try again',
    details: 'Unable to connect to Claude Code servers',
  },

  'timeout': {
    message: 'Request timed out',
    action: 'Try again with a shorter message or check your connection',
    details: 'The request took too long to complete',
  },

  // MCP errors
  'mcp_command_invalid': {
    message: 'Invalid MCP command',
    action: 'Use only approved MCP packages and commands',
    details: 'The command contains unsafe characters or is not in the approved list',
  },

  'mcp_url_invalid': {
    message: 'Invalid MCP server URL',
    action: 'Please enter a valid HTTP or HTTPS URL',
    details: 'The URL format is incorrect',
  },

  'mcp_server_error': {
    message: 'MCP server connection failed',
    action: 'Check that the MCP server is running and accessible',
    details: 'Unable to connect to the configured MCP server',
  },

  // Streaming errors
  'stream_error': {
    message: 'Streaming connection lost',
    action: 'Try sending your message again',
    details: 'The connection was interrupted during streaming',
  },

  'stream_abort': {
    message: 'Request was cancelled',
    action: 'Click send to try again',
    details: 'The streaming request was cancelled',
  },

  // Storage errors
  'storage_error': {
    message: 'Failed to save conversation',
    action: 'Check your browser storage permissions',
    details: 'Unable to save to local storage',
  },

  'storage_full': {
    message: 'Storage limit reached',
    action: 'Delete some old conversations to free up space',
    details: 'Your browser storage is full',
  },

  // Generic errors
  'unknown': {
    message: 'An unexpected error occurred',
    action: 'Please try again or refresh the page',
    details: 'If the problem persists, please report this issue',
  },

  'sdk_error': {
    message: 'Claude Code SDK error',
    action: 'Check your Claude Code installation and try again',
    details: 'There was an issue with the Claude Code SDK',
  },
};

/**
 * Get user-friendly error message from error type or raw message
 */
export function getErrorMessage(error: string | Error): ErrorInfo {
  const errorKey = typeof error === 'string' ? error : error.message;
  
  // Check for direct matches first
  if (ERROR_MESSAGES[errorKey]) {
    return ERROR_MESSAGES[errorKey];
  }
  
  // Check for specific error patterns
  if (errorKey.includes('authentication')) {
    return ERROR_MESSAGES.authentication;
  }
  
  if (errorKey.includes('login')) {
    return ERROR_MESSAGES.login;
  }
  
  if (errorKey.includes('timeout')) {
    return ERROR_MESSAGES.timeout;
  }
  
  if (errorKey.includes('network') || errorKey.includes('fetch')) {
    return ERROR_MESSAGES.network;
  }
  
  if (errorKey.includes('MCP') || errorKey.includes('mcp')) {
    return ERROR_MESSAGES.mcp_server_error;
  }
  
  if (errorKey.includes('stream') || errorKey.includes('abort')) {
    return ERROR_MESSAGES.stream_error;
  }
  
  if (errorKey.includes('storage') || errorKey.includes('localStorage')) {
    return ERROR_MESSAGES.storage_error;
  }
  
  // Default to unknown error
  return {
    ...ERROR_MESSAGES.unknown,
    details: typeof error === 'string' ? error : error.message,
  };
}

/**
 * Format error for display in UI
 */
export function formatErrorForDisplay(error: string | Error): {
  title: string;
  message: string;
  action?: string;
} {
  const errorInfo = getErrorMessage(error);
  
  return {
    title: errorInfo.message,
    message: errorInfo.details || '',
    action: errorInfo.action,
  };
}