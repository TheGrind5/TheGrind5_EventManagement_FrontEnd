import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';
import '../../styles/AdminUsers.css';

const AdminEventApprovalPage = () => {
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
  
  // Dialog state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    fetchPendingEvents();
  }, [currentPage]);

  const fetchPendingEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching pending events...');
      
      // Thử dùng endpoint mới trước, nếu không được thì fallback sang endpoint cũ
      let response;
      try {
        response = await adminService.getPendingEvents({
          pageNumber: currentPage,
          pageSize
        });
        console.log('✅ Used /admin/pending-events endpoint');
      } catch (fallbackErr) {
        // Nếu endpoint mới không tồn tại, dùng endpoint cũ với filter status=Pending
        console.warn('⚠️ /admin/pending-events not found, using fallback endpoint');
        console.log('🔄 Trying /admin/events?status=Pending...');
        
        response = await adminService.getAllEvents({
          status: 'Pending',
          pageNumber: currentPage,
          pageSize,
          sortBy: 'CreatedAt',
          sortOrder: 'desc'
        });
        console.log('✅ Used /admin/events?status=Pending endpoint');
      }

      console.log('✅ Pending events response:', response);
      console.log('📊 Response structure:', {
        fullResponse: response,
        data: response.data,
        'data.data': response.data?.data,
        'data.data.Events': response.data?.data?.Events,
        'data.data.events': response.data?.data?.events,
        'data.events': response.data?.events
      });

      // Cấu trúc response từ AdminController (với camelCase serializer):
      // { data: { success, message, data: { events, totalCount, totalPages } } }
      const responseData = response.data;
      let eventsData;
      
      if (responseData?.data) {
        // Có wrap: { success, message, data: { events, totalCount, totalPages } }
        eventsData = responseData.data;
      } else if (responseData?.events) {
        // Không có wrap, dữ liệu ở ngay responseData
        eventsData = responseData;
      } else {
        // Fallback: thử tìm ở các vị trí khác
        eventsData = responseData;
      }

      // Với camelCase serializer, properties sẽ là: events, totalCount, totalPages
      const eventsList = eventsData?.Events || eventsData?.events || [];
      const total = eventsData?.TotalCount ?? eventsData?.totalCount ?? 0;
      const pages = eventsData?.TotalPages ?? eventsData?.totalPages ?? 0;

      console.log('📦 Parsed data:', {
        eventsCount: eventsList.length,
        totalCount: total,
        totalPages: pages
      });

      setEvents(eventsList);
      setTotalCount(total);
      setTotalPages(pages);
    } catch (err) {
      console.error('❌ Error fetching pending events:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        url: err.config?.url
      });
      
      let errorMessage = 'Không thể tải danh sách sự kiện chờ duyệt. ';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage += 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (err.response.status === 403) {
          errorMessage += 'Bạn không có quyền truy cập. Vui lòng đăng nhập với tài khoản Admin.';
        } else if (err.response.status === 404) {
          errorMessage += `Endpoint không tồn tại (404). URL: ${err.config?.url || 'unknown'}. `;
          errorMessage += 'Vui lòng kiểm tra backend đã được restart và route đã được đăng ký chưa.';
        } else {
          errorMessage += err.response.data?.message || err.response.data?.error || `Status: ${err.response.status}`;
        }
      } else if (err.request) {
        errorMessage += 'Không thể kết nối đến server. Vui lòng kiểm tra Backend đã chạy chưa.';
      } else {
        errorMessage += err.message || 'Unknown error';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setDetailDialogOpen(true);
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleApprove = async (eventId, eventTitle) => {
    if (!window.confirm(`Bạn có chắc chắn muốn duyệt sự kiện "${eventTitle}"?`)) {
      return;
    }

    setApproving(true);
    try {
      const response = await adminService.approveEvent(eventId);
      alert(response.data?.message || 'Duyệt sự kiện thành công!');
      fetchPendingEvents(); // Refresh danh sách
    } catch (err) {
      console.error('❌ Error approving event:', err);
      const errorMsg = err.response?.data?.message || 'Không thể duyệt sự kiện. Vui lòng thử lại.';
      alert(errorMsg);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (eventId, eventTitle) => {
    if (!window.confirm(`Bạn có chắc chắn muốn từ chối duyệt sự kiện "${eventTitle}"?`)) {
      return;
    }

    setRejecting(true);
    try {
      const response = await adminService.rejectEvent(eventId);
      alert(response.data?.message || 'Từ chối duyệt sự kiện thành công!');
      fetchPendingEvents(); // Refresh danh sách
    } catch (err) {
      console.error('❌ Error rejecting event:', err);
      const errorMsg = err.response?.data?.message || 'Không thể từ chối duyệt sự kiện. Vui lòng thử lại.';
      alert(errorMsg);
    } finally {
      setRejecting(false);
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className="admin-users-page">
        <div className="page-header">
          <h1>✅ Duyệt Sự Kiện</h1>
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
        <h1>✅ Duyệt Sự Kiện</h1>
        <div className="header-actions">
          <button onClick={handleLogout} className="btn-secondary">
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-container">
          <div className="error-message">
            <p>❌ {error}</p>
            <button onClick={fetchPendingEvents} className="btn-retry">
              🔄 Thử lại
            </button>
          </div>
        </div>
      )}

      {/* Events Table */}
      {events.length === 0 && !loading ? (
        <div className="no-data">
          <p>📭 Không có sự kiện nào chờ duyệt</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Tên Sự Kiện</th>
                  <th>Người Tạo Sự Kiện</th>
                  <th>Ngày Tạo</th>
                  <th>Xem Chi Tiết</th>
                  <th style={{ textAlign: 'center' }}>Duyệt</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.eventId}>
                    <td>
                      <strong>{event.title}</strong>
                    </td>
                    <td>{event.hostName || 'N/A'}</td>
                    <td>{formatDate(event.createdAt)}</td>
                    <td>
                      <button
                        className="btn-action"
                        style={{
                          background: '#667eea',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                        onClick={() => handleViewDetails(event)}
                      >
                        Xem
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                        <button
                          className="btn-action"
                          style={{
                            background: '#10b981',
                            color: '#fff',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                          onClick={() => handleApprove(event.eventId, event.title)}
                          disabled={approving || rejecting}
                        >
                          {approving ? 'Đang duyệt...' : 'Duyệt'}
                        </button>
                        <button
                          className="btn-action"
                          style={{
                            background: '#dc2626',
                            color: '#fff',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                          onClick={() => handleReject(event.eventId, event.title)}
                          disabled={approving || rejecting}
                        >
                          {rejecting ? 'Đang từ chối...' : 'Không Duyệt'}
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

      {/* Detail Dialog */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={handleCloseDetailDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Chi Tiết Sự Kiện: {selectedEvent?.title}
        </DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <div style={{ padding: '16px 0' }}>
              <div style={{ marginBottom: '16px' }}>
                <strong>Mô tả:</strong>
                <p style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                  {selectedEvent.description || 'Chưa có mô tả'}
                </p>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <strong>Danh mục:</strong>
                <p style={{ marginTop: '8px' }}>{selectedEvent.category || 'N/A'}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong>Chế độ:</strong>
                <p style={{ marginTop: '8px' }}>{selectedEvent.eventMode || 'N/A'}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong>Thời gian bắt đầu:</strong>
                <p style={{ marginTop: '8px' }}>{formatDate(selectedEvent.startTime)}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong>Thời gian kết thúc:</strong>
                <p style={{ marginTop: '8px' }}>{formatDate(selectedEvent.endTime)}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong>Địa điểm:</strong>
                <p style={{ marginTop: '8px' }}>{selectedEvent.location || 'N/A'}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong>Người tạo:</strong>
                <p style={{ marginTop: '8px' }}>{selectedEvent.hostName || 'N/A'}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong>Ngày tạo:</strong>
                <p style={{ marginTop: '8px' }}>{formatDate(selectedEvent.createdAt)}</p>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog} variant="outlined">
            Đóng
          </Button>
          {selectedEvent && (
            <Button 
              onClick={() => {
                handleCloseDetailDialog();
                handleApprove(selectedEvent.eventId, selectedEvent.title);
              }}
              variant="contained"
              color="success"
              disabled={approving}
            >
              Duyệt Sự Kiện
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminEventApprovalPage;

