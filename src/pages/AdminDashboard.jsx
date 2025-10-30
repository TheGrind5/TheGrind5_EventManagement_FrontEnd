import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import UserManagement from '../components/admin/UserManagement';
import { useAuth } from '../contexts/AuthContext';
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
      
      <div className="admin-main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/admin/users" replace />} />
          <Route path="/dashboard" element={<Navigate to="/admin/users" replace />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/events" element={<ComingSoon title="Quản Lý Events" />} />
          <Route path="/orders" element={<ComingSoon title="Quản Lý Orders" />} />
          <Route path="/settings" element={<ComingSoon title="Cài Đặt" />} />
        </Routes>
      </div>
    </div>
  );
};

// Temporary placeholder component
const ComingSoon = ({ title }) => (
  <div style={{ 
    padding: '30px', 
    textAlign: 'center',
    background: '#f5f7fa',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <h2 style={{ color: '#262B40', marginBottom: '16px' }}>{title}</h2>
    <p style={{ color: '#6c757d', fontSize: '18px' }}>
      Chức năng đang được phát triển... 🚧
    </p>
  </div>
);

export default AdminDashboard;

