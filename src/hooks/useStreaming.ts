import { useState, useRef, useCallback } from 'react';
import { formatMessages } from '@/lib/message-utils';
import { type ConversationMessage } from '@/lib/conversation-store';
import { generateMessageId } from '@/lib/id-utils';

interface StreamingState {
  loading: boolean;
  error: string | null;
  isTyping: boolean;
}

export function useStreaming() {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    loading: false,
    error: null,
    isTyping: false
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStreaming = useCallback(async (
    prompt: string,
    mcpServers: Record<string, any>,
    onUpdateMessages: (updater: (prev: ConversationMessage[]) => ConversationMessage[]) => void
  ) => {
    // Create streaming assistant message
    const assistantMessage: ConversationMessage = {
      id: generateMessageId(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      streaming: true
    };
    
    onUpdateMessages(prev => [...prev, assistantMessage]);
    
    // Track accumulated messages for proper formatting
    const accumulatedMessages: any[] = [];
    
    setStreamingState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      abortControllerRef.current = new AbortController();
      
      const response = await fetch('/api/claude-code/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          mcpServers
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setStreamingState(prev => ({ ...prev, loading: false }));
              return;
            }

            try {
              const message = JSON.parse(data);
              
              if (message.type === 'error') {
                setStreamingState(prev => ({ ...prev, error: message.error, loading: false }));
                break;
              }

              // Add to accumulated messages and format with deduplication
              accumulatedMessages.push(message);
              
              // Use the local formatMessages function for consistent formatting without duplicates
              const formattedContent = formatMessages(accumulatedMessages);
              
              // Extract token usage from result messages
              let tokenUsage = undefined;
              if (message.type === 'result' && message.usage) {
                tokenUsage = {
                  input: message.usage.input_tokens || 0,
                  output: message.usage.output_tokens || 0,
                  total: message.usage.total_tokens || (message.usage.input_tokens || 0) + (message.usage.output_tokens || 0)
                };
              }
              
              if (formattedContent.trim()) {
                onUpdateMessages(prev => prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { 
                        ...msg, 
                        content: formattedContent,
                        ...(tokenUsage && { tokens: tokenUsage })
                      }
                    : msg
                ));
              }
            } catch (e) {
              console.error('Error parsing message:', e);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setStreamingState(prev => ({ ...prev, error: 'Request was cancelled', loading: false }));
      } else {
        setStreamingState(prev => ({ ...prev, error: 'Failed to connect to Claude Code SDK', loading: false }));
      }
      // Remove the streaming message on error
      onUpdateMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id));
    } finally {
      setStreamingState(prev => ({ ...prev, loading: false }));
      abortControllerRef.current = null;
    }
  }, []);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    ...streamingState,
    startStreaming,
    stopStreaming
  };
}