import { useState, useCallback, useMemo } from 'react';
import { generateServerId } from '@/lib/id-utils';

export interface McpServer {
  name: string;
  command: string;
  args?: string[];
  type?: 'stdio' | 'sse' | 'http';
  url?: string;
  enabled: boolean;
}

export function useMcpServers() {
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);

  const addMcpServer = useCallback(() => {
    const newServer: McpServer = {
      name: generateServerId(),
      command: '',
      args: [],
      type: 'stdio',
      enabled: false,
    };
    setMcpServers(prev => [...prev, newServer]);
  }, []);

  const updateMcpServer = useCallback((index: number, updates: Partial<McpServer>) => {
    setMcpServers(prev => prev.map((server, i) => 
      i === index ? { ...server, ...updates } : server,
    ));
  }, []);

  const removeMcpServer = useCallback((index: number) => {
    setMcpServers(prev => prev.filter((_, i) => i !== index));
  }, []);

  const enabledServers = useMemo(() => {
    return mcpServers
      .filter(server => server.enabled)
      .reduce((acc, server) => {
        acc[server.name] = {
          command: server.command,
          args: server.args,
          type: server.type || 'stdio',
          url: server.url,
        };
        return acc;
      }, {} as Record<string, unknown>);
  }, [mcpServers]);

  const getEnabledServers = useCallback(() => enabledServers, [enabledServers]);

  return {
    mcpServers,
    addMcpServer,
    updateMcpServer,
    removeMcpServer,
    getEnabledServers,
  };
}