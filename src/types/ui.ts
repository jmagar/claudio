/**
 * UI component related types
 */

import { ConversationMessage } from './chat';

// Component prop interfaces
export interface ChatMessagesProps {
  messages: ConversationMessage[];
  loading: boolean;
  error: string | null;
  retryAttempt: number;
  isRetrying: boolean;
  editingMessageId: string | null;
  isDarkMode: boolean;
  onCopyToClipboard: (content: string) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onRestartFromMessage: (messageId: string) => void;
  onSetEditingMessageId: (id: string | null) => void;
}

// Theme types
export interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  border: string;
  input: string;
  ring: string;
  destructive: string;
  warning: string;
  success: string;
}

export interface ThemeConfig {
  name: string;
  colors: ThemeColors;
  isDark: boolean;
}

// Error boundary types
export interface ErrorInfo {
  componentStack: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}