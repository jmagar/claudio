'use client';

import { useEffect, useState, useCallback } from 'react';
import { mcpHealthMonitor, type McpServerHealth } from '@/lib/mcp-health-monitor';
import type { McpServer } from '@/types';

export function useMcpHealth(servers: McpServer[]) {
  const [healthMap, setHealthMap] = useState<Map<string, McpServerHealth>>(new Map());
  const [isMonitoring, setIsMonitoring] = useState(false);

  const startMonitoring = useCallback(() => {
    if (isMonitoring) {
      return;
    }

    servers.forEach(server => {
      if (server.enabled) {
        mcpHealthMonitor.startMonitoring(server);
      }
    });

    setIsMonitoring(true);
  }, [servers, isMonitoring]);

  const stopMonitoring = useCallback(() => {
    mcpHealthMonitor.stopAllMonitoring();
    setIsMonitoring(false);
  }, []);

  const recoverServer = useCallback(async (server: McpServer): Promise<boolean> => {
    return mcpHealthMonitor.recoverServer(server);
  }, []);

  const getServerHealth = useCallback((server: McpServer): McpServerHealth | undefined => {
    const serverId = [
      server.name || 'unnamed',
      server.type || 'stdio',
      server.command || 'no-command'
    ].map(part => part.replace(/[^a-zA-Z0-9]/g, '-')).join('-');
    return healthMap.get(serverId);
  }, [healthMap]);

  const getHealthSummary = useCallback(() => {
    const summary = {
      total: healthMap.size,
      healthy: 0,
      unhealthy: 0,
      checking: 0,
      unknown: 0,
    };

    healthMap.forEach(health => {
      summary[health.status]++;
    });

    return summary;
  }, [healthMap]);

  useEffect(() => {
    const unsubscribe = mcpHealthMonitor.subscribe((newHealthMap) => {
      setHealthMap(newHealthMap);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isMonitoring) return;
    
    mcpHealthMonitor.stopAllMonitoring();
    
    servers.forEach(server => {
      if (server.enabled) {
        mcpHealthMonitor.startMonitoring(server);
      }
    });
  }, [servers, isMonitoring]);

  useEffect(() => {
    return () => {
      if (isMonitoring) {
        mcpHealthMonitor.stopAllMonitoring();
      }
    };
  }, [isMonitoring]);

  return {
    healthMap,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    recoverServer,
    getServerHealth,
    getHealthSummary,
  };
}