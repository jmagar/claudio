'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bot, 
  User, 
  Loader2, 
  AlertCircle, 
  Copy, 
  Edit3, 
  RotateCcw, 
  Hash,
  Check,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ConversationMessage } from '@/types/chat';
import { useState } from 'react';

interface ChatMessagesProps {
  messages: ConversationMessage[];
  loading: boolean;
  error: string | null;
  editingMessageId: string | null;
  isDarkMode: boolean;
  onCopyToClipboard: (content: string) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onRestartFromMessage: (messageId: string) => void;
  onSetEditingMessageId: (id: string | null) => void;
}

export function ChatMessages({
  messages,
  loading,
  error,
  editingMessageId,
  isDarkMode,
  onCopyToClipboard,
  onEditMessage,
  onRestartFromMessage,
  onSetEditingMessageId
}: ChatMessagesProps) {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const handleCopy = (content: string, messageId: string) => {
    onCopyToClipboard(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  return (
    <motion.div 
      className="flex-1 overflow-y-auto p-6 space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence>
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            layout
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ 
              duration: 0.4, 
              delay: index * 0.05,
              layout: { duration: 0.3 }
            }}
            className={`group flex gap-4 ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.type === 'assistant' && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  delay: index * 0.05 + 0.1,
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
              >
                <Avatar className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                  <AvatarFallback className="bg-transparent">
                    <motion.div
                      animate={{ 
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ 
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Bot className="h-5 w-5 text-white" />
                    </motion.div>
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            )}

            <div className={`max-w-[75%] ${
              message.type === 'user' ? 'order-first' : ''
            }`}>
              <motion.div 
                className={`relative rounded-2xl px-6 py-4 backdrop-blur-sm overflow-hidden ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white ml-auto shadow-lg shadow-blue-500/25'
                    : isDarkMode
                      ? 'bg-slate-800/90 border border-slate-600/30 text-slate-100 shadow-lg shadow-slate-900/50'
                      : 'bg-white/90 border border-slate-200/50 shadow-lg shadow-slate-900/10'
                }`}
                whileHover={{ 
                  scale: message.type === 'user' ? 1.02 : 1.01,
                  y: -2
                }}
                transition={{ duration: 0.2 }}
              >
                {/* Animated background for user messages */}
                {message.type === 'user' && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-500/20"
                    animate={{
                      opacity: [0.5, 0.8, 0.5],
                      scale: [1, 1.02, 1]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
                
                {/* Content */}
                <div className="relative">
                  {editingMessageId === message.id ? (
                    <motion.div 
                      className="space-y-3"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Textarea
                        defaultValue={message.content}
                        className={`min-h-[120px] rounded-xl border-2 transition-all ${
                          isDarkMode 
                            ? 'bg-slate-700/50 border-slate-600 focus:border-blue-500' 
                            : 'bg-white border-slate-300 focus:border-blue-500'
                        } focus:ring-2 focus:ring-blue-500/20`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.metaKey) {
                            onEditMessage(message.id, e.currentTarget.value);
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              const textarea = e.currentTarget.parentElement?.parentElement?.querySelector('textarea') as HTMLTextAreaElement;
                              onEditMessage(message.id, textarea.value);
                            }}
                            className="rounded-xl bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onSetEditingMessageId(null)}
                            className="rounded-xl"
                          >
                            Cancel
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      {message.type === 'assistant' ? (
                        <div className={`prose prose-base max-w-none transition-all ${
                          isDarkMode 
                            ? 'prose-invert prose-slate prose-headings:text-slate-100 prose-p:text-slate-200 prose-strong:text-slate-100'
                            : 'prose-slate prose-headings:text-slate-800 prose-p:text-slate-700'
                        }`}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code(props: any) {
                                const {inline, className, children, ...rest} = props;
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <SyntaxHighlighter
                                      style={isDarkMode ? oneDark : oneLight}
                                      language={match[1]}
                                      PreTag="div"
                                      className="rounded-xl !my-3 shadow-lg"
                                      {...rest}
                                    >
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  </motion.div>
                                ) : (
                                  <code className={`${className} px-2 py-1 rounded-md ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`} {...rest}>
                                    {children}
                                  </code>
                                );
                              },
                              p: ({ children }) => (
                                <motion.p
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="leading-relaxed"
                                >
                                  {children}
                                </motion.p>
                              )
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <motion.p 
                          className="text-base leading-relaxed font-medium"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          {message.content}
                        </motion.p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Message metadata */}
              <motion.div 
                className={`flex items-center justify-between mt-3 px-3 text-xs transition-all ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-4">
                  <motion.span 
                    className="font-medium"
                    whileHover={{ scale: 1.05 }}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </motion.span>
                  {message.tokens && (
                    <motion.span 
                      className="flex items-center gap-1.5 font-medium"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Hash className="h-3 w-3" />
                      {message.tokens.total.toLocaleString()}
                    </motion.span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    className="opacity-0 group-hover:opacity-100 transition-all duration-200"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(message.content, message.id)}
                      className={`h-8 w-8 p-0 rounded-xl transition-all duration-200 ${
                        copiedMessageId === message.id
                          ? 'bg-green-500/10 text-green-500'
                          : isDarkMode
                            ? 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200'
                            : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={copiedMessageId === message.id ? 'check' : 'copy'}
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 90 }}
                          transition={{ duration: 0.15 }}
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                  
                  {message.type === 'user' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ opacity: 1, scale: 1 }}
                      className="opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSetEditingMessageId(message.id)}
                        className={`h-8 w-8 p-0 rounded-xl transition-all duration-200 ${
                          editingMessageId === message.id
                            ? 'bg-blue-500/10 text-blue-500'
                            : isDarkMode
                              ? 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200'
                              : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <motion.div
                          whileHover={{ rotate: 5 }}
                          whileTap={{ rotate: -5 }}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </motion.div>
                      </Button>
                    </motion.div>
                  )}
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    className="opacity-0 group-hover:opacity-100 transition-all duration-200"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRestartFromMessage(message.id)}
                      className={`h-8 w-8 p-0 rounded-xl transition-all duration-200 ${
                        isDarkMode
                          ? 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200'
                          : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <motion.div
                        whileHover={{ rotate: -180 }}
                        transition={{ duration: 0.3 }}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </motion.div>
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {message.type === 'user' && (
              <motion.div
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  delay: index * 0.05 + 0.1,
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
              >
                <Avatar className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 shadow-lg">
                  <AvatarFallback className="bg-transparent">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <User className="h-5 w-5 text-white" />
                    </motion.div>
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {loading && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          className="flex gap-4"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 360]
            }}
            transition={{ 
              scale: { duration: 2, repeat: Infinity },
              rotate: { duration: 4, repeat: Infinity, ease: "linear" }
            }}
          >
            <Avatar className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
              <AvatarFallback className="bg-transparent">
                <Bot className="h-5 w-5 text-white" />
              </AvatarFallback>
            </Avatar>
          </motion.div>
          <motion.div 
            className={`rounded-2xl px-6 py-4 backdrop-blur-sm ${
              isDarkMode
                ? 'bg-slate-800/90 border border-slate-600/30 text-slate-100 shadow-lg'
                : 'bg-white/90 border border-slate-200/50 shadow-lg'
            }`}
            animate={{ 
              scale: [1, 1.02, 1],
              boxShadow: [
                '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                '0 10px 15px -3px rgba(59, 130, 246, 0.1)',
                '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              ]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-5 w-5 text-blue-500" />
              </motion.div>
              <div className="space-y-1">
                <motion.span 
                  className={`text-sm font-medium ${
                    isDarkMode ? 'text-slate-200' : 'text-slate-700'
                  }`}
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Claude is thinking
                </motion.span>
                <motion.div 
                  className="flex gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className={`w-1 h-1 rounded-full ${
                        isDarkMode ? 'bg-slate-400' : 'bg-slate-500'
                      }`}
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ 
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2
                      }}
                    />
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          className="flex justify-center"
        >
          <motion.div 
            className={`flex items-center gap-3 p-4 rounded-2xl border shadow-lg ${
              isDarkMode
                ? 'bg-red-900/20 border-red-700/30 text-red-400'
                : 'bg-red-50 border-red-200/50 text-red-700'
            }`}
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <AlertCircle className="h-5 w-5" />
            </motion.div>
            <span className="text-sm font-medium">{error}</span>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}