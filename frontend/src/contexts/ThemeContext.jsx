import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or default to 'dark'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('app-theme');
    return savedTheme || 'dark';
  });

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    
    // Apply theme class to body
    document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  // Theme color values
  const themes = {
    dark: {
      // Main backgrounds
      primaryBg: '#1a1a1a',
      secondaryBg: '#323232',
      cardBg: '#323232',
      darkerBg: '#262626',
      
      // Text colors
      primaryText: '#E0E0E0',
      secondaryText: '#a0a0a0',
      mutedText: '#8E8E8E',
      
      // Brand colors
      brandBlue: '#4a90e2',
      brandBlueDark: '#357abd',
      
      // Accent colors
      success: '#10b981',
      warning: '#f59e0b',
      info: '#06b6d4',
      error: '#f44336',
      
      // Interactive elements
      border: 'rgba(255, 255, 255, 0.1)',
      borderHover: 'rgba(74, 144, 226, 0.3)',
      shadow: 'rgba(0, 0, 0, 0.2)',
      overlay: 'rgba(255, 255, 255, 0.1)',
    },
    light: {
      // Main backgrounds
      primaryBg: '#ffffff',
      secondaryBg: '#f8fafc',
      cardBg: '#ffffff',
      darkerBg: '#f1f5f9',
      
      // Text colors
      primaryText: '#1f2937',
      secondaryText: '#6b7280',
      mutedText: '#9ca3af',
      
      // Brand colors
      brandBlue: '#4a90e2',
      brandBlueDark: '#357abd',
      
      // Accent colors
      success: '#10b981',
      warning: '#f59e0b',
      info: '#06b6d4',
      error: '#f44336',
      
      // Interactive elements
      border: 'rgba(0, 0, 0, 0.1)',
      borderHover: 'rgba(74, 144, 226, 0.3)',
      shadow: 'rgba(0, 0, 0, 0.1)',
      overlay: 'rgba(0, 0, 0, 0.05)',
    }
  };

  const currentTheme = themes[theme];

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    colors: currentTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};