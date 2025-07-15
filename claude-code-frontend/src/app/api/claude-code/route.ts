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
  } catch (error: any) {
    console.error('Claude Code API error:', error);
    
    // Handle authentication errors specifically
    if (error.message?.includes('authentication') || error.message?.includes('login')) {
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
        error: error.message || 'Failed to process request',
        details: error.stack
      },
      { status: 500 }
    );
  }
}