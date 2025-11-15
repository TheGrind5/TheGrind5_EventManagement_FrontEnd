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
    validTo: '',
    isActive: true // Default là active
  });
  const [addFormError, setAddFormError] = useState(null);

  // Edit Voucher modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    voucherId: null,
    discountPercentage: '',
    validFrom: '',
    validTo: '',
    isActive: true,
    maxUsageCount: '',
    minOrderAmount: '',
    description: ''
  });
  const [editFormError, setEditFormError] = useState(null);

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
      
      console.log('📦 Voucher API Response:', response);
      
      // Handle response format from apiClient
      // apiClient wraps response in { success, data, message, timestamp }
      // Backend returns array of vouchers wrapped in { success: true, data: [...], message: "...", timestamp: "..." }
      let vouchersData = [];
      
      if (response) {
        // Check if response.data exists and is an array
        if (Array.isArray(response.data)) {
          vouchersData = response.data;
        } 
        // If response.data is an object with a data property (nested)
        else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          vouchersData = response.data.data;
        }
        // If response itself is an array (direct response)
        else if (Array.isArray(response)) {
          vouchersData = response;
        }
        // If response.data is an object but not an array, try to extract items
        else if (response.data && typeof response.data === 'object') {
          // Try common property names
          if (Array.isArray(response.data.items)) {
            vouchersData = response.data.items;
          } else if (Array.isArray(response.data.vouchers)) {
            vouchersData = response.data.vouchers;
          }
        }
      }
      
      console.log('📋 Extracted vouchers:', vouchersData);
      
      // Debug: Log first voucher to check structure
      if (vouchersData.length > 0) {
        const firstVoucher = vouchersData[0];
        console.log('🔍 First voucher structure:', firstVoucher);
        console.log('🔍 isActive value:', firstVoucher.isActive, 'Type:', typeof firstVoucher.isActive);
        console.log('🔍 IsActive value:', firstVoucher.IsActive, 'Type:', typeof firstVoucher.IsActive);
        console.log('🔍 All keys:', Object.keys(firstVoucher));
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
          const isActive = v.isActive !== undefined ? v.isActive : v.IsActive;
          const validFrom = new Date(v.validFrom || v.ValidFrom);
          const validTo = new Date(v.validTo || v.ValidTo);
          return (isActive === true || isActive === 1) && now >= validFrom && now <= validTo;
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

  // Calculate statistics
  const calculateStats = () => {
    const now = new Date();
    let total = vouchers.length;
    let active = 0;
    let inactive = 0;
    let expired = 0;
    let pending = 0;

    vouchers.forEach(voucher => {
      const isActive = voucher.isActive !== undefined 
        ? voucher.isActive 
        : (voucher.IsActive !== undefined ? voucher.IsActive : true);
      const isActiveBool = isActive === true || isActive === 1 || isActive === 'true';
      
      if (!isActiveBool) {
        inactive++;
      } else {
        const validFrom = new Date(voucher.validFrom || voucher.ValidFrom);
        const validTo = new Date(voucher.validTo || voucher.ValidTo);
        
        if (now < validFrom) {
          pending++;
        } else if (now > validTo) {
          expired++;
        } else if (now >= validFrom && now <= validTo) {
          active++;
        }
      }
    });

    return { total, active, inactive, expired, pending };
  };

  const stats = calculateStats();

  const getVoucherStatus = (voucher) => {
    // Backend trả về camelCase (isActive) do cấu hình JsonNamingPolicy.CamelCase
    // Nhưng cũng kiểm tra PascalCase để an toàn
    const isActive = voucher.isActive !== undefined ? voucher.isActive : 
                     (voucher.IsActive !== undefined ? voucher.IsActive : false);
    
    // Debug log for troubleshooting (chỉ log khi có vấn đề)
    const voucherCode = voucher.voucherCode || voucher.VoucherCode || 'Unknown';
    
    // Convert to boolean for consistent checking
    // Handle: boolean true/false, number 1/0, string "true"/"false", null, undefined
    // Nếu undefined hoặc null, mặc định là false
    let isActiveBool = false;
    
    if (isActive === true || isActive === 1 || isActive === 'true' || isActive === 'True' || isActive === '1') {
      isActiveBool = true;
    } else if (isActive === false || isActive === 0 || isActive === 'false' || isActive === 'False' || isActive === '0') {
      isActiveBool = false;
    } else if (isActive === null || isActive === undefined) {
      isActiveBool = false; // Mặc định là false nếu null/undefined
    }
    
    // Debug log chỉ khi có vấn đề (isActiveBool = false nhưng mong đợi true)
    if (isActiveBool === false && (voucher.isActive === true || voucher.IsActive === true)) {
      console.warn(`⚠️ Voucher ${voucherCode} có vấn đề với isActive:`, {
        isActive: isActive,
        isActiveType: typeof isActive,
        isActiveBool: isActiveBool,
        voucherIsActive: voucher.isActive,
        voucherIsActivePascal: voucher.IsActive,
        allKeys: Object.keys(voucher)
      });
    }
    
    // Nếu không active, trả về ngay (không cần kiểm tra thời gian)
    if (!isActiveBool) {
      return { text: 'Chưa hoạt động', class: 'badge-inactive' };
    }
    
    // Chỉ kiểm tra thời gian nếu isActive = true
    // Sử dụng UTC để so sánh với backend (backend dùng DateTime.UtcNow)
    const now = new Date();
    const validFrom = new Date(voucher.validFrom || voucher.ValidFrom);
    const validTo = new Date(voucher.validTo || voucher.ValidTo);
    
    // Convert to UTC để so sánh chính xác với backend
    const nowUTC = new Date(now.toISOString());
    const validFromUTC = new Date(validFrom.toISOString());
    const validToUTC = new Date(validTo.toISOString());
    
    // Kiểm tra thời gian với UTC
    if (nowUTC < validFromUTC) {
      return { text: 'Chưa bắt đầu', class: 'badge-pending' };
    }
    
    if (nowUTC > validToUTC) {
      return { text: 'Đã hết hạn', class: 'badge-expired' };
    }
    
    // Nếu active và trong thời gian hợp lệ
    if (nowUTC >= validFromUTC && nowUTC <= validToUTC) {
      return { text: 'Đang hoạt động', class: 'badge-active' };
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

  const handleOpenEditModal = (voucher) => {
    // Format dates for input fields (yyyy-mm-dd)
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Format datetime for datetime-local input
    const formatDateTimeForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setEditFormData({
      voucherId: voucher.voucherId || voucher.VoucherId,
      discountPercentage: voucher.discountPercentage || '',
      validFrom: formatDateTimeForInput(voucher.validFrom || voucher.ValidFrom),
      validTo: formatDateTimeForInput(voucher.validTo || voucher.ValidTo),
      isActive: voucher.isActive !== undefined ? voucher.isActive : (voucher.IsActive !== undefined ? voucher.IsActive : true),
      maxUsageCount: voucher.maxUsageCount || voucher.MaxUsageCount || '',
      minOrderAmount: voucher.minOrderAmount || voucher.MinOrderAmount || '',
      description: voucher.description || voucher.Description || ''
    });
    setEditFormError(null);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditFormData({
      voucherId: null,
      discountPercentage: '',
      validFrom: '',
      validTo: '',
      isActive: true,
      maxUsageCount: '',
      minOrderAmount: '',
      description: ''
    });
    setEditFormError(null);
  };

  const handleEditVoucherSubmit = async (e) => {
    e.preventDefault();
    setEditFormError(null);

    try {
      // Validate form
      const discountValue = parseFloat(editFormData.discountPercentage);
      if (!editFormData.discountPercentage || isNaN(discountValue) || discountValue < 1 || discountValue > 100) {
        setEditFormError('Giá trị voucher phải từ 1% đến 100%');
        return;
      }

      if (!editFormData.validFrom) {
        setEditFormError('Vui lòng chọn ngày bắt đầu');
        return;
      }

      if (!editFormData.validTo) {
        setEditFormError('Vui lòng chọn ngày hết hạn');
        return;
      }

      const validFrom = new Date(editFormData.validFrom);
      const validTo = new Date(editFormData.validTo);

      if (validTo <= validFrom) {
        setEditFormError('Ngày hết hạn phải sau ngày bắt đầu');
        return;
      }

      // Chuẩn bị dữ liệu gửi lên backend
      const voucherData = {
        discountPercentage: discountValue,
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
        isActive: editFormData.isActive
      };

      // Chỉ gửi các field có giá trị
      if (editFormData.maxUsageCount !== '') {
        const maxUsage = parseInt(editFormData.maxUsageCount);
        if (!isNaN(maxUsage) && maxUsage > 0) {
          voucherData.maxUsageCount = maxUsage;
        }
      }

      if (editFormData.minOrderAmount !== '') {
        const minOrder = parseFloat(editFormData.minOrderAmount);
        if (!isNaN(minOrder) && minOrder >= 0) {
          voucherData.minOrderAmount = minOrder;
        }
      }

      if (editFormData.description && editFormData.description.trim()) {
        voucherData.description = editFormData.description.trim();
      }

      console.log('📤 Updating voucher:', voucherData);

      // Gọi API update voucher
      const response = await voucherAPI.update(editFormData.voucherId, voucherData);
      
      console.log('✅ Voucher updated:', response);

      // Thông báo thành công
      alert('Cập nhật voucher thành công!');
      
      // Đóng modal và reset form
      handleCloseEditModal();
      
      // Refresh danh sách voucher
      fetchVouchers();
    } catch (err) {
      console.error('❌ Error updating voucher:', err);
      let errorMessage = 'Không thể cập nhật voucher. ';
      
      if (err.response) {
        if (err.response.status === 400) {
          const errorData = err.response.data;
          if (errorData?.errors) {
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
          errorMessage += 'Bạn không có quyền cập nhật voucher. Vui lòng đăng nhập với tài khoản Admin.';
        } else if (err.response.status === 404) {
          errorMessage += 'Voucher không tồn tại.';
        } else if (err.response.status === 500) {
          const errorData = err.response.data;
          if (errorData?.message) {
            errorMessage += errorData.message;
          } else {
            errorMessage += 'Lỗi server. Vui lòng kiểm tra console log để xem chi tiết.';
          }
          console.error('❌ Full error response:', err.response);
        } else {
          errorMessage += err.response.data?.message || 'Vui lòng thử lại.';
        }
      } else if (err.request) {
        errorMessage += 'Không thể kết nối đến server. Vui lòng kiểm tra Backend đã chạy chưa.';
      } else {
        errorMessage += err.message || 'Có lỗi xảy ra.';
      }
      
      console.error('❌ Full error object:', err);
      setEditFormError(errorMessage);
    }
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
      validTo: '',
      isActive: true // Default là active
    });
    setAddFormError(null);
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setAddFormData({
      voucherCode: '',
      discountPercentage: '',
      validTo: '',
      isActive: true
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

      // Nếu isActive = true, voucher phải dùng được ngay lập tức
      const now = new Date();
      let validFrom = new Date();
      let validTo;
      
      // Parse ngày hết hạn (format: yyyy-mm-dd) và set giờ là 23:59:59
      const [year, month, day] = addFormData.validTo.split('-').map(Number);
      const validToDate = new Date(year, month - 1, day, 23, 59, 59, 999); // month is 0-indexed
      validTo = validToDate;

      // Kiểm tra nếu isActive = true
      if (addFormData.isActive) {
        // Nếu active, validFrom phải <= now (để có thể dùng ngay)
        // validFrom đã = now nên OK
        
        // validTo phải >= now (để voucher còn hiệu lực)
        if (validTo < now) {
          setAddFormError('Nếu voucher đang hoạt động, ngày hết hạn phải sau thời điểm hiện tại');
          return;
        }
        
        // Đảm bảo validTo > validFrom
        if (validTo <= validFrom) {
          setAddFormError('Ngày hết hạn phải sau thời điểm hiện tại');
          return;
        }
      } else {
        // Nếu không active, có thể để validFrom trong tương lai
        // Nhưng vẫn cần validTo > validFrom
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const validToDateOnly = new Date(year, month - 1, day);
        validToDateOnly.setHours(0, 0, 0, 0);
        
        if (validToDateOnly < today) {
          setAddFormError('Ngày hết hạn không được là ngày trong quá khứ');
          return;
        }

        if (validTo <= validFrom) {
          setAddFormError('Ngày hết hạn phải sau thời điểm hiện tại');
          return;
        }
      }

      // Chuẩn bị dữ liệu gửi lên backend
      const voucherData = {
        voucherCode: addFormData.voucherCode.trim().toUpperCase(),
        discountPercentage: discountValue,
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
        isActive: addFormData.isActive // Sử dụng giá trị từ form
      };

      // Log để debug
      console.log('📤 Creating voucher with validation:', {
        isActive: addFormData.isActive,
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
        now: now.toISOString(),
        canUseNow: addFormData.isActive && validFrom <= now && validTo >= now
      });

      console.log('📤 Creating voucher:', voucherData);

      // Gọi API create voucher
      const response = await voucherAPI.create(voucherData);
      
      console.log('✅ Voucher created - Full response:', JSON.stringify(response, null, 2));
      console.log('✅ Voucher created - Response data:', response?.data);
      console.log('✅ Voucher created - Response.data.data:', response?.data?.data);
      
      // apiClient có thể wrap response, cần extract đúng
      // Response format từ apiClient: { success, data, message, timestamp }
      // Backend trả về: { success: true, data: { voucherDTO }, message: "...", timestamp: "..." }
      let createdVoucher = null;
      
      if (response?.data?.data) {
        // Nested data (backend response wrapped by apiClient)
        createdVoucher = response.data.data;
      } else if (response?.data) {
        // Direct data
        createdVoucher = response.data;
      } else if (response) {
        // Response itself
        createdVoucher = response;
      }
      
      if (createdVoucher) {
        const isActiveValue = createdVoucher.isActive !== undefined ? createdVoucher.isActive : 
                             (createdVoucher.IsActive !== undefined ? createdVoucher.IsActive : false);
        console.log('✅ Created voucher details:', {
          voucherCode: createdVoucher.voucherCode || createdVoucher.VoucherCode,
          isActive: isActiveValue,
          isActiveType: typeof isActiveValue,
          allKeys: Object.keys(createdVoucher)
        });
        
        if (addFormData.isActive && !isActiveValue) {
          console.error('❌ ERROR: Voucher was created with isActive=false but form had isActive=true');
          console.error('❌ Created voucher object:', createdVoucher);
          alert('⚠️ Cảnh báo: Voucher được tạo nhưng có thể không ở trạng thái hoạt động. Vui lòng kiểm tra lại trong database.');
        } else if (addFormData.isActive && isActiveValue) {
          console.log('✅ Voucher created successfully with isActive=true');
        }
      } else {
        console.warn('⚠️ Could not extract created voucher from response');
      }

      // Thông báo thành công
      alert('Tạo voucher thành công!');
      
      // Đóng modal và reset form
      handleCloseAddModal();
      
      // Refresh danh sách voucher sau 500ms để đảm bảo database đã commit
      setTimeout(() => {
        fetchVouchers();
      }, 500);
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
        } else if (err.response.status === 500) {
          // Server error - extract detailed message
          const errorData = err.response.data;
          if (errorData?.message) {
            errorMessage += errorData.message;
          } else if (errorData?.data) {
            errorMessage += errorData.data;
          } else {
            errorMessage += 'Lỗi server. Vui lòng kiểm tra console log để xem chi tiết.';
          }
          
          // Log full error for debugging
          console.error('❌ Full error response:', err.response);
        } else {
          errorMessage += err.response.data?.message || 'Vui lòng thử lại.';
        }
      } else if (err.request) {
        errorMessage += 'Không thể kết nối đến server. Vui lòng kiểm tra Backend đã chạy chưa.';
      } else {
        errorMessage += err.message || 'Có lỗi xảy ra.';
      }
      
      console.error('❌ Full error object:', err);
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

      {/* Statistics Cards */}
      <div className="stats-container">
        <div className="stat-card stat-total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Tổng số voucher</div>
          </div>
        </div>
        <div className="stat-card stat-active">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Đang hoạt động</div>
          </div>
        </div>
        <div className="stat-card stat-inactive">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-value">{stats.inactive}</div>
            <div className="stat-label">Chưa hoạt động</div>
          </div>
        </div>
        <div className="stat-card stat-expired">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <div className="stat-value">{stats.expired}</div>
            <div className="stat-label">Đã hết hạn</div>
          </div>
        </div>
        <div className="stat-card stat-pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Chưa bắt đầu</div>
          </div>
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
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenEditModal(voucher)}
                            className="btn-edit"
                            title="Chỉnh sửa voucher"
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(voucher)}
                            className="btn-delete"
                            title="Xóa voucher"
                          >
                            🗑️ Xóa
                          </button>
                        </div>
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

                <div className="form-group">
                  <label htmlFor="isActive">
                    Trạng thái <span className="required">*</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={addFormData.isActive}
                      onChange={(e) => setAddFormData({ ...addFormData, isActive: e.target.checked })}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <label htmlFor="isActive" style={{ cursor: 'pointer', margin: 0 }}>
                      Kích hoạt voucher (IsActive)
                    </label>
                  </div>
                  <small>
                    {addFormData.isActive 
                      ? '⚠️ Voucher sẽ được kích hoạt ngay lập tức và có thể sử dụng ngay. Ngày hết hạn phải sau thời điểm hiện tại.'
                      : 'Bỏ chọn nếu muốn tạo voucher ở trạng thái không kích hoạt (có thể kích hoạt sau)'}
                  </small>
                </div>

                <div className="form-info">
                  <p><strong>ℹ️ Thông tin:</strong></p>
                  <ul>
                    <li>Ngày bắt đầu: Tự động là thời điểm admin tạo voucher</li>
                    <li>
                      {addFormData.isActive 
                        ? '✅ Nếu tick "Kích hoạt voucher": Voucher sẽ ở trạng thái "Đang hoạt động" và có thể sử dụng ngay lập tức'
                        : '⏸️ Nếu không tick: Voucher sẽ ở trạng thái "Chưa hoạt động" và không thể sử dụng cho đến khi được kích hoạt'}
                    </li>
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

      {/* Edit Voucher Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Chỉnh sửa Voucher</h2>
              <button onClick={handleCloseEditModal} className="btn-close">×</button>
            </div>
            <div className="modal-body">
              {editFormError && (
                <div className="alert alert-danger">
                  {editFormError}
                </div>
              )}
              <form onSubmit={handleEditVoucherSubmit}>
                <div className="form-group">
                  <label htmlFor="editDiscountPercentage">
                    Giá trị Voucher (% giảm giá) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id="editDiscountPercentage"
                    placeholder="Ví dụ: 20 (nghĩa là giảm 20%)"
                    value={editFormData.discountPercentage}
                    onChange={(e) => setEditFormData({ ...editFormData, discountPercentage: e.target.value })}
                    min="1"
                    max="100"
                    step="0.01"
                    required
                  />
                  <small>Giá trị từ 1% đến 100%</small>
                </div>

                <div className="form-group">
                  <label htmlFor="editValidFrom">
                    Ngày bắt đầu <span className="required">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="editValidFrom"
                    value={editFormData.validFrom}
                    onChange={(e) => setEditFormData({ ...editFormData, validFrom: e.target.value })}
                    required
                  />
                  <small>Chọn ngày và giờ bắt đầu áp dụng voucher</small>
                </div>

                <div className="form-group">
                  <label htmlFor="editValidTo">
                    Ngày hết hạn <span className="required">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="editValidTo"
                    value={editFormData.validTo}
                    onChange={(e) => setEditFormData({ ...editFormData, validTo: e.target.value })}
                    required
                  />
                  <small>Chọn ngày và giờ hết hạn voucher</small>
                </div>

                <div className="form-group">
                  <label htmlFor="editIsActive">
                    Trạng thái <span className="required">*</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                    <input
                      type="checkbox"
                      id="editIsActive"
                      checked={editFormData.isActive}
                      onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <label htmlFor="editIsActive" style={{ cursor: 'pointer', margin: 0 }}>
                      Kích hoạt voucher (IsActive)
                    </label>
                  </div>
                  <small>Bỏ chọn nếu muốn tắt voucher</small>
                </div>

                <div className="form-group">
                  <label htmlFor="editMaxUsageCount">
                    Số lần sử dụng tối đa
                  </label>
                  <input
                    type="number"
                    id="editMaxUsageCount"
                    placeholder="Để trống = không giới hạn"
                    value={editFormData.maxUsageCount}
                    onChange={(e) => setEditFormData({ ...editFormData, maxUsageCount: e.target.value })}
                    min="1"
                  />
                  <small>Để trống nếu không muốn giới hạn số lần sử dụng</small>
                </div>

                <div className="form-group">
                  <label htmlFor="editMinOrderAmount">
                    Giá trị đơn hàng tối thiểu
                  </label>
                  <input
                    type="number"
                    id="editMinOrderAmount"
                    placeholder="Để trống = không yêu cầu"
                    value={editFormData.minOrderAmount}
                    onChange={(e) => setEditFormData({ ...editFormData, minOrderAmount: e.target.value })}
                    min="0"
                    step="1000"
                  />
                  <small>Giá trị đơn hàng tối thiểu để áp dụng voucher (VND)</small>
                </div>

                <div className="form-group">
                  <label htmlFor="editDescription">
                    Mô tả
                  </label>
                  <textarea
                    id="editDescription"
                    placeholder="Nhập mô tả cho voucher (tùy chọn)"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows="3"
                    maxLength="500"
                  />
                  <small>Tối đa 500 ký tự</small>
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={handleCloseEditModal} className="btn-cancel">
                    Hủy
                  </button>
                  <button type="submit" className="btn-primary">
                    Cập nhật Voucher
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
