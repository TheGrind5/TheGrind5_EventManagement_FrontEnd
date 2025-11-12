import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import AdminSidebar from '../components/admin/AdminSidebar';
import UserManagement from '../components/admin/UserManagement';
import EventManagement from '../components/admin/EventManagement';
import AdminOrdersPage from './admin/AdminOrdersPage';
import AdminEventsPage from './admin/AdminEventsPage';
import AdminVouchersPage from './admin/AdminVouchersPage';
import AdminAnnouncementsPage from './admin/AdminAnnouncementsPage';
import AdminEventApprovalPage from './admin/AdminEventApprovalPage';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-dashboard-container">
      <AdminSidebar onLogout={handleLogout} />
      
      <div className="admin-main-content" style={{ paddingTop: '64px' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/users" replace />} />
          <Route path="/dashboard" element={<Navigate to="/admin/users" replace />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/events" element={<AdminEventsPage />} />
          <Route path="/orders" element={<AdminOrdersPage />} />
          <Route path="/vouchers" element={<AdminVouchersPage />} />
          <Route path="/announcements" element={<AdminAnnouncementsPage />} />
          <Route path="/event-approval" element={<AdminEventApprovalPage />} />
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
      background: isDark ? '#0D0D0D' : '#FFFFFF',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.3s ease'
    }}>
      <h2 style={{ color: isDark ? '#F5F5F5' : '#1A1A1A', marginBottom: '16px', transition: 'color 0.3s ease' }}>{title}</h2>
      <p style={{ color: isDark ? '#B0B0B0' : '#737373', fontSize: '18px', transition: 'color 0.3s ease' }}>
        Chức năng đang được phát triển... 🚧
      </p>
    </div>
  );
};

export default AdminDashboard;

