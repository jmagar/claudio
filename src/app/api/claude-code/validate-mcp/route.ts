import { NextRequest, NextResponse } from 'next/server';
import type { McpServer } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ValidateMcpRequest {
  server: McpServer;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { server }: ValidateMcpRequest = body;

    if (!server.command) {
      return NextResponse.json(
        { error: 'Server command is required' },
        { status: 400 },
      );
    }

    const validationResult = await validateMcpServer(server);

    return NextResponse.json({
      valid: validationResult.valid,
      error: validationResult.error,
      responseTime: validationResult.responseTime,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to validate MCP server' },
      { status: 500 },
    );
  }
}

async function validateMcpServer(server: McpServer): Promise<{
  valid: boolean;
  error?: string;
  responseTime: number;
}> {
  const startTime = Date.now();

  try {
    if (server.type === 'http' || server.type === 'sse') {
      if (!server.url) {
        return {
          valid: false,
          error: 'URL is required for HTTP/SSE servers',
          responseTime: Date.now() - startTime,
        };
      }

      try {
        new URL(server.url);
      } catch {
        return {
          valid: false,
          error: 'Invalid URL format',
          responseTime: Date.now() - startTime,
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(`${server.url}/health`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        clearTimeout(timeoutId);

        return {
          valid: response.ok,
          error: response.ok ? undefined : `Server returned ${response.status}`,
          responseTime: Date.now() - startTime,
        };
      } catch (err) {
        clearTimeout(timeoutId);
        
        if (err instanceof Error && err.name === 'AbortError') {
          return {
            valid: false,
            error: 'Health check timed out',
            responseTime: Date.now() - startTime,
          };
        }

        return {
          valid: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          responseTime: Date.now() - startTime,
        };
      }
    }

    if (!server.command.startsWith('npx ') && !server.command.startsWith('node ')) {
      return {
        valid: false,
        error: 'Only npx and node commands are allowed for security',
        responseTime: Date.now() - startTime,
      };
    }

    if (server.command.includes('..') || server.command.includes('|') || 
        server.command.includes('&') || server.command.includes(';')) {
      return {
        valid: false,
        error: 'Command contains potentially dangerous characters',
        responseTime: Date.now() - startTime,
      };
    }

    return {
      valid: true,
      responseTime: Date.now() - startTime,
    };

  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Validation failed',
      responseTime: Date.now() - startTime,
    };
  }
}