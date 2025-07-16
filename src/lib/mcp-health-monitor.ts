'use client';

import type { McpServer } from '@/types';

export interface McpServerHealth {
  id: string;
  status: 'healthy' | 'unhealthy' | 'checking' | 'unknown';
  lastCheck: Date;
  responseTime?: number;
  errorCount: number;
  consecutiveErrors: number;
  lastError?: string;
  uptime: number;
}

export interface HealthCheckConfig {
  interval: number;
  timeout: number;
  maxRetries: number;
  unhealthyThreshold: number;
}

const DEFAULT_CONFIG: HealthCheckConfig = {
  interval: 30000,
  timeout: 5000,
  maxRetries: 3,
  unhealthyThreshold: 3,
};

export class McpHealthMonitor {
  private healthMap = new Map<string, McpServerHealth>();
  private checkIntervals = new Map<string, NodeJS.Timeout>();
  private config: HealthCheckConfig;
  private subscribers = new Set<(health: Map<string, McpServerHealth>) => void>();

  constructor(config: Partial<HealthCheckConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  subscribe(callback: (health: Map<string, McpServerHealth>) => void): () => void {
    this.subscribers.add(callback);
    callback(new Map(this.healthMap));
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(): void {
    const healthCopy = new Map(this.healthMap);
    this.subscribers.forEach(callback => callback(healthCopy));
  }

  startMonitoring(server: McpServer): void {
    const serverId = this.getServerId(server);
    
    if (this.checkIntervals.has(serverId)) {
      this.stopMonitoring(serverId);
    }

    this.healthMap.set(serverId, {
      id: serverId,
      status: 'unknown',
      lastCheck: new Date(),
      errorCount: 0,
      consecutiveErrors: 0,
      uptime: 0,
    });

    this.performHealthCheck(server);

    const interval = setInterval(() => {
      this.performHealthCheck(server);
    }, this.config.interval);

    this.checkIntervals.set(serverId, interval);
    this.notifySubscribers();
  }

  stopMonitoring(serverId: string): void {
    const interval = this.checkIntervals.get(serverId);
    if (interval) {
      clearInterval(interval);
      this.checkIntervals.delete(serverId);
    }
    this.healthMap.delete(serverId);
    this.notifySubscribers();
  }

  stopAllMonitoring(): void {
    this.checkIntervals.forEach((interval, serverId) => {
      clearInterval(interval);
    });
    this.checkIntervals.clear();
    this.healthMap.clear();
    this.notifySubscribers();
  }

  getHealth(serverId: string): McpServerHealth | undefined {
    return this.healthMap.get(serverId);
  }

  getAllHealth(): Map<string, McpServerHealth> {
    return new Map(this.healthMap);
  }

  private getServerId(server: McpServer): string {
    return `${server.name || 'unnamed'}-${server.type || 'stdio'}-${server.command || 'no-command'}`.replace(/[^a-zA-Z0-9-]/g, '-');
  }

  private async performHealthCheck(server: McpServer): Promise<void> {
    const serverId = this.getServerId(server);
    const health = this.healthMap.get(serverId);
    
    if (!health) {
      return;
    }

    health.status = 'checking';
    health.lastCheck = new Date();
    this.notifySubscribers();

    const startTime = Date.now();
    let isHealthy = false;
    let error: string | undefined;

    try {
      switch (server.type) {
        case 'http':
        case 'sse':
          isHealthy = await this.checkHttpServer(server);
          break;
        case 'stdio':
        default:
          isHealthy = await this.checkStdioServer(server);
          break;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      isHealthy = false;
    }

    const responseTime = Date.now() - startTime;

    health.responseTime = responseTime;
    health.lastCheck = new Date();

    if (isHealthy) {
      health.status = 'healthy';
      health.consecutiveErrors = 0;
      health.uptime += this.config.interval;
    } else {
      health.errorCount++;
      health.consecutiveErrors++;
      health.lastError = error;
      health.uptime = 0;

      if (health.consecutiveErrors >= this.config.unhealthyThreshold) {
        health.status = 'unhealthy';
      } else {
        health.status = 'healthy';
      }
    }

    this.notifySubscribers();
  }

  private async checkHttpServer(server: McpServer): Promise<boolean> {
    if (!server.url) {
      throw new Error('HTTP server requires URL');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${server.url}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Health check timed out');
      }
      throw err;
    }
  }

  private async checkStdioServer(server: McpServer): Promise<boolean> {
    if (!server.command) {
      throw new Error('STDIO server requires command');
    }

    try {
      await fetch('/api/claude-code/validate-mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          server: {
            name: server.name,
            command: server.command,
            args: server.args,
            type: server.type,
          },
        }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      return true;
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        throw new Error('MCP server validation timed out');
      }
      throw err;
    }
  }

  async recoverServer(server: McpServer): Promise<boolean> {
    const serverId = this.getServerId(server);
    const health = this.healthMap.get(serverId);
    
    if (!health || health.status !== 'unhealthy') {
      return false;
    }

    health.status = 'checking';
    this.notifySubscribers();

    let retryCount = 0;
    while (retryCount < this.config.maxRetries) {
      try {
        await this.performHealthCheck(server);
        const updatedHealth = this.healthMap.get(serverId);
        
        if (updatedHealth?.status === 'healthy') {
          return true;
        }
      } catch (err) {
        retryCount++;
        if (retryCount < this.config.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }

    return false;
  }
}

export const mcpHealthMonitor = new McpHealthMonitor();