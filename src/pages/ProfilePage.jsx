import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/apiClient';
import Header from '../components/layout/Header';
import config from '../config/environment';

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

      setAvatarFile(file);
      setError('');
      
      // Tạo preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
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


  if (loading) {
    return (
      <div>
        <Header />
        <div className="loading-container">
          <div className="loading-spinner">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div>
        <Header />
        <div className="main-content">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-4">⚠️</div>
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={loadProfile}
              className="btn btn-primary"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      
      <div className="main-content">
        {/* Header */}
        <div className="card mb-6">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
                  Profile
                </h1>
                <p style={{ color: '#9ca3af', fontSize: '1rem' }}>
                  Quản lý thông tin cá nhân của bạn
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="btn btn-primary"
                  >
                    Chỉnh sửa
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleCancel}
                      className="btn btn-secondary"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="btn btn-primary"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="alert alert-success mb-4">
            {message}
          </div>
        )}
        {error && (
          <div className="alert alert-error mb-4">
            {error}
          </div>
        )}

        {/* Profile Content */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Avatar Section */}
          <div>
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <div style={{ 
                  margin: '0 auto 16px', 
                  width: '128px', 
                  height: '128px', 
                  background: 'rgba(102, 126, 234, 0.2)', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '2px solid rgba(102, 126, 234, 0.3)',
                  overflow: 'hidden'
                }}>
                  {avatarPreview || profile?.avatar ? (
                    <img 
                      key={avatarKey}
                      src={avatarPreview || profile?.avatar} 
                      alt="Avatar" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '3rem', color: '#667eea', fontWeight: '600' }}>
                      {profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                  {profile?.fullName || 'Chưa có tên'}
                </h3>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '16px' }}>
                  {profile?.role}
                </p>
                <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                  <p>ID: {profile?.userId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div style={{ gridColumn: 'span 2' }}>
            <div className="card">
              <div className="card-body">
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#ffffff', marginBottom: '24px' }}>
                  Thông tin chi tiết
                </h3>
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                    {/* Full Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#9ca3af', marginBottom: '8px' }}>
                        Họ và tên
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="Nhập họ và tên"
                        />
                      ) : (
                        <p style={{ color: '#ffffff', padding: '12px 0' }}>
                          {profile?.fullName || 'Chưa cập nhật'}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#9ca3af', marginBottom: '8px' }}>
                        Email
                      </label>
                      <p style={{ 
                        color: '#ffffff', 
                        padding: '12px 16px', 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        {profile?.email}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                        Email không thể thay đổi
                      </p>
                    </div>

                    {/* Phone */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#9ca3af', marginBottom: '8px' }}>
                        Số điện thoại
                      </label>
                      {editing ? (
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="Nhập số điện thoại"
                        />
                      ) : (
                        <p style={{ color: '#ffffff', padding: '12px 0' }}>
                          {profile?.phone || 'Chưa cập nhật'}
                        </p>
                      )}
                    </div>

                    {/* Avatar */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#9ca3af', marginBottom: '8px' }}>
                        Ảnh đại diện
                      </label>
                      {editing ? (
                        <div>
                          {/* File Upload */}
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              style={{
                                display: 'none'
                              }}
                              id="avatar-upload"
                            />
                            <label
                              htmlFor="avatar-upload"
                              style={{
                                display: 'inline-block',
                                padding: '12px 24px',
                                background: 'rgba(102, 126, 234, 0.1)',
                                border: '2px dashed rgba(102, 126, 234, 0.3)',
                                borderRadius: '12px',
                                color: '#667eea',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                textAlign: 'center',
                                width: '100%',
                                transition: 'all 0.2s ease',
                                minHeight: '60px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                gap: '8px'
                              }}
                              onMouseOver={(e) => {
                                e.target.style.background = 'rgba(102, 126, 234, 0.2)';
                                e.target.style.borderColor = 'rgba(102, 126, 234, 0.5)';
                                e.target.style.transform = 'translateY(-2px)';
                              }}
                              onMouseOut={(e) => {
                                e.target.style.background = 'rgba(102, 126, 234, 0.1)';
                                e.target.style.borderColor = 'rgba(102, 126, 234, 0.3)';
                                e.target.style.transform = 'translateY(0)';
                              }}
                            >
                              <div style={{ fontSize: '1.5rem' }}>📷</div>
                              <div>Chọn ảnh từ máy tính</div>
                              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                Hỗ trợ: JPG, PNG, GIF (tối đa 5MB)
                              </div>
                            </label>
                          </div>
                          
                          {avatarPreview && (
                            <div style={{ 
                              marginTop: '16px', 
                              textAlign: 'center' 
                            }}>
                              <p style={{ 
                                fontSize: '0.75rem', 
                                color: '#9ca3af', 
                                marginBottom: '8px' 
                              }}>
                                Preview:
                              </p>
                              <img 
                                src={avatarPreview} 
                                alt="Avatar Preview" 
                                style={{ 
                                  width: '80px', 
                                  height: '80px', 
                                  borderRadius: '50%', 
                                  objectFit: 'cover',
                                  border: '3px solid rgba(102, 126, 234, 0.3)',
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <p style={{ color: '#ffffff', padding: '12px 0' }}>
                          {profile?.avatar ? 'Đã cập nhật' : 'Chưa cập nhật'}
                        </p>
                      )}
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#9ca3af', marginBottom: '8px' }}>
                        Ngày sinh
                      </label>
                      {editing ? (
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleInputChange}
                          className="form-input"
                        />
                      ) : (
                        <p style={{ color: '#ffffff', padding: '12px 0' }}>
                          {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                        </p>
                      )}
                    </div>

                    {/* Gender */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#9ca3af', marginBottom: '8px' }}>
                        Giới tính
                      </label>
                      {editing ? (
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className="form-input"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: '#ffffff',
                            padding: '12px 16px',
                            fontSize: '0.875rem',
                            width: '100%',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="" style={{ background: '#1f2937', color: '#9ca3af' }}>
                            Chọn giới tính
                          </option>
                          <option value="Nam" style={{ background: '#1f2937', color: '#ffffff' }}>
                            👨 Nam
                          </option>
                          <option value="Nữ" style={{ background: '#1f2937', color: '#ffffff' }}>
                            👩 Nữ
                          </option>
                          <option value="Khác" style={{ background: '#1f2937', color: '#ffffff' }}>
                            🏳️‍⚧️ Khác
                          </option>
                        </select>
                      ) : (
                        <div style={{ 
                          color: '#ffffff', 
                          padding: '12px 16px',
                          background: 'rgba(255, 255, 255, 0.05)', 
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {profile?.gender && (
                            <span style={{ fontSize: '1rem' }}>
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
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#9ca3af', marginBottom: '8px' }}>
                        Vai trò
                      </label>
                      <p style={{ 
                        color: '#ffffff', 
                        padding: '12px 16px', 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        {profile?.role}
                      </p>
                    </div>

                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
