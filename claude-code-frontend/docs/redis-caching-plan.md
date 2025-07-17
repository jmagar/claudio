# Redis Caching Plan for Chat Messages

## Simple Goal
Use Redis to cache frequently accessed conversations and messages for faster loading. localStorage remains the primary storage.

## Architecture

### Current Flow
```
User Request → localStorage → Display Messages
```

### New Flow with Redis Cache
```
User Request → Redis Cache (if hit) → Display Messages
            → localStorage → Redis Cache → Display Messages (if miss)
```

## Implementation

### 1. Setup (10 minutes)
```bash
npm install @upstash/redis
```

### 2. Simple Cache Layer
```typescript
// src/lib/message-cache.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export class MessageCache {
  // Cache conversation for 1 hour
  async cacheConversation(conversationId: string, conversation: Conversation) {
    await redis.setex(`conv:${conversationId}`, 3600, JSON.stringify(conversation))
  }
  
  // Get from cache
  async getConversation(conversationId: string): Promise<Conversation | null> {
    const cached = await redis.get(`conv:${conversationId}`)
    return cached ? JSON.parse(cached as string) : null
  }
  
  // Clear cache when conversation updates
  async invalidateConversation(conversationId: string) {
    await redis.del(`conv:${conversationId}`)
  }
}
```

### 3. Update Conversation Store
```typescript
// src/lib/conversation-store.ts
import { MessageCache } from './message-cache'

class ConversationStore {
  private cache = new MessageCache()
  
  async getConversation(id: string): Promise<Conversation | null> {
    // Try cache first
    try {
      const cached = await this.cache.getConversation(id)
      if (cached) return cached
    } catch (error) {
      // Cache failed, continue to localStorage
    }
    
    // Fallback to localStorage
    const conversation = this.getConversationFromLocalStorage(id)
    
    // Cache it for next time
    if (conversation) {
      this.cache.cacheConversation(id, conversation).catch(() => {})
    }
    
    return conversation
  }
  
  saveConversation(conversation: Conversation): void {
    // Save to localStorage (primary storage)
    this.saveToLocalStorage(conversation)
    
    // Update cache
    this.cache.cacheConversation(conversation.id, conversation).catch(() => {})
  }
}
```

## Benefits
- **Faster loading** for recently accessed conversations
- **Zero risk** - localStorage is still primary storage
- **10x simpler** than full Redis migration
- **Easy to add/remove** - just caching layer

## Cost
- **Free tier**: 10,000 Redis commands/day (plenty for caching)
- **Estimated usage**: ~50 cache hits/day per user

That's it! Simple Redis caching without changing your core storage strategy.