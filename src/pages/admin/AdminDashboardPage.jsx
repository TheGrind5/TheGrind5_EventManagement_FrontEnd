import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';
import '../../styles/AdminDashboard.css';

const AdminDashboardPage = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStatistics();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await adminService.getStatistics();
      setStatistics(response.data);
      setError(null);
    } catch (err) {
      setError('Không thể tải thống kê. Vui lòng thử lại.');
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-header">
          <div>
            <h1>📊 Admin Dashboard</h1>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            🚪 Đăng xuất
          </button>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="admin-header">
          <div>
            <h1>📊 Admin Dashboard</h1>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            🚪 Đăng xuất
          </button>
        </div>
        <div className="error-message">
          <p>⚠️ {error}</p>
          <button onClick={fetchStatistics} className="btn-retry">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>📊 Admin Dashboard</h1>
          <p>Tổng quan hệ thống quản lý người dùng</p>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          🚪 Đăng xuất
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="statistics-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Tổng người dùng</h3>
            <p className="stat-number">{statistics?.totalUsers || 0}</p>
          </div>
        </div>

        <div className="stat-card stat-card-success">
          <div className="stat-icon">🎤</div>
          <div className="stat-content">
            <h3>Hosts</h3>
            <p className="stat-number">{statistics?.totalHosts || 0}</p>
          </div>
        </div>

        <div className="stat-card stat-card-info">
          <div className="stat-icon">🎫</div>
          <div className="stat-content">
            <h3>Customers</h3>
            <p className="stat-number">{statistics?.totalCustomers || 0}</p>
          </div>
        </div>

        <div className="stat-card stat-card-warning">
          <div className="stat-icon">👑</div>
          <div className="stat-content">
            <h3>Admins</h3>
            <p className="stat-number">{statistics?.totalAdmins || 0}</p>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>User mới tháng này</h3>
            <p className="stat-number">{statistics?.newUsersThisMonth || 0}</p>
          </div>
        </div>

        <div className="stat-card stat-card-gold">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Tổng Wallet Balance</h3>
            <p className="stat-number-small">
              {formatCurrency(statistics?.totalWalletBalance || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>🚀 Quản lý nhanh</h2>
        <div className="action-buttons">
          <Link to="/admin/users" className="action-btn action-btn-primary">
            <span className="action-icon">📋</span>
            <div>
              <h3>Tất cả Users</h3>
              <p>Xem danh sách đầy đủ</p>
            </div>
          </Link>

          <Link to="/admin/users/hosts" className="action-btn action-btn-success">
            <span className="action-icon">🎤</span>
            <div>
              <h3>Danh sách Hosts</h3>
              <p>Quản lý tổ chức sự kiện</p>
            </div>
          </Link>

          <Link to="/admin/users/customers" className="action-btn action-btn-info">
            <span className="action-icon">🎫</span>
            <div>
              <h3>Danh sách Customers</h3>
              <p>Quản lý khách hàng</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div className="activity-summary">
        <h2>📊 Tóm tắt</h2>
        <div className="summary-content">
          <div className="summary-item">
            <span className="summary-label">Tổng số người dùng:</span>
            <span className="summary-value">{statistics?.totalUsers || 0} users</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Tỷ lệ Host/Customer:</span>
            <span className="summary-value">
              {statistics?.totalHosts || 0} : {statistics?.totalCustomers || 0}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">User mới tháng này:</span>
            <span className="summary-value highlight">
              +{statistics?.newUsersThisMonth || 0} users
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

