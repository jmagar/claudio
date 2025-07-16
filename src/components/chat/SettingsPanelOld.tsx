'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { validateMcpCommand, validateMcpUrl, sanitizeMcpCommand } from '@/lib/message-utils';
import { themeClasses } from '@/lib/theme-utils';
import { 
  X, 
  Sun, 
  Moon, 
  Plus, 
  Trash2,
  Settings,
  Palette,
  Server,
  Check,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronRight,
  Zap,
  Globe,
  Terminal,
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
  onToggleDarkMode: () => void;
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
  onRemoveMcpServer,
}: SettingsPanelProps) {
  const [expandedServer, setExpandedServer] = useState<number | null>(null);
  const [showMcpInfo, setShowMcpInfo] = useState(false);

  if (!isVisible) {return null;}

  const getConnectionTypeIcon = (type: string) => {
    switch (type) {
      case 'stdio': return <Terminal className="h-4 w-4" />;
      case 'sse': return <Zap className="h-4 w-4" />;
      case 'http': return <Globe className="h-4 w-4" />;
      default: return <Terminal className="h-4 w-4" />;
    }
  };


  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={`w-96 border-l backdrop-blur-xl ${
        isDarkMode 
          ? 'bg-gray-950/95 border-gray-800/50 shadow-2xl' 
          : 'bg-white/95 border-gray-200/50 shadow-xl'
      }`}
    >
      {/* Header */}
      <div className={`border-b px-6 py-4 ${
        isDarkMode ? 'border-gray-800/50' : 'border-gray-200/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              isDarkMode 
                ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20' 
                : 'bg-gradient-to-br from-blue-50 to-purple-50'
            }`}>
              <Settings className={`h-5 w-5 ${
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

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8">
          {/* Theme Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20' 
                  : 'bg-gradient-to-br from-amber-50 to-orange-50'
              }`}>
                <Palette className={`h-4 w-4 ${
                  isDarkMode ? 'text-amber-400' : 'text-amber-600'
                }`} />
              </div>
              <div>
                <h4 className={`font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Appearance
                </h4>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Choose your preferred theme
                </p>
              </div>
            </div>
            
            <div className={`p-4 rounded-2xl border transition-all ${
              isDarkMode 
                ? 'bg-gray-900/50 border-gray-800/50' 
                : 'bg-gray-50/50 border-gray-200/50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sun className={`h-5 w-5 transition-colors ${
                    !isDarkMode 
                      ? 'text-amber-500' 
                      : isDarkMode 
                        ? 'text-gray-500' 
                        : 'text-gray-400'
                  }`} />
                  <span className={`font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={isDarkMode}
                    onCheckedChange={() => onToggleDarkMode()}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Moon className={`h-5 w-5 transition-colors ${
                    isDarkMode 
                      ? 'text-blue-400' 
                      : 'text-gray-400'
                  }`} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* MCP Servers Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20' 
                    : 'bg-gradient-to-br from-purple-50 to-pink-50'
                }`}>
                  <Server className={`h-4 w-4 ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                </div>
                <div>
                  <h4 className={`font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    MCP Servers
                  </h4>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Extend Claude's capabilities
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMcpInfo(!showMcpInfo)}
                className={`rounded-xl ${
                  isDarkMode 
                    ? 'hover:bg-gray-800/50 text-gray-400' 
                    : 'hover:bg-gray-100/50 text-gray-600'
                }`}
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>

            <AnimatePresence>
              {showMcpInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-4 rounded-2xl border ${
                    isDarkMode 
                      ? 'bg-blue-900/20 border-blue-800/30' 
                      : 'bg-blue-50/50 border-blue-200/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Info className={`h-4 w-4 mt-0.5 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <div className="space-y-2">
                      <p className={`text-sm font-medium ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-900'
                      }`}>
                        Model Context Protocol (MCP)
                      </p>
                      <p className={`text-xs leading-relaxed ${
                        isDarkMode ? 'text-blue-400/80' : 'text-blue-700/80'
                      }`}>
                        MCP servers allow Claude to interact with external tools and services. 
                        Configure servers to enable features like file system access, databases, 
                        APIs, and more.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Add Server Button */}
            <Button
              onClick={onAddMcpServer}
              variant="outline"
              className={`w-full rounded-2xl border-2 border-dashed h-12 transition-all hover:scale-[1.02] ${
                isDarkMode 
                  ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/30 text-gray-400 hover:text-gray-300' 
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50/50 text-gray-600 hover:text-gray-700'
              }`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add MCP Server
            </Button>

            {/* Server List */}
            <div className="space-y-3">
              <AnimatePresence>
                {mcpServers.map((server, index) => (
                  <motion.div
                    key={`${server.name}-${server.command}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-2xl border transition-all hover:scale-[1.01] ${
                      server.enabled
                        ? isDarkMode 
                          ? 'bg-green-900/20 border-green-800/50 shadow-lg shadow-green-900/10' 
                          : 'bg-green-50/50 border-green-200/50 shadow-lg shadow-green-500/10'
                        : isDarkMode 
                          ? 'bg-gray-900/50 border-gray-800/50' 
                          : 'bg-gray-50/50 border-gray-200/50'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Server Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`p-2 rounded-xl ${
                            server.enabled 
                              ? isDarkMode 
                                ? 'bg-green-500/20' 
                                : 'bg-green-100'
                              : isDarkMode 
                                ? 'bg-gray-700/50' 
                                : 'bg-gray-200/50'
                          }`}>
                            {getConnectionTypeIcon(server.type || 'stdio')}
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={server.name}
                              onChange={(e) => onUpdateMcpServer(index, { name: e.target.value })}
                              className={`text-sm font-medium bg-transparent border-none outline-none w-full ${
                                isDarkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                              }`}
                              placeholder="Server name (e.g., File System)"
                            />
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                server.enabled
                                  ? isDarkMode 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-green-100 text-green-700'
                                  : isDarkMode 
                                    ? 'bg-gray-700/50 text-gray-500' 
                                    : 'bg-gray-200/50 text-gray-600'
                              }`}>
                                {server.type || 'stdio'}
                              </span>
                              {server.enabled && (
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                  <span className={`text-xs ${
                                    isDarkMode ? 'text-green-400' : 'text-green-600'
                                  }`}>
                                    Active
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={server.enabled}
                            onCheckedChange={(enabled) => onUpdateMcpServer(index, { enabled })}
                            className="data-[state=checked]:bg-green-600"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedServer(expandedServer === index ? null : index)}
                            className={`rounded-xl ${
                              isDarkMode 
                                ? 'hover:bg-gray-800/50 text-gray-400' 
                                : 'hover:bg-gray-100/50 text-gray-600'
                            }`}
                          >
                            {expandedServer === index ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            onClick={() => onRemoveMcpServer(index)}
                            variant="ghost"
                            size="sm"
                            className={`rounded-xl hover:scale-105 transition-all ${
                              isDarkMode 
                                ? 'hover:bg-red-900/20 text-red-400 hover:text-red-300' 
                                : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                            }`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Configuration */}
                      <AnimatePresence>
                        {expandedServer === index && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 pt-3 border-t border-current/10"
                          >
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className={`text-xs font-medium mb-1 block ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  Connection Type
                                </label>
                                <select
                                  value={server.type || 'stdio'}
                                  onChange={(e) => onUpdateMcpServer(index, { type: e.target.value as 'stdio' | 'sse' | 'http' })}
                                  className={`w-full px-3 py-2 text-sm rounded-xl border transition-all ${
                                    isDarkMode 
                                      ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' 
                                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                                  } focus:ring-2 focus:ring-blue-500/20`}
                                >
                                  <option value="stdio">stdio</option>
                                  <option value="sse">sse</option>
                                  <option value="http">http</option>
                                </select>
                              </div>
                              
                              {server.type === 'http' && (
                                <div>
                                  <label className={`text-xs font-medium mb-1 block ${
                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                  }`}>
                                    URL
                                  </label>
                                  <input
                                    type="url"
                                    value={server.url || ''}
                                    onChange={(e) => {
                                      const url = e.target.value;
                                      onUpdateMcpServer(index, { url });
                                    }}
                                    className={`w-full px-3 py-2 text-sm rounded-xl border transition-all ${
                                      isDarkMode 
                                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                                    } focus:ring-2 focus:ring-blue-500/20`}
                                    placeholder="https://localhost:3000"
                                    title="Enter a valid HTTP/HTTPS URL"
                                  />
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <label className={`text-xs font-medium mb-1 block ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                Command/Executable
                              </label>
                              <input
                                type="text"
                                value={server.command}
                                onChange={(e) => {
                                  const sanitized = sanitizeMcpCommand(e.target.value);
                                  onUpdateMcpServer(index, { command: sanitized });
                                }}
                                className={`w-full px-3 py-2 text-sm rounded-xl border transition-all font-mono ${
                                  isDarkMode 
                                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                                } focus:ring-2 focus:ring-blue-500/20`}
                                placeholder="npx @modelcontextprotocol/server-filesystem /path/to/allowed"
                                title="Only safe commands allowed. Dangerous characters will be removed."
                              />
                            </div>

                            {/* Validation Status */}
                            {(() => {
                              if (!server.name || !server.command) {
                                return (
                                  <div className={`flex items-center gap-2 p-2 rounded-xl ${themeClasses.warningBackground(isDarkMode)}`}>
                                    <AlertCircle className="h-3 w-3" />
                                    <span className="text-xs">Name and command required</span>
                                  </div>
                                );
                              }

                              const commandValidation = validateMcpCommand(server.command);
                              const urlValidation = server.type === 'http' && server.url ? validateMcpUrl(server.url) : { isValid: true };

                              if (commandValidation.isValid && urlValidation.isValid) {
                                return (
                                  <div className={`flex items-center gap-2 p-2 rounded-xl ${themeClasses.successBackground(isDarkMode)}`}>
                                    <Check className="h-3 w-3" />
                                    <span className="text-xs">Configuration complete</span>
                                  </div>
                                );
                              }

                              const error = commandValidation.error || urlValidation.error;
                              return (
                                <div className={`flex items-center gap-2 p-2 rounded-xl ${themeClasses.errorBackground(isDarkMode)}`}>
                                  <AlertCircle className="h-3 w-3" />
                                  <span className="text-xs">{error}</span>
                                </div>
                              );
                            })()}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {mcpServers.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-center py-8 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                <Server className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No MCP servers configured</p>
                <p className="text-xs mt-1">Add a server to extend Claude's capabilities</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className={`border-t px-6 py-4 ${
        isDarkMode ? 'border-gray-800/50' : 'border-gray-200/50'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            {mcpServers.filter(s => s.enabled).length} active server{mcpServers.filter(s => s.enabled).length !== 1 ? 's' : ''}
          </span>
          <span className={`text-xs ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Changes saved automatically
          </span>
        </div>
      </div>
    </motion.div>
  );
}