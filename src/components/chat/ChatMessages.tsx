'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertCircle, 
  Copy, 
  Edit3, 
  RotateCcw, 
  Hash, 
} from 'lucide-react';
import { 
  Message, 
  MessageAvatar, 
  MessageContent, 
  MessageActions, 
  MessageAction, 
} from '@/components/ui/message';
import { Loader } from '@/components/ui/loader';
import { 
  ChatContainerRoot, 
  ChatContainerContent, 
  ChatContainerScrollAnchor, 
} from '@/components/ui/chat-container';
// import { ScrollButton } from '@/components/ui/scroll-button';
import type { ConversationMessage, ChatMessagesProps } from '@/types';
import { WelcomeScreen } from './WelcomeScreen';
import { useEffect, useState, memo, useMemo, useCallback } from 'react';

/**
 * Renders a scroll-to-bottom button that appears only when the chat log is not scrolled to the bottom.
 *
 * The button is only rendered on the client after mounting to avoid server-side rendering issues. When clicked, it smoothly scrolls the chat container to the bottom.
 */
function ClientOnlyScrollButton() {
  const [isMounted, setIsMounted] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  useEffect(() => {
    setIsMounted(true);
    
    const handleScroll = () => {
      const container = document.querySelector('[role="log"]');
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 10);
      }
    };
    
    const container = document.querySelector('[role="log"]');
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);
  
  const scrollToBottom = () => {
    const container = document.querySelector('[role="log"]');
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    }
  };
  
  if (!isMounted) {return null;}
  
  return (
    <Button
      variant="outline"
      size="sm"
      className={`h-10 w-10 rounded-full transition-all duration-150 ease-out ${
        !isAtBottom
          ? 'translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none translate-y-4 scale-95 opacity-0'
      }`}
      onClick={scrollToBottom}
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </Button>
  );
}

// Memoized individual message component to prevent unnecessary re-renders
const ChatMessage = memo(function ChatMessage({
  message,
  isEditing,
  isDarkMode,
  onCopyToClipboard,
  onEditMessage,
  onRestartFromMessage,
  onSetEditingMessageId,
}: {
  message: ConversationMessage;
  isEditing: boolean;
  isDarkMode: boolean;
  onCopyToClipboard: (content: string) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onRestartFromMessage: (messageId: string) => void;
  onSetEditingMessageId: (id: string | null) => void;
}) {
  // Memoize styling classes to prevent recalculation
  const containerClasses = useMemo(() => 
    `group ${message.type === 'user' ? 'flex justify-end' : 'flex justify-start'}`,
    [message.type],
  );

  const messageClasses = useMemo(() => 
    `max-w-[85%] lg:max-w-[70%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`,
    [message.type],
  );

  const avatarClasses = useMemo(() => 
    `w-8 h-8 ${
      message.type === 'user' 
        ? 'bg-gradient-to-r from-green-500 to-blue-500' 
        : 'bg-gradient-to-r from-blue-500 to-purple-600'
    }`,
    [message.type],
  );

  const bubbleClasses = useMemo(() => 
    `rounded-xl px-3 py-2 transition-all hover:scale-[1.005] ${
      message.type === 'user'
        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white ml-auto shadow-lg shadow-blue-500/25'
        : isDarkMode
          ? 'bg-gray-900/70 border border-gray-800/50 shadow-lg shadow-black/10'
          : 'bg-white border border-gray-200 shadow-sm'
    }`,
    [message.type, isDarkMode],
  );

  const contentClasses = useMemo(() => 
    `${
      message.type === 'user' 
        ? 'bg-transparent text-white' 
        : isDarkMode 
          ? 'bg-transparent prose-invert' 
          : 'bg-transparent'
    } prose prose-sm max-w-none`,
    [message.type, isDarkMode],
  );

  const metadataClasses = useMemo(() => 
    `flex items-center justify-between mt-2 px-2 text-xs ${
      isDarkMode ? 'text-slate-400' : 'text-slate-500'
    }`,
    [isDarkMode],
  );

  const handleEditSave = useCallback((textarea: HTMLTextAreaElement) => {
    onEditMessage(message.id, textarea.value);
  }, [message.id, onEditMessage]);

  const handleEditCancel = useCallback(() => {
    onSetEditingMessageId(null);
  }, [onSetEditingMessageId]);

  const handleCopy = useCallback(() => {
    onCopyToClipboard(message.content);
  }, [message.content, onCopyToClipboard]);

  const handleEdit = useCallback(() => {
    onSetEditingMessageId(message.id);
  }, [message.id, onSetEditingMessageId]);

  const handleRestart = useCallback(() => {
    onRestartFromMessage(message.id);
  }, [message.id, onRestartFromMessage]);

  return (
    <div className={containerClasses}>
      <Message className={messageClasses}>
        <MessageAvatar
          src=""
          alt={message.type === 'user' ? 'User' : 'Assistant'}
          fallback={message.type === 'user' ? 'U' : 'A'}
          className={avatarClasses}
        />

        <div className="flex-1 min-w-0">
          <div className={bubbleClasses}>
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  defaultValue={message.content}
                  className="min-h-[100px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.metaKey) {
                      handleEditSave(e.currentTarget);
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                      handleEditSave(textarea);
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEditCancel}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <MessageContent
                markdown={message.type === 'assistant'}
                className={contentClasses}
              >
                {message.content}
              </MessageContent>
            )}
          </div>

          {/* Message metadata */}
          <div className={metadataClasses}>
            <div className="flex items-center gap-4">
              <span>{message.timestamp.toLocaleTimeString()}</span>
              {message.tokens && (
                <span className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {message.tokens.total}
                </span>
              )}
            </div>
            
            <MessageActions className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MessageAction tooltip="Copy message">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </MessageAction>
              
              {message.type === 'user' && (
                <MessageAction tooltip="Edit message">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    className="h-6 w-6 p-0"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                </MessageAction>
              )}
              
              <MessageAction tooltip="Restart from here">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRestart}
                  className="h-6 w-6 p-0"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </MessageAction>
            </MessageActions>
          </div>
        </div>
      </Message>
    </div>
  );
});

// Interface now imported from types

export const ChatMessages = memo(function ChatMessages({
  messages,
  loading,
  error,
  retryAttempt,
  isRetrying,
  editingMessageId,
  isDarkMode,
  onCopyToClipboard,
  onEditMessage,
  onRestartFromMessage,
  onSetEditingMessageId,
}: ChatMessagesProps) {
  // Only animate the latest message to reduce animation overhead
  const [lastMessageCount, setLastMessageCount] = useState(0);
  
  useEffect(() => {
    setLastMessageCount(messages.length);
  }, [messages.length]);

  // Memoize error styles to prevent recalculation
  const errorClasses = useMemo(() => 
    `p-4 rounded-2xl border ${
      isDarkMode 
        ? 'bg-red-900/20 border-red-800/50 text-red-300' 
        : 'bg-red-50 border-red-200 text-red-700'
    }`,
    [isDarkMode],
  );

  const errorIconClasses = useMemo(() => 
    `h-5 w-5 mt-0.5 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`,
    [isDarkMode],
  );

  const errorTextClasses = useMemo(() => 
    `text-sm mt-1 ${isDarkMode ? 'text-red-400/80' : 'text-red-600/80'}`,
    [isDarkMode],
  );

  const codeClasses = useMemo(() => 
    `px-1 py-0.5 rounded font-mono ${isDarkMode ? 'bg-red-900/30' : 'bg-red-100'}`,
    [isDarkMode],
  );

  return (
    <div className="flex-1 relative h-full">
      <ChatContainerRoot className="h-full">
        <ChatContainerContent className="p-4 space-y-4">
          {/* Show welcome screen when no messages */}
          {messages.length === 0 && !loading && !error ? (
            <WelcomeScreen isDarkMode={isDarkMode} />
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isNewMessage = index >= lastMessageCount - 1;
                
                return isNewMessage ? (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChatMessage
                      message={message}
                      isEditing={editingMessageId === message.id}
                      isDarkMode={isDarkMode}
                      onCopyToClipboard={onCopyToClipboard}
                      onEditMessage={onEditMessage}
                      onRestartFromMessage={onRestartFromMessage}
                      onSetEditingMessageId={onSetEditingMessageId}
                    />
                  </motion.div>
                ) : (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isEditing={editingMessageId === message.id}
                    isDarkMode={isDarkMode}
                    onCopyToClipboard={onCopyToClipboard}
                    onEditMessage={onEditMessage}
                    onRestartFromMessage={onRestartFromMessage}
                    onSetEditingMessageId={onSetEditingMessageId}
                  />
                );
              })}

      {loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start"
        >
          <Message>
            <MessageAvatar
              src=""
              alt="Assistant"
              fallback="A"
              className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600"
            />
            <div className={`${
              isDarkMode
                ? 'bg-gray-900/70 border border-gray-800/50 shadow-lg shadow-black/10'
                : 'bg-white border border-gray-200 shadow-sm'
            } rounded-2xl px-4 py-3`}>
              <div className="flex items-center gap-3">
                <Loader 
                  variant="typing" 
                  size="sm" 
                  className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} 
                />
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {isRetrying 
                    ? `Retrying... (attempt ${retryAttempt + 1})`
                    : 'Claude is thinking'
                  }
                </span>
              </div>
            </div>
          </Message>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl"
        >
          <div className={errorClasses}>
            <div className="flex items-start gap-3">
              <AlertCircle className={errorIconClasses} />
              <div>
                <p className="font-medium">Connection Error</p>
                <p className={errorTextClasses}>
                  {error}
                </p>
                <p className={`text-xs mt-2 ${
                  isDarkMode ? 'text-red-500' : 'text-red-600'
                }`}>
                  Make sure you've run <code className={codeClasses}>claude login</code> to authenticate.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
            </div>
          )}
          
          <ChatContainerScrollAnchor />
        </ChatContainerContent>
      </ChatContainerRoot>
      
      {/* Scroll to bottom button - only show when mounted */}
      <div className="absolute bottom-4 right-4">
        <ClientOnlyScrollButton />
      </div>
    </div>
  );
});