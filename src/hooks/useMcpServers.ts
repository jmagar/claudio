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

/**
 * Validates and converts McpServer to McpServerConfig
 * Ensures type safety and prevents runtime errors from invalid configurations
 */
function validateMcpServerConfig(server: McpServer): unknown {
  // Validate required fields
  if (!server.name || typeof server.name !== 'string') {
    throw new Error(`Invalid MCP server name: ${server.name}`);
  }
  
  if (!server.command || typeof server.command !== 'string') {
    throw new Error(`Invalid MCP server command for ${server.name}: ${server.command}`);
  }
  
  // Create base configuration
  const config: Record<string, unknown> = {
    command: server.command.trim(),
  };
  
  // Add optional fields based on what's provided
  if (server.args && Array.isArray(server.args)) {
    config.args = server.args.filter(arg => typeof arg === 'string' && arg.trim());
  }
  
  // Handle different server types with their specific configurations
  if (server.type) {
    switch (server.type) {
      case 'stdio':
        // stdio servers don't need additional config
        break;
      case 'sse':
      case 'http':
        if (server.url && typeof server.url === 'string' && server.url.trim()) {
          config.url = server.url.trim();
        }
        break;
    }
  }
  
  return config;
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
    const servers: Record<string, unknown> = {};
    
    mcpServers
      .filter(server => server.enabled)
      .forEach(server => {
        try {
          const validatedConfig = validateMcpServerConfig(server);
          servers[server.name] = validatedConfig;
        } catch {
          // Skip invalid servers rather than crashing the entire application
        }
      });
    
    return servers;
  }, [mcpServers]);

  const getEnabledServers = useCallback((): Record<string, unknown> => enabledServers, [enabledServers]);

  return {
    mcpServers,
    addMcpServer,
    updateMcpServer,
    removeMcpServer,
    getEnabledServers,
  };
}