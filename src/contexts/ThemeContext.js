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
  // Lấy theme từ localStorage hoặc default to dark (futuristic theme)
  const [themeMode, setThemeMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    // Default to dark theme for futuristic look
    return 'dark';
  });

  // Tạo Material-UI theme - TheGrind5 Futuristic Theme
  const muiTheme = createTheme({
    palette: {
      mode: themeMode,
      primary: {
        main: '#FF7A00',        // Orange primary
        light: '#FF8A00',
        dark: '#E66A00',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#0A1128',        // Dark Navy secondary (đổi từ green)
        light: '#001F3F',
        dark: '#050911',
        contrastText: '#FFFFFF',
      },
      error: {
        main: '#EF4444',
      },
      warning: {
        main: '#FF7A00',
      },
      info: {
        main: '#3B82F6',
      },
      success: {
        main: '#FF7A00',  // Orange để đồng bộ với theme chính
      },
      background: {
        default: themeMode === 'dark' ? '#0D0D0D' : '#FFFFFF',
        paper: themeMode === 'dark' ? '#1A1A1A' : '#FFFFFF',
      },
      text: {
        primary: themeMode === 'dark' ? '#FFFFFF' : '#0D0D0D',
        secondary: themeMode === 'dark' ? '#A5A5A5' : '#737373',
      },
      divider: themeMode === 'dark' ? '#2A2A2A' : '#E5E7EB',
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
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 12,
            padding: '12px 24px',
            transition: 'all 0.3s ease-in-out',
          },
          contained: {
            background: 'linear-gradient(135deg, #FF7A00 0%, #FF8A00 100%)',
            boxShadow: '0 4px 12px rgba(255, 122, 0, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #FF8A00 0%, #FF9A20 100%)',
              boxShadow: '0 0 10px rgba(255, 122, 0, 0.5), 0 0 20px rgba(255, 122, 0, 0.3)',
              transform: 'translateY(-2px)',
            },
          },
          outlined: {
            borderColor: '#FF7A00',
            color: '#FF7A00',
            '&:hover': {
              borderColor: '#FF8A00',
              backgroundColor: 'rgba(255, 122, 0, 0.1)',
              boxShadow: '0 0 10px rgba(255, 122, 0, 0.5), 0 0 20px rgba(255, 122, 0, 0.3)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: themeMode === 'dark' 
              ? '1px solid #2A2A2A' 
              : '1px solid #E5E7EB',
            boxShadow: themeMode === 'dark' 
              ? '0 4px 12px rgba(0, 0, 0, 0.4)' 
              : '0 2px 8px rgba(0, 0, 0, 0.06)',
            backgroundColor: themeMode === 'dark' ? '#1A1A1A' : '#FFFFFF',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              boxShadow: themeMode === 'dark' 
                ? '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 10px rgba(255, 122, 0, 0.5)' 
                : '0 4px 12px rgba(0, 0, 0, 0.08)',
              transform: 'translateY(-2px)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              backgroundColor: themeMode === 'dark' ? 'rgba(18, 18, 18, 0.8)' : '#FFFFFF',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 122, 0, 0.3)',
                },
              },
              '&.Mui-focused': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#FF7A00',
                  boxShadow: '0 0 10px rgba(255, 122, 0, 0.5), 0 0 20px rgba(255, 122, 0, 0.3)',
                },
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            fontWeight: 500,
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: themeMode === 'dark' ? '#1A1A1A' : '#FFFFFF',
            borderRadius: 12,
          },
          elevation1: {
            boxShadow: themeMode === 'dark' 
              ? '0 4px 12px rgba(0, 0, 0, 0.4)' 
              : '0 2px 8px rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
  });

  // Cập nhật CSS variables khi theme thay đổi
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    if (themeMode === 'dark') {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
      body.classList.add('dark-theme');
      body.classList.remove('light-theme');
      body.style.background = '#0D0D0D';
      body.style.color = '#FFFFFF';
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
      body.classList.add('light-theme');
      body.classList.remove('dark-theme');
      body.style.background = '#FFFFFF';
      body.style.color = '#0D0D0D';
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
