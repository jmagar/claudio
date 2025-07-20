'use client';

import { messageCache } from './message-cache';
import type { McpServer } from '@/types/chat';

export interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  streaming?: boolean;
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
  editable?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
  totalTokens: number;
  mcpServers?: Record<string, McpServer>;
}

class ConversationStore {
  private storageKey = 'claude-code-conversations';
  private currentConversationKey = 'claude-code-current-conversation';

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  async getAllConversations(): Promise<Conversation[]> {
    if (!this.isBrowser()) return [];
    
    // Try cache first (only metadata for list view)
    try {
      const cachedList = await messageCache.getConversationList();
      if (cachedList) {
        // Return cached metadata directly - already has proper Date objects
        return cachedList;
      }
    } catch (error) {
      // Cache failed, continue to localStorage
      console.warn('Cache miss for conversation list:', error);
    }
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      
      const conversations = JSON.parse(stored);
      const result = conversations.map((conv: Conversation) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: (conv.messages || []).map((msg: ConversationMessage) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
      
      // Cache the list for next time
      messageCache.cacheConversationList(result).catch(() => {});
      
      return result;
    } catch (error) {
      console.error('Error loading conversations:', error);
      return [];
    }
  }

  async getConversation(id: string): Promise<Conversation | null> {
    // Try cache first
    try {
      const cached = await messageCache.getConversation(id);
      if (cached) {
        return cached;
      }
    } catch (error) {
      // Cache failed, continue to localStorage
      console.warn('Cache miss for conversation:', id, error);
    }
    
    // Fallback to localStorage
    const conversations = await this.getAllConversations();
    const conversation = conversations.find(conv => conv.id === id) || null;
    
    // Cache it for next time if found
    if (conversation) {
      messageCache.cacheConversation(id, conversation).catch(() => {});
    }
    
    return conversation;
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    if (!this.isBrowser()) return;
    
    try {
      const conversations = await this.getAllConversations();
      const existingIndex = conversations.findIndex(conv => conv.id === conversation.id);
      
      if (existingIndex >= 0) {
        conversations[existingIndex] = conversation;
      } else {
        conversations.unshift(conversation); // Add to beginning
      }
      
      // Keep only last 50 conversations
      const trimmed = conversations.slice(0, 50);
      localStorage.setItem(this.storageKey, JSON.stringify(trimmed));
      
      // Update cache
      messageCache.cacheConversation(conversation.id, conversation).catch(() => {});
      messageCache.cacheConversationList(trimmed).catch(() => {});
      
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }

  async deleteConversation(id: string): Promise<void> {
    if (!this.isBrowser()) return;
    
    try {
      const conversations = await this.getAllConversations();
      const filtered = conversations.filter(conv => conv.id !== id);
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
      
      // Clear from cache
      messageCache.invalidateConversation(id).catch(() => {});
      messageCache.cacheConversationList(filtered).catch(() => {});
      
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }

  generateTitle(messages: ConversationMessage[]): string {
    const firstUserMessage = messages.find(m => m.type === 'user');
    if (!firstUserMessage) return 'New Conversation';
    
    // Extract meaningful words from the first message
    const content = firstUserMessage.content.trim();
    const words = content.split(/\s+/).slice(0, 6);
    const title = words.join(' ');
    
    // Truncate if too long
    return title.length > 50 ? title.substring(0, 47) + '...' : title;
  }

  getCurrentConversationId(): string | null {
    if (!this.isBrowser()) return null;
    
    try {
      return localStorage.getItem(this.currentConversationKey);
    } catch {
      return null;
    }
  }

  setCurrentConversationId(id: string | null): void {
    if (!this.isBrowser()) return;
    
    try {
      if (id) {
        localStorage.setItem(this.currentConversationKey, id);
      } else {
        localStorage.removeItem(this.currentConversationKey);
      }
    } catch (error) {
      console.error('Error setting current conversation ID:', error);
    }
  }

  createNewConversation(mcpServers?: Record<string, McpServer>): Conversation {
    return {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      totalTokens: 0,
      mcpServers: mcpServers || {}
    };
  }
}

export const conversationStore = new ConversationStore();