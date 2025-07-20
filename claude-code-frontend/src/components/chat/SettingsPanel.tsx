'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  X, 
  Sun, 
  Moon, 
  Plus, 
  Trash2,
  Settings,
  Palette,
  Server,
  Terminal
} from 'lucide-react';

interface McpServer {
  name: string;
  command: string;
  args?: string[];
  type?: 'stdio' | 'sse' | 'http';
  url?: string;
  enabled: boolean;
}

interface SettingsPanelProps {
  isVisible: boolean;
  isDarkMode: boolean;
  mcpServers: McpServer[];
  onClose: () => void;
  onToggleDarkMode: (darkMode: boolean) => void;
  onAddMcpServer: () => void;
  onUpdateMcpServer: (index: number, updates: Partial<McpServer>) => void;
  onRemoveMcpServer: (index: number) => void;
}

export function SettingsPanel({
  isVisible,
  isDarkMode,
  mcpServers,
  onClose,
  onToggleDarkMode,
  onAddMcpServer,
  onUpdateMcpServer,
  onRemoveMcpServer
}: SettingsPanelProps) {
  if (!isVisible) return null;

  return (
    <motion.aside
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={`w-96 border-l backdrop-blur-xl relative overflow-hidden ${
        isDarkMode 
          ? 'bg-slate-900/95 border-slate-700/30' 
          : 'bg-white/95 border-slate-200/30'
      }`}
    >
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Settings
            </h3>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={`rounded-xl transition-all duration-200 ${
              isDarkMode 
                ? 'hover:bg-slate-800/50 text-slate-400 hover:text-white' 
                : 'hover:bg-slate-100/50 text-slate-600 hover:text-slate-900'
            }`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-8">
          {/* Theme Section */}
          <div className={`p-6 rounded-2xl border backdrop-blur-sm ${
            isDarkMode 
              ? 'bg-slate-800/50 border-slate-700/30' 
              : 'bg-white/50 border-slate-200/30'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Palette className="h-4 w-4 text-yellow-600" />
              </div>
              <h3 className={`text-sm font-semibold ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                Appearance
              </h3>
            </div>
            
            <div className={`flex items-center justify-between p-4 rounded-xl transition-all ${
              isDarkMode 
                ? 'bg-slate-700/30 hover:bg-slate-700/50' 
                : 'bg-slate-100/50 hover:bg-slate-100/80'
            }`}>
              <div className="flex items-center gap-3">
                <Sun className={`h-5 w-5 ${
                  isDarkMode ? 'text-slate-400' : 'text-yellow-500'
                }`} />
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
              
              <Switch
                checked={isDarkMode}
                onCheckedChange={onToggleDarkMode}
              />
              
              <Moon className={`h-5 w-5 ${
                isDarkMode ? 'text-blue-400' : 'text-slate-400'
              }`} />
            </div>
          </div>

          {/* MCP Servers Section */}
          <div className={`p-6 rounded-2xl border backdrop-blur-sm ${
            isDarkMode 
              ? 'bg-slate-800/50 border-slate-700/30' 
              : 'bg-white/50 border-slate-200/30'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Server className="h-4 w-4 text-green-600" />
                </div>
                <h3 className={`text-sm font-semibold ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  MCP Servers
                </h3>
              </div>
              
              <Button
                onClick={onAddMcpServer}
                size="sm"
                className="rounded-xl bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {mcpServers.map((server, index) => (
                  <motion.div
                    key={`${server.name}-${index}`}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-slate-700/50 border-slate-600/30 hover:border-slate-500/50' 
                        : 'bg-slate-50/80 border-slate-200/50 hover:border-slate-300/50'
                    } backdrop-blur-sm`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-1.5 rounded-lg ${
                          server.enabled
                            ? 'bg-gradient-to-r from-green-500 to-blue-500'
                            : isDarkMode ? 'bg-slate-600/50' : 'bg-slate-300/50'
                        }`}>
                          <Terminal className={`h-3 w-3 ${
                            server.enabled ? 'text-white' : isDarkMode ? 'text-slate-400' : 'text-slate-600'
                          }`} />
                        </div>
                        <input
                          type="text"
                          value={server.name}
                          onChange={(e) => onUpdateMcpServer(index, { name: e.target.value })}
                          className={`text-sm font-semibold bg-transparent border-none outline-none flex-1 ${
                            isDarkMode ? 'text-white placeholder-slate-400' : 'text-slate-900 placeholder-slate-500'
                          }`}
                          placeholder="Server name"
                        />
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={server.enabled}
                          onCheckedChange={(enabled) => onUpdateMcpServer(index, { enabled })}
                        />
                        
                        <Button
                          onClick={() => onRemoveMcpServer(index)}
                          variant="ghost"
                          size="sm"
                          className={`h-8 w-8 p-0 rounded-xl transition-all duration-200 ${
                            isDarkMode 
                              ? 'hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-red-500/20' 
                              : 'hover:bg-red-50 text-red-500 hover:text-red-600 border border-red-200/50'
                          }`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    
                    <input
                      type="text"
                      value={server.command}
                      onChange={(e) => onUpdateMcpServer(index, { command: e.target.value })}
                      className={`w-full text-sm font-mono rounded-lg border px-3 py-2 transition-all duration-200 ${
                        isDarkMode 
                          ? 'bg-slate-800/50 border-slate-600/50 text-slate-300 placeholder-slate-500 focus:border-blue-500/50 focus:bg-slate-800/80' 
                          : 'bg-white/50 border-slate-300/50 text-slate-700 placeholder-slate-400 focus:border-blue-500/50 focus:bg-white/80'
                      } focus:ring-2 focus:ring-blue-500/20 focus:outline-none`}
                      placeholder="Enter command..."
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {mcpServers.length === 0 && (
                <div className={`text-center py-8 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  <Server className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">No MCP servers configured</p>
                  <p className="text-xs mt-1">Click the + button to add a server</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}