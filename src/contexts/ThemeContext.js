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

  // Tạo Material-UI theme - TicketBox.vn Design System
  const muiTheme = createTheme({
    palette: {
      mode: themeMode,
      primary: {
        main: '#3DBE29',        // TicketBox signature green
        light: '#5FD946',
        dark: '#2FA320',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#F97316',        // Accent orange
        light: '#FB923C',
        dark: '#EA580C',
      },
      error: {
        main: '#EF4444',
      },
      warning: {
        main: '#F59E0B',
      },
      info: {
        main: '#3B82F6',
      },
      success: {
        main: '#10B981',
      },
      background: {
        default: themeMode === 'dark' ? '#0F0F23' : '#FFFFFF',
        paper: themeMode === 'dark' ? '#1A1A2E' : '#FFFFFF',
      },
      text: {
        primary: themeMode === 'dark' ? '#FFFFFF' : '#1C1C1C',
        secondary: themeMode === 'dark' ? '#D1D5DB' : '#6B7280',
      },
      divider: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB',
    },
    typography: {
      fontFamily: [
        'Inter',
        'Roboto',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 700,
        letterSpacing: '-0.01em',
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
      body1: {
        fontSize: '1rem',
        fontWeight: 400,
      },
      body2: {
        fontSize: '0.875rem',
        fontWeight: 400,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 6,
            padding: '8px 20px',
            boxShadow: 'none',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            border: themeMode === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.1)' 
              : '1px solid #E5E7EB',
            boxShadow: 'none',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
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
