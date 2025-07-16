/**
 * Comprehensive theme management utilities
 */

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  theme: Theme;
  systemPreference: 'light' | 'dark';
  effectiveTheme: 'light' | 'dark';
}

export interface ThemeStorage {
  getTheme(): Theme;
  setTheme(theme: Theme): void;
  getSystemPreference(): 'light' | 'dark';
  getEffectiveTheme(): 'light' | 'dark';
}

/**
 * Local storage theme manager
 */
export class LocalStorageThemeManager implements ThemeStorage {
  private readonly storageKey = 'claude-code-theme';
  private mediaQuery: MediaQueryList | null = null;
  private listeners: Set<(theme: ThemeConfig) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', this.handleSystemThemeChange.bind(this));
    }
  }

  private handleSystemThemeChange = () => {
    const config = this.getThemeConfig();
    this.notifyListeners(config);
  };

  private notifyListeners(config: ThemeConfig) {
    this.listeners.forEach(listener => listener(config));
  }

  getTheme(): Theme {
    if (typeof window === 'undefined') {
      return 'system';
    }
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored as Theme;
      }
    } catch (error) {
    }
    return 'system';
  }

  setTheme(theme: Theme): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      localStorage.setItem(this.storageKey, theme);
      const config = this.getThemeConfig();
      this.notifyListeners(config);
    } catch (error) {
    }
  }

  getSystemPreference(): 'light' | 'dark' {
    if (typeof window === 'undefined' || !this.mediaQuery) {
      return 'light';
    }
    return this.mediaQuery.matches ? 'dark' : 'light';
  }

  getEffectiveTheme(): 'light' | 'dark' {
    const theme = this.getTheme();
    if (theme === 'system') {
      return this.getSystemPreference();
    }
    return theme;
  }

  getThemeConfig(): ThemeConfig {
    const theme = this.getTheme();
    const systemPreference = this.getSystemPreference();
    const effectiveTheme = this.getEffectiveTheme();

    return {
      theme,
      systemPreference,
      effectiveTheme,
    };
  }

  subscribe(listener: (config: ThemeConfig) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  destroy() {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.handleSystemThemeChange);
    }
    this.listeners.clear();
  }
}

/**
 * Theme utilities for CSS classes and styling
 */
export class ThemeStyler {
  private isDarkMode: boolean;

  constructor(isDarkMode: boolean) {
    this.isDarkMode = isDarkMode;
  }

  // Background utilities
  get background() {
    return this.isDarkMode 
      ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-black' 
      : 'bg-gradient-to-br from-gray-50 via-white to-gray-100';
  }

  get headerBackground() {
    return this.isDarkMode 
      ? 'bg-gray-950/90 border-gray-800/50 shadow-lg' 
      : 'bg-white/90 border-gray-200/50 shadow-sm';
  }

  get sidebarBackground() {
    return this.isDarkMode 
      ? 'bg-gray-950/95 border-gray-800/50 shadow-2xl' 
      : 'bg-white/95 border-gray-200/50 shadow-xl';
  }

  get cardBackground() {
    return this.isDarkMode 
      ? 'bg-gray-900/70 border-gray-800/50 shadow-lg shadow-black/10' 
      : 'bg-white border-gray-200 shadow-sm';
  }

  get inputBackground() {
    return this.isDarkMode 
      ? 'bg-gray-900/60 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 shadow-inner' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500';
  }

  // Text utilities
  get textPrimary() {
    return this.isDarkMode ? 'text-white' : 'text-gray-900';
  }

  get textSecondary() {
    return this.isDarkMode ? 'text-gray-400' : 'text-gray-600';
  }

  get textMuted() {
    return this.isDarkMode ? 'text-gray-500' : 'text-gray-400';
  }

  // Interactive utilities
  get hoverInteractive() {
    return this.isDarkMode 
      ? 'hover:bg-gray-800/50 text-gray-400 hover:text-gray-300' 
      : 'hover:bg-gray-100/50 text-gray-600 hover:text-gray-700';
  }

  // State utilities
  get errorBackground() {
    return this.isDarkMode 
      ? 'bg-red-900/20 border-red-800/50 text-red-300' 
      : 'bg-red-50 border-red-200 text-red-700';
  }

  get successBackground() {
    return this.isDarkMode 
      ? 'bg-green-900/20 border-green-800/50 text-green-400' 
      : 'bg-green-50 border-green-200 text-green-700';
  }

  get warningBackground() {
    return this.isDarkMode 
      ? 'bg-amber-900/20 border-amber-800/50 text-amber-400' 
      : 'bg-amber-50 border-amber-200 text-amber-700';
  }

  // Button utilities
  getButtonClasses(variant: 'primary' | 'secondary' | 'ghost' | 'danger', size: 'sm' | 'md' | 'lg' = 'md'): string {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg',
    };

    const baseClasses = `rounded-xl transition-all hover:scale-105 ${sizeClasses[size]}`;

    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-blue-500/25`;
      
      case 'secondary':
        return `${baseClasses} ${
          this.isDarkMode 
            ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' 
            : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
        } border`;
      
      case 'ghost':
        return `${baseClasses} ${this.hoverInteractive}`;
      
      case 'danger':
        return `${baseClasses} ${
          this.isDarkMode 
            ? 'hover:bg-red-900/20 text-red-400 hover:text-red-300' 
            : 'hover:bg-red-50 text-red-600 hover:text-red-700'
        }`;
      
      default:
        return baseClasses;
    }
  }

  // Icon utilities
  get iconColors() {
    return {
      primary: this.isDarkMode ? 'text-blue-400' : 'text-blue-600',
      success: this.isDarkMode ? 'text-green-400' : 'text-green-600',
      warning: this.isDarkMode ? 'text-amber-400' : 'text-amber-600',
      error: this.isDarkMode ? 'text-red-400' : 'text-red-600',
      muted: this.isDarkMode ? 'text-gray-500' : 'text-gray-400',
    };
  }

  // Focus utilities
  get focusRing() {
    return 'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';
  }
}

/**
 * Hook-like function for theme management
 */
export function createThemeManager(): {
  manager: LocalStorageThemeManager;
  getStyler: (isDarkMode: boolean) => ThemeStyler;
} {
  const manager = new LocalStorageThemeManager();
  
  const getStyler = (isDarkMode: boolean) => new ThemeStyler(isDarkMode);
  
  return {
    manager,
    getStyler,
  };
}

/**
 * Utility to apply theme to document
 */
export function applyThemeToDocument(theme: 'light' | 'dark') {
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
  
  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#111827' : '#ffffff');
  }
}

/**
 * Get theme transition CSS for smooth animations
 */
export function getThemeTransitionCSS(): string {
  return `
    * {
      transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
    }
    
    .theme-transition-disable * {
      transition: none !important;
    }
  `;
}

/**
 * Prefers reduced motion check
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}