import { useState, useEffect, useCallback } from 'react';
import { conversationStore, type Conversation, type ConversationMessage } from '@/lib/conversation-store';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);

  // Load conversations on mount
  useEffect(() => {
    const stored = conversationStore.getAllConversations();
    setConversations(stored);
    if (stored.length > 0) {
      loadConversation(stored[0]);
    }
  }, []);

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
  }, [messages, currentConversation?.id, currentConversation?.title]);

  const createNewConversation = useCallback((mcpServers: Record<string, any>) => {
    const newConv = conversationStore.createNewConversation(mcpServers);
    setCurrentConversation(newConv);
    setMessages([]);
    return newConv;
  }, []);

  const loadConversation = useCallback((conversation: Conversation) => {
    setCurrentConversation(conversation);
    setMessages(conversation.messages);
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
    if (messageIndex === -1) return;
    
    // Remove messages after the edited message and restart from there
    const messagesUpToEdit = messages.slice(0, messageIndex);
    const editedMessage = { ...messages[messageIndex], content: newContent };
    
    setMessages([...messagesUpToEdit, editedMessage]);
  }, [messages]);

  const restartFromMessage = useCallback((messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    
    // Keep messages up to and including the selected message
    const messagesToKeep = messages.slice(0, messageIndex + 1);
    setMessages(messagesToKeep);
  }, [messages]);

  return {
    conversations,
    currentConversation,
    messages,
    setMessages,
    createNewConversation,
    loadConversation,
    deleteConversation,
    editMessage,
    restartFromMessage
  };
}