import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import Header from '../components/layout/Header';

const ProfilePage = () => {
  const { refreshProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

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

      const profileData = await authAPI.getCurrentUserProfile(token);
      setProfile(profileData);
      setFormData({
        fullName: profileData.fullName || '',
        phone: profileData.phone || ''
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
        setError('Kích thước ảnh không được vượt quá 5MB');
        return;
      }

      setAvatarFile(file);
      
      // Tạo preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      setError('Vui lòng chọn ảnh để upload');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setMessage('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Không tìm thấy token xác thực');
        return;
      }

      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await fetch('http://localhost:5000/api/auth/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Upload ảnh thất bại');
      }

      const result = await response.json();
      setMessage('Upload ảnh avatar thành công!');
      
      // Cập nhật profile với ảnh mới
      setProfile(prev => ({
        ...prev,
        avatarUrl: result.avatarUrl
      }));

      // Reset file
      setAvatarFile(null);
      setAvatarPreview(null);
      
      // Refresh profile để cập nhật avatar trong header
      await refreshProfile();

    } catch (err) {
      setError('Lỗi khi upload ảnh: ' + err.message);
    } finally {
      setUploading(false);
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

      const updateData = {};
      if (formData.fullName !== profile.fullName) {
        updateData.fullName = formData.fullName;
      }
      if (formData.phone !== profile.phone) {
        updateData.phone = formData.phone;
      }

      if (Object.keys(updateData).length === 0) {
        setMessage('Không có thay đổi nào để cập nhật');
        return;
      }

      const result = await authAPI.updateProfile(updateData, token);
      setProfile(result.user);
      // Refresh user data in context
      await refreshProfile();
      setMessage('Cập nhật profile thành công!');
      setEditing(false);
    } catch (err) {
      setError('Lỗi khi cập nhật profile: ' + err.message);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: profile.fullName || '',
      phone: profile.phone || ''
    });
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
                <div style={{ position: 'relative', display: 'inline-block' }}>
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
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    {avatarPreview || profile?.avatarUrl ? (
                      <img 
                        src={avatarPreview || (profile?.avatarUrl?.startsWith('http') ? profile.avatarUrl : `http://localhost:5000${profile.avatarUrl}`)} 
                        alt="Avatar" 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          borderRadius: '50%'
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '3rem', color: '#667eea', fontWeight: '600' }}>
                        {profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  
                  {/* Camera Icon Button */}
                  <label 
                    htmlFor="avatar-upload"
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '14px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#5a67d8';
                      e.target.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#667eea';
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    📷
                  </label>
                  
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Upload Button */}
                {avatarFile && (
                  <div style={{ marginTop: '16px' }}>
                    <button
                      onClick={handleAvatarUpload}
                      disabled={uploading}
                      style={{
                        background: uploading ? '#6b7280' : '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '0.875rem',
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {uploading ? 'Đang upload...' : 'Lưu ảnh'}
                    </button>
                  </div>
                )}

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
