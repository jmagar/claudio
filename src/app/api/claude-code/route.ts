import { NextRequest, NextResponse } from 'next/server';
import { getClaudeCodeResponse, formatClaudeMessages } from '@/lib/claude-code-sdk';
import { type McpServerConfig } from '@anthropic-ai/claude-code';
import { claudeCodeRateLimit } from '@/lib/rate-limit';
import { validateClaudeCodeRequest, validateRequestSize } from '@/lib/input-validation';

/**
 * Sanitizes and validates a map of MCP server configurations, returning only valid entries.
 *
 * Ensures each server entry is an object with a valid `command` string, and includes optional fields such as `args` (array of strings) and `url` (for `sse` or `http` types). Invalid or incomplete entries are omitted from the result.
 *
 * @param mcpServers - The input object to validate as MCP server configurations
 * @returns An object containing only valid MCP server configurations
 */
function validateMcpServers(mcpServers: unknown): Record<string, any> {
  if (!mcpServers || typeof mcpServers !== 'object') {
    return {};
  }
  
  const servers = mcpServers as Record<string, unknown>;
  const validatedServers: Record<string, any> = {};
  
  for (const [name, config] of Object.entries(servers)) {
    if (!config || typeof config !== 'object') {
      console.warn(`Skipping invalid MCP server configuration for ${name}:`, config);
      continue;
    }
    
    const serverConfig = config as Record<string, unknown>;
    
    // Validate required command field
    if (!serverConfig.command || typeof serverConfig.command !== 'string') {
      console.warn(`Skipping MCP server ${name}: invalid or missing command`);
      continue;
    }
    
    const validatedConfig: any = {
      command: serverConfig.command,
    };
    
    // Validate optional fields
    if (serverConfig.args && Array.isArray(serverConfig.args)) {
      validatedConfig.args = serverConfig.args.filter(arg => typeof arg === 'string');
    }
    
    // Handle different server types appropriately
    if (serverConfig.type && ['stdio', 'sse', 'http'].includes(serverConfig.type as string)) {
      const serverType = serverConfig.type as string;
      switch (serverType) {
        case 'stdio':
          // stdio servers don't need additional config
          break;
        case 'sse':
        case 'http':
          if (serverConfig.url && typeof serverConfig.url === 'string') {
            validatedConfig.url = serverConfig.url;
          }
          break;
      }
    }
    
    validatedServers[name] = validatedConfig;
  }
  
  return validatedServers;
}

/**
 * Handles POST requests to the Claude Code API endpoint, enforcing rate limiting, request size validation, and input validation before processing the request.
 *
 * Validates and sanitizes the request body, including prompt, system prompt, turn limits, tool restrictions, and MCP server configurations. If validation passes, forwards the request to the Claude Code backend and returns the formatted response, raw messages, and message count. Responds with appropriate HTTP status codes and error messages for rate limiting, invalid input, authentication errors, or other failures.
 *
 * @returns A JSON response containing the Claude Code output, message details, and rate limit headers.
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimitResult = claudeCodeRateLimit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          },
        },
      );
    }

    // Validate request size
    const sizeValidation = validateRequestSize(request.headers.get('content-length'));
    if (!sizeValidation.isValid) {
      return NextResponse.json(
        { error: sizeValidation.errors[0] },
        { status: 413 },
      );
    }

    const requestBody = await request.json();

    // Validate request parameters
    const validation = validateClaudeCodeRequest(requestBody);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join('; ') },
        { status: 400 },
      );
    }

    const { 
      prompt, 
      customSystemPrompt, 
      maxTurns = 3,
      allowedTools,
      disallowedTools,
      mcpServers,
    } = requestBody;
    
    // Validate MCP servers to prevent runtime crashes
    const validatedMcpServers = validateMcpServers(mcpServers);
    
    const messages = await getClaudeCodeResponse({
      prompt,
      customSystemPrompt,
      maxTurns,
      allowedTools,
      disallowedTools,
      mcpServers: validatedMcpServers,
    });
    
    const formattedResponse = formatClaudeMessages(messages);
    
    return NextResponse.json({ 
      response: formattedResponse,
      messages,
      messageCount: messages.length,
    }, {
      headers: {
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
      },
    });
  } catch (error: unknown) {
    // Log detailed error information server-side for debugging
    if (error instanceof Error) {
      console.error('Claude Code API error:', error.message, error.stack);
    } else {
      console.error('Claude Code API error:', error);
    }
    
    // Handle authentication errors specifically
    if (error instanceof Error && (error.message?.includes('authentication') || error.message?.includes('login'))) {
      return NextResponse.json(
        { 
          error: 'Authentication required. Please run "claude login" in your terminal first.',
          authRequired: true,
        },
        { status: 401 },
      );
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process request',
      },
      { status: 500 },
    );
  }
}