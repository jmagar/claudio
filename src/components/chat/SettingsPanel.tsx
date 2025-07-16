'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Settings,
} from 'lucide-react';
import { ThemeSettings } from './settings/ThemeSettings';
import { McpServerSettings } from './settings/McpServerSettings';
import type { McpServer } from '@/types';

interface SettingsPanelProps {
  isVisible: boolean;
  isDarkMode: boolean;
  mcpServers: McpServer[];
  onClose: () => void;
  onToggleDarkMode: () => void;
  onAddMcpServer: () => void;
  onUpdateMcpServer: (index: number, updates: Partial<McpServer>) => void;
  onRemoveMcpServer: (index: number) => void;
}

/**
 * Renders an animated settings sidebar panel with theme and MCP server configuration options.
 *
 * Displays a slide-in panel from the right with a backdrop when visible. The panel adapts its appearance for dark or light mode and provides controls for toggling dark mode and managing a list of MCP servers. The panel can be closed by clicking the backdrop or the close button.
 *
 * @returns The settings panel React element, conditionally rendered based on visibility.
 */
export function SettingsPanel({
  isVisible,
  isDarkMode,
  mcpServers,
  onClose,
  onToggleDarkMode,
  onAddMcpServer,
  onUpdateMcpServer,
  onRemoveMcpServer,
}: SettingsPanelProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed right-0 top-0 h-full w-full lg:w-96 z-50 flex flex-col ${
              isDarkMode 
                ? 'bg-gray-950/95 border-gray-800/50' 
                : 'bg-white/95 border-gray-200/50'
            } border-l backdrop-blur-xl`}
          >
            {/* Header */}
            <div className={`px-6 py-4 border-b ${
              isDarkMode ? 'border-gray-800/50' : 'border-gray-200/50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20' 
                      : 'bg-gradient-to-br from-blue-50 to-purple-50'
                  }`}>
                    <Settings className={`h-4 w-4 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Settings
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Customize your experience
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className={`rounded-xl hover:scale-105 transition-all ${
                    isDarkMode 
                      ? 'hover:bg-gray-800/50 text-gray-400 hover:text-gray-300' 
                      : 'hover:bg-gray-100/50 text-gray-600 hover:text-gray-700'
                  }`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-8">
                {/* Theme Settings */}
                <ThemeSettings
                  isDarkMode={isDarkMode}
                  onToggleDarkMode={onToggleDarkMode}
                />

                {/* MCP Server Settings */}
                <McpServerSettings
                  isDarkMode={isDarkMode}
                  mcpServers={mcpServers}
                  onAddMcpServer={onAddMcpServer}
                  onUpdateMcpServer={onUpdateMcpServer}
                  onRemoveMcpServer={onRemoveMcpServer}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}