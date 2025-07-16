/**
 * Input validation utilities for API endpoints
 */

export interface ValidationConfig {
  maxPromptLength: number;
  maxCustomSystemPromptLength: number;
  maxTurns: number;
  minTurns: number;
  maxMcpServers: number;
}

export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  maxPromptLength: 100000, // 100KB prompt limit
  maxCustomSystemPromptLength: 10000, // 10KB system prompt limit
  maxTurns: 10, // Maximum conversation turns
  minTurns: 1, // Minimum conversation turns
  maxMcpServers: 10, // Maximum number of MCP servers
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates the parameters of a Claude Code API request against configurable constraints.
 *
 * Checks for required fields, correct types, and value limits for properties such as `prompt`, `customSystemPrompt`, `maxTurns`, `allowedTools`, `disallowedTools`, and `mcpServers`. Accumulates all validation errors and returns a result indicating overall validity.
 *
 * @param requestBody - The request body to validate
 * @param config - Optional validation configuration to override default limits
 * @returns An object indicating whether the request is valid and any validation errors
 */
export function validateClaudeCodeRequest(
  requestBody: any,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG,
): ValidationResult {
  const errors: string[] = [];

  // Validate prompt
  if (!requestBody.prompt) {
    errors.push('Prompt is required');
  } else if (typeof requestBody.prompt !== 'string') {
    errors.push('Prompt must be a string');
  } else if (requestBody.prompt.length > config.maxPromptLength) {
    errors.push(`Prompt too long. Maximum length: ${config.maxPromptLength} characters`);
  } else if (requestBody.prompt.trim().length === 0) {
    errors.push('Prompt cannot be empty');
  }

  // Validate customSystemPrompt if provided
  if (requestBody.customSystemPrompt !== undefined) {
    if (typeof requestBody.customSystemPrompt !== 'string') {
      errors.push('Custom system prompt must be a string');
    } else if (requestBody.customSystemPrompt.length > config.maxCustomSystemPromptLength) {
      errors.push(`Custom system prompt too long. Maximum length: ${config.maxCustomSystemPromptLength} characters`);
    }
  }

  // Validate maxTurns if provided
  if (requestBody.maxTurns !== undefined) {
    if (!Number.isInteger(requestBody.maxTurns)) {
      errors.push('maxTurns must be an integer');
    } else if (requestBody.maxTurns < config.minTurns || requestBody.maxTurns > config.maxTurns) {
      errors.push(`maxTurns must be between ${config.minTurns} and ${config.maxTurns}`);
    }
  }

  // Validate allowedTools if provided
  if (requestBody.allowedTools !== undefined) {
    if (!Array.isArray(requestBody.allowedTools)) {
      errors.push('allowedTools must be an array');
    } else if (!requestBody.allowedTools.every((tool: any) => typeof tool === 'string')) {
      errors.push('All allowedTools must be strings');
    }
  }

  // Validate disallowedTools if provided
  if (requestBody.disallowedTools !== undefined) {
    if (!Array.isArray(requestBody.disallowedTools)) {
      errors.push('disallowedTools must be an array');
    } else if (!requestBody.disallowedTools.every((tool: any) => typeof tool === 'string')) {
      errors.push('All disallowedTools must be strings');
    }
  }

  // Validate mcpServers if provided
  if (requestBody.mcpServers !== undefined) {
    if (typeof requestBody.mcpServers !== 'object' || requestBody.mcpServers === null) {
      errors.push('mcpServers must be an object');
    } else {
      const serverCount = Object.keys(requestBody.mcpServers).length;
      if (serverCount > config.maxMcpServers) {
        errors.push(`Too many MCP servers. Maximum allowed: ${config.maxMcpServers}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Checks if the request body size, as specified by the Content-Length header, exceeds the allowed maximum.
 *
 * @param contentLength - The Content-Length header value from the request, or null if not provided
 * @param maxSizeBytes - The maximum allowed size in bytes (defaults to 1MB)
 * @returns A ValidationResult indicating whether the request size is within the allowed limit and any related errors
 */
export function validateRequestSize(
  contentLength: string | null,
  maxSizeBytes: number = 1024 * 1024, // 1MB default
): ValidationResult {
  const errors: string[] = [];

  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > maxSizeBytes) {
      errors.push(`Request too large. Maximum size: ${Math.round(maxSizeBytes / 1024)} KB`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Removes potentially dangerous characters and protocols from a string to prevent injection attacks.
 *
 * Strips HTML/XML special characters (`<`, `>`, `"`, `'`, `&`), as well as occurrences of `javascript:` and `data:` protocols, and trims whitespace.
 *
 * @param input - The string to sanitize
 * @returns The sanitized string
 */
export function sanitizeString(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/[<>\"'&]/g, '') // Remove HTML/XML characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .trim();
}

/**
 * Checks if an MCP server name contains only allowed characters and does not exceed 50 characters.
 *
 * Only alphanumeric characters, hyphens, underscores, and dots are permitted.
 *
 * @param name - The MCP server name to validate
 * @returns `true` if the name is valid; otherwise, `false`
 */
export function validateMcpServerName(name: string): boolean {
  // Only allow alphanumeric characters, hyphens, underscores, and dots
  const safeNamePattern = /^[a-zA-Z0-9\-_.]+$/;
  return safeNamePattern.test(name) && name.length <= 50;
}