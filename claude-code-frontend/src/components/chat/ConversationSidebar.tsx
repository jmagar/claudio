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
  Trash2
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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -320, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className={`w-80 flex-shrink-0 border-r backdrop-blur-xl ${
            isDarkMode 
              ? 'bg-gray-950/95 border-gray-800/50 shadow-2xl' 
              : 'bg-white/95 border-gray-200/50 shadow-xl'
          }`}
        >
          {/* Header */}
          <div className="p-6 border-b border-current/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Conversations
              </h2>
              <Button
                onClick={onNewConversation}
                size="sm"
                className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl border transition-all ${
                  isDarkMode 
                    ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className={`p-6 text-center ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm mt-1">Start a new conversation to begin</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {filteredConversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`group relative p-4 rounded-xl cursor-pointer transition-all ${
                      currentConversation?.id === conversation.id
                        ? isDarkMode 
                          ? 'bg-blue-900/30 border-blue-700/50' 
                          : 'bg-blue-50/80 border-blue-200/50'
                        : isDarkMode 
                          ? 'hover:bg-slate-800/50 border-transparent' 
                          : 'hover:bg-slate-100/50 border-transparent'
                    } border`}
                    onClick={() => onLoadConversation(conversation)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 opacity-50" />
                          <p className={`font-medium text-sm truncate ${
                            isDarkMode ? 'text-white' : 'text-slate-900'
                          }`}>
                            {conversation.title}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs">
                          <span className={`flex items-center gap-1 ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            <MessageSquare className="h-3 w-3" />
                            {conversation.messages.length}
                          </span>
                          <span className={`flex items-center gap-1 ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            <Hash className="h-3 w-3" />
                            {conversation.totalTokens}
                          </span>
                          <span className={`flex items-center gap-1 ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            <Clock className="h-3 w-3" />
                            {conversation.updatedAt.toLocaleDateString()}
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
                        className={`opacity-0 group-hover:opacity-100 transition-opacity rounded-lg ${
                          isDarkMode 
                            ? 'hover:bg-red-900/20 text-red-400' 
                            : 'hover:bg-red-50 text-red-600'
                        }`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}