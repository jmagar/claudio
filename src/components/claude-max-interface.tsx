'use client';

import { useState, useRef } from 'react';
import { useTheme } from '@/context/theme';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Plus, 
  Bot,
  Menu,
  Sun,
  Moon,
} from 'lucide-react';
import { type ConversationMessage, type Conversation } from '@/types';
import { themeClasses } from '@/lib/theme-utils';
import { generateMessageId } from '@/lib/id-utils';
import { ConversationSidebar } from '@/components/chat/ConversationSidebar';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { SettingsPanel } from '@/components/chat/SettingsPanel';
import { useConversations } from '@/hooks/useConversations';
import { useStreaming } from '@/hooks/useStreaming';
import { useMcpServers } from '@/hooks/useMcpServers';

/**
 * Renders the main chat interface for Claude Code, providing conversation management, message streaming, theming, and server configuration.
 *
 * Integrates conversation selection, chat messaging, editing, streaming controls, theme toggling, and server management within a responsive layout. Users can start new conversations, edit or delete messages, manage server endpoints, and switch between dark and light modes.
 *
 * @returns The Claude Code chat interface React component.
 */
export function ClaudeMaxInterface() {
  const [prompt, setPrompt] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const [showSidebar, setShowSidebar] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Custom hooks for managing state and logic
  const {
    conversations,
    currentConversation,
    messages,
    setMessages,
    createNewConversation,
    loadConversation,
    deleteConversation,
    editMessage,
    restartFromMessage,
  } = useConversations();

  const {
    loading,
    error,
    retryAttempt,
    isRetrying,
    startStreaming,
    stopStreaming,
  } = useStreaming();

  const {
    mcpServers,
    addMcpServer,
    updateMcpServer,
    removeMcpServer,
    getEnabledServers,
  } = useMcpServers();


  const startNewConversation = () => {
    if (loading) {stopStreaming();}
    
    createNewConversation(getEnabledServers());
    setEditingMessageId(null);
  };

  const handleLoadConversation = (conversation: Conversation) => {
    if (loading) {stopStreaming();}
    loadConversation(conversation);
    setEditingMessageId(null);
  };

  const handleDeleteConversation = (conversationId: string) => {
    const shouldCreateNew = deleteConversation(conversationId);
    if (shouldCreateNew === null) {
      startNewConversation();
    }
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    editMessage(messageId, newContent);
    setEditingMessageId(null);
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || loading) {return;}
    
    // Create new conversation if none exists
    if (!currentConversation) {
      startNewConversation();
    }
    
    const userMessage: ConversationMessage = {
      id: generateMessageId(),
      type: 'user',
      content: prompt,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentPrompt = prompt;
    setPrompt('');
    
    await startStreaming(currentPrompt, getEnabledServers(), setMessages);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const clearChat = () => {
    if (loading) {stopStreaming();}
    startNewConversation();
  };

  return (
    <div className={`h-screen flex transition-all duration-300 ${themeClasses.background(isDarkMode)}`}>
      
      {/* Use the extracted ConversationSidebar component */}
      <ConversationSidebar
        conversations={conversations}
        currentConversation={currentConversation}
        onLoadConversation={handleLoadConversation}
        onNewConversation={startNewConversation}
        onDeleteConversation={handleDeleteConversation}
        isDarkMode={isDarkMode}
        isVisible={showSidebar}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Header */}
        <div className={`flex-shrink-0 border-b backdrop-blur-xl ${themeClasses.headerBackground(isDarkMode)}`}>
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="rounded-xl"
                aria-label={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
              >
                <Menu className="h-4 w-4" />
              </Button>
              
              <div className={`flex items-center gap-2 ${themeClasses.textPrimary(isDarkMode)}`}>
                <div className="relative">
                  <Bot className="h-5 w-5" />
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse" />
                </div>
                <div>
                  <h1 className="text-base font-semibold">Claude Code</h1>
                  <p className={`text-xs ${themeClasses.textSecondary(isDarkMode)}`}>
                    {currentConversation?.title || 'New Conversation'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="rounded-xl h-8 w-8 p-0"
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="rounded-xl h-8 w-8 p-0"
                aria-label={showSettings ? 'Hide settings' : 'Show settings'}
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="rounded-xl h-8 w-8 p-0"
                aria-label="Start new conversation"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Container - Takes remaining space */}
        <div className="flex-1 min-h-0">
          <ChatMessages
            messages={messages}
            loading={loading}
            error={error}
            retryAttempt={retryAttempt}
            isRetrying={isRetrying}
            editingMessageId={editingMessageId}
            isDarkMode={isDarkMode}
            onCopyToClipboard={copyToClipboard}
            onEditMessage={handleEditMessage}
            onRestartFromMessage={restartFromMessage}
            onSetEditingMessageId={setEditingMessageId}
          />
        </div>

        {/* Input - Sticky at bottom */}
        <div className="flex-shrink-0">
          <ChatInput
            ref={textareaRef}
            prompt={prompt}
            loading={loading}
            messages={messages}
            mcpServers={mcpServers}
            isDarkMode={isDarkMode}
            onPromptChange={setPrompt}
            onSubmit={handleSubmit}
            onStopGeneration={stopStreaming}
            onKeyPress={handleKeyPress}
          />
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isVisible={showSettings}
        isDarkMode={isDarkMode}
        mcpServers={mcpServers}
        onClose={() => setShowSettings(false)}
        onToggleDarkMode={toggleTheme}
        onAddMcpServer={addMcpServer}
        onUpdateMcpServer={updateMcpServer}
        onRemoveMcpServer={removeMcpServer}
      />
    </div>
  );
}