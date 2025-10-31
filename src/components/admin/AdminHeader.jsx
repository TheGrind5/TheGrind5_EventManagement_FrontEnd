import React from 'react';
import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import NotificationBell from './NotificationBell';

const AdminHeader = () => {
  return (
    <AppBar 
      position="fixed"
      sx={{ 
        ml: '260px',
        width: 'calc(100% - 260px)',
        backgroundColor: '#fff',
        color: '#000',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        zIndex: 1000
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Quản trị hệ thống
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <NotificationBell />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AdminHeader;

