import { useState, useEffect, useCallback, useRef } from 'react';
import { conversationStore } from '@/lib/conversation-store';
import { type Conversation, type ConversationMessage } from '@/types';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  
  // Use ref to track the current conversation ID to prevent race conditions
  const currentConversationIdRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadConversation = useCallback((conversation: Conversation) => {
    setCurrentConversation(conversation);
    setMessages(conversation.messages);
  }, []);

  // Load conversations on mount
  useEffect(() => {
    const stored = conversationStore.getAllConversations();
    setConversations(stored);
    if (stored.length > 0) {
      loadConversation(stored[0]);
    }
  }, [loadConversation]);

  // Debounced save function to prevent excessive localStorage operations
  const debouncedSave = useCallback((conversationToSave: Conversation) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      // Double-check that this is still the current conversation
      if (conversationToSave.id === currentConversationIdRef.current) {
        conversationStore.saveConversation(conversationToSave);
        setConversations(conversationStore.getAllConversations());
      }
    }, 300); // 300ms debounce
  }, []);

  // Save conversation when messages change - fixed race condition
  useEffect(() => {
    if (currentConversation && messages.length > 0 && currentConversation.id === currentConversationIdRef.current) {
      const updated = {
        ...currentConversation,
        messages,
        updatedAt: new Date(),
        totalTokens: messages.reduce((total, msg) => total + (msg.tokens?.total || 0), 0),
        title: currentConversation.title === 'New Conversation' 
          ? conversationStore.generateTitle(messages)
          : currentConversation.title,
      };
      
      // Use debounced save to prevent excessive operations during streaming
      debouncedSave(updated);
      
      // Update current conversation state immediately for UI responsiveness
      setCurrentConversation(updated);
    }
  }, [messages, currentConversation, debouncedSave]);

  // Update conversation ID ref when conversation changes
  useEffect(() => {
    currentConversationIdRef.current = currentConversation?.id || null;
  }, [currentConversation?.id]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const createNewConversation = useCallback((mcpServers: Record<string, unknown>) => {
    const newConv = conversationStore.createNewConversation(mcpServers);
    setCurrentConversation(newConv);
    setMessages([]);
    return newConv;
  }, []);

  const deleteConversation = useCallback((conversationId: string) => {
    conversationStore.deleteConversation(conversationId);
    const remaining = conversationStore.getAllConversations();
    setConversations(remaining);
    
    if (currentConversation?.id === conversationId) {
      if (remaining.length > 0) {
        loadConversation(remaining[0]);
      } else {
        return null; // Signal that we need to create a new conversation
      }
    }
  }, [currentConversation?.id, loadConversation]);

  const editMessage = useCallback((messageId: string, newContent: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) {return;}
    
    // Remove messages after the edited message and restart from there
    const messagesUpToEdit = messages.slice(0, messageIndex);
    const editedMessage = { ...messages[messageIndex], content: newContent };
    
    setMessages([...messagesUpToEdit, editedMessage]);
  }, [messages]);

  const restartFromMessage = useCallback((messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) {return;}
    
    // Keep messages up to and including the selected message
    const messagesToKeep = messages.slice(0, messageIndex + 1);
    setMessages(messagesToKeep);
  }, [messages]);

  // Resume from last conversation - useful for CLI integration
  const resumeLastConversation = useCallback(() => {
    const stored = conversationStore.getAllConversations();
    if (stored.length > 0) {
      const lastConversation = stored[0]; // Most recent conversation
      loadConversation(lastConversation);
      return lastConversation;
    }
    return null;
  }, [loadConversation]);

  // Export conversation data for CLI integration
  const exportConversation = useCallback((conversation?: Conversation) => {
    const conv = conversation || currentConversation;
    if (!conv) {return null;}
    
    return {
      id: conv.id,
      title: conv.title,
      messages: conv.messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
      })),
      totalTokens: conv.totalTokens,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
    };
  }, [currentConversation]);

  return {
    conversations,
    currentConversation,
    messages,
    setMessages,
    createNewConversation,
    loadConversation,
    deleteConversation,
    editMessage,
    restartFromMessage,
    resumeLastConversation,
    exportConversation,
  };
}