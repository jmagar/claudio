'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  X, 
  Sun, 
  Moon, 
  Plus, 
  Trash2 
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
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className={`w-80 border-l backdrop-blur-xl ${
        isDarkMode 
          ? 'bg-slate-900/90 border-slate-700/50' 
          : 'bg-white/90 border-slate-200/50'
      }`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Settings
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-xl"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Theme
            </label>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <Switch
                checked={isDarkMode}
                onCheckedChange={onToggleDarkMode}
              />
              <Moon className="h-4 w-4" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-sm font-medium ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                MCP Servers
              </label>
              <Button
                onClick={onAddMcpServer}
                size="sm"
                className="rounded-xl"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {mcpServers.map((server, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-xl border ${
                    isDarkMode 
                      ? 'bg-slate-800/50 border-slate-700' 
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="text"
                      value={server.name}
                      onChange={(e) => onUpdateMcpServer(index, { name: e.target.value })}
                      className={`text-sm font-medium bg-transparent border-none outline-none ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}
                      placeholder="Server name"
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={server.enabled}
                        onCheckedChange={(enabled) => onUpdateMcpServer(index, { enabled })}
                      />
                      <Button
                        onClick={() => onRemoveMcpServer(index)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <input
                    type="text"
                    value={server.command}
                    onChange={(e) => onUpdateMcpServer(index, { command: e.target.value })}
                    className={`w-full text-xs bg-transparent border rounded px-2 py-1 ${
                      isDarkMode 
                        ? 'border-slate-600 text-slate-300' 
                        : 'border-slate-300 text-slate-600'
                    }`}
                    placeholder="Command"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}