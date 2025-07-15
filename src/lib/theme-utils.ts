/**
 * Theme utility functions for consistent styling across components
 */

export interface ThemeConfig {
  isDarkMode: boolean;
}

/**
 * Theme-aware class name generators
 */
export const themeClasses = {
  /**
   * Background classes for main containers
   */
  background: (isDarkMode: boolean) =>
    isDarkMode 
      ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-black' 
      : 'bg-gradient-to-br from-gray-50 via-white to-gray-100',

  /**
   * Header/navigation background
   */
  headerBackground: (isDarkMode: boolean) =>
    isDarkMode 
      ? 'bg-gray-950/90 border-gray-800/50 shadow-lg' 
      : 'bg-white/90 border-gray-200/50 shadow-sm',

  /**
   * Sidebar background
   */
  sidebarBackground: (isDarkMode: boolean) =>
    isDarkMode 
      ? 'bg-gray-950/95 border-gray-800/50 shadow-2xl' 
      : 'bg-white/95 border-gray-200/50 shadow-xl',

  /**
   * Card/panel background
   */
  cardBackground: (isDarkMode: boolean) =>
    isDarkMode 
      ? 'bg-gray-900/70 border-gray-800/50 shadow-lg shadow-black/10' 
      : 'bg-white border-gray-200 shadow-sm',

  /**
   * Input background
   */
  inputBackground: (isDarkMode: boolean) =>
    isDarkMode 
      ? 'bg-gray-900/60 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 shadow-inner' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500',

  /**
   * Text colors for primary content
   */
  textPrimary: (isDarkMode: boolean) =>
    isDarkMode ? 'text-white' : 'text-gray-900',

  /**
   * Text colors for secondary content
   */
  textSecondary: (isDarkMode: boolean) =>
    isDarkMode ? 'text-gray-400' : 'text-gray-600',

  /**
   * Text colors for muted content
   */
  textMuted: (isDarkMode: boolean) =>
    isDarkMode ? 'text-gray-500' : 'text-gray-400',

  /**
   * Hover states for interactive elements
   */
  hoverInteractive: (isDarkMode: boolean) =>
    isDarkMode 
      ? 'hover:bg-gray-800/50 text-gray-400 hover:text-gray-300' 
      : 'hover:bg-gray-100/50 text-gray-600 hover:text-gray-700',

  /**
   * Error states
   */
  errorBackground: (isDarkMode: boolean) =>
    isDarkMode 
      ? 'bg-red-900/20 border-red-800/50 text-red-300' 
      : 'bg-red-50 border-red-200 text-red-700',

  /**
   * Success states
   */
  successBackground: (isDarkMode: boolean) =>
    isDarkMode 
      ? 'bg-green-900/20 border-green-800/50 text-green-400' 
      : 'bg-green-50 border-green-200 text-green-700',

  /**
   * Warning states
   */
  warningBackground: (isDarkMode: boolean) =>
    isDarkMode 
      ? 'bg-amber-900/20 border-amber-800/50 text-amber-400' 
      : 'bg-amber-50 border-amber-200 text-amber-700',
};

/**
 * Get consistent focus ring classes
 */
export function getFocusRing(isDarkMode: boolean): string {
  return 'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';
}

/**
 * Get consistent button classes based on variant and theme
 */
export function getButtonClasses(
  variant: 'primary' | 'secondary' | 'ghost' | 'danger',
  isDarkMode: boolean,
  size: 'sm' | 'md' | 'lg' = 'md'
): string {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  const baseClasses = `rounded-xl transition-all hover:scale-105 ${sizeClasses[size]}`;

  switch (variant) {
    case 'primary':
      return `${baseClasses} bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-blue-500/25`;
    
    case 'secondary':
      return `${baseClasses} ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' 
          : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
      } border`;
    
    case 'ghost':
      return `${baseClasses} ${themeClasses.hoverInteractive(isDarkMode)}`;
    
    case 'danger':
      return `${baseClasses} ${
        isDarkMode 
          ? 'hover:bg-red-900/20 text-red-400 hover:text-red-300' 
          : 'hover:bg-red-50 text-red-600 hover:text-red-700'
      }`;
    
    default:
      return baseClasses;
  }
}

/**
 * Theme-aware icon colors
 */
export const iconColors = {
  primary: (isDarkMode: boolean) => isDarkMode ? 'text-blue-400' : 'text-blue-600',
  success: (isDarkMode: boolean) => isDarkMode ? 'text-green-400' : 'text-green-600',
  warning: (isDarkMode: boolean) => isDarkMode ? 'text-amber-400' : 'text-amber-600',
  error: (isDarkMode: boolean) => isDarkMode ? 'text-red-400' : 'text-red-600',
  muted: (isDarkMode: boolean) => isDarkMode ? 'text-gray-500' : 'text-gray-400',
};