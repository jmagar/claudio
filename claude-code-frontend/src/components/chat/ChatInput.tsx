'use client';

import { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  messages: any[];
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
    onKeyPress
  }, ref) => {
    return (
      <div className={`border-t backdrop-blur-xl ${
        isDarkMode 
          ? 'bg-slate-900/50 border-slate-700/50' 
          : 'bg-white/50 border-slate-200/50'
      }`}>
        <div className="p-4">
          <div className="relative">
            <Textarea
              ref={ref}
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="Message Claude Code..."
              className={`min-h-[60px] max-h-[200px] pr-12 rounded-2xl border-2 transition-all resize-none ${
                isDarkMode
                  ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:border-blue-500'
              } focus:ring-2 focus:ring-blue-500/20`}
              disabled={loading}
            />
            
            <div className="absolute bottom-2 right-2 flex items-center gap-2">
              {loading ? (
                <Button
                  onClick={onStopGeneration}
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={onSubmit}
                  disabled={!prompt.trim()}
                  size="sm"
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between mt-3">
            <span className={`text-xs ${
              isDarkMode ? 'text-slate-500' : 'text-slate-500'
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
                isDarkMode ? 'text-slate-500' : 'text-slate-500'
              }`}>
                {messages.length} message{messages.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ChatInput.displayName = 'ChatInput';