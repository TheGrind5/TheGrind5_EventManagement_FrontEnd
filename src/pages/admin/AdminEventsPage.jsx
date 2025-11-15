import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';
import { runDiagnostics } from '../../utils/debugHelper';
import { formatVietnamDateTimeShort } from '../../utils/dateTimeUtils';
import '../../styles/AdminUsers.css';

const AdminEventsPage = () => {
  const [events, setEvents] = useState([]);
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
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('CreatedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Delete confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [targetEvent, setTargetEvent] = useState({ id: null, title: '' });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    runDiagnostics();
    fetchEvents();
  }, [currentPage, searchTerm, statusFilter, sortBy, sortOrder]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching events with params:', {
        searchTerm,
        status: statusFilter,
        pageNumber: currentPage,
        pageSize,
        sortBy,
        sortOrder
      });

      const response = await adminService.getAllEvents({
        searchTerm: searchTerm || undefined,
        status: statusFilter || undefined,
        pageNumber: currentPage,
        pageSize,
        sortBy,
        sortOrder
      });

      console.log('✅ Response received:', response);
      console.log('📊 Events data:', response.data);

      setEvents(response.data.events || []);
      setTotalCount(response.data.totalCount || 0);
      setTotalPages(response.data.totalPages || 0);
    } catch (err) {
      console.error('❌ Error fetching events:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      
      let errorMessage = 'Không thể tải danh sách sự kiện. ';
      
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

  // Sử dụng formatVietnamDateTimeShort từ dateTimeUtils để đồng bộ UTC+7
  const formatDate = formatVietnamDateTimeShort;

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEvents();
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

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'Open': return 'badge-host';
      case 'Draft': return 'badge-default';
      case 'Closed': return 'badge-customer';
      case 'Cancelled': return 'badge-admin';
      default: return 'badge-default';
    }
  };

  const openConfirmDelete = (eventId, title) => {
    setTargetEvent({ id: eventId, title });
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (deleting) return;
    setConfirmOpen(false);
    setTargetEvent({ id: null, title: '' });
  };

  const confirmDelete = async () => {
    if (!targetEvent.id) return;
    setDeleting(true);
    try {
      const res = await adminService.adminForceDeleteEvent(targetEvent.id);
      alert(res.data?.message || 'Đã xóa vĩnh viễn sự kiện');
      setConfirmOpen(false);
      fetchEvents();
    } catch (err) {
      console.error('❌ Error deleting event:', err);
      if (err?.response?.status === 404) {
        try {
          const res2 = await adminService.adminDeleteEvent(targetEvent.id);
          alert(res2.data?.message || 'Đã xóa sự kiện thành công');
          setConfirmOpen(false);
          fetchEvents();
          return;
        } catch (err2) {
          console.error('❌ Fallback delete failed:', err2);
          err = err2;
        }
      }
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (typeof err.response?.data === 'string' ? err.response.data : '') ||
        (err.response?.status === 403 ? 'Bạn không có quyền xóa sự kiện này.' : '') ||
        '';
      const msg = serverMsg || 'Không thể xóa sự kiện. Vui lòng thử lại.';
      alert(msg);
    } finally {
      setDeleting(false);
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className="admin-users-page">
        <div className="page-header">
          <h1>📅 Quản lý Sự kiện</h1>
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
      <div className="page-header">
        <h1>📅 Quản lý Sự kiện</h1>
        <div className="header-actions">
          <Link 
            to="/admin/users" 
            className="btn-primary"
            style={{
              backgroundColor: '#e65100',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#d84315';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#e65100';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Quản lý Users
          </Link>
          <Link 
            to="/admin/orders" 
            className="btn-primary"
            style={{
              backgroundColor: '#e65100',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#d84315';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#e65100';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Quản lý Orders
          </Link>
          <button 
            onClick={handleLogout} 
            className="btn-secondary"
            style={{
              backgroundColor: '#e65100',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#d84315';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#e65100';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-container">
          <div className="error-message">
            <p>❌ {error}</p>
            <button onClick={fetchEvents} className="btn-retry">
              🔄 Thử lại
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="filters-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên sự kiện hoặc host..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className={`filter-select ${statusFilter === '' ? 'all-status-selected' : ''}`}
            style={{
              color: statusFilter === '' ? '#000000' : 'inherit',
              backgroundColor: statusFilter === '' ? '#ffffff' : 'inherit'
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Draft">Draft</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button type="submit" className="btn-search">
            🔍 Tìm kiếm
          </button>
        </form>
      </div>

      {/* Events Table */}
      {events.length === 0 && !loading ? (
        <div className="no-data">
          <p>📭 Không tìm thấy sự kiện nào</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('EventId')} className="sortable">
                    ID {sortBy === 'EventId' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('Title')} className="sortable">
                    Tên sự kiện {sortBy === 'Title' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Host</th>
                  <th>Danh mục</th>
                  <th onClick={() => handleSort('Status')} className="sortable">
                    Trạng thái {sortBy === 'Status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('ReportCount')} className="sortable">
                    Số lần bị báo cáo {sortBy === 'ReportCount' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('StartTime')} className="sortable">
                    Thời gian bắt đầu {sortBy === 'StartTime' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('CreatedAt')} className="sortable">
                    Ngày tạo {sortBy === 'CreatedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.eventId}>
                    <td>#{event.eventId}</td>
                    <td>
                      <Link 
                        to={`/event/${event.eventId}`}
                        className="event-title-link"
                        style={{ fontWeight: 600, color: '#667eea' }}
                      >
                        {event.title}
                      </Link>
                    </td>
                    <td>{event.hostName || 'N/A'}</td>
                    <td>{event.category || 'N/A'}</td>
                    <td>
                      <span className={`role-badge ${getStatusBadgeClass(event.status)}`}>
                        {event.status}
                      </span>
                    </td>
                    <td>
                      <span 
                        style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: 600,
                          backgroundColor: event.reportCount > 0 ? '#fee' : '#f0f0f0',
                          color: event.reportCount > 0 ? '#d32f2f' : '#666'
                        }}
                      >
                        {event.reportCount || 0}
                      </span>
                    </td>
                    <td>{formatDate(event.startTime)}</td>
                    <td>{formatDate(event.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-action"
                          style={{
                            background: '#ff9800',
                            color: '#fff',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                          title="Xóa vĩnh viễn"
                          onClick={() => openConfirmDelete(event.eventId, event.title)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="page-btn"
              >
                ← Trước
              </button>

              {/* Numbered page buttons */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '0 8px' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className="page-btn"
                    style={{
                      background: page === currentPage ? '#667eea' : '#f0f0f0',
                      color: page === currentPage ? '#fff' : '#333',
                      fontWeight: page === currentPage ? 700 : 500,
                      borderRadius: 6,
                      padding: '6px 10px'
                    }}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="page-btn"
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    {/* Confirm Delete Dialog */}
    <Dialog open={confirmOpen} onClose={closeConfirm} maxWidth="xs" fullWidth>
      <DialogTitle>Xóa vĩnh viễn sự kiện?</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          Bạn chuẩn bị xóa sự kiện
          <strong> "{targetEvent.title}"</strong>. Hành động này sẽ xóa tất cả dữ liệu liên quan và KHÔNG thể hoàn tác.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeConfirm} disabled={deleting} variant="outlined">
          Hủy
        </Button>
        <Button onClick={confirmDelete} disabled={deleting} color="warning" variant="contained">
          {deleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
        </Button>
      </DialogActions>
    </Dialog>
    </div>
  );
};

export default AdminEventsPage;

