'use client';

import { generateConversationId, generateMessageId } from './id-utils';
import type { ConversationMessage, Conversation } from '@/types';

class ConversationStore {
  private storageKey = 'claude-code-conversations';

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private validateAndFixId(id: string): string {
    // If ID is just a timestamp (likely legacy data), generate a new proper ID
    if (/^\d{13}$/.test(id)) {
      return generateMessageId();
    }
    return id;
  }

  private validateAndFixConversationId(id: string): string {
    // If ID is just a timestamp (likely legacy data), generate a new proper ID
    if (/^\d{13}$/.test(id)) {
      return generateConversationId();
    }
    return id;
  }

  getAllConversations(): Conversation[] {
    if (!this.isBrowser()) {return [];}
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {return [];}
      
      const conversations = JSON.parse(stored);
      return conversations.map((conv: unknown) => {
        const conversation = conv as Record<string, unknown>;
        // Fix conversation ID if it's a legacy timestamp
        const fixedId = this.validateAndFixConversationId(conversation.id as string);
        return {
          ...conversation,
          id: fixedId,
          createdAt: new Date(conversation.createdAt as string),
          updatedAt: new Date(conversation.updatedAt as string),
          messages: (conversation.messages as Array<Record<string, unknown>>).map((msg) => ({
            ...msg,
            id: this.validateAndFixId(msg.id as string),
            timestamp: new Date(msg.timestamp as string),
          })),
        };
      });
    } catch (error) {
      return [];
    }
  }

  getConversation(id: string): Conversation | null {
    const conversations = this.getAllConversations();
    return conversations.find(conv => conv.id === id) || null;
  }

  saveConversation(conversation: Conversation): void {
    if (!this.isBrowser()) {return;}
    
    try {
      const conversations = this.getAllConversations();
      const existingIndex = conversations.findIndex(conv => conv.id === conversation.id);
      
      if (existingIndex >= 0) {
        conversations[existingIndex] = conversation;
      } else {
        conversations.unshift(conversation); // Add to beginning
      }
      
      // Keep only last 50 conversations
      const trimmed = conversations.slice(0, 50);
      localStorage.setItem(this.storageKey, JSON.stringify(trimmed));
    } catch (error) {
    }
  }

  deleteConversation(id: string): void {
    if (!this.isBrowser()) {return;}
    
    try {
      const conversations = this.getAllConversations();
      const filtered = conversations.filter(conv => conv.id !== id);
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    } catch (error) {
    }
  }

  generateTitle(messages: ConversationMessage[]): string {
    const firstUserMessage = messages.find(m => m.type === 'user');
    if (!firstUserMessage) {return 'New Conversation';}
    
    // Extract meaningful words from the first message
    const content = firstUserMessage.content.trim();
    const words = content.split(/\s+/).slice(0, 6);
    const title = words.join(' ');
    
    // Truncate if too long
    return title.length > 50 ? title.substring(0, 47) + '...' : title;
  }

  createNewConversation(mcpServers?: Record<string, unknown>): Conversation {
    return {
      id: generateConversationId(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      totalTokens: 0,
      mcpServers: mcpServers || {},
    };
  }
}

export const conversationStore = new ConversationStore();