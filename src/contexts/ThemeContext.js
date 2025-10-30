import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const CustomThemeProvider = ({ children }) => {
  // Lấy theme từ localStorage hoặc system preference
  const [themeMode, setThemeMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    // Nếu không có theme đã lưu, kiểm tra system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Tạo Material-UI theme
  const muiTheme = createTheme({
    palette: {
      mode: themeMode,
      primary: {
        main: '#667eea',
        light: '#764ba2',
        dark: '#4a5568',
      },
      secondary: {
        main: '#22c55e',
        light: '#4CAF50',
        dark: '#16a34a',
      },
      error: {
        main: '#ef4444',
      },
      warning: {
        main: '#f59e0b',
      },
      background: {
        default: themeMode === 'dark' ? '#0f0f23' : '#ffffff',
        paper: themeMode === 'dark' ? '#2d3748' : '#ffffff',
      },
      text: {
        primary: themeMode === 'dark' ? '#ffffff' : '#212529',
        secondary: themeMode === 'dark' ? '#e2e8f0' : '#6c757d',
      },
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 12,
            padding: '10px 24px',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: themeMode === 'dark' 
              ? '0 8px 30px rgba(0, 0, 0, 0.3)' 
              : '0 8px 30px rgba(0, 0, 0, 0.08)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
            },
          },
        },
      },
    },
  });

  // Cập nhật CSS variables khi theme thay đổi
  useEffect(() => {
    const root = document.documentElement;
    
    if (themeMode === 'dark') {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    }

    // Lưu theme vào localStorage
    localStorage.setItem('theme', themeMode);
  }, [themeMode]);

  // Lắng nghe thay đổi system preference
  const handleSystemThemeChange = useCallback((e) => {
    // Chỉ tự động thay đổi nếu user chưa set theme manually
    const savedTheme = localStorage.getItem('theme');
    if (!savedTheme) {
      setThemeMode(e.matches ? 'dark' : 'light');
    }
  }, [setThemeMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [handleSystemThemeChange]);

  const toggleTheme = () => {
    setThemeMode(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const value = {
    theme: themeMode,
    toggleTheme,
    isDark: themeMode === 'dark',
    isLight: themeMode === 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={muiTheme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
