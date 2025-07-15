'use client';

import { generateConversationId } from './id-utils';

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
  mcpServers?: Record<string, unknown>;
}

class ConversationStore {
  private storageKey = 'claude-code-conversations';

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  getAllConversations(): Conversation[] {
    if (!this.isBrowser()) {return [];}
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {return [];}
      
      const conversations = JSON.parse(stored);
      return conversations.map((conv: unknown) => {
        const conversation = conv as Record<string, unknown>;
        return {
          ...conversation,
          createdAt: new Date(conversation.createdAt as string),
          updatedAt: new Date(conversation.updatedAt as string),
          messages: (conversation.messages as Array<Record<string, unknown>>).map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp as string),
          })),
        };
      });
    } catch (error) {
      console.error('Error loading conversations:', error);
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
      console.error('Error saving conversation:', error);
    }
  }

  deleteConversation(id: string): void {
    if (!this.isBrowser()) {return;}
    
    try {
      const conversations = this.getAllConversations();
      const filtered = conversations.filter(conv => conv.id !== id);
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting conversation:', error);
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