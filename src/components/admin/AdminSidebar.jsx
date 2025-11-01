import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Dashboard,
  People,
  Event,
  Receipt,
  Settings,
  Logout,
  AdminPanelSettings
} from '@mui/icons-material';
import './AdminSidebar.css';

const AdminSidebar = ({ onLogout }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/admin/dashboard', icon: <Dashboard />, label: 'Dashboard', },
    { path: '/admin/users', icon: <People />, label: 'Quản Lý Users' },
    { path: '/admin/events', icon: <Event />, label: 'Quản Lý Events' },
    { path: '/admin/orders', icon: <Receipt />, label: 'Quản Lý Orders' },
    { path: '/admin/settings', icon: <Settings />, label: 'Cài Đặt' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <AdminPanelSettings className="admin-icon" />
        <h3>Admin Panel</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          <img 
            src="/brand-logo.png" 
            alt="FUTicket Logo" 
            style={{ height: '24px', width: 'auto', objectFit: 'contain' }}
          />
          <p className="brand-subtitle" style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>FUTicket</p>
        </div>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>
          <Logout />
          <span>Đăng Xuất</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;

