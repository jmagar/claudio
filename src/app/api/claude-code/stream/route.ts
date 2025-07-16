import { NextRequest } from 'next/server';
import { runClaudeCodeQuery } from '@/lib/claude-code-sdk';
import { claudeCodeStreamRateLimit } from '@/lib/rate-limit';
import { validateClaudeCodeRequest, validateRequestSize } from '@/lib/input-validation';

/**
 * Validates that the provided object is a valid Record<string, McpServerConfig>
 * Throws an error if validation fails to prevent runtime crashes
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
    const rateLimitResult = claudeCodeStreamRateLimit(request);
    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
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
      return new Response(
        JSON.stringify({ error: sizeValidation.errors[0] }),
        { 
          status: 413,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const requestBody = await request.json();

    // Validate request parameters
    const validation = validateClaudeCodeRequest(requestBody);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ error: validation.errors.join('; ') }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const { 
      prompt, 
      customSystemPrompt, 
      maxTurns = 5,
      allowedTools,
      disallowedTools,
      mcpServers, 
    } = requestBody;

    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false;
        
        const safeEnqueue = (data: Uint8Array) => {
          if (!isClosed) {
            try {
              controller.enqueue(data);
            } catch (error: unknown) {
              if (error && typeof error === 'object' && 'code' in error && error.code === 'ERR_INVALID_STATE') {
                isClosed = true;
              } else {
                throw error;
              }
            }
          }
        };

        const safeClose = () => {
          if (!isClosed) {
            try {
              controller.close();
              isClosed = true;
            } catch (error: unknown) {
              if (error && typeof error === 'object' && 'code' in error && error.code !== 'ERR_INVALID_STATE') {
              }
            }
          }
        };

        try {
          // Validate MCP servers to prevent runtime crashes
          const validatedMcpServers = validateMcpServers(mcpServers);
          
          for await (const message of runClaudeCodeQuery({
            prompt,
            customSystemPrompt,
            maxTurns,
            allowedTools,
            disallowedTools,
            mcpServers: validatedMcpServers,
          })) {
            if (isClosed) {break;}
            
            const chunk = encoder.encode(`data: ${JSON.stringify(message)}\n\n`);
            safeEnqueue(chunk);
          }
          
          // Send done signal
          if (!isClosed) {
            safeEnqueue(encoder.encode('data: [DONE]\n\n'));
          }
          safeClose();
        } catch (error: unknown) {
          
          if (!isClosed) {
            const errorMessage = {
              type: 'error',
              error: error instanceof Error ? error.message : 'Failed to process request',
              authRequired: error instanceof Error && (error.message?.includes('authentication') || error.message?.includes('login')),
            };
            
            safeEnqueue(encoder.encode(`data: ${JSON.stringify(errorMessage)}\n\n`));
          }
          safeClose();
        }
      },
      
      cancel() {
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
      },
    });
  } catch (error: unknown) {
    // Log detailed error information server-side for debugging
    if (error instanceof Error) {
    } else {
    }
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to setup stream',
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}