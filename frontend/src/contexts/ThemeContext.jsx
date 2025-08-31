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
      // Main backgrounds (using login page colors)
      primaryBg: '#212121',         // Auth page background
      secondaryBg: '#323232',       // Auth form background  
      cardBg: '#262626',           // Input background
      darkerBg: '#1a1a1a',        // Phone screen background
      
      // Additional dark shades
      inputBg: '#262626',          // Input fields
      hoverBg: '#424242',          // Button hover
      borderDark: '#2c2c2c',       // Dark borders
      
      // Text colors (from login page)
      primaryText: '#E0E0E0',      // Main text
      secondaryText: '#a0a0a0',    // Subtitle text
      mutedText: '#8E8E8E',        // Placeholder text
      
      // Brand colors
      brandBlue: '#4a90e2',
      brandBlueDark: '#357abd',
      
      // Accent colors
      success: '#10b981',
      warning: '#f59e0b',
      info: '#06b6d4',
      error: '#f44336',
      
      // Interactive elements (using login page colors)
      border: '#2c2c2c',                    // Dark borders like chat header
      borderLight: 'rgba(255, 255, 255, 0.1)', // Very subtle borders
      borderHover: 'rgba(74, 144, 226, 0.3)',   // Brand color borders
      shadow: 'rgba(0, 0, 0, 0.25)',           // Deeper shadows
      shadowLarge: 'rgba(0, 0, 0, 0.4)',       // Phone mockup shadow
      overlay: 'rgba(255, 255, 255, 0.05)',    // Very subtle overlay
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