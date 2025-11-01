import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';
import { runDiagnostics } from '../../utils/debugHelper';
import '../../styles/AdminUsers.css';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    // Run diagnostics on first load
    runDiagnostics();
    fetchOrders();
  }, [currentPage, searchTerm, sortBy, sortOrder]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching orders with params:', {
        searchTerm,
        pageNumber: currentPage,
        pageSize,
        sortBy,
        sortOrder
      });

      const response = await adminService.getAllOrders({
        searchTerm: searchTerm || undefined,
        pageNumber: currentPage,
        pageSize,
        sortBy,
        sortOrder
      });

      console.log('✅ Response received:', response);
      console.log('📊 Full response:', JSON.stringify(response, null, 2));
      console.log('📊 Response data:', response.data);

      // Backend trả về: { success: true, message: "...", data: { orders: [...], totalCount: ... } }
      // apiClient interceptor đã extract: response.data = response.data?.data || response.data
      // Vậy response.data sẽ là GetOrdersResponse: { orders: [...], totalCount: ..., totalPages: ... }
      const responseData = response.data || {};
      
      // Backend dùng camelCase nên sẽ là: orders, totalCount, totalPages
      // Nhưng cần kiểm tra cả PascalCase để tương thích
      const ordersData = responseData.orders || responseData.Orders || [];
      const totalCount = responseData.totalCount ?? responseData.TotalCount ?? 0;
      const totalPages = responseData.totalPages ?? responseData.TotalPages ?? 0;
      
      console.log('📦 Orders found:', ordersData.length);
      console.log('📦 First order sample:', ordersData[0]);
      console.log('📦 Total count:', totalCount, 'Total pages:', totalPages);
      
      setOrders(ordersData);
      setTotalCount(totalCount);
      setTotalPages(totalPages);
    } catch (err) {
      console.error('❌ Error fetching orders:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      
      let errorMessage = 'Không thể tải danh sách orders. ';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage += 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (err.response.status === 403) {
          errorMessage += 'Bạn không có quyền truy cập. Vui lòng đăng nhập với tài khoản Admin.';
        } else if (err.response.status === 404) {
          errorMessage += 'Resource not found. Vui lòng kiểm tra Backend đã chạy và endpoint /api/admin/orders có tồn tại.';
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
    fetchOrders();
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

  if (loading && orders.length === 0) {
    return (
      <div className="admin-users-page">
        <div className="page-header">
          <h1>📦 Quản lý Order</h1>
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
          <h1>📦 Quản lý Order</h1>
          <p>Quản lý và theo dõi các đơn hàng trong hệ thống</p>
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
            placeholder="🔍 Tìm theo tên khách hàng, email, sự kiện..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn-search">
            Tìm kiếm
          </button>
        </form>
      </div>

      {error && (
        <div className="error-message">
          <h3>⚠️ Lỗi tải dữ liệu</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={fetchOrders} className="btn-retry">
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

      {/* Orders Table */}
      {!error && orders.length === 0 && !loading ? (
        <div className="no-data">
          <p>📦 Chưa có order nào được thực hiện</p>
        </div>
      ) : !error && orders.length > 0 ? (
        <>
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('OrderId')} className="sortable">
                    ID vé {sortBy === 'OrderId' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('CustomerName')} className="sortable">
                    Tên người mua {sortBy === 'CustomerName' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Vé đã mua</th>
                  <th onClick={() => handleSort('Quantity')} className="sortable">
                    Số lượng vé {sortBy === 'Quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('Amount')} className="sortable">
                    Số tiền mua {sortBy === 'Amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('CreatedAt')} className="sortable">
                    Thời gian mua {sortBy === 'CreatedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.orderId}>
                    <td>#{order.orderId}</td>
                    <td>
                      <div className="user-info">
                        <span>{order.customerName}</span>
                      </div>
                    </td>
                    <td>{order.ticketInfo}</td>
                    <td className="quantity">{order.quantity || order.Quantity || 0}</td>
                    <td className="wallet-amount">{formatCurrency(order.amount)}</td>
                    <td>{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <div className="pagination-info">
              Hiển thị {orders.length} / {totalCount} orders
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
      ) : null}
    </div>
  );
};

export default AdminOrdersPage;

