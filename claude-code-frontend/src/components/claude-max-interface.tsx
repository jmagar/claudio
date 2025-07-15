'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Plus, 
  Bot,
  Menu,
  Sun,
  Moon
} from 'lucide-react';
import { conversationStore, type Conversation, type ConversationMessage } from '@/lib/conversation-store';
import { ConversationSidebar } from '@/components/chat/ConversationSidebar';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { SettingsPanel } from '@/components/chat/SettingsPanel';

interface McpServer {
  name: string;
  command: string;
  args?: string[];
  type?: 'stdio' | 'sse' | 'http';
  url?: string;
  enabled: boolean;
}

export function ClaudeMaxInterface() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load conversations on component mount
  useEffect(() => {
    const stored = conversationStore.getAllConversations();
    setConversations(stored);
    if (stored.length > 0) {
      loadConversation(stored[0]);
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save conversation when messages change
  useEffect(() => {
    if (currentConversation && messages.length > 0) {
      const updated = {
        ...currentConversation,
        messages,
        updatedAt: new Date(),
        totalTokens: messages.reduce((total, msg) => total + (msg.tokens?.total || 0), 0),
        title: currentConversation.title === 'New Conversation' 
          ? conversationStore.generateTitle(messages)
          : currentConversation.title
      };
      conversationStore.saveConversation(updated);
      setCurrentConversation(updated);
      setConversations(conversationStore.getAllConversations());
    }
  }, [messages, currentConversation]);

  // Local function to format Claude messages without duplicates
  const formatMessages = (messages: any[]): string => {
    const uniqueContent: string[] = [];
    
    for (const message of messages) {
      if (message.type === 'assistant' && message.message) {
        const content = message.message.content;
        let textContent = '';
        
        if (typeof content === 'string') {
          textContent = content;
        } else if (Array.isArray(content)) {
          textContent = content
            .map(block => block.type === 'text' ? block.text : JSON.stringify(block, null, 2))
            .join('\n');
        }
        
        if (textContent.trim() && !uniqueContent.some(existing => existing.includes(textContent.trim()))) {
          uniqueContent.push(textContent);
        }
      } else if (message.type === 'result' && message.subtype === 'success') {
        const resultContent = message.result || '';
        if (resultContent.trim() && !uniqueContent.some(existing => existing.includes(resultContent.trim()))) {
          uniqueContent.push(resultContent);
        }
      }
    }
    
    return uniqueContent.join('\n\n');
  };

  const startNewConversation = () => {
    if (loading) stopGeneration();
    
    const newConv = conversationStore.createNewConversation(
      mcpServers
        .filter(server => server.enabled)
        .reduce((acc, server) => {
          acc[server.name] = {
            command: server.command,
            args: server.args,
            type: server.type || 'stdio',
            url: server.url
          };
          return acc;
        }, {} as Record<string, any>)
    );
    
    setCurrentConversation(newConv);
    setMessages([]);
    setError(null);
  };

  const loadConversation = (conversation: Conversation) => {
    if (loading) stopGeneration();
    setCurrentConversation(conversation);
    setMessages(conversation.messages);
    setError(null);
    setEditingMessageId(null);
  };

  const deleteConversation = (conversationId: string) => {
    conversationStore.deleteConversation(conversationId);
    const remaining = conversationStore.getAllConversations();
    setConversations(remaining);
    
    if (currentConversation?.id === conversationId) {
      if (remaining.length > 0) {
        loadConversation(remaining[0]);
      } else {
        startNewConversation();
      }
    }
  };

  const editMessage = (messageId: string, newContent: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    
    // Remove messages after the edited message and restart from there
    const messagesUpToEdit = messages.slice(0, messageIndex);
    const editedMessage = { ...messages[messageIndex], content: newContent };
    
    setMessages([...messagesUpToEdit, editedMessage]);
    setEditingMessageId(null);
  };

  const restartFromMessage = (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    
    // Keep messages up to and including the selected message
    const messagesToKeep = messages.slice(0, messageIndex + 1);
    setMessages(messagesToKeep);
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || loading) return;
    
    // Create new conversation if none exists
    if (!currentConversation) {
      startNewConversation();
    }
    
    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);
    const currentPrompt = prompt;
    setPrompt('');
    
    // Create streaming assistant message
    const assistantMessage: ConversationMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      streaming: true
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    
    // Track accumulated messages for proper formatting
    const accumulatedMessages: any[] = [];
    
    try {
      abortControllerRef.current = new AbortController();
      
      const enabledMcpServers = mcpServers
        .filter(server => server.enabled)
        .reduce((acc, server) => {
          acc[server.name] = {
            command: server.command,
            args: server.args,
            type: server.type || 'stdio',
            url: server.url
          };
          return acc;
        }, {} as Record<string, any>);

      const response = await fetch('/api/claude-code/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: currentPrompt,
          mcpServers: enabledMcpServers
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
              setLoading(false);
              return;
            }

            try {
              const message = JSON.parse(data);
              
              if (message.type === 'error') {
                setError(message.error);
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
                setMessages(prev => prev.map(msg => 
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
        setError('Request was cancelled');
      } else {
        setError('Failed to connect to Claude Code SDK');
      }
      // Remove the streaming message on error
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id));
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
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
    if (loading) stopGeneration();
    startNewConversation();
  };

  const addMcpServer = () => {
    const newServer: McpServer = {
      name: `server-${Date.now()}`,
      command: '',
      args: [],
      type: 'stdio',
      enabled: false
    };
    setMcpServers(prev => [...prev, newServer]);
  };

  const updateMcpServer = (index: number, updates: Partial<McpServer>) => {
    setMcpServers(prev => prev.map((server, i) => 
      i === index ? { ...server, ...updates } : server
    ));
  };

  const removeMcpServer = (index: number) => {
    setMcpServers(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={`h-screen flex transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' 
        : 'bg-gradient-to-br from-white via-slate-50 to-white'
    }`}>
      
      {/* Use the extracted ConversationSidebar component */}
      <ConversationSidebar
        conversations={conversations}
        currentConversation={currentConversation}
        onLoadConversation={loadConversation}
        onNewConversation={startNewConversation}
        onDeleteConversation={deleteConversation}
        isDarkMode={isDarkMode}
        isVisible={showSidebar}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className={`border-b backdrop-blur-xl ${
          isDarkMode 
            ? 'bg-slate-900/50 border-slate-700/50' 
            : 'bg-white/50 border-slate-200/50'
        }`}>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="rounded-xl"
              >
                <Menu className="h-4 w-4" />
              </Button>
              
              <div className={`flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                <div className="relative">
                  <Bot className="h-6 w-6" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">Claude Code</h1>
                  <p className={`text-xs ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {currentConversation?.title || 'New Conversation'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="rounded-xl"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="rounded-xl"
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="rounded-xl"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ChatMessages
          messages={messages}
          loading={loading}
          error={error}
          editingMessageId={editingMessageId}
          isDarkMode={isDarkMode}
          onCopyToClipboard={copyToClipboard}
          onEditMessage={editMessage}
          onRestartFromMessage={restartFromMessage}
          onSetEditingMessageId={setEditingMessageId}
        />
        <div ref={messagesEndRef} />

        {/* Input */}
        <ChatInput
          ref={textareaRef}
          prompt={prompt}
          loading={loading}
          messages={messages}
          mcpServers={mcpServers}
          isDarkMode={isDarkMode}
          onPromptChange={setPrompt}
          onSubmit={handleSubmit}
          onStopGeneration={stopGeneration}
          onKeyPress={handleKeyPress}
        />
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isVisible={showSettings}
        isDarkMode={isDarkMode}
        mcpServers={mcpServers}
        onClose={() => setShowSettings(false)}
        onToggleDarkMode={setIsDarkMode}
        onAddMcpServer={addMcpServer}
        onUpdateMcpServer={updateMcpServer}
        onRemoveMcpServer={removeMcpServer}
      />
    </div>
  );
}