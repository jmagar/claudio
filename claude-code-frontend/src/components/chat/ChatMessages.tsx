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
  Hash 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ConversationMessage } from '@/types/chat';

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
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <AnimatePresence>
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`group flex gap-4 ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.type === 'assistant' && (
              <Avatar className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600">
                <AvatarFallback>
                  <Bot className="h-4 w-4 text-white" />
                </AvatarFallback>
              </Avatar>
            )}

            <div className={`max-w-[70%] ${
              message.type === 'user' ? 'order-first' : ''
            }`}>
              <div className={`rounded-2xl px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white ml-auto'
                  : isDarkMode
                    ? 'bg-slate-800/50 border border-slate-700/50'
                    : 'bg-white border border-slate-200'
              }`}>
                {editingMessageId === message.id ? (
                  <div className="space-y-2">
                    <Textarea
                      defaultValue={message.content}
                      className="min-h-[100px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.metaKey) {
                          onEditMessage(message.id, e.currentTarget.value);
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                          onEditMessage(message.id, textarea.value);
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSetEditingMessageId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {message.type === 'assistant' ? (
                      <div className={`prose prose-sm max-w-none ${
                        isDarkMode ? 'prose-invert' : ''
                      }`}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code(props: any) {
                              const {node, inline, className, children, ...rest} = props;
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={isDarkMode ? oneDark : oneLight}
                                  language={match[1]}
                                  PreTag="div"
                                  className="rounded-lg !my-2"
                                  {...rest}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...rest}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Message metadata */}
              <div className={`flex items-center justify-between mt-2 px-2 text-xs ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                <div className="flex items-center gap-4">
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {message.tokens && (
                    <span className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {message.tokens.total}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCopyToClipboard(message.content)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  
                  {message.type === 'user' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSetEditingMessageId(message.id)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRestartFromMessage(message.id)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {message.type === 'user' && (
              <Avatar className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500">
                <AvatarFallback>
                  <User className="h-4 w-4 text-white" />
                </AvatarFallback>
              </Avatar>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-4"
        >
          <Avatar className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600">
            <AvatarFallback>
              <Bot className="h-4 w-4 text-white" />
            </AvatarFallback>
          </Avatar>
          <div className={`rounded-2xl px-4 py-3 ${
            isDarkMode
              ? 'bg-slate-800/50 border border-slate-700/50'
              : 'bg-white border border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className={`text-sm ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Claude is thinking...
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}