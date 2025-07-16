'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Server,
  Info,
  Activity,
  Play,
  Pause,
} from 'lucide-react';
import { McpServerItem } from './McpServerItem';
import { useMcpHealth } from '@/hooks/useMcpHealth';
import type { McpServer } from '@/types';

interface McpServerSettingsProps {
  isDarkMode: boolean;
  mcpServers: McpServer[];
  onAddMcpServer: () => void;
  onUpdateMcpServer: (index: number, updates: Partial<McpServer>) => void;
  onRemoveMcpServer: (index: number) => void;
}

/**
 * Displays and manages the configuration and health monitoring of Model Context Protocol (MCP) servers.
 *
 * Provides UI controls to add, update, and remove MCP servers, toggle health monitoring, and view real-time health status. Includes informational and security notices, and adapts styling for dark or light mode.
 */
export function McpServerSettings({
  isDarkMode,
  mcpServers,
  onAddMcpServer,
  onUpdateMcpServer,
  onRemoveMcpServer,
}: McpServerSettingsProps) {
  const { isMonitoring, startMonitoring, stopMonitoring, getHealthSummary } = useMcpHealth(mcpServers);
  const healthSummary = getHealthSummary();
  return (
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
              ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20' 
              : 'bg-gradient-to-br from-blue-50 to-purple-50'
          }`}>
            <Server className={`h-4 w-4 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
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
              Configure Model Context Protocol servers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            size="sm"
            variant="outline"
            className={`rounded-lg gap-1 ${
              isMonitoring 
                ? 'border-red-600/50 text-red-600 hover:bg-red-50'
                : 'border-green-600/50 text-green-600 hover:bg-green-50'
            }`}
          >
            {isMonitoring ? (
              <>
                <Pause className="h-3 w-3" />
                Stop Monitoring
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                Start Monitoring
              </>
            )}
          </Button>
          <Button
            onClick={onAddMcpServer}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-1"
          >
            <Plus className="h-3 w-3" />
            Add Server
          </Button>
        </div>
      </div>

      {/* Health Summary */}
      {isMonitoring && healthSummary.total > 0 && (
        <div className={`rounded-xl p-4 border ${
          isDarkMode 
            ? 'bg-gray-900/20 border-gray-800/30' 
            : 'bg-gray-50/50 border-gray-200/50'
        }`}>
          <div className="flex items-start gap-3">
            <Activity className={`h-4 w-4 mt-0.5 ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`} />
            <div className="flex-1">
              <p className={`font-medium text-sm ${
                isDarkMode ? 'text-green-300' : 'text-green-800'
              }`}>
                Health Monitoring Active
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <span className={`flex items-center gap-1 ${
                  isDarkMode ? 'text-green-400' : 'text-green-600'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  {healthSummary.healthy} Healthy
                </span>
                {healthSummary.unhealthy > 0 && (
                  <span className={`flex items-center gap-1 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    {healthSummary.unhealthy} Unhealthy
                  </span>
                )}
                {healthSummary.checking > 0 && (
                  <span className={`flex items-center gap-1 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    {healthSummary.checking} Checking
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className={`rounded-xl p-4 border ${
        isDarkMode 
          ? 'bg-blue-900/10 border-blue-800/30' 
          : 'bg-blue-50/50 border-blue-200/50'
      }`}>
        <div className="flex items-start gap-3">
          <Info className={`h-4 w-4 mt-0.5 ${
            isDarkMode ? 'text-blue-400' : 'text-blue-600'
          }`} />
          <div className="text-sm">
            <p className={`font-medium ${
              isDarkMode ? 'text-blue-300' : 'text-blue-800'
            }`}>
              About MCP Servers
            </p>
            <p className={`mt-1 ${
              isDarkMode ? 'text-blue-400/80' : 'text-blue-700/80'
            }`}>
              MCP servers extend Claude's capabilities by providing access to external tools, 
              data sources, and APIs. Only configure servers from trusted sources.
            </p>
          </div>
        </div>
      </div>

      {/* Server List */}
      <div className="space-y-3">
        {mcpServers.length === 0 ? (
          <div className={`text-center py-8 rounded-xl border-2 border-dashed ${
            isDarkMode 
              ? 'border-gray-700/50 text-gray-400' 
              : 'border-gray-300/50 text-gray-500'
          }`}>
            <Server className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No MCP servers configured</p>
            <p className="text-sm mt-1">
              Add your first server to extend Claude's capabilities
            </p>
          </div>
        ) : (
          mcpServers.map((server, index) => (
            <McpServerItem
              key={index}
              server={server}
              index={index}
              isDarkMode={isDarkMode}
              onUpdate={onUpdateMcpServer}
              onRemove={onRemoveMcpServer}
            />
          ))
        )}
      </div>

      {/* Security Warning */}
      {mcpServers.length > 0 && (
        <div className={`rounded-xl p-4 border ${
          isDarkMode 
            ? 'bg-amber-900/10 border-amber-800/30' 
            : 'bg-amber-50/50 border-amber-200/50'
        }`}>
          <div className="flex items-start gap-3">
            <Info className={`h-4 w-4 mt-0.5 ${
              isDarkMode ? 'text-amber-400' : 'text-amber-600'
            }`} />
            <div className="text-sm">
              <p className={`font-medium ${
                isDarkMode ? 'text-amber-300' : 'text-amber-800'
              }`}>
                Security Notice
              </p>
              <p className={`mt-1 ${
                isDarkMode ? 'text-amber-400/80' : 'text-amber-700/80'
              }`}>
                MCP servers run with system permissions. Only use servers from trusted sources 
                and verify commands before enabling.
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}