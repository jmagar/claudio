'use client';

import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from './button';
import type { McpServerHealth } from '@/lib/mcp-health-monitor';

interface HealthIndicatorProps {
  health?: McpServerHealth;
  isDarkMode: boolean;
  showDetails?: boolean;
  onRecover?: () => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Displays a visual indicator of server health status with optional details and recovery action.
 *
 * Renders an icon and, if enabled, detailed information about the server's health, including status, response time, uptime, error messages, and a recovery button when applicable. Adapts appearance based on dark mode and size preferences.
 */
export function HealthIndicator({ 
  health, 
  isDarkMode, 
  showDetails = false, 
  onRecover,
  size = 'md',
}: HealthIndicatorProps) {
  if (!health) {
    return (
      <div className={`flex items-center gap-2 ${getContainerClasses(size)}`}>
        <HelpCircle className={`${getIconClasses(size)} ${
          isDarkMode ? 'text-gray-500' : 'text-gray-400'
        }`} />
        {showDetails && (
          <span className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            No health data
          </span>
        )}
      </div>
    );
  }

  const { status, responseTime, lastError, consecutiveErrors, uptime } = health;

  const getStatusIcon = () => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className={`${getIconClasses(size)} text-green-500`} />;
      case 'unhealthy':
        return <XCircle className={`${getIconClasses(size)} text-red-500`} />;
      case 'checking':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <RefreshCw className={`${getIconClasses(size)} ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`} />
          </motion.div>
        );
      case 'unknown':
      default:
        return <Clock className={`${getIconClasses(size)} ${
          isDarkMode ? 'text-gray-500' : 'text-gray-400'
        }`} />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'healthy':
        return 'Healthy';
      case 'unhealthy':
        return 'Unhealthy';
      case 'checking':
        return 'Checking...';
      case 'unknown':
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'unhealthy':
        return 'text-red-600';
      case 'checking':
        return isDarkMode ? 'text-blue-400' : 'text-blue-600';
      case 'unknown':
      default:
        return isDarkMode ? 'text-gray-400' : 'text-gray-600';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${getContainerClasses(size)}`}>
      {getStatusIcon()}
      
      {showDetails && (
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </div>
          
          {status === 'healthy' && responseTime && (
            <div className={`text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {responseTime}ms • Uptime: {formatUptime(uptime)}
            </div>
          )}
          
          {status === 'unhealthy' && (
            <div className="space-y-1">
              {lastError && (
                <div className="text-xs text-red-500 truncate">
                  {lastError}
                </div>
              )}
              <div className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {consecutiveErrors} consecutive errors
              </div>
            </div>
          )}
          
          {status === 'checking' && (
            <div className={`text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Running health check...
            </div>
          )}
        </div>
      )}
      
      {status === 'unhealthy' && onRecover && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRecover}
          className={`ml-2 h-6 px-2 text-xs ${
            isDarkMode 
              ? 'hover:bg-blue-900/30 text-blue-400' 
              : 'hover:bg-blue-50 text-blue-600'
          }`}
        >
          Recover
        </Button>
      )}
    </div>
  );
}

/**
 * Returns the appropriate padding class for the container based on the specified size.
 *
 * @param size - The size variant, one of 'sm', 'md', or 'lg'
 * @returns The corresponding Tailwind CSS padding class for the given size
 */
function getContainerClasses(size: string): string {
  switch (size) {
    case 'sm':
      return 'p-1';
    case 'lg':
      return 'p-3';
    case 'md':
    default:
      return 'p-2';
  }
}

/**
 * Returns the appropriate icon size classes based on the specified size.
 *
 * @param size - The size variant, one of 'sm', 'md', or 'lg'
 * @returns A string of Tailwind CSS classes for icon height and width
 */
function getIconClasses(size: string): string {
  switch (size) {
    case 'sm':
      return 'h-3 w-3';
    case 'lg':
      return 'h-5 w-5';
    case 'md':
    default:
      return 'h-4 w-4';
  }
}

/**
 * Converts an uptime value in milliseconds to a human-readable string in hours, minutes, and seconds.
 *
 * @param uptime - The uptime duration in milliseconds.
 * @returns The formatted uptime string, such as "2h 15m", "5m 30s", or "45s".
 */
function formatUptime(uptime: number): string {
  const seconds = Math.floor(uptime / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}