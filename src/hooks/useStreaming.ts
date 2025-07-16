import { useState, useRef, useCallback, useEffect } from 'react';
import { formatMessages } from '@/lib/message-utils';
import { generateMessageId } from '@/lib/id-utils';
import { getErrorMessage } from '@/lib/error-messages';
import { ExponentialBackoff, isRetryableError, sleep } from '@/lib/retry-utils';
import type { 
  ConversationMessage, 
  ClaudeMessage, 
  StreamingState, 
  StreamingConfig, 
  RetryConfig,
} from '@/types';

const DEFAULT_CONFIG: StreamingConfig = {
  timeoutMs: 30000, // 30 seconds
  retryConfig: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    jitterFactor: 0.1,
  },
  preservePartialContent: true,
};

export function useStreaming() {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    loading: false,
    error: null,
    isTyping: false,
    retryAttempt: 0,
    isRetrying: false,
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

  const cleanupStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreamingState({
      loading: false,
      error: null,
      isTyping: false,
      retryAttempt: 0,
      isRetrying: false,
    });
  }, []);

  const startStreaming = useCallback(async (
    prompt: string,
    mcpServers: Record<string, any>,
    onUpdateMessages: (updater: (messages: ConversationMessage[]) => ConversationMessage[]) => void,
    config: StreamingConfig = DEFAULT_CONFIG,
  ) => {
    const backoff = new ExponentialBackoff(config.retryConfig);
    let assistantMessage: ConversationMessage | null = null;
    let preservedContent = '';
    let finalError: Error | null = null;

    // Reset streaming state
    setStreamingState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      retryAttempt: 0, 
      isRetrying: false,
    }));

    const performStreamingAttempt = async (): Promise<void> => {
      // Abort any existing streaming operation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create or reuse assistant message
      if (!assistantMessage) {
        assistantMessage = {
          id: generateMessageId(),
          type: 'assistant',
          content: preservedContent,
          timestamp: new Date(),
          streaming: true,
        };
        
        // Add the message to the conversation - check for existing streaming messages first
        onUpdateMessages(prev => {
          // Remove any existing streaming messages to prevent duplicates
          const filteredMessages = prev.filter(msg => !msg.streaming);
          return [...filteredMessages, assistantMessage!];
        });
      } else if (config.preservePartialContent && preservedContent) {
        // Update existing message with preserved content
        onUpdateMessages(prev => prev.map(msg => 
          msg.id === assistantMessage!.id 
            ? { ...msg, content: preservedContent, streaming: true }
            : msg,
        ));
      }

      const accumulatedMessages: ClaudeMessage[] = [];
      let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
      let timeoutId: NodeJS.Timeout | null = null;
      const startTime = Date.now();
      
      try {
        abortControllerRef.current = new AbortController();
        
        // Set up timeout
        timeoutId = setTimeout(() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
        }, config.timeoutMs);
        
        const response = await fetch('/api/claude-code/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt,
            mcpServers,
          }),
          signal: abortControllerRef.current.signal,
        });
        
        // Clear timeout if request succeeds
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }

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
                    throw new Error(errorMessage.error || 'Stream error');
                  }

                  // Add to accumulated messages and format
                  accumulatedMessages.push(message as ClaudeMessage);
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
                    preservedContent = formattedContent; // Save for retry
                    onUpdateMessages(prev => {
                      // Make sure we only update the correct assistant message
                      return prev.map(msg => 
                        msg.id === assistantMessage!.id 
                          ? { 
                              ...msg, 
                              content: formattedContent,
                              streaming: message && typeof message === 'object' && 'type' in message && message.type === 'result' ? false : true,
                              ...(tokenUsage && { tokens: tokenUsage }),
                            }
                          : msg,
                      );
                    });
                  }
                } catch (_e) {
                  // Skip malformed JSON
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
        const streamError = error instanceof Error ? error : new Error('Stream error');
        
        if (streamError.name === 'AbortError') {
          const isTimeout = Date.now() - startTime >= (config.timeoutMs || DEFAULT_CONFIG.timeoutMs!);
          throw new Error(isTimeout ? 'Request timeout' : 'Stream aborted');
        }
        
        throw streamError;
      } finally {
        // Cleanup
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        // Clear accumulated messages to prevent memory leaks
        accumulatedMessages.length = 0;
        
        if (abortControllerRef.current) {
          if (!abortControllerRef.current.signal.aborted) {
            abortControllerRef.current.abort();
          }
          abortControllerRef.current = null;
        }
      }
    };

    // Main retry loop
    while (backoff.canRetry()) {
      try {
        await performStreamingAttempt();
        // Success! Reset state and return
        setStreamingState(prev => ({ ...prev, loading: false, isRetrying: false }));
        return;
      } catch (error: unknown) {
        const streamError = error instanceof Error ? error : new Error('Unknown error');
        finalError = streamError;

        // Check if this error is retryable
        if (!isRetryableError(streamError) || !backoff.canRetry()) {
          break;
        }

        const delay = backoff.getNextDelay();
        if (delay < 0) {
          break;
        }

        // Update state to show retry attempt
        setStreamingState(prev => ({ 
          ...prev, 
          isRetrying: true, 
          retryAttempt: backoff.getCurrentAttempt().attempt,
        }));

        // Wait before retrying
        await sleep(delay);
      }
    }

    // All retries exhausted - handle final error
    const errorInfo = getErrorMessage(finalError || 'stream_error');
    setStreamingState(prev => ({ 
      ...prev, 
      error: errorInfo.message, 
      loading: false, 
      isRetrying: false,
    }));
    
    // Mark the message as no longer streaming but preserve content if configured
    if (assistantMessage) {
      onUpdateMessages(prev => prev.map(msg => 
        msg.id === assistantMessage!.id 
          ? { ...msg, streaming: false }
          : msg,
      ));
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
    cleanupStreaming,
  };
}