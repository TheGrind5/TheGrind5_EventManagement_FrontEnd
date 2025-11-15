import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { voucherAPI } from '../../services/apiClient';
import '../../styles/AdminVouchers.css';

const AdminVouchersPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'expired'

  // Delete voucher modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState(null);

  // Add Voucher modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    voucherCode: '',
    discountPercentage: '',
    validTo: ''
  });
  const [addFormError, setAddFormError] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    fetchVouchers();
  }, [searchTerm, statusFilter]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = {};
      if (searchTerm) {
        filters.searchCode = searchTerm;
      }
      if (statusFilter === 'active') {
        filters.isActive = true;
      }

      const response = await voucherAPI.getAll(filters);
      
      // Handle response format from apiClient
      // apiClient wraps response in { success, data, message, timestamp }
      // Backend returns array of vouchers
      let vouchersData = [];
      if (response && response.data) {
        // If response.data is an array, use it directly
        if (Array.isArray(response.data)) {
          vouchersData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          vouchersData = response.data.data;
        } else if (Array.isArray(response)) {
          vouchersData = response;
        }
      }
      
      // Apply client-side filtering for expired status
      let filteredVouchers = vouchersData;
      if (statusFilter === 'expired') {
        const now = new Date();
        filteredVouchers = vouchersData.filter(v => {
          const validTo = new Date(v.validTo);
          return validTo < now;
        });
      } else if (statusFilter === 'active') {
        // Filter for active and not expired
        const now = new Date();
        filteredVouchers = vouchersData.filter(v => {
          const validFrom = new Date(v.validFrom);
          const validTo = new Date(v.validTo);
          return v.isActive && now >= validFrom && now <= validTo;
        });
      }

      setVouchers(filteredVouchers);
    } catch (err) {
      console.error('❌ Error fetching vouchers:', err);
      
      let errorMessage = 'Không thể tải danh sách voucher. ';
      
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
        errorMessage += err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getVoucherStatus = (voucher) => {
    const now = new Date();
    const validFrom = new Date(voucher.validFrom);
    const validTo = new Date(voucher.validTo);
    
    if (!voucher.isActive) {
      return { text: 'Vô hiệu hóa', class: 'badge-inactive' };
    }
    
    if (now < validFrom) {
      return { text: 'Chưa bắt đầu', class: 'badge-pending' };
    }
    
    if (now > validTo) {
      return { text: 'Đã hết hạn', class: 'badge-expired' };
    }
    
    if (now >= validFrom && now <= validTo) {
      return { text: 'Đang áp dụng', class: 'badge-active' };
    }
    
    return { text: 'Không xác định', class: 'badge-default' };
  };

  const handleSearch = (e) => {
    e.preventDefault();
      fetchVouchers();
  };

  const handleOpenDeleteModal = (voucher) => {
    setVoucherToDelete(voucher);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setVoucherToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!voucherToDelete) return;

    try {
      setError(null);
      await voucherAPI.delete(voucherToDelete.voucherId);
      
      alert('Xóa voucher thành công!');
      handleCloseDeleteModal();
      
      // Refresh danh sách voucher
      fetchVouchers();
    } catch (err) {
      console.error('❌ Error deleting voucher:', err);
      let errorMessage = 'Không thể xóa voucher. ';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage += 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (err.response.status === 403) {
          errorMessage += 'Bạn không có quyền xóa voucher. Vui lòng đăng nhập với tài khoản Admin.';
        } else if (err.response.status === 404) {
          errorMessage += 'Voucher không tồn tại.';
        } else {
          errorMessage += err.response.data?.message || 'Vui lòng thử lại.';
        }
      } else if (err.request) {
        errorMessage += 'Không thể kết nối đến server. Vui lòng kiểm tra Backend đã chạy chưa.';
      } else {
        errorMessage += err.message || 'Có lỗi xảy ra.';
      }
      
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  const handleOpenAddModal = () => {
    setAddFormData({
      voucherCode: '',
      discountPercentage: '',
      validTo: ''
    });
    setAddFormError(null);
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setAddFormData({
      voucherCode: '',
      discountPercentage: '',
      validTo: ''
    });
    setAddFormError(null);
  };

  const handleAddVoucherSubmit = async (e) => {
    e.preventDefault();
    setAddFormError(null);

    try {
      // Validate form
      if (!addFormData.voucherCode || !addFormData.voucherCode.trim()) {
        setAddFormError('Vui lòng nhập mã voucher');
        return;
      }

      const discountValue = parseFloat(addFormData.discountPercentage);
      if (!addFormData.discountPercentage || isNaN(discountValue) || discountValue < 1 || discountValue > 100) {
        setAddFormError('Giá trị voucher phải từ 1% đến 100%');
        return;
      }

      if (!addFormData.validTo) {
        setAddFormError('Vui lòng chọn ngày hết hạn');
        return;
      }

      // Ngày bắt đầu = thời điểm hiện tại
      const validFrom = new Date();
      
      // Parse ngày hết hạn (format: yyyy-mm-dd) và set giờ là 23:59:59
      // Parse date string thành local date để tránh timezone shift
      const [year, month, day] = addFormData.validTo.split('-').map(Number);
      const validToDate = new Date(year, month - 1, day, 23, 59, 59, 999); // month is 0-indexed
      const validTo = validToDate;

      // Kiểm tra ngày hết hạn phải sau ngày bắt đầu
      // So sánh ngày (không tính giờ) để cho phép tạo voucher hết hạn trong tương lai
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const validToDateOnly = new Date(year, month - 1, day);
      validToDateOnly.setHours(0, 0, 0, 0);
      
      if (validToDateOnly < today) {
        setAddFormError('Ngày hết hạn không được là ngày trong quá khứ');
        return;
      }

      // Kiểm tra thời gian hết hạn phải sau thời điểm hiện tại
      if (validTo <= validFrom) {
        setAddFormError('Ngày hết hạn phải sau thời điểm hiện tại');
        return;
      }

      // Chuẩn bị dữ liệu gửi lên backend
      const voucherData = {
        voucherCode: addFormData.voucherCode.trim().toUpperCase(),
        discountPercentage: discountValue,
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
        isActive: true
      };

      console.log('📤 Creating voucher:', voucherData);

      // Gọi API create voucher
      const response = await voucherAPI.create(voucherData);
      
      console.log('✅ Voucher created:', response);

      // Thông báo thành công
      alert('Tạo voucher thành công!');
      
      // Đóng modal và reset form
      handleCloseAddModal();
      
      // Reset filter về 'all' và searchTerm về '' để đảm bảo voucher mới hiển thị
      setStatusFilter('all');
      setSearchTerm('');
      
      // Refresh danh sách voucher (useEffect sẽ tự động gọi fetchVouchers khi filter thay đổi)
      // Nhưng để đảm bảo, ta vẫn gọi trực tiếp
      await fetchVouchers();
    } catch (err) {
      console.error('❌ Error creating voucher:', err);
      let errorMessage = 'Không thể tạo voucher. ';
      
      if (err.response) {
        if (err.response.status === 400) {
          // Validation error từ backend
          const errorData = err.response.data;
          if (errorData?.errors) {
            // Nếu có nhiều lỗi validation
            const errorMessages = Object.values(errorData.errors).flat();
            errorMessage += errorMessages.join(', ');
          } else if (errorData?.message) {
            errorMessage += errorData.message;
          } else {
            errorMessage += 'Dữ liệu không hợp lệ.';
          }
        } else if (err.response.status === 401) {
          errorMessage += 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (err.response.status === 403) {
          errorMessage += 'Bạn không có quyền tạo voucher. Vui lòng đăng nhập với tài khoản Admin.';
        } else {
          errorMessage += err.response.data?.message || 'Vui lòng thử lại.';
        }
      } else if (err.request) {
        errorMessage += 'Không thể kết nối đến server. Vui lòng kiểm tra Backend đã chạy chưa.';
      } else {
        errorMessage += err.message || 'Có lỗi xảy ra.';
      }
      
      setAddFormError(errorMessage);
    }
  };

  if (loading && vouchers.length === 0) {
    return (
      <div className="admin-vouchers-page">
        <div className="page-header">
          <h1>🎫 Quản lý Voucher</h1>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải danh sách...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-vouchers-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>🎫 Quản lý Voucher</h1>
          <p>Quản lý và theo dõi voucher trong hệ thống</p>
        </div>
        <div className="header-actions">
          <button onClick={handleOpenAddModal} className="btn-add-voucher">
            ➕ Add Voucher
          </button>
          <Link to="/admin/users" className="btn-back">
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
            placeholder="🔍 Tìm theo mã voucher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn-search">
            Tìm kiếm
          </button>
        </form>

        <div className="filter-tabs">
          <button
            onClick={() => setStatusFilter('all')}
            className={statusFilter === 'all' ? 'filter-tab active' : 'filter-tab'}
          >
            📋 Tất cả ({vouchers.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={statusFilter === 'active' ? 'filter-tab active' : 'filter-tab'}
          >
            ✅ Đang áp dụng
          </button>
          <button
            onClick={() => setStatusFilter('expired')}
            className={statusFilter === 'expired' ? 'filter-tab active' : 'filter-tab'}
          >
            ⏰ Đã hết hạn
          </button>
        </div>
      </div>

            {error && (
        <div className="error-message">
          <h3>⚠️ Lỗi tải dữ liệu</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={fetchVouchers} className="btn-retry">
              🔄 Thử lại
            </button>
          </div>
        </div>
      )}

      {/* Vouchers Table */}
      {vouchers.length === 0 && !loading ? (
        <div className="no-data">
          <p>📭 Không tìm thấy voucher nào</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="vouchers-table">
              <thead>
                <tr>
                  <th>Mã Voucher</th>
                  <th>Giá trị</th>
                  <th>Ngày bắt đầu</th>
                  <th>Ngày kết thúc</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((voucher) => {
                  const status = getVoucherStatus(voucher);
                  return (
                    <tr key={voucher.voucherId}>
                      <td>
                        <div className="voucher-code">
                          <strong>{voucher.voucherCode}</strong>
                            {voucher.description && (
                            <div className="voucher-description">{voucher.description}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="discount-value">
                          {voucher.discountPercentage}%
                        </span>
                      </td>
                      <td>{formatDate(voucher.validFrom)}</td>
                      <td>{formatDate(voucher.validTo)}</td>
                      <td>
                        <span className={`status-badge ${status.class}`}>
                          {status.text}
                        </span>
                      </td>
                      <td>
                        {status.text === 'Đã hết hạn' ? (
                          <button
                            onClick={() => handleOpenDeleteModal(voucher)}
                            className="btn-delete"
                          >
                            🗑️ Xóa
                          </button>
                        ) : (
                          <span className="no-action">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Delete Voucher Confirmation Modal */}
      {isDeleteModalOpen && voucherToDelete && (
        <div className="modal-overlay" onClick={handleCloseDeleteModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🗑️ Xác nhận xóa Voucher</h2>
              <button onClick={handleCloseDeleteModal} className="btn-close">×</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn xóa voucher <strong>{voucherToDelete.voucherCode}</strong>?</p>
              <div className="voucher-info-delete">
                <div className="info-row">
                  <span className="info-label">Giá trị:</span>
                  <span className="info-value">{voucherToDelete.discountPercentage}%</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Ngày hết hạn:</span>
                  <span className="info-value">{formatDate(voucherToDelete.validTo)}</span>
                </div>
              </div>
              <div className="alert alert-warning">
                <strong>⚠️ Lưu ý:</strong> Hành động này không thể hoàn tác. Voucher sẽ bị xóa vĩnh viễn khỏi hệ thống.
              </div>
              <div className="modal-actions">
                <button type="button" onClick={handleCloseDeleteModal} className="btn-cancel">
                  Hủy
                </button>
                <button type="button" onClick={handleDeleteConfirm} className="btn-delete-confirm">
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Voucher Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={handleCloseAddModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Tạo Voucher Mới</h2>
              <button onClick={handleCloseAddModal} className="btn-close">×</button>
            </div>
            <div className="modal-body">
              {addFormError && (
                <div className="alert alert-danger">
                  {addFormError}
                </div>
              )}
              <form onSubmit={handleAddVoucherSubmit}>
                <div className="form-group">
                  <label htmlFor="voucherCode">
                    Mã Voucher <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="voucherCode"
                    placeholder="Ví dụ: VOUCHER20"
                    value={addFormData.voucherCode}
                    onChange={(e) => setAddFormData({ ...addFormData, voucherCode: e.target.value.toUpperCase() })}
                    required
                    autoFocus
                  />
                  <small>Mã voucher sẽ được chuyển thành chữ hoa tự động</small>
                </div>

                <div className="form-group">
                  <label htmlFor="discountPercentage">
                    Giá trị Voucher (% giảm giá) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id="discountPercentage"
                    placeholder="Ví dụ: 20 (nghĩa là giảm 20%)"
                    value={addFormData.discountPercentage}
                    onChange={(e) => setAddFormData({ ...addFormData, discountPercentage: e.target.value })}
                    min="1"
                    max="100"
                    step="0.01"
                    required
                  />
                  <small>Giá trị từ 1% đến 100%</small>
                </div>

                <div className="form-group">
                  <label htmlFor="validTo">
                    Ngày hết hạn <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="validTo"
                    value={addFormData.validTo}
                    onChange={(e) => setAddFormData({ ...addFormData, validTo: e.target.value })}
                    required
                    min={new Date().toISOString().split('T')[0]} // Không cho chọn ngày trong quá khứ
                  />
                  <small>Ngày bắt đầu sẽ tự động là thời điểm hiện tại. Voucher sẽ hết hạn vào cuối ngày đã chọn (23:59:59)</small>
                </div>

                <div className="form-info">
                  <p><strong>ℹ️ Thông tin:</strong></p>
                  <ul>
                    <li>Ngày bắt đầu: Tự động là thời điểm admin tạo voucher</li>
                    <li>Voucher sẽ tự động được kích hoạt (IsActive = true)</li>
                    <li>Mã voucher phải là duy nhất trong hệ thống</li>
                  </ul>
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={handleCloseAddModal} className="btn-cancel">
                    Hủy
                  </button>
                  <button type="submit" className="btn-primary">
                    Tạo Voucher
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVouchersPage;
