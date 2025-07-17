'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, X, Zap, Activity, Command } from 'lucide-react';
import { getCommandSuggestions, loadCustomCommands, type SlashCommand } from '@/lib/slash-commands';

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
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function ChatInput({
  prompt,
  loading,
  messages,
  mcpServers,
  isDarkMode,
  onPromptChange,
  onSubmit,
  onStopGeneration,
  onKeyPress,
  textareaRef
}: ChatInputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<SlashCommand[]>([]);
    const [selectedSuggestion, setSelectedSuggestion] = useState(0);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    
    // Load custom commands on mount
    useEffect(() => {
      loadCustomCommands();
    }, []);
    
    const handleInputChange = (value: string) => {
      onPromptChange(value);
      setIsTyping(value.length > 0);
      
      // Handle slash command suggestions
      if (value.startsWith('/')) {
        const commandSuggestions = getCommandSuggestions(value);
        setSuggestions(commandSuggestions);
        setShowSuggestions(commandSuggestions.length > 0);
        setSelectedSuggestion(0);
      } else {
        setShowSuggestions(false);
        setSuggestions([]);
      }
    };

    const handleSuggestionSelect = (command: SlashCommand) => {
      onPromptChange(`/${command.name}`);
      setShowSuggestions(false);
      setSuggestions([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (showSuggestions && suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedSuggestion(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedSuggestion(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
        } else if (e.key === 'Tab' || e.key === 'Enter') {
          if (suggestions[selectedSuggestion]) {
            e.preventDefault();
            handleSuggestionSelect(suggestions[selectedSuggestion]);
            return;
          }
        } else if (e.key === 'Escape') {
          setShowSuggestions(false);
          setSuggestions([]);
        }
      }
      
      // Call the original onKeyPress handler
      onKeyPress(e);
    };

    return (
      <motion.footer 
        className={`relative border-t backdrop-blur-xl overflow-hidden ${
          isDarkMode 
            ? 'bg-slate-900/80 border-slate-700/30' 
            : 'bg-white/80 border-slate-200/30'
        }`}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 opacity-5"
          animate={{
            background: isFocused
              ? ['linear-gradient(45deg, #3b82f6, #8b5cf6)', 'linear-gradient(45deg, #8b5cf6, #06b6d4)']
              : ['linear-gradient(45deg, transparent, transparent)']
          }}
          transition={{ duration: 2 }}
        />

        <div className="relative p-6">
          <motion.div 
            className="relative group"
            animate={{ 
              scale: isFocused ? 1.02 : 1,
              y: isFocused ? -2 : 0
            }}
            transition={{ duration: 0.2 }}
          >
            {/* Glowing border effect */}
            <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
              isFocused 
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 blur-sm' 
                : 'bg-transparent'
            }`} />
            
            <motion.div className="relative">
              <Textarea
                ref={textareaRef}
                data-slot="chat-input"
                value={prompt}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Message Claude Code..."
                className={`relative min-h-[70px] max-h-[200px] pr-16 pl-6 py-4 rounded-2xl border-2 transition-all duration-300 resize-none text-base ${
                  isDarkMode
                    ? `bg-slate-800/70 border-slate-700/50 text-white placeholder-slate-400 
                       focus:border-blue-500/70 focus:bg-slate-800/90 focus:shadow-lg focus:shadow-blue-500/10`
                    : `bg-white/70 border-slate-300/50 text-slate-900 placeholder-slate-500 
                       focus:border-blue-500/70 focus:bg-white/90 focus:shadow-lg focus:shadow-blue-500/10`
                } focus:ring-2 focus:ring-blue-500/20 focus:outline-none backdrop-blur-sm`}
                disabled={loading}
              />
              
              {/* Slash command suggestions */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    ref={suggestionsRef}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute bottom-full left-0 right-0 mb-2 rounded-xl border backdrop-blur-sm shadow-lg z-50 max-h-64 overflow-y-auto ${
                      isDarkMode
                        ? 'bg-slate-800/95 border-slate-700/50'
                        : 'bg-white/95 border-slate-200/50'
                    }`}
                  >
                    <div className="p-2">
                      <div className={`flex items-center gap-2 px-3 py-2 text-xs font-medium ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        <Command className="w-3 h-3" />
                        Slash Commands
                      </div>
                      
                      {suggestions.map((command, index) => (
                        <motion.button
                          key={command.name}
                          onClick={() => handleSuggestionSelect(command)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-150 ${
                            index === selectedSuggestion
                              ? isDarkMode
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                              : isDarkMode
                                ? 'text-slate-300 hover:bg-slate-700/50'
                                : 'text-slate-700 hover:bg-slate-50'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center gap-2">
                            <code className={`text-sm font-mono px-2 py-1 rounded ${
                              index === selectedSuggestion
                                ? isDarkMode
                                  ? 'bg-blue-500/30 text-blue-200'
                                  : 'bg-blue-100 text-blue-800'
                                : isDarkMode
                                  ? 'bg-slate-700 text-slate-300'
                                  : 'bg-slate-100 text-slate-700'
                            }`}>
                              /{command.name}
                            </code>
                            <span className="flex-1 text-sm">{command.description}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Typing indicator */}
              <AnimatePresence>
                {isTyping && !loading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute top-2 left-2"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className={`w-2 h-2 rounded-full ${
                        isDarkMode ? 'bg-blue-400' : 'bg-blue-500'
                      }`}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="stop"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      onClick={onStopGeneration}
                      size="sm"
                      variant="outline"
                      className={`rounded-xl h-10 w-10 p-0 transition-all duration-200 ${
                        isDarkMode
                          ? 'border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10 text-red-400'
                          : 'border-red-300/50 hover:border-red-400/50 hover:bg-red-50 text-red-500'
                      }`}
                    >
                      <motion.div
                        whileHover={{ rotate: 90 }}
                        transition={{ duration: 0.2 }}
                      >
                        <X className="h-4 w-4" />
                      </motion.div>
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="send"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={onSubmit}
                      disabled={!prompt.trim()}
                      size="sm"
                      className={`rounded-xl h-10 w-10 p-0 transition-all duration-200 ${
                        prompt.trim()
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl'
                          : isDarkMode
                            ? 'bg-slate-700/50 text-slate-500 border-slate-600/30'
                            : 'bg-slate-200/50 text-slate-400 border-slate-300/30'
                      }`}
                    >
                      <motion.div
                        animate={{
                          x: prompt.trim() ? [0, 2, 0] : 0,
                          rotate: prompt.trim() ? [0, -10, 0] : 0
                        }}
                        transition={{
                          duration: 2,
                          repeat: prompt.trim() ? Infinity : 0,
                          ease: "easeInOut"
                        }}
                      >
                        <Send className="h-4 w-4" />
                      </motion.div>
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div 
            className="flex items-center justify-between mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.span 
              className={`text-xs font-medium transition-colors ${
                isDarkMode ? 'text-slate-500' : 'text-slate-500'
              }`}
              whileHover={{ scale: 1.05, color: isDarkMode ? '#94a3b8' : '#64748b' }}
            >
              ⌘+Enter to send • Shift+Enter for new line
            </motion.span>
            
            <div className="flex items-center gap-4">
              <AnimatePresence>
                {mcpServers.filter(s => s.enabled).length > 0 && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'text-green-400 bg-green-500/10 border border-green-500/20' 
                        : 'text-green-600 bg-green-50 border border-green-200/50'
                    }`}
                    whileHover={{ scale: 1.05 }}
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 1, 0.7]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-2 h-2 rounded-full bg-current"
                    />
                    <Zap className="h-3 w-3" />
                    {mcpServers.filter(s => s.enabled).length} MCP server{mcpServers.filter(s => s.enabled).length > 1 ? 's' : ''}
                  </motion.span>
                )}
              </AnimatePresence>
              
              <motion.span 
                className={`flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'text-slate-400 bg-slate-800/50 border border-slate-700/30' 
                    : 'text-slate-600 bg-slate-100/50 border border-slate-200/50'
                }`}
                whileHover={{ scale: 1.05 }}
              >
                <Activity className="h-3 w-3" />
                {messages.length} message{messages.length !== 1 ? 's' : ''}
              </motion.span>
            </div>
          </motion.div>
        </div>
      </motion.footer>
    );
}