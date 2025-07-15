'use client';

import { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  PromptInput, 
  PromptInputTextarea, 
  PromptInputActions, 
  PromptInputAction, 
} from '@/components/ui/prompt-input';
import { PromptSuggestion } from '@/components/ui/prompt-suggestion';
import { Send, X } from 'lucide-react';

interface McpServer {
  name: string;
  command: string;
  args?: string[];
  type?: 'stdio' | 'sse' | 'http';
  url?: string;
  enabled: boolean;
}

interface ChatInputProps {
  prompt: string;
  loading: boolean;
  messages: unknown[];
  mcpServers: McpServer[];
  isDarkMode: boolean;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  onStopGeneration: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({
    prompt,
    loading,
    messages,
    mcpServers,
    isDarkMode,
    onPromptChange,
    onSubmit,
    onStopGeneration,
    onKeyPress,
  }, _ref) => {
    const suggestions = [
      'Help me debug this code',
      'Explain how this works',
      'Write unit tests for this function',
      'Refactor this code to be more efficient',
      'Add error handling',
      'Generate documentation',
    ];

    const handleSuggestionClick = (suggestion: string) => {
      onPromptChange(suggestion);
    };

    return (
      <div className={`border-t backdrop-blur-xl ${
        isDarkMode 
          ? 'bg-gray-950/90 border-gray-800/50 shadow-lg' 
          : 'bg-white/90 border-gray-200/50 shadow-sm'
      }`}>
        {/* Prompt Suggestions */}
        {messages.length === 0 && !loading && (
          <div className="p-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <PromptSuggestion
                  key={`${suggestion}-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs"
                  size="sm"
                >
                  {suggestion}
                </PromptSuggestion>
              ))}
            </div>
          </div>
        )}
        
        <div className="p-4">
          <PromptInput
            value={prompt}
            onValueChange={onPromptChange}
            onSubmit={onSubmit}
            isLoading={loading}
            maxHeight={200}
            className={`transition-all ${
              isDarkMode
                ? 'bg-gray-900/60 border-gray-700 focus-within:border-blue-500 shadow-inner'
                : 'bg-white border-gray-300 focus-within:border-blue-500'
            } focus-within:ring-2 focus-within:ring-blue-500/20`}
          >
            <PromptInputTextarea
              placeholder="Message Claude Code..."
              className={`${
                isDarkMode
                  ? 'text-white placeholder-gray-400'
                  : 'text-gray-900 placeholder-gray-500'
              }`}
              onKeyDown={onKeyPress}
              disabled={loading}
            />
            
            <PromptInputActions>
              {loading ? (
                <PromptInputAction tooltip="Stop generation">
                  <Button
                    onClick={onStopGeneration}
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </PromptInputAction>
              ) : (
                <PromptInputAction tooltip="Send message">
                  <Button
                    onClick={onSubmit}
                    disabled={!prompt.trim()}
                    size="sm"
                    className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </PromptInputAction>
              )}
            </PromptInputActions>
          </PromptInput>
          
          {/* Footer */}
          <div className="flex items-center justify-between mt-3">
            <span className={`text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Shift+Enter for new line
            </span>
            
            <div className="flex items-center gap-3">
              {mcpServers.filter(s => s.enabled).length > 0 && (
                <span className={`flex items-center gap-1 text-xs ${
                  isDarkMode ? 'text-green-400' : 'text-green-600'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  {mcpServers.filter(s => s.enabled).length} MCP server{mcpServers.filter(s => s.enabled).length > 1 ? 's' : ''} active
                </span>
              )}
              
              <span className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {messages.length} message{messages.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

ChatInput.displayName = 'ChatInput';