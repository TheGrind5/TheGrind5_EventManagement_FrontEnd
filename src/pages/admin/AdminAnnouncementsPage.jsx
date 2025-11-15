import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { announcementAPI } from '../../services/apiClient';
import { formatVietnamDateTimeShort } from '../../utils/dateTimeUtils';
import '../../styles/AdminUsers.css';

const AdminAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // Add Announcement modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    content: ''
  });
  const [addFormError, setAddFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await announcementAPI.getAll();
      
      // Handle response format from apiClient
      let announcementsData = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          announcementsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          announcementsData = response.data.data;
        } else if (Array.isArray(response)) {
          announcementsData = response;
        }
      }

      setAnnouncements(announcementsData);
    } catch (err) {
      console.error('❌ Error fetching announcements:', err);
      let errorMessage = 'Không thể tải danh sách thông báo. ';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage += 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (err.response.status === 403) {
          errorMessage += 'Bạn không có quyền truy cập. Vui lòng đăng nhập với tài khoản Admin.';
        } else {
          errorMessage += err.response.data?.message || 'Vui lòng thử lại.';
        }
      } else if (err.request) {
        errorMessage += 'Không thể kết nối đến server. Vui lòng kiểm tra Backend đã chạy chưa.';
      } else {
        errorMessage += err.message || 'Có lỗi xảy ra.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
    setAddFormData({ content: '' });
    setAddFormError(null);
  };

  const handleCloseAddModal = () => {
    if (submitting) return;
    setIsAddModalOpen(false);
    setAddFormData({ content: '' });
    setAddFormError(null);
  };

  const handleAddAnnouncement = async () => {
    if (!addFormData.content.trim()) {
      setAddFormError('Nội dung thông báo không được để trống');
      return;
    }

    if (addFormData.content.trim().length > 1000) {
      setAddFormError('Nội dung thông báo không được vượt quá 1000 ký tự');
      return;
    }

    try {
      setSubmitting(true);
      setAddFormError(null);

      const response = await announcementAPI.create(addFormData.content.trim());
      
      alert(response.message || 'Tạo thông báo thành công');
      handleCloseAddModal();
      fetchAnnouncements();
    } catch (err) {
      console.error('❌ Error creating announcement:', err);
      let errorMessage = 'Có lỗi xảy ra khi tạo thông báo. ';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage += 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (err.response.status === 403) {
          errorMessage += 'Bạn không có quyền tạo thông báo. Vui lòng đăng nhập với tài khoản Admin.';
        } else {
          errorMessage += err.response.data?.message || 'Vui lòng thử lại.';
        }
      } else if (err.request) {
        errorMessage += 'Không thể kết nối đến server. Vui lòng kiểm tra Backend đã chạy chưa.';
      } else {
        errorMessage += err.message || 'Có lỗi xảy ra.';
      }
      
      setAddFormError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (announcementId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
      return;
    }

    try {
      const response = await announcementAPI.delete(announcementId);
      
      alert(response.message || 'Xóa thông báo thành công');
      fetchAnnouncements();
    } catch (err) {
      console.error('❌ Error deleting announcement:', err);
      let errorMessage = 'Có lỗi xảy ra khi xóa thông báo. ';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage += 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (err.response.status === 403) {
          errorMessage += 'Bạn không có quyền xóa thông báo. Vui lòng đăng nhập với tài khoản Admin.';
        } else if (err.response.status === 404) {
          errorMessage += 'Không tìm thấy thông báo.';
        } else {
          errorMessage += err.response.data?.message || 'Vui lòng thử lại.';
        }
      } else if (err.request) {
        errorMessage += 'Không thể kết nối đến server. Vui lòng kiểm tra Backend đã chạy chưa.';
      } else {
        errorMessage += err.message || 'Có lỗi xảy ra.';
      }
      
      alert(errorMessage);
    }
  };

  // Sử dụng formatVietnamDateTimeShort từ dateTimeUtils để đồng bộ UTC+7
  const formatDate = formatVietnamDateTimeShort;

  if (loading && announcements.length === 0) {
    return (
      <div className="admin-users-page">
        <div className="page-header">
          <h1>📢 Quản lý Thông Báo</h1>
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
          <h1>📢 Quản lý Thông Báo</h1>
          <p>Quản lý và theo dõi thông báo hệ thống</p>
        </div>
        <div className="header-actions">
          <button onClick={handleOpenAddModal} className="btn-add-voucher" style={{ backgroundColor: '#FF7A00', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
            ➕ Thêm Thông Báo
          </button>
          <Link to="/admin/dashboard" className="btn-back" style={{ marginRight: '10px' }}>
            ← Về Dashboard
          </Link>
          <button onClick={handleLogout} className="btn-logout">
            🚪 Đăng xuất
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-container">
          <div className="error-message">
            <p>❌ {error}</p>
            <button onClick={fetchAnnouncements} className="btn-retry">
              🔄 Thử lại
            </button>
          </div>
        </div>
      )}

      {/* Announcements Table */}
      {announcements.length === 0 && !loading ? (
        <div className="no-data">
          <p>📭 Chưa có thông báo nào</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Nội dung thông báo</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                <th>Xóa thông báo</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((announcement, index) => (
                <tr key={announcement.announcementId || announcement.AnnouncementId}>
                  <td>{index + 1}</td>
                  <td style={{ maxWidth: '400px', wordWrap: 'break-word' }}>
                    {announcement.content || announcement.Content}
                  </td>
                  <td>{formatDate(announcement.createdAt || announcement.CreatedAt)}</td>
                  <td>
                    <span className={`role-badge ${announcement.isActive || announcement.IsActive ? 'badge-host' : 'badge-default'}`}>
                      {announcement.isActive || announcement.IsActive ? 'Hoạt động' : 'Đã tắt'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(announcement.announcementId || announcement.AnnouncementId)}
                      className="btn-action"
                      style={{
                        background: '#d32f2f',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '14px'
                      }}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Announcement Dialog */}
      <Dialog open={isAddModalOpen} onClose={handleCloseAddModal} maxWidth="md" fullWidth>
        <DialogTitle>Thêm Thông Báo Mới</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Điền Nội Dung thông báo"
            placeholder="Nhập nội dung thông báo (tối đa 1000 ký tự)..."
            value={addFormData.content}
            onChange={(e) => setAddFormData({ ...addFormData, content: e.target.value })}
            error={!!addFormError}
            helperText={addFormError || `${addFormData.content.length}/1000 ký tự`}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddModal} disabled={submitting} variant="outlined">
            Hủy
          </Button>
          <Button 
            onClick={handleAddAnnouncement} 
            disabled={submitting || !addFormData.content.trim()}
            variant="contained"
            style={{ backgroundColor: '#FF7A00' }}
          >
            {submitting ? 'Đang tạo...' : 'Tạo Thông Báo'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminAnnouncementsPage;

