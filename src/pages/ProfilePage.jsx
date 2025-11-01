import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/apiClient';
import Header from '../components/layout/Header';
import AIHistory from '../components/ai/AIHistory';
import config from '../config/environment';
import Cropper from 'react-easy-crop';
import './ProfilePage.css';

const ProfilePage = () => {
  const { refreshProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    avatar: '',
    dateOfBirth: '',
    gender: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [avatarKey, setAvatarKey] = useState(0); // Key để force re-render avatar
  
  // Crop states
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Không tìm thấy token xác thực');
        return;
      }

      const response = await authAPI.getCurrentUserProfile();
      const profileData = response.data;
      
      // Fix avatar URL nếu cần
      if (profileData.avatar && profileData.avatar.startsWith("/")) {
        profileData.avatar = `${config.BASE_URL}${profileData.avatar}`;
      }
      
      setProfile(profileData);
      setFormData({
        fullName: profileData.fullName || '',
        phone: profileData.phone || '',
        avatar: '', // Không cần lưu avatar URL trong formData
        dateOfBirth: profileData.dateOfBirth ? profileData.dateOfBirth.split('T')[0] : '',
        gender: profileData.gender || ''
      });
    } catch (err) {
      setError('Không thể tải thông tin profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Kiểm tra loại file
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn file ảnh hợp lệ');
        return;
      }
      
      // Kiểm tra kích thước file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước file không được vượt quá 5MB');
        return;
      }

      setError('');
      
      // Hiển thị modal crop
      const reader = new FileReader();
      reader.onload = (e) => {
        setCropImageSrc(e.target.result);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
      
      // Reset input
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setMessage('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Không tìm thấy token xác thực');
        return;
      }

      // Xử lý upload avatar nếu có file
      let avatarUrl = null;
      if (avatarFile) {
        console.log('📤 Uploading avatar file:', avatarFile.name);
        const uploadResult = await authAPI.uploadAvatar(avatarFile);
        avatarUrl = uploadResult.data.avatarUrl;
        console.log('✅ Avatar uploaded:', avatarUrl);
      }

      // Debug logging
      console.log('🔍 DEBUG Profile Update:');
      console.log('- formData:', formData);
      console.log('- profile:', profile);
      console.log('- avatarFile:', avatarFile);

      const updateData = {};
      if (formData.fullName !== profile?.fullName) {
        console.log('✅ FullName changed:', formData.fullName, '->', profile?.fullName);
        updateData.fullName = formData.fullName;
      }
      if (formData.phone !== profile?.phone) {
        console.log('✅ Phone changed:', formData.phone, '->', profile?.phone);
        updateData.phone = formData.phone;
      }
      if (avatarFile && avatarUrl) {
        console.log('✅ Avatar changed:', avatarUrl, '->', profile?.avatar);
        updateData.avatar = avatarUrl;
      }
      if (formData.dateOfBirth !== (profile?.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '')) {
        console.log('✅ DateOfBirth changed:', formData.dateOfBirth, '->', profile?.dateOfBirth);
        updateData.dateOfBirth = formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null;
      }
      if (formData.gender !== profile?.gender) {
        console.log('✅ Gender changed:', formData.gender, '->', profile?.gender);
        updateData.gender = formData.gender;
      }

      console.log('📝 UpdateData:', updateData);

      if (Object.keys(updateData).length === 0) {
        console.log('❌ No changes detected');
        setMessage('Không có thay đổi nào để cập nhật');
        return;
      }

      const result = await authAPI.updateProfile(updateData);
      
      // Fix avatar URL nếu cần
      const updatedUser = result.data.user;
      if (updatedUser.avatar && updatedUser.avatar.startsWith("/")) {
        updatedUser.avatar = `${config.BASE_URL}${updatedUser.avatar}`;
      }
      
      setProfile(updatedUser);
      // Refresh user data in context để cập nhật avatar trên header
      await refreshProfile();
      setMessage('Cập nhật profile thành công!');
      setEditing(false);
      // Reset avatar file và preview sau khi upload thành công
      setAvatarFile(null);
      setAvatarPreview(null);
      // Force re-render avatar để tránh cache
      setAvatarKey(prev => prev + 1);
    } catch (err) {
      setError('Lỗi khi cập nhật profile: ' + err.message);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: profile?.fullName || '',
      phone: profile?.phone || '',
      avatar: '', // Không cần lưu avatar URL trong formData nữa
      dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
      gender: profile?.gender || ''
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setEditing(false);
    setMessage('');
    setError('');
  };

  // Crop functions
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    );
    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Canvas is empty');
          return;
        }
        const fileUrl = window.URL.createObjectURL(blob);
        resolve({ blob, url: fileUrl });
      }, 'image/jpeg', 0.9);
    });
  };

  const handleCropComplete = async () => {
    try {
      const croppedImage = await getCroppedImg(
        cropImageSrc,
        croppedAreaPixels
      );
      
      // Tạo File từ blob
      const file = new File([croppedImage.blob], 'avatar.jpg', { type: 'image/jpeg' });
      
      // Lưu file và preview
      setAvatarFile(file);
      setAvatarPreview(croppedImage.url);
      
      // Đóng modal
      setShowCropModal(false);
      setCropImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (error) {
      console.error('Error cropping image:', error);
      setError('Có lỗi xảy ra khi cắt ảnh');
    }
  };

  const handleCancelCrop = () => {
    setShowCropModal(false);
    setCropImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };


  if (loading) {
    return (
      <div className="profile-page">
        <Header />
        <div className="profile-loading">
          <div className="loading-spinner">Đang tải thông tin...</div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="profile-page">
        <Header />
        <div className="main-content">
          <div className="profile-error">
            <div className="profile-error-icon">⚠️</div>
            <p>{error}</p>
            <button 
              onClick={loadProfile}
              className="profile-btn profile-btn-primary"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Header />
      
      <div className="main-content">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-header-content">
            <div>
              <h1 className="profile-header-title">
                Profile
              </h1>
              <p className="profile-header-subtitle">
                Quản lý thông tin cá nhân của bạn
              </p>
            </div>
            <div className="profile-header-actions">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="profile-btn profile-btn-primary"
                >
                  ✏️ Chỉnh sửa
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="profile-btn profile-btn-secondary"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="profile-btn profile-btn-primary"
                  >
                    💾 Lưu thay đổi
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="profile-alert profile-alert-success">
            <span>✓</span>
            {message}
          </div>
        )}
        {error && (
          <div className="profile-alert profile-alert-error">
            <span>✕</span>
            {error}
          </div>
        )}

        {/* Profile Content */}
        <div className="profile-content">
          {/* Avatar Section */}
          <div className="profile-avatar-card">
            <div className="profile-avatar-wrapper">
              {avatarPreview || profile?.avatar ? (
                <img 
                  key={avatarKey}
                  src={avatarPreview || profile?.avatar} 
                  alt="Avatar" 
                  className="profile-avatar-img"
                />
              ) : (
                <span className="profile-avatar-initial">
                  {profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <h3 className="profile-name">
              {profile?.fullName || 'Chưa có tên'}
            </h3>
            <div className="profile-role">
              {profile?.role}
            </div>
            <div className="profile-id">
              ID: {profile?.userId}
            </div>
          </div>

          {/* Profile Details */}
          <div className="profile-details-card">
            <h3 className="profile-details-title">
              Thông tin chi tiết
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="profile-details-grid">
                    {/* Full Name */}
                    <div className="profile-field">
                      <label className="profile-field-label">
                        Họ và tên
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className="profile-field-input"
                          placeholder="Nhập họ và tên"
                        />
                      ) : (
                        <div className="profile-field-value">
                          {profile?.fullName || 'Chưa cập nhật'}
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div className="profile-field">
                      <label className="profile-field-label">
                        Email
                      </label>
                      <div className="profile-field-value profile-field-value-disabled">
                        {profile?.email}
                      </div>
                      <p className="profile-field-hint">
                        Email không thể thay đổi
                      </p>
                    </div>

                    {/* Phone */}
                    <div className="profile-field">
                      <label className="profile-field-label">
                        Số điện thoại
                      </label>
                      {editing ? (
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="profile-field-input"
                          placeholder="Nhập số điện thoại"
                        />
                      ) : (
                        <div className="profile-field-value">
                          {profile?.phone || 'Chưa cập nhật'}
                        </div>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="profile-field">
                      <label className="profile-field-label">
                        Ảnh đại diện
                      </label>
                      {editing ? (
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="profile-avatar-upload"
                            id="avatar-upload"
                          />
                          <label
                            htmlFor="avatar-upload"
                            className="profile-avatar-upload-label"
                          >
                            <div className="profile-avatar-upload-icon">📷</div>
                            <div>Chọn ảnh từ máy tính</div>
                            <div className="profile-avatar-upload-hint">
                              Hỗ trợ: JPG, PNG, GIF (tối đa 5MB)
                            </div>
                          </label>
                          
                          {avatarPreview && (
                            <div className="profile-avatar-preview">
                              <span className="profile-avatar-preview-label">
                                Xem trước:
                              </span>
                              <img 
                                src={avatarPreview} 
                                alt="Avatar Preview" 
                                className="profile-avatar-preview-img"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="profile-field-value">
                          {profile?.avatar ? 'Đã cập nhật' : 'Chưa cập nhật'}
                        </div>
                      )}
                    </div>

                    {/* Date of Birth */}
                    <div className="profile-field">
                      <label className="profile-field-label">
                        Ngày sinh
                      </label>
                      {editing ? (
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleInputChange}
                          className="profile-field-input"
                        />
                      ) : (
                        <div className="profile-field-value">
                          {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                        </div>
                      )}
                    </div>

                    {/* Gender */}
                    <div className="profile-field">
                      <label className="profile-field-label">
                        Giới tính
                      </label>
                      {editing ? (
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className="profile-field-select"
                        >
                          <option value="">
                            Chọn giới tính
                          </option>
                          <option value="Nam">
                            👨 Nam
                          </option>
                          <option value="Nữ">
                            👩 Nữ
                          </option>
                          <option value="Khác">
                            🏳️‍⚧️ Khác
                          </option>
                        </select>
                      ) : (
                        <div className="profile-gender-display">
                          {profile?.gender && (
                            <span className="profile-gender-emoji">
                              {profile.gender === 'Nam' ? '👨' : 
                               profile.gender === 'Nữ' ? '👩' : 
                               profile.gender === 'Khác' ? '🏳️‍⚧️' : ''}
                            </span>
                          )}
                          <span>
                            {profile?.gender || 'Chưa cập nhật'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Role */}
                    <div className="profile-field">
                      <label className="profile-field-label">
                        Vai trò
                      </label>
                      <div className="profile-field-value profile-field-value-disabled">
                        {profile?.role}
                      </div>
                    </div>

              </div>
            </form>
          </div>

          {/* AI History Section */}
          <div className="profile-details-card" style={{ marginTop: '2rem' }}>
            <AIHistory />
          </div>
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && cropImageSrc && (
        <div className="crop-modal-overlay" onClick={handleCancelCrop}>
          <div className="crop-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="crop-modal-header">
              <h3>Cắt ảnh đại diện</h3>
              <button className="crop-modal-close" onClick={handleCancelCrop}>
                ✕
              </button>
            </div>
            <div className="crop-modal-body">
              <div className="crop-container">
                <Cropper
                  image={cropImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="crop-controls">
                <label className="crop-zoom-label">
                  Phóng to/thu nhỏ:
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="crop-zoom-slider"
                  />
                </label>
              </div>
            </div>
            <div className="crop-modal-footer">
              <button
                className="profile-btn profile-btn-secondary"
                onClick={handleCancelCrop}
              >
                Hủy
              </button>
              <button
                className="profile-btn profile-btn-primary"
                onClick={handleCropComplete}
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
