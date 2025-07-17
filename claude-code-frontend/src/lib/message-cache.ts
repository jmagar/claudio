import type { Conversation } from './conversation-store';

class MessageCache {
  private isEnabled = true;

  /**
   * Cache a conversation for 1 hour
   */
  async cacheConversation(conversationId: string, conversation: Conversation): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const key = `conv:${conversationId}`;
      const data = JSON.stringify({
        ...conversation,
        cachedAt: Date.now()
      });
      
      await fetch('/api/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set',
          key,
          value: data,
          ttl: 3600 // 1 hour
        })
      });
    } catch (error) {
      console.error('Failed to cache conversation:', {
        conversationId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get conversation from cache
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    if (!this.isEnabled) return null;

    try {
      const key = `conv:${conversationId}`;
      const response = await fetch(`/api/cache?action=get&key=${encodeURIComponent(key)}`);
      
      if (!response.ok) {
        console.error(`Cache API error: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const { cached } = await response.json();
      
      if (!cached) return null;

      const data = JSON.parse(cached);
      
      // Remove our cache metadata before returning
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { cachedAt, ...conversation } = data;
      
      // Convert date strings back to Date objects
      return {
        ...conversation,
        createdAt: new Date(conversation.createdAt),
        updatedAt: new Date(conversation.updatedAt),
        messages: conversation.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      };
    } catch (error) {
      console.warn('Failed to get conversation from cache:', error);
      return null;
    }
  }

  /**
   * Clear cached conversation when it's updated
   */
  async invalidateConversation(conversationId: string): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const key = `conv:${conversationId}`;
      await fetch('/api/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'del',
          key
        })
      });
    } catch (error) {
      console.warn('Failed to invalidate conversation cache:', error);
    }
  }

  /**
   * Cache list of conversation metadata (without full messages)
   */
  async cacheConversationList(conversations: Conversation[]): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const key = 'conversations:list';
      const lightConversations = conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        totalTokens: conv.totalTokens,
        messageCount: conv.messages.length
      }));
      
      const data = JSON.stringify({
        conversations: lightConversations,
        cachedAt: Date.now()
      });
      
      await fetch('/api/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set',
          key,
          value: data,
          ttl: 1800 // 30 minutes
        })
      });
    } catch (error) {
      console.warn('Failed to cache conversation list:', error);
    }
  }

  /**
   * Get cached conversation list
   */
  async getConversationList(): Promise<any[] | null> {
    if (!this.isEnabled) return null;

    try {
      const key = 'conversations:list';
      const response = await fetch(`/api/cache?action=get&key=${encodeURIComponent(key)}`);
      
      if (!response.ok) {
        console.error(`Cache list API error: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const { cached } = await response.json();
      
      if (!cached) return null;

      const data = JSON.parse(cached);
      
      // Convert date strings back to Date objects
      return data.conversations.map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt)
      }));
    } catch (error) {
      console.warn('Failed to get conversation list from cache:', error);
      return null;
    }
  }

  /**
   * Clear all cached data
   */
  async clearAll(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await fetch('/api/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clear'
        })
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Check if Redis cache is available
   */
  isAvailable(): boolean {
    return this.isEnabled;
  }

  /**
   * Get connection info for debugging
   */
  async getConnectionInfo(): Promise<{ enabled: boolean; working: boolean }> {
    try {
      const response = await fetch('/api/cache?action=get&key=test');
      return {
        enabled: this.isEnabled,
        working: response.ok
      };
    } catch {
      return {
        enabled: this.isEnabled,
        working: false
      };
    }
  }
}

// Export singleton instance
export const messageCache = new MessageCache();