import { useState, useRef, useCallback, useEffect } from 'react';
import { formatMessages, type ClaudeMessage } from '@/lib/message-utils';
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
    isTyping: false,
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup AbortController on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const startStreaming = useCallback(async (
    prompt: string,
    mcpServers: Record<string, unknown>,
    onUpdateMessages: (updater: (prev: ConversationMessage[]) => ConversationMessage[]) => void,
  ) => {
    // Abort any existing streaming operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create streaming assistant message
    const assistantMessage: ConversationMessage = {
      id: generateMessageId(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      streaming: true,
    };
    
    onUpdateMessages(prev => [...prev, assistantMessage]);
    
    // Track accumulated messages for proper formatting
    const accumulatedMessages: ClaudeMessage[] = [];
    
    setStreamingState(prev => ({ ...prev, loading: true, error: null }));
    
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    
    try {
      abortControllerRef.current = new AbortController();
      
      const response = await fetch('/api/claude-code/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          mcpServers,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.body) {throw new Error('No response body');}

      reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {break;}

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
                const message = JSON.parse(data) as unknown;
                
                if (message && typeof message === 'object' && 'type' in message && message.type === 'error') {
                  const errorMessage = message as { error?: string };
                  setStreamingState(prev => ({ ...prev, error: errorMessage.error || 'Unknown error', loading: false }));
                  break;
                }

                // Add to accumulated messages and format with deduplication
                accumulatedMessages.push(message as ClaudeMessage);
                
                // Use the local formatMessages function for consistent formatting without duplicates
                const formattedContent = formatMessages(accumulatedMessages);
                
                // Extract token usage from result messages
                let tokenUsage = undefined;
                if (message && typeof message === 'object' && 'type' in message && message.type === 'result' && 'usage' in message && message.usage) {
                  const resultMessage = message as { usage: { input_tokens?: number; output_tokens?: number; total_tokens?: number } };
                  tokenUsage = {
                    input: resultMessage.usage.input_tokens || 0,
                    output: resultMessage.usage.output_tokens || 0,
                    total: resultMessage.usage.total_tokens || (resultMessage.usage.input_tokens || 0) + (resultMessage.usage.output_tokens || 0),
                  };
                }
                
                if (formattedContent.trim()) {
                  onUpdateMessages(prev => prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { 
                          ...msg, 
                          content: formattedContent,
                          streaming: false, // Mark as no longer streaming
                          ...(tokenUsage && { tokens: tokenUsage }),
                        }
                      : msg,
                  ));
                }
              } catch (_e) {
                console.error('Error parsing message:', _e);
              }
            }
          }
        }
      } finally {
        // Always close the reader to prevent resource leaks
        if (reader) {
          try {
            reader.releaseLock();
          } catch {
            // Reader might already be closed
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        setStreamingState(prev => ({ ...prev, error: 'Request was cancelled', loading: false }));
      } else {
        setStreamingState(prev => ({ ...prev, error: 'Failed to connect to Claude Code SDK', loading: false }));
      }
      // Don't remove the streaming message on error - preserve partial content
      onUpdateMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, streaming: false }
          : msg,
      ));
    } finally {
      setStreamingState(prev => ({ ...prev, loading: false }));
      
      // Clear accumulated messages to prevent memory leaks
      accumulatedMessages.length = 0;
      
      // Clean up AbortController reference
      if (abortControllerRef.current) {
        abortControllerRef.current = null;
      }
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
    stopStreaming,
  };
}