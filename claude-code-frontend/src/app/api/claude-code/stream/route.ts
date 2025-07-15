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
      mcpServers 
    } = await request.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const message of runClaudeCodeQuery({
            prompt,
            customSystemPrompt,
            maxTurns,
            allowedTools,
            disallowedTools,
            mcpServers
          })) {
            const chunk = encoder.encode(`data: ${JSON.stringify(message)}\n\n`);
            controller.enqueue(chunk);
          }
          
          // Send done signal
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error: any) {
          console.error('Streaming error:', error);
          
          const errorMessage = {
            type: 'error',
            error: error.message || 'Failed to process request',
            authRequired: error.message?.includes('authentication') || error.message?.includes('login')
          };
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorMessage)}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Stream setup error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to setup stream',
        details: error.stack
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}