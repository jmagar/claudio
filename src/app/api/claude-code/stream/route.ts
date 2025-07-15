import { NextRequest } from 'next/server';
import { runClaudeCodeQuery } from '@/lib/claude-code-sdk';

export async function POST(request: NextRequest) {
  try {
    const { 
      prompt, 
      customSystemPrompt, 
      maxTurns = 5,
      allowedTools,
      disallowedTools,
      mcpServers, 
    } = await request.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

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
                console.log('Stream controller already closed, stopping enqueue');
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
                console.error('Error closing controller:', error);
              }
            }
          }
        };

        try {
          for await (const message of runClaudeCodeQuery({
            prompt,
            customSystemPrompt,
            maxTurns,
            allowedTools,
            disallowedTools,
            mcpServers,
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
          console.error('Streaming error:', error);
          
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
        console.log('Stream cancelled by client');
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    console.error('Stream setup error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to setup stream',
        details: error instanceof Error ? error.stack : undefined,
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}