import { NextRequest, NextResponse } from 'next/server';
import { getClaudeCodeResponse, formatClaudeMessages } from '@/lib/claude-code-sdk';
import { claudeCodeRateLimit } from '@/lib/rate-limit';
import { validateClaudeCodeRequest, validateRequestSize } from '@/lib/input-validation';

/**
 * Validates that the provided object is a valid Record<string, McpServerConfig>
 * Returns an empty object if validation fails to prevent runtime crashes
 */
function validateMcpServers(mcpServers: unknown): Record<string, unknown> {
  if (!mcpServers || typeof mcpServers !== 'object') {
    return {};
  }
  
  const servers = mcpServers as Record<string, unknown>;
  const validatedServers: Record<string, unknown> = {};
  
  for (const [name, config] of Object.entries(servers)) {
    if (!config || typeof config !== 'object') {
      continue;
    }
    
    const serverConfig = config as Record<string, unknown>;
    
    // Validate required command field
    if (!serverConfig.command || typeof serverConfig.command !== 'string') {
      continue;
    }
    
    const validatedConfig: Record<string, unknown> = {
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
    } else {
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