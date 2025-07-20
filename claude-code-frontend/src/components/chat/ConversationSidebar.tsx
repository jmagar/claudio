'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Search,
  History,
  MessageSquare,
  Hash,
  Clock,
  FileText,
  Trash2,
} from 'lucide-react';
import { Conversation } from '@/types/chat';

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onLoadConversation: (conversation: Conversation) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  isDarkMode: boolean;
  isVisible: boolean;
}

export function ConversationSidebar({
  conversations,
  currentConversation,
  onLoadConversation,
  onNewConversation,
  onDeleteConversation,
  isDarkMode,
  isVisible
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isVisible) return null;

  return (
    <motion.aside
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -320, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={`w-80 flex-shrink-0 border-r backdrop-blur-xl relative overflow-hidden ${
        isDarkMode 
          ? 'bg-slate-900/95 border-slate-700/30' 
          : 'bg-white/95 border-slate-200/30'
      }`}
    >
      {/* Header */}
      <div className="p-6 border-b border-current/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-1.5 rounded-lg">
              <History className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Conversations
            </h2>
          </div>
          
          <Button
            onClick={onNewConversation}
            size="sm"
            className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-all duration-200 ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-12 pr-4 py-3 rounded-xl border transition-all duration-200 ${
              isDarkMode 
                ? 'bg-slate-800/50 border-slate-700/50 text-white placeholder-slate-400 focus:border-blue-500/50 focus:bg-slate-800/80' 
                : 'bg-white/70 border-slate-300/50 text-slate-900 placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/90'
            } focus:ring-2 focus:ring-blue-500/20 focus:outline-none`}
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredConversations.length === 0 ? (
          <div className={`text-center py-8 ${
            isDarkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>
            <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">
              {searchQuery ? 'No matches found' : 'No conversations yet'}
            </p>
            <p className="text-xs mt-1">
              {searchQuery ? 'Try a different search term' : 'Start a new conversation to begin'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredConversations.map((conversation, index) => (
                <motion.div
                  key={conversation.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden ${
                    currentConversation?.id === conversation.id
                      ? isDarkMode 
                        ? 'bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-blue-500/30 shadow-lg shadow-blue-500/10' 
                        : 'bg-gradient-to-r from-blue-50/80 to-purple-50/80 border-blue-300/50 shadow-lg shadow-blue-500/10'
                      : isDarkMode 
                        ? 'hover:bg-slate-800/60 border-slate-700/30 hover:border-slate-600/50' 
                        : 'hover:bg-slate-50/80 border-slate-200/30 hover:border-slate-300/50'
                  } border backdrop-blur-sm`}
                  onClick={() => onLoadConversation(conversation)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-1.5 rounded-lg transition-colors ${
                          currentConversation?.id === conversation.id
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                            : isDarkMode ? 'bg-slate-700/50' : 'bg-slate-200/50'
                        }`}>
                          <FileText className={`h-3.5 w-3.5 ${
                            currentConversation?.id === conversation.id
                              ? 'text-white'
                              : isDarkMode ? 'text-slate-400' : 'text-slate-600'
                          }`} />
                        </div>
                        <p className={`font-semibold text-sm truncate transition-colors ${
                          currentConversation?.id === conversation.id
                            ? isDarkMode ? 'text-blue-300' : 'text-blue-700'
                            : isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}>
                          {conversation.title}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs">
                        <span className={`flex items-center gap-1.5 transition-colors ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          <MessageSquare className="h-3 w-3" />
                          <span className="font-medium">{conversation.messages.length}</span>
                        </span>
                        <span className={`flex items-center gap-1.5 transition-colors ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          <Hash className="h-3 w-3" />
                          <span className="font-medium">{conversation.totalTokens.toLocaleString()}</span>
                        </span>
                        <span className={`flex items-center gap-1.5 transition-colors ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          <Clock className="h-3 w-3" />
                          <span className="font-medium">{conversation.updatedAt.toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conversation.id);
                      }}
                      variant="ghost"
                      size="sm"
                      className={`opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-xl h-8 w-8 p-0 ${
                        isDarkMode 
                          ? 'hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-red-500/20' 
                          : 'hover:bg-red-50 text-red-500 hover:text-red-600 border border-red-200/50'
                      }`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.aside>
  );
}