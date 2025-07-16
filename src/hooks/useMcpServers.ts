import { useState, useCallback, useMemo } from 'react';
import { generateServerId } from '@/lib/id-utils';
import { type McpServerConfig } from '@anthropic-ai/claude-code';

export interface McpServer {
  name: string;
  command: string;
  args?: string[];
  type?: 'stdio' | 'sse' | 'http';
  url?: string;
  enabled: boolean;
}

/**
 * Validates an MCP server object and returns a configuration suitable for runtime use.
 *
 * Ensures required fields are present and correctly typed, trims string values, filters valid arguments, and includes the URL for 'sse' or 'http' server types if provided.
 *
 * @param server - The MCP server object to validate and convert
 * @returns The validated and normalized server configuration object
 * @throws If required fields (`name` or `command`) are missing or invalid
 */
function validateMcpServerConfig(server: McpServer): any {
  // Validate required fields
  if (!server.name || typeof server.name !== 'string') {
    throw new Error(`Invalid MCP server name: ${server.name}`);
  }
  
  if (!server.command || typeof server.command !== 'string') {
    throw new Error(`Invalid MCP server command for ${server.name}: ${server.command}`);
  }
  
  // Create base configuration
  const config: any = {
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

/**
 * React hook for managing a list of MCP (Multi-Channel Processing) server configurations with validation.
 *
 * Provides state and functions to add, update, and remove MCP servers, as well as retrieve a record of enabled and validated server configurations.
 *
 * @returns An object containing the current list of MCP servers, and functions to add, update, remove, and get enabled servers.
 */
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
    const servers: Record<string, any> = {};
    
    mcpServers
      .filter(server => server.enabled)
      .forEach(server => {
        try {
          const validatedConfig = validateMcpServerConfig(server);
          servers[server.name] = validatedConfig;
        } catch (error) {
          console.error(`Invalid MCP server configuration for ${server.name}:`, error);
          // Skip invalid servers rather than crashing the entire application
        }
      });
    
    return servers;
  }, [mcpServers]);

  const getEnabledServers = useCallback((): Record<string, any> => enabledServers, [enabledServers]);

  return {
    mcpServers,
    addMcpServer,
    updateMcpServer,
    removeMcpServer,
    getEnabledServers,
  };
}