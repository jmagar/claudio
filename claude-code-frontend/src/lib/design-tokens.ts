// Design System Tokens for Claude Code UI
// This file centralizes all design tokens for consistent styling

export const tokens = {
  // Spacing System (based on 4px grid)
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    '3xl': '3rem',    // 48px
    '4xl': '4rem',    // 64px
    '5xl': '6rem',    // 96px
  },

  // Typography Scale
  typography: {
    // Font sizes
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
    },
    
    // Font weights
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    
    // Line heights
    lineHeight: {
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
    
    // Letter spacing
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  // Color System
  colors: {
    // Primary gradients
    primary: {
      gradient: 'from-blue-500 to-purple-600',
      gradientHover: 'from-blue-600 to-purple-700',
      gradientActive: 'from-blue-700 to-purple-800',
    },
    
    // Secondary gradients
    secondary: {
      gradient: 'from-green-500 to-blue-500',
      gradientHover: 'from-green-600 to-blue-600',
    },
    
    // Status colors
    status: {
      success: 'text-green-500',
      warning: 'text-yellow-500',
      error: 'text-red-500',
      info: 'text-blue-500',
    },
    
    // Surface colors for dark mode
    dark: {
      surface: 'bg-slate-900/90',
      surfaceHover: 'bg-slate-800/50',
      surfaceActive: 'bg-slate-800/80',
      border: 'border-slate-700/50',
      borderHover: 'border-slate-600/50',
      text: 'text-slate-100',
      textSecondary: 'text-slate-400',
      textMuted: 'text-slate-500',
    },
    
    // Surface colors for light mode
    light: {
      surface: 'bg-white/90',
      surfaceHover: 'bg-slate-100/50',
      surfaceActive: 'bg-slate-100/80',
      border: 'border-slate-200/50',
      borderHover: 'border-slate-300/50',
      text: 'text-slate-900',
      textSecondary: 'text-slate-600',
      textMuted: 'text-slate-500',
    },
  },

  // Border Radius System
  borderRadius: {
    sm: '0.25rem',     // 4px
    md: '0.5rem',      // 8px
    lg: '0.75rem',     // 12px
    xl: '1rem',        // 16px
    '2xl': '1.5rem',   // 24px
    full: '9999px',    // Full circle
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    glow: '0 0 20px rgb(59 130 246 / 0.15)',
  },

  // Animation Durations
  animation: {
    fast: '150ms',
    normal: '250ms',
    slow: '400ms',
    slower: '600ms',
  },

  // Transition Easings
  easing: {
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // Layout constraints
  layout: {
    maxWidth: {
      chat: '4xl',
      sidebar: '20rem',
      container: '7xl',
    },
    
    heights: {
      header: '4rem',
      input: '3.75rem',
      avatar: '2rem',
      button: '2.5rem',
    },
  },

  // Z-index scale
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
};

// Helper functions for consistent styling
export const getSpacing = (size: keyof typeof tokens.spacing) => tokens.spacing[size];
export const getFontSize = (size: keyof typeof tokens.typography.fontSize) => tokens.typography.fontSize[size];
export const getBorderRadius = (size: keyof typeof tokens.borderRadius) => tokens.borderRadius[size];

// Common component styles
export const componentStyles = {
  // Button base styles
  button: {
    base: 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    sizes: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    },
    variants: {
      primary: 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl',
      secondary: 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl',
      ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800',
      outline: 'border border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500',
    },
  },

  // Input base styles
  input: {
    base: 'block w-full rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
    sizes: {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-6 py-4 text-lg',
    },
  },

  // Card base styles
  card: {
    base: 'rounded-2xl border backdrop-blur-xl transition-all duration-200',
    variants: {
      default: 'bg-white/90 border-slate-200/50 dark:bg-slate-900/90 dark:border-slate-700/50',
      elevated: 'bg-white/95 border-slate-200/50 shadow-lg dark:bg-slate-900/95 dark:border-slate-700/50',
      ghost: 'bg-transparent border-transparent hover:bg-slate-50/50 dark:hover:bg-slate-800/50',
    },
  },

  // Avatar styles
  avatar: {
    base: 'rounded-full flex items-center justify-center overflow-hidden',
    sizes: {
      sm: 'w-6 h-6',
      md: 'w-8 h-8',
      lg: 'w-10 h-10',
      xl: 'w-12 h-12',
    },
  },
};

// Animation presets
export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  slideInLeft: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
  },

  slideInRight: {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 },
  },

  slideInUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 },
  },

  scaleIn: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
  },

  spring: {
    type: "spring",
    damping: 20,
    stiffness: 300,
  },

  smooth: {
    type: "tween",
    ease: "easeOut",
    duration: 0.2,
  },
};