'use client';

import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Code, 
  Zap, 
  MessageSquare, 
  FileText, 
  Layers,
  ArrowRight,
} from 'lucide-react';

interface WelcomeScreenProps {
  isDarkMode: boolean;
}

/**
 * Renders an animated welcome screen with feature highlights and usage tips, adapting its appearance for dark or light mode.
 *
 * Displays a hero section, a grid of feature suggestion cards, and a "Pro Tips" section, all styled and animated for an engaging onboarding experience.
 *
 * @param isDarkMode - Whether to use dark mode styling for the interface.
 */
export function WelcomeScreen({ isDarkMode }: WelcomeScreenProps) {
  const suggestions = [
    {
      icon: Code,
      title: 'Code Generation',
      description: 'Create React components with TypeScript',
      example: 'Build a responsive navbar component',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Zap,
      title: 'Debug & Optimize',
      description: 'Fix bugs and improve performance',
      example: 'Debug this async function',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: FileText,
      title: 'Documentation',
      description: 'Generate docs and comments',
      example: 'Write API documentation',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Layers,
      title: 'Architecture',
      description: 'Design patterns and best practices',
      example: 'Suggest state management approach',
      color: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
            className={`relative w-24 h-24 mx-auto mb-6 rounded-3xl ${
              isDarkMode 
                ? 'bg-gradient-to-br from-blue-500/20 to-purple-600/20' 
                : 'bg-gradient-to-br from-blue-400/20 to-purple-500/20'
            } flex items-center justify-center`}
          >
            <div className={`absolute inset-0 rounded-3xl ${
              isDarkMode 
                ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                : 'bg-gradient-to-br from-blue-400 to-purple-500'
            } opacity-20 blur-xl animate-pulse`} />
            <Sparkles className={`h-12 w-12 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`} />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className={`text-4xl font-bold mb-4 bg-gradient-to-r ${
              isDarkMode 
                ? 'from-white via-blue-100 to-purple-200' 
                : 'from-gray-900 via-blue-900 to-purple-900'
            } bg-clip-text text-transparent`}
          >
            Welcome to Claude Code
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className={`text-lg max-w-2xl mx-auto ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Your intelligent coding companion powered by Claude. Get help with code generation, 
            debugging, architecture decisions, and more—all with real-time streaming responses.
          </motion.p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className={`group p-6 rounded-2xl border backdrop-blur-sm transition-all cursor-pointer ${
                isDarkMode 
                  ? 'bg-gray-900/40 border-gray-800/50 hover:bg-gray-800/50 hover:border-gray-700/50' 
                  : 'bg-white/40 border-gray-200/50 hover:bg-white/60 hover:border-gray-300/50'
              } hover:shadow-lg`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${suggestion.color} opacity-90 group-hover:opacity-100 transition-opacity`}>
                  <suggestion.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {suggestion.title}
                  </h3>
                  <p className={`text-sm mb-3 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {suggestion.description}
                  </p>
                  <div className={`flex items-center gap-2 text-xs font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <MessageSquare className="h-3 w-3" />
                    <span>"{suggestion.example}"</span>
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className={`text-center p-6 rounded-2xl border ${
            isDarkMode 
              ? 'bg-gray-900/20 border-gray-800/30' 
              : 'bg-gray-50/50 border-gray-200/30'
          }`}
        >
          <h3 className={`font-medium mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Pro Tips
          </h3>
          <div className={`text-sm space-y-1 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <p>• Use <kbd className={`px-2 py-1 rounded text-xs font-mono ${
              isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}>Shift + Enter</kbd> for multi-line input</p>
            <p>• Configure MCP servers in settings to extend Claude's capabilities</p>
            <p>• All conversations are automatically saved and searchable</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}