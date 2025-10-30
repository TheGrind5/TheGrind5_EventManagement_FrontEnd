import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';
import { runDiagnostics } from '../../utils/debugHelper';
import '../../styles/AdminUsers.css';

const AdminUsersPage = () => {
  const { roleFilter } = useParams(); // "hosts", "customers", hoặc undefined (all)
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('CreatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Selected user for detail modal
  const [selectedUser, setSelectedUser] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    // Run diagnostics on first load
    runDiagnostics();
    fetchUsers();
  }, [currentPage, searchTerm, sortBy, sortOrder, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const role = getRoleFromFilter();
      
      console.log('🔍 Fetching users with params:', {
        role,
        searchTerm,
        pageNumber: currentPage,
        pageSize,
        sortBy,
        sortOrder
      });

      const response = await adminService.getAllUsers({
        role,
        searchTerm: searchTerm || undefined,
        pageNumber: currentPage,
        pageSize,
        sortBy,
        sortOrder
      });

      console.log('✅ Response received:', response);
      console.log('📊 Users data:', response.data);

      setUsers(response.data.users || []);
      setTotalCount(response.data.totalCount || 0);
      setTotalPages(response.data.totalPages || 0);
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      
      let errorMessage = 'Không thể tải danh sách người dùng. ';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage += 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (err.response.status === 403) {
          errorMessage += 'Bạn không có quyền truy cập. Vui lòng đăng nhập với tài khoản Admin.';
        } else if (err.response.status === 404) {
          errorMessage += 'Không tìm thấy API endpoint.';
        } else {
          errorMessage += err.response.data?.message || 'Vui lòng thử lại.';
        }
      } else if (err.request) {
        errorMessage += 'Không thể kết nối đến server. Vui lòng kiểm tra Backend đã chạy chưa.';
      } else {
        errorMessage += err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getRoleFromFilter = () => {
    if (roleFilter === 'hosts') return 'Host';
    if (roleFilter === 'customers') return 'Customer';
    return undefined; // All users
  };

  const getPageTitle = () => {
    if (roleFilter === 'hosts') return '🎤 Danh sách Hosts';
    if (roleFilter === 'customers') return '🎫 Danh sách Customers';
    return '👥 Tất cả người dùng';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const getRoleBadgeClass = (role) => {
    if (role === 'Host') return 'badge-host';
    if (role === 'Customer') return 'badge-customer';
    if (role === 'Admin') return 'badge-admin';
    return 'badge-default';
  };

  const viewUserDetail = async (userId) => {
    try {
      const response = await adminService.getUserById(userId);
      setSelectedUser(response.data);
    } catch (err) {
      console.error('Error fetching user detail:', err);
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
  };

  if (loading && users.length === 0) {
    return (
      <div className="admin-users-page">
        <div className="page-header">
          <h1>{getPageTitle()}</h1>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải danh sách...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>{getPageTitle()}</h1>
          <p>Quản lý và theo dõi người dùng trong hệ thống</p>
        </div>
        <div className="header-actions">
          <Link to="/admin/dashboard" className="btn-back">
            ← Về Dashboard
          </Link>
          <button onClick={handleLogout} className="btn-logout">
            🚪 Đăng xuất
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="🔍 Tìm theo tên, email, username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn-search">
            Tìm kiếm
          </button>
        </form>

        <div className="filter-tabs">
          <Link
            to="/admin/users"
            className={!roleFilter ? 'filter-tab active' : 'filter-tab'}
          >
            👥 Tất cả ({totalCount})
          </Link>
          <Link
            to="/admin/users/hosts"
            className={roleFilter === 'hosts' ? 'filter-tab active' : 'filter-tab'}
          >
            🎤 Hosts
          </Link>
          <Link
            to="/admin/users/customers"
            className={roleFilter === 'customers' ? 'filter-tab active' : 'filter-tab'}
          >
            🎫 Customers
          </Link>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <h3>⚠️ Lỗi tải dữ liệu</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={fetchUsers} className="btn-retry">
              🔄 Thử lại
            </button>
            <button 
              onClick={() => {
                console.log('🔍 Checking diagnostics...');
                runDiagnostics();
              }} 
              className="btn-retry"
            >
              🔍 Kiểm tra kết nối
            </button>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }} 
              className="btn-retry"
              style={{ background: '#e53e3e' }}
            >
              🔐 Đăng nhập lại
            </button>
          </div>
          <div className="error-help">
            <p><strong>💡 Gợi ý khắc phục:</strong></p>
            <ol style={{ textAlign: 'left', margin: '10px 0' }}>
              <li>Kiểm tra Backend đã chạy: <code>cd TheGrind5_EventManagement_BackEnd/src && dotnet run</code></li>
              <li>Mở F12 → Console tab để xem chi tiết lỗi</li>
              <li>Đăng nhập lại với tài khoản Admin: <code>admin@thegrind5.com / 123456</code></li>
            </ol>
          </div>
        </div>
      )}

      {/* Users Table */}
      {users.length === 0 && !loading ? (
        <div className="no-data">
          <p>📭 Không tìm thấy người dùng nào</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('UserId')} className="sortable">
                    ID {sortBy === 'UserId' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('FullName')} className="sortable">
                    Họ tên {sortBy === 'FullName' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('Email')} className="sortable">
                    Email {sortBy === 'Email' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Số điện thoại</th>
                  <th onClick={() => handleSort('Role')} className="sortable">
                    Role {sortBy === 'Role' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('WalletBalance')} className="sortable">
                    Wallet {sortBy === 'WalletBalance' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('CreatedAt')} className="sortable">
                    Ngày tạo {sortBy === 'CreatedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.userId}>
                    <td>#{user.userId}</td>
                    <td>
                      <div className="user-info">
                        {user.avatar && (
                          <img src={user.avatar} alt={user.fullName} className="user-avatar-small" />
                        )}
                        <span>{user.fullName}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.phone || 'N/A'}</td>
                    <td>
                      <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="wallet-amount">{formatCurrency(user.walletBalance)}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <button
                        onClick={() => viewUserDetail(user.userId)}
                        className="btn-view"
                      >
                        👁️ Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <div className="pagination-info">
              Hiển thị {users.length} / {totalCount} người dùng
            </div>
            <div className="pagination-controls">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn-page"
              >
                ← Trước
              </button>
              <span className="page-info">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn-page"
              >
                Sau →
              </button>
            </div>
          </div>
        </>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👤 Chi tiết người dùng</h2>
              <button onClick={closeModal} className="btn-close">×</button>
            </div>
            <div className="modal-body">
              <div className="user-detail">
                <div className="detail-row">
                  <span className="detail-label">ID:</span>
                  <span className="detail-value">#{selectedUser.userId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Username:</span>
                  <span className="detail-value">{selectedUser.username}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Họ tên:</span>
                  <span className="detail-value">{selectedUser.fullName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{selectedUser.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Số điện thoại:</span>
                  <span className="detail-value">{selectedUser.phone || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Role:</span>
                  <span className={`role-badge ${getRoleBadgeClass(selectedUser.role)}`}>
                    {selectedUser.role}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Wallet Balance:</span>
                  <span className="detail-value wallet-amount">
                    {formatCurrency(selectedUser.walletBalance)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Giới tính:</span>
                  <span className="detail-value">{selectedUser.gender || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Ngày sinh:</span>
                  <span className="detail-value">
                    {selectedUser.dateOfBirth ? formatDate(selectedUser.dateOfBirth) : 'N/A'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Ngày tạo:</span>
                  <span className="detail-value">{formatDate(selectedUser.createdAt)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Cập nhật lần cuối:</span>
                  <span className="detail-value">
                    {selectedUser.updatedAt ? formatDate(selectedUser.updatedAt) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;

