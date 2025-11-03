import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import UserManagement from '../components/admin/UserManagement';
import EventManagement from '../components/admin/EventManagement';
import AdminOrdersPage from './admin/AdminOrdersPage';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-dashboard-container">
      <AdminSidebar onLogout={handleLogout} />
      <AdminHeader />
      
      <div className="admin-main-content" style={{ paddingTop: '64px' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/users" replace />} />
          <Route path="/dashboard" element={<Navigate to="/admin/users" replace />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/events" element={<EventManagement />} />
          <Route path="/orders" element={<AdminOrdersPage />} />
          <Route path="/settings" element={<ComingSoon title="Cài Đặt" />} />
        </Routes>
      </div>
    </div>
  );
};

// Temporary placeholder component
const ComingSoon = ({ title }) => {
  const { isDark } = useTheme();
  return (
    <div style={{ 
      padding: '30px', 
      textAlign: 'center',
      background: isDark ? '#1A1A1A' : '#F5F5F5',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.3s ease'
    }}>
      <h2 style={{ color: isDark ? '#FFFFFF' : '#262B40', marginBottom: '16px', transition: 'color 0.3s ease' }}>{title}</h2>
      <p style={{ color: isDark ? '#A5A5A5' : '#6c757d', fontSize: '18px', transition: 'color 0.3s ease' }}>
        Chức năng đang được phát triển... 🚧
      </p>
    </div>
  );
};

export default AdminDashboard;

