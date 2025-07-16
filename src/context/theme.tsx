'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { LocalStorageThemeManager, ThemeStyler, applyThemeToDocument, type Theme, type ThemeConfig } from '@/lib/theme-manager';

interface ThemeContextType {
  isDarkMode: boolean;
  theme: Theme;
  systemPreference: 'light' | 'dark';
  effectiveTheme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  styler: ThemeStyler;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeManager] = useState(() => new LocalStorageThemeManager());
  const [config, setConfig] = useState<ThemeConfig>(() => themeManager.getThemeConfig());
  const [styler, setStyler] = useState(() => new ThemeStyler(config.effectiveTheme === 'dark'));

  // Subscribe to theme changes
  useEffect(() => {
    const unsubscribe = themeManager.subscribe((newConfig) => {
      setConfig(newConfig);
      setStyler(new ThemeStyler(newConfig.effectiveTheme === 'dark'));
      applyThemeToDocument(newConfig.effectiveTheme);
    });

    // Apply initial theme
    applyThemeToDocument(config.effectiveTheme);

    return () => {
      unsubscribe();
      themeManager.destroy();
    };
  }, [themeManager, config.effectiveTheme]);

  const toggleTheme = () => {
    const currentTheme = config.theme;
    let newTheme: Theme;
    
    if (currentTheme === 'system') {
      newTheme = config.systemPreference === 'dark' ? 'light' : 'dark';
    } else {
      newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    }
    
    themeManager.setTheme(newTheme);
  };

  const setTheme = (theme: Theme) => {
    themeManager.setTheme(theme);
  };

  return (
    <ThemeContext.Provider value={{ 
      isDarkMode: config.effectiveTheme === 'dark',
      theme: config.theme,
      systemPreference: config.systemPreference,
      effectiveTheme: config.effectiveTheme,
      toggleTheme, 
      setTheme,
      styler,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}