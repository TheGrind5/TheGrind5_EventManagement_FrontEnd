import React from 'react';
import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import NotificationBell from './NotificationBell';
import ThemeToggle from '../common/ThemeToggle';

const AdminHeader = () => {
  const { isDark } = useCustomTheme();
  const muiTheme = useMuiTheme();

  return (
    <AppBar 
      position="fixed"
      sx={{ 
        ml: '260px',
        width: 'calc(100% - 260px)',
        backgroundColor: isDark ? '#1A1A1A' : '#FAFAFA',
        color: isDark ? '#FFFFFF' : '#2D3748',
        boxShadow: isDark ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
        borderBottom: isDark ? '1px solid #2A2A2A' : '1px solid #E0E0E0',
        zIndex: 1000,
        transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Quản trị hệ thống
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ThemeToggle />
          <NotificationBell />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AdminHeader;

