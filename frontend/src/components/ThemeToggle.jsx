import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle ${className}`}
      style={{
        background: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
        border: isDark ? '2px solid rgba(255, 255, 255, 0.5)' : '2px solid rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: '0.5rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        minWidth: '44px',
        height: '44px',
        position: 'relative',
        overflow: 'hidden',
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
      }}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      onMouseEnter={(e) => {
        e.target.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)';
        e.target.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
        e.target.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.target.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
        e.target.style.backgroundColor = 'transparent';
        e.target.style.transform = 'scale(1)';
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.3s ease',
          transform: theme === 'dark' ? 'rotate(0deg)' : 'rotate(180deg)'
        }}
      >
        {isDark ? (
          // Sun icon for switching to light mode
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="4" stroke="#f59e0b" strokeWidth="2"/>
              <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="#f59e0b" strokeWidth="2"/>
            </svg>
            <span style={{ fontSize: '16px', color: '#f59e0b', fontWeight: 'bold' }}>☀️</span>
          </>
        ) : (
          // Moon icon for switching to dark mode
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="#4a90e2" strokeWidth="2" fill="#4a90e2" fillOpacity="0.1"/>
            </svg>
            <span style={{ fontSize: '16px', color: '#4a90e2', fontWeight: 'bold' }}>🌙</span>
          </>
        )}
        
        {/* Debug text to ensure visibility */}
        <span style={{ 
          position: 'absolute',
          top: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '2px 4px',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none'
        }}>
          {isDark ? 'Dark' : 'Light'}
        </span>
      </span>
    </button>
  );
};

export default ThemeToggle;