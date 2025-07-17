/**
 * Error Boundary Component for Message Parsing
 * Provides graceful error handling for message parsing failures
 */

import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class MessageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Message parsing error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/30 dark:bg-amber-900/20 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Message rendering error</p>
            <p className="text-sm opacity-75">
              There was an issue displaying this message. The content may contain invalid formatting.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary for functional components
 */
interface ErrorBoundaryProviderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ErrorBoundaryProvider({ children, fallback }: ErrorBoundaryProviderProps) {
  return (
    <MessageErrorBoundary fallback={fallback}>
      {children}
    </MessageErrorBoundary>
  );
}