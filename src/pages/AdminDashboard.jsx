import React from 'react';
 import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import AdminSidebar from '../components/admin/AdminSidebar';
import UserManagement from '../components/admin/UserManagement';
import EventCalendar from '../components/admin/EventCalendar';
import AdminOrdersPage from './admin/AdminOrdersPage';
import AdminEventsPage from './admin/AdminEventsPage';
import AdminVouchersPage from './admin/AdminVouchersPage';
import AdminAnnouncementsPage from './admin/AdminAnnouncementsPage';
import AdminEventApprovalPage from './admin/AdminEventApprovalPage';
import AdminSettingsPage from './admin/AdminSettingsPage';
import { useAuth } from '../contexts/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
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
          <Route path="/events/calendar" element={<EventCalendar />} />
          <Route path="/orders" element={<AdminOrdersPage />} />
          <Route path="/vouchers" element={<AdminVouchersPage />} />
          <Route path="/announcements" element={<AdminAnnouncementsPage />} />
          <Route path="/event-approval" element={<AdminEventApprovalPage />} />
          <Route path="/settings" element={<AdminSettingsPage />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;

