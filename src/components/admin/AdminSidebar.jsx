import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Dashboard,
  People,
  Event,
  Receipt,
  Settings,
  Logout,
  AdminPanelSettings,
  LocalOffer,
  Notifications,
  CheckCircle,
  CalendarToday,
  BarChart,
  ShowChart,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import ThemeToggle from '../common/ThemeToggle';
import './AdminSidebar.css';

const AdminSidebar = ({ onLogout }) => {
  const location = useLocation();
  const { isDark } = useCustomTheme();
  const muiTheme = useMuiTheme();
  const [openCharts, setOpenCharts] = useState(location.pathname.startsWith('/admin/charts'));

  // Auto-expand Charts menu if on charts page
  React.useEffect(() => {
    if (location.pathname.startsWith('/admin/charts')) {
      setOpenCharts(true);
    }
  }, [location.pathname]);

  const menuItems = [
    { path: '/admin/dashboard', icon: <Dashboard />, label: 'Dashboard', },
    { path: '/admin/users', icon: <People />, label: 'Quản Lý Users' },
    { path: '/admin/events', icon: <Event />, label: 'Quản Lý Events' },
    { path: '/admin/events/calendar', icon: <CalendarToday />, label: 'Lịch Sự Kiện' },
    { path: '/admin/orders', icon: <Receipt />, label: 'Quản Lý Orders' },
    { path: '/admin/vouchers', icon: <LocalOffer />, label: 'Quản Lý Vouchers' },
    { path: '/admin/announcements', icon: <Notifications />, label: 'Thêm Thông Báo' },
    { path: '/admin/event-approval', icon: <CheckCircle />, label: 'Duyệt Sự Kiện' },
  ];

  const chartSubItems = [
    { path: '/admin/charts/bar', icon: <BarChart />, label: 'Biểu Đồ Cột' },
    { path: '/admin/charts/line', icon: <ShowChart />, label: 'Biểu Đồ Đường Thẳng' },
  ];

  const isActive = (path) => location.pathname === path;
  const isChartActive = () => location.pathname.startsWith('/admin/charts');

  return (
    <div className={`admin-sidebar ${isDark ? 'dark-mode' : 'light-mode'}`}>
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
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
          <ThemeToggle />
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

        {/* Charts Menu with Dropdown */}
        <div className="menu-item-wrapper">
          <div
            className={`menu-item ${isChartActive() ? 'active' : ''}`}
            onClick={() => setOpenCharts(!openCharts)}
            style={{ cursor: 'pointer' }}
          >
            <span className="menu-icon">
              <BarChart />
            </span>
            <span className="menu-label">Biểu Đồ</span>
            <span className="menu-icon" style={{ marginLeft: 'auto' }}>
              {openCharts ? <ExpandLess /> : <ExpandMore />}
            </span>
          </div>

          {/* Submenu */}
          <div
            className={`submenu ${openCharts ? 'open' : ''}`}
            style={{
              maxHeight: openCharts ? '200px' : '0',
              overflow: 'hidden',
              transition: 'max-height 0.3s ease-in-out'
            }}
          >
            {chartSubItems.map((subItem) => (
              <Link
                key={subItem.path}
                to={subItem.path}
                className={`submenu-item ${isActive(subItem.path) ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 20px 12px 50px',
                  textDecoration: 'none',
                  color: isActive(subItem.path) ? '#f97316' : (isDark ? '#9ca3af' : '#6b7280'),
                  fontSize: '14px',
                  fontWeight: isActive(subItem.path) ? 600 : 400,
                  transition: 'all 0.2s',
                  backgroundColor: isActive(subItem.path) 
                    ? (isDark ? 'rgba(249, 115, 22, 0.1)' : 'rgba(249, 115, 22, 0.05)')
                    : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isActive(subItem.path)) {
                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
                    e.currentTarget.style.color = isDark ? '#fff' : '#333';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(subItem.path)) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = isDark ? '#9ca3af' : '#6b7280';
                  }
                }}
              >
                {subItem.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Settings Menu */}
        <Link
          to="/admin/settings"
          className={`menu-item ${isActive('/admin/settings') ? 'active' : ''}`}
        >
          <span className="menu-icon"><Settings /></span>
          <span className="menu-label">Cài Đặt</span>
        </Link>
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

