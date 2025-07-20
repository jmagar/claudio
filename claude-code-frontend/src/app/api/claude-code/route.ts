import { NextRequest, NextResponse } from 'next/server';
import { getClaudeCodeResponse, formatClaudeMessages } from '@/lib/claude-code-sdk';

export async function POST(request: NextRequest) {
  try {
    const { 
      prompt, 
      customSystemPrompt, 
      maxTurns = 3,
      allowedTools,
      disallowedTools 
    } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }
    
    const messages = await getClaudeCodeResponse({
      prompt,
      customSystemPrompt,
      maxTurns,
      allowedTools,
      disallowedTools
    });
    
    const formattedResponse = formatClaudeMessages(messages);
    
    return NextResponse.json({ 
      response: formattedResponse,
      messages,
      messageCount: messages.length
    });
  } catch (error: unknown) {
    console.error('Claude Code API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Handle authentication errors specifically
    if (errorMessage.includes('authentication') || errorMessage.includes('login')) {
      return NextResponse.json(
        { 
          error: 'Authentication required. Please run "claude login" in your terminal first.',
          authRequired: true
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: errorMessage || 'Failed to process request',
        details: errorStack
      },
      { status: 500 }
    );
  }
}