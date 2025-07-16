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
 * Validates Claude Code API request parameters
 */
export function validateClaudeCodeRequest(
  requestBody: unknown,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG,
): ValidationResult {
  const errors: string[] = [];
  const body = requestBody as Record<string, unknown>;

  // Validate prompt
  if (!body.prompt) {
    errors.push('Prompt is required');
  } else if (typeof body.prompt !== 'string') {
    errors.push('Prompt must be a string');
  } else if (body.prompt.length > config.maxPromptLength) {
    errors.push(`Prompt too long. Maximum length: ${config.maxPromptLength} characters`);
  } else if (body.prompt.trim().length === 0) {
    errors.push('Prompt cannot be empty');
  }

  // Validate customSystemPrompt if provided
  if (body.customSystemPrompt !== undefined) {
    if (typeof body.customSystemPrompt !== 'string') {
      errors.push('Custom system prompt must be a string');
    } else if (body.customSystemPrompt.length > config.maxCustomSystemPromptLength) {
      errors.push(`Custom system prompt too long. Maximum length: ${config.maxCustomSystemPromptLength} characters`);
    }
  }

  // Validate maxTurns if provided
  if (body.maxTurns !== undefined) {
    if (!Number.isInteger(body.maxTurns)) {
      errors.push('maxTurns must be an integer');
    } else if (body.maxTurns !== null && ((body.maxTurns as number) < config.minTurns || (body.maxTurns as number) > config.maxTurns)) {
      errors.push(`maxTurns must be between ${config.minTurns} and ${config.maxTurns}`);
    }
  }

  // Validate allowedTools if provided
  if (body.allowedTools !== undefined) {
    if (!Array.isArray(body.allowedTools)) {
      errors.push('allowedTools must be an array');
    } else if (!body.allowedTools.every((tool: unknown) => typeof tool === 'string')) {
      errors.push('All allowedTools must be strings');
    }
  }

  // Validate disallowedTools if provided
  if (body.disallowedTools !== undefined) {
    if (!Array.isArray(body.disallowedTools)) {
      errors.push('disallowedTools must be an array');
    } else if (!body.disallowedTools.every((tool: unknown) => typeof tool === 'string')) {
      errors.push('All disallowedTools must be strings');
    }
  }

  // Validate mcpServers if provided
  if (body.mcpServers !== undefined) {
    if (typeof body.mcpServers !== 'object' || body.mcpServers === null) {
      errors.push('mcpServers must be an object');
    } else {
      const serverCount = Object.keys(body.mcpServers).length;
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
 * Validates the size of the request body
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
 * Sanitizes string input to prevent injection attacks
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
 * Validates that MCP server names are safe
 */
export function validateMcpServerName(name: string): boolean {
  // Only allow alphanumeric characters, hyphens, underscores, and dots
  const safeNamePattern = /^[a-zA-Z0-9\-_.]+$/;
  return safeNamePattern.test(name) && name.length <= 50;
}