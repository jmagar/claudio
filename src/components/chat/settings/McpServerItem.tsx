'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { 
  Trash2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Zap,
  Globe,
  Terminal,
} from 'lucide-react';
import { validateMcpCommand, validateMcpUrl, sanitizeMcpCommand } from '@/lib/message-utils';
import { HealthIndicator } from '@/components/ui/health-indicator';
import { useMcpHealth } from '@/hooks/useMcpHealth';
import type { McpServer } from '@/types';

interface McpServerItemProps {
  server: McpServer;
  index: number;
  isDarkMode: boolean;
  onUpdate: (index: number, updates: Partial<McpServer>) => void;
  onRemove: (index: number) => void;
}

export function McpServerItem({ 
  server, 
  index, 
  isDarkMode, 
  onUpdate, 
  onRemove,
}: McpServerItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [commandValidation, setCommandValidation] = useState<{ isValid: boolean; error?: string }>({ isValid: true });
  const [urlValidation, setUrlValidation] = useState<{ isValid: boolean; error?: string }>({ isValid: true });
  
  const { getServerHealth, recoverServer } = useMcpHealth([server]);
  const health = getServerHealth(server);

  const handleCommandChange = (command: string) => {
    const sanitized = sanitizeMcpCommand(command);
    const validation = validateMcpCommand(sanitized);
    setCommandValidation(validation);
    onUpdate(index, { command: sanitized });
  };

  const handleUrlChange = (url: string) => {
    const validation = validateMcpUrl(url);
    setUrlValidation(validation);
    onUpdate(index, { url });
  };

  const getServerTypeIcon = (type?: string) => {
    switch (type) {
      case 'stdio': return <Terminal className="h-4 w-4" />;
      case 'sse': return <Zap className="h-4 w-4" />;
      case 'http': return <Globe className="h-4 w-4" />;
      default: return <Terminal className="h-4 w-4" />;
    }
  };

  const getServerTypeColor = (type?: string) => {
    switch (type) {
      case 'stdio': return isDarkMode ? 'text-green-400' : 'text-green-600';
      case 'sse': return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
      case 'http': return isDarkMode ? 'text-blue-400' : 'text-blue-600';
      default: return isDarkMode ? 'text-green-400' : 'text-green-600';
    }
  };

  return (
    <div className={`rounded-xl border p-4 ${
      isDarkMode 
        ? 'bg-gray-900/30 border-gray-800/50' 
        : 'bg-white/50 border-gray-200/50'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 h-6 w-6"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
          
          <div className={`p-2 rounded-lg ${
            isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100/50'
          }`}>
            <div className={getServerTypeColor(server.type)}>
              {getServerTypeIcon(server.type)}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className={`font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {server.name || 'Unnamed Server'}
              </p>
              {server.enabled && (
                <div className={`w-2 h-2 rounded-full ${
                  isDarkMode ? 'bg-green-400' : 'bg-green-500'
                }`} />
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {server.type || 'stdio'} • {server.command || 'No command'}
              </p>
              {server.enabled && (
                <HealthIndicator 
                  health={health} 
                  isDarkMode={isDarkMode}
                  size="sm"
                  onRecover={async () => {
                    await recoverServer(server);
                  }}
                />
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch
            checked={server.enabled}
            onCheckedChange={(enabled) => onUpdate(index, { enabled })}
            className="data-[state=checked]:bg-blue-600"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className={`p-2 h-8 w-8 rounded-lg hover:scale-105 transition-all ${
              isDarkMode 
                ? 'hover:bg-red-900/30 text-red-400 hover:text-red-300' 
                : 'hover:bg-red-50 text-red-600 hover:text-red-700'
            }`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200/20 space-y-4">
          {/* Server Name */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Server Name
            </label>
            <Input
              value={server.name}
              onChange={(e) => onUpdate(index, { name: e.target.value })}
              placeholder="Enter server name"
              className={`rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700/50 text-white' 
                  : 'bg-white/50 border-gray-300/50'
              }`}
            />
          </div>

          {/* Server Type */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Connection Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['stdio', 'sse', 'http'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => onUpdate(index, { type })}
                  className={`p-3 rounded-lg border transition-all text-sm font-medium ${
                    server.type === type
                      ? isDarkMode
                        ? 'bg-blue-900/30 border-blue-600/50 text-blue-300'
                        : 'bg-blue-50 border-blue-300 text-blue-700'
                      : isDarkMode
                        ? 'bg-gray-800/30 border-gray-700/50 text-gray-400 hover:bg-gray-700/30'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={getServerTypeColor(type)}>
                      {getServerTypeIcon(type)}
                    </div>
                    {type.toUpperCase()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Command */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Command
            </label>
            <Input
              value={server.command}
              onChange={(e) => handleCommandChange(e.target.value)}
              placeholder="npx @modelcontextprotocol/server-example"
              className={`rounded-lg font-mono ${
                !commandValidation.isValid
                  ? 'border-red-500 focus:border-red-500'
                  : isDarkMode 
                    ? 'bg-gray-800/50 border-gray-700/50 text-white' 
                    : 'bg-white/50 border-gray-300/50'
              }`}
            />
            {!commandValidation.isValid && (
              <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                {commandValidation.error}
              </div>
            )}
          </div>

          {/* URL (for SSE/HTTP) */}
          {(server.type === 'sse' || server.type === 'http') && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Server URL
              </label>
              <Input
                value={server.url || ''}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="http://localhost:3000"
                className={`rounded-lg ${
                  !urlValidation.isValid
                    ? 'border-red-500 focus:border-red-500'
                    : isDarkMode 
                      ? 'bg-gray-800/50 border-gray-700/50 text-white' 
                      : 'bg-white/50 border-gray-300/50'
                }`}
              />
              {!urlValidation.isValid && (
                <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {urlValidation.error}
                </div>
              )}
            </div>
          )}

          {/* Arguments */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Arguments (one per line)
            </label>
            <textarea
              value={server.args?.join('\n') || ''}
              onChange={(e) => onUpdate(index, { 
                args: e.target.value.split('\n').filter(arg => arg.trim()), 
              })}
              placeholder="--port 3000\n--verbose"
              rows={3}
              className={`w-full rounded-lg border font-mono text-sm resize-none ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700/50 text-white' 
                  : 'bg-white/50 border-gray-300/50'
              }`}
            />
          </div>

          {/* Health Status */}
          {server.enabled && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Health Status
              </label>
              <div className={`rounded-lg border p-3 ${
                isDarkMode 
                  ? 'bg-gray-800/30 border-gray-700/50' 
                  : 'bg-gray-50/50 border-gray-200/50'
              }`}>
                <HealthIndicator 
                  health={health} 
                  isDarkMode={isDarkMode}
                  showDetails={true}
                  size="md"
                  onRecover={async () => {
                    await recoverServer(server);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}