import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/apiClient';
import { subscriptionAPI, subscriptionHelpers } from '../services/subscriptionService';
import Header from '../components/layout/Header';
import AIHistory from '../components/ai/AIHistory';
import config from '../config/environment';
import Cropper from 'react-easy-crop';
import { Box, Stack, Typography, CircularProgress, useTheme } from '@mui/material';
import './ProfilePage.css';

const ProfilePage = () => {
  const { refreshProfile, user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
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
  const [subscription, setSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [cpOld, setCpOld] = useState('');
  const [cpNew, setCpNew] = useState('');
  const [cpConfirm, setCpConfirm] = useState('');
  const [cpLoading, setCpLoading] = useState(false);
  const [cpMessage, setCpMessage] = useState('');
  const [cpError, setCpError] = useState('');
  
  // Crop states
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const avatarClickInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    // Load subscription after user is loaded
    console.log('🔍 useEffect triggered, user:', user);
    const userRole = user?.role || user?.Role;
    if (user && userRole === 'Host') {
      console.log('👤 User loaded, loading subscription for:', user.email || user.Email);
      loadSubscription();
    } else {
      console.log('⚠️ Not a Host user or user not loaded yet. Role:', userRole);
    }
  }, [user]);

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
        const cacheKey = profileData.updatedAt ? new Date(profileData.updatedAt).getTime() : Date.now();
        profileData.avatar = `${config.BASE_URL}${profileData.avatar}?v=${cacheKey}`;
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

  const loadSubscription = async () => {
    try {
      setSubscriptionLoading(true);
      const response = await subscriptionAPI.getMySubscription();
      console.log('🔍 Full Subscription Response:', response);
      console.log('🔍 Response Type:', typeof response);
      console.log('🔍 Response Keys:', Object.keys(response));
      console.log('🔍 Response.data:', response.data);
      console.log('🔍 Response.data Type:', typeof response.data);
      console.log('🔍 Response.data Keys:', response.data ? Object.keys(response.data) : 'no data');
      
      const data = response.data;
      
      // Handle SubscriptionStatusResponse - check both camelCase and PascalCase
      // Backend returns: { hasActiveSubscription, activeSubscription, ... } or { HasActiveSubscription, ActiveSubscription, ... }
      const activeSubscription = data?.activeSubscription || data?.ActiveSubscription;
      
      if (activeSubscription) {
        console.log('✅ Found ActiveSubscription:', activeSubscription);
        setSubscription(activeSubscription);
      } else if (data?.planType || data?.PlanType || data?.subscriptionId || data?.SubscriptionId) {
        // Direct subscription object (fallback)
        console.log('✅ Found direct subscription data:', data);
        setSubscription(data);
      } else {
        console.log('⚠️ No subscription found in response');
        console.log('⚠️ HasActiveSubscription:', data?.hasActiveSubscription ?? data?.HasActiveSubscription);
        console.log('⚠️ Data dump:', JSON.stringify(data, null, 2));
        setSubscription(null);
      }
    } catch (err) {
      console.error('❌ Error loading subscription:', err);
      console.error('❌ Error details:', err.response?.data);
      setSubscription(null);
    } finally {
      setSubscriptionLoading(false);
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
        const cacheKey = updatedUser.updatedAt ? new Date(updatedUser.updatedAt).getTime() : Date.now();
        updatedUser.avatar = `${config.BASE_URL}${updatedUser.avatar}?v=${cacheKey}`;
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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      setCpError('');
      setCpMessage('');

      if (!cpOld || !cpNew || !cpConfirm) {
        setCpError('Vui lòng nhập đầy đủ các trường');
        return;
      }
      if (cpNew.length < 8) {
        setCpError('Mật khẩu mới phải có ít nhất 8 ký tự');
        return;
      }
      if (cpNew !== cpConfirm) {
        setCpError('Xác nhận mật khẩu không khớp');
        return;
      }

      setCpLoading(true);
      await authAPI.changePassword(cpOld, cpNew);
      setCpMessage('Đổi mật khẩu thành công!');
      setCpOld('');
      setCpNew('');
      setCpConfirm('');
    } catch (err) {
      // Ưu tiên hiển thị thông báo cụ thể từ backend (ví dụ: Mật khẩu cũ không đúng)
      const msg = err?.message || err?.response?.data?.message || 'Đổi mật khẩu thất bại';
      setCpError(msg);
    } finally {
      setCpLoading(false);
    }
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

  // Helper function to convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '76, 175, 80'; // Default green
  };

  // Get gradient colors for subscription plan (matching SubscriptionPlansPage)
  const getGradientColors = (planType) => {
    switch (planType) {
      case 'Professional':
        return { start: '#FF9800', end: '#FFC107' }; // Orange to Yellow
      case 'BreakoutHost':
        return { start: '#E91E63', end: '#9C27B0' }; // Pink to Purple
      case 'RisingHost':
        return { start: '#4CAF50', end: '#388E3C' }; // Green gradient
      default:
        return { start: '#4CAF50', end: '#43A047' }; // Default green
    }
  };


  if (loading) {
    return (
      <Box sx={{ 
        backgroundColor: theme.palette.mode === 'dark' ? '#0A0A0A' : '#FFFFFF',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <Header />
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: 'calc(100vh - 64px)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Animated Background Gradient */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: theme.palette.mode === 'dark' 
                ? 'radial-gradient(circle at 50% 50%, rgba(255, 122, 0, 0.1) 0%, transparent 70%)'
                : 'radial-gradient(circle at 50% 50%, rgba(255, 122, 0, 0.05) 0%, transparent 70%)',
              animation: 'pulse 3s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  opacity: 0.5,
                  transform: 'scale(1)',
                },
                '50%': {
                  opacity: 1,
                  transform: 'scale(1.1)',
                },
              },
            }}
          />

          {/* Floating Particles */}
          {[...Array(6)].map((_, i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF7A00 0%, #FF9500 100%)',
                opacity: 0.6,
                animation: `float${i} ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
                left: `${20 + i * 15}%`,
                top: `${30 + i * 10}%`,
                '@keyframes float0': {
                  '0%, 100%': { transform: 'translateY(0) translateX(0) scale(1)', opacity: 0.6 },
                  '50%': { transform: 'translateY(-30px) translateX(20px) scale(1.2)', opacity: 1 },
                },
                '@keyframes float1': {
                  '0%, 100%': { transform: 'translateY(0) translateX(0) scale(1)', opacity: 0.6 },
                  '50%': { transform: 'translateY(30px) translateX(-20px) scale(1.2)', opacity: 1 },
                },
                '@keyframes float2': {
                  '0%, 100%': { transform: 'translateY(0) translateX(0) scale(1)', opacity: 0.6 },
                  '50%': { transform: 'translateY(-40px) translateX(-15px) scale(1.2)', opacity: 1 },
                },
                '@keyframes float3': {
                  '0%, 100%': { transform: 'translateY(0) translateX(0) scale(1)', opacity: 0.6 },
                  '50%': { transform: 'translateY(40px) translateX(15px) scale(1.2)', opacity: 1 },
                },
                '@keyframes float4': {
                  '0%, 100%': { transform: 'translateY(0) translateX(0) scale(1)', opacity: 0.6 },
                  '50%': { transform: 'translateY(-25px) translateX(25px) scale(1.2)', opacity: 1 },
                },
                '@keyframes float5': {
                  '0%, 100%': { transform: 'translateY(0) translateX(0) scale(1)', opacity: 0.6 },
                  '50%': { transform: 'translateY(25px) translateX(-25px) scale(1.2)', opacity: 1 },
                },
              }}
            />
          ))}

          <Stack alignItems="center" spacing={4} sx={{ position: 'relative', zIndex: 1 }}>
            {/* Multi-Ring Loading Animation */}
            <Box sx={{ position: 'relative', width: 120, height: 120 }}>
              {/* Outer Ring */}
              <CircularProgress
                size={120}
                thickness={2}
                sx={{
                  position: 'absolute',
                  color: theme.palette.mode === 'dark' ? 'rgba(255, 122, 0, 0.3)' : 'rgba(255, 122, 0, 0.2)',
                  animation: 'spin 2s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
              
              {/* Middle Ring */}
              <CircularProgress
                size={90}
                thickness={3}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: theme.palette.mode === 'dark' ? 'rgba(255, 122, 0, 0.6)' : 'rgba(255, 122, 0, 0.4)',
                  animation: 'spinReverse 1.5s linear infinite',
                  '@keyframes spinReverse': {
                    '0%': { transform: 'translate(-50%, -50%) rotate(360deg)' },
                    '100%': { transform: 'translate(-50%, -50%) rotate(0deg)' },
                  },
                }}
              />
              
              {/* Inner Ring */}
              <CircularProgress
                size={60}
                thickness={4}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: '#FF7A00',
                  animation: 'spin 1s linear infinite',
                }}
              />

              {/* Center Dot */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF7A00 0%, #FF9500 100%)',
                  boxShadow: `0 0 20px ${theme.palette.mode === 'dark' ? 'rgba(255, 122, 0, 0.8)' : 'rgba(255, 122, 0, 0.5)'}`,
                  animation: 'pulseDot 1.5s ease-in-out infinite',
                  '@keyframes pulseDot': {
                    '0%, 100%': {
                      transform: 'translate(-50%, -50%) scale(1)',
                      opacity: 1,
                    },
                    '50%': {
                      transform: 'translate(-50%, -50%) scale(1.3)',
                      opacity: 0.7,
                    },
                  },
                }}
              />
            </Box>

            {/* Loading Text with Animation */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #FF7A00 0%, #FF9500 50%, #FFB84D 100%)'
                    : 'linear-gradient(135deg, #FF7A00 0%, #FF9500 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                  animation: 'fadeInUp 0.8s ease-out',
                  '@keyframes fadeInUp': {
                    '0%': {
                      opacity: 0,
                      transform: 'translateY(20px)',
                    },
                    '100%': {
                      opacity: 1,
                      transform: 'translateY(0)',
                    },
                  },
                }}
              >
                Đang tải thông tin...
              </Typography>
              
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 1,
                  animation: 'fadeInUp 0.8s ease-out 0.2s both',
                  opacity: 0.7,
                }}
              >
                Vui lòng đợi trong giây lát
              </Typography>

              {/* Animated Dots */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 0.5,
                  mt: 2,
                  '& > *': {
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: theme.palette.mode === 'dark' ? 'rgba(255, 122, 0, 0.6)' : 'rgba(255, 122, 0, 0.4)',
                  },
                }}
              >
                {[...Array(3)].map((_, i) => (
                  <Box
                    key={i}
                    sx={{
                      animation: `bounce 1.4s ease-in-out infinite`,
                      animationDelay: `${i * 0.2}s`,
                      '@keyframes bounce': {
                        '0%, 80%, 100%': {
                          transform: 'scale(0.8)',
                          opacity: 0.5,
                        },
                        '40%': {
                          transform: 'scale(1.2)',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Stack>
        </Box>
      </Box>
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
        {/* Bỏ Header phía trên vì đã chuyển nút chỉnh sửa xuống bên dưới */}

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
          {/* Left Column - Avatar & Subscription */}
          <div className="profile-left-column">
            {/* Avatar Section */}
            <div className="profile-avatar-card">
              <div
                className="profile-avatar-wrapper"
                onClick={() => {
                  if (editing && avatarClickInputRef?.current) {
                    avatarClickInputRef.current.click();
                  }
                }}
                title={editing ? 'Nhấn để chọn ảnh mới' : ''}
                style={{ cursor: editing ? 'pointer' : 'default' }}
              >
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
              {/* Hidden input to trigger when clicking avatar (only effective in edit mode) */}
              <input
                ref={avatarClickInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
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

            {/* Subscription Section - Only for Host */}
            {console.log('🎯 Rendering subscription section, user role:', user?.role || user?.Role)}
            {(user?.role === 'Host' || user?.Role === 'Host') && (
              <div className="profile-subscription-card">
                <h3 className="profile-subscription-title">
                  Gói Subscription
                </h3>
                
                {subscriptionLoading ? (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    py: 4 
                  }}>
                    <Stack alignItems="center" spacing={2}>
                      <CircularProgress 
                        size={40}
                        thickness={4}
                        sx={{ 
                          color: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 122, 0, 0.8)' 
                            : 'rgba(255, 122, 0, 0.9)',
                        }} 
                      />
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ opacity: 0.7 }}
                      >
                        Đang tải...
                      </Typography>
                    </Stack>
                  </Box>
                ) : subscription ? (() => {
                  const planType = subscription.PlanType ?? subscription.planType ?? '';
                  const isActive = (subscription.Status === 'Active' || subscription.status === 'Active');
                  const gradient = getGradientColors(planType);
                  
                  return (
                    <div className="subscription-info">
                      <div 
                        className={`subscription-card ${isActive ? 'subscription-active' : 'subscription-inactive'}`}
                        style={{
                          background: isActive 
                            ? `linear-gradient(135deg, rgba(${hexToRgb(gradient.start)}, 0.15) 0%, rgba(${hexToRgb(gradient.end)}, 0.08) 100%)`
                            : undefined,
                          border: isActive 
                            ? `2px solid rgba(${hexToRgb(gradient.start)}, 0.4)`
                            : undefined
                        }}
                      >
                        <div className="subscription-content">
                          <div className="subscription-header">
                            <div className="subscription-plan-info">
                              <h4 className="subscription-plan-name">
                                {subscription.PlanName ?? subscription.planName ?? subscriptionHelpers.getPlanDisplayName(planType)}
                              </h4>
                              <span className={`subscription-badge ${isActive ? 'subscription-badge-active' : 'subscription-badge-inactive'}`}>
                                {subscription.Status ?? subscription.status}
                              </span>
                            </div>
                          </div>
                          
                          <div className="subscription-details">
                            {/* Only show remaining events for non-Professional plans */}
                            {planType !== 'Professional' && (
                              <div className="subscription-detail-item">
                                <span className="subscription-detail-icon">📅</span>
                                <div className="subscription-detail-content">
                                  <span className="subscription-detail-label">Sự kiện còn lại</span>
                                  <span className="subscription-detail-value">
                                    {(subscription.RemainingEvents === 'Unlimited' || subscription.remainingEvents === 'Unlimited') ||
                                     subscription.RemainingEvents === -1 || subscription.remainingEvents === -1 ||
                                     (typeof subscription.RemainingEvents === 'number' && subscription.RemainingEvents > 1000) ||
                                     (typeof subscription.remainingEvents === 'number' && subscription.remainingEvents > 1000)
                                      ? 'Không giới hạn' 
                                      : `${subscription.RemainingEvents ?? subscription.remainingEvents ?? 0} sự kiện`}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {/* Show unlimited create event for Professional plan */}
                            {planType === 'Professional' && (
                              <div className="subscription-detail-item">
                                <span className="subscription-detail-icon">✨</span>
                                <div className="subscription-detail-content">
                                  <span className="subscription-detail-label">Unlimited create event</span>
                                  <span className="subscription-detail-value" style={{ color: gradient.start, fontWeight: 'bold' }}>
                                    Tạo sự kiện không giới hạn
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            <div className="subscription-detail-item">
                              <span className="subscription-detail-icon">⏰</span>
                              <div className="subscription-detail-content">
                                <span className="subscription-detail-label">Hết hạn</span>
                                <span className="subscription-detail-value">
                                  {new Date(subscription.EndDate ?? subscription.endDate).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {((subscription.PlanType === 'RisingHost' || subscription.planType === 'RisingHost') || 
                          (subscription.PlanType === 'BreakoutHost' || subscription.planType === 'BreakoutHost')) && (
                          <div className="subscription-action">
                            <button
                              onClick={() => navigate('/subscriptions/plans')}
                              className="subscription-upgrade-btn"
                              style={{
                                background: `linear-gradient(135deg, ${gradient.start} 0%, ${gradient.end} 100%)`,
                                boxShadow: `0 4px 12px ${gradient.start}40`
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = `linear-gradient(135deg, ${gradient.end} 0%, ${gradient.start} 100%)`;
                                e.target.style.boxShadow = `0 6px 16px ${gradient.start}50`;
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = `linear-gradient(135deg, ${gradient.start} 0%, ${gradient.end} 100%)`;
                                e.target.style.boxShadow = `0 4px 12px ${gradient.start}40`;
                              }}
                            >
                              <span className="subscription-upgrade-icon">⬆️</span>
                              <span>Nâng cấp</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })() : (
                  <div className="subscription-empty">
                    <div className="subscription-empty-icon">📦</div>
                    <p className="subscription-empty-text">
                      Chưa có gói
                    </p>
                    <button
                      onClick={() => navigate('/subscriptions/plans')}
                      className="profile-btn profile-btn-primary subscription-empty-btn"
                    >
                      Mua ngay
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column Wrapper */}
          <div className="profile-right-column">
          {/* Profile Details */}
          <div className="profile-details-card">
            <div className="profile-details-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <h3 className="profile-details-heading" style={{ margin: 0 }}>
                Profile
            </h3>
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

                    {/* Avatar field hidden in detail section */}

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

                    {/* Role field hidden in detail section */}

              </div>
            </form>
            </div>

            {/* Change Password Section - moved below Profile card */}
            <div className="profile-details-card change-password-card">
              <div className="profile-details-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <h3 className="profile-details-heading" style={{ margin: 0 }}>
                  Đổi mật khẩu
                </h3>
              </div>

              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {cpMessage && (
                    <div className="profile-alert profile-alert-success" style={{ marginTop: 12 }}>
                      <span>✓</span>{cpMessage}
                    </div>
                  )}
                  {cpError && (
                    <div className="profile-alert profile-alert-error" style={{ marginTop: 12 }}>
                      <span>✕</span>{cpError}
                    </div>
                  )}
                  <div className="profile-details-grid change-password-grid">
                    <div className="profile-field">
                      <label className="profile-field-label">
                        Mật khẩu cũ
                      </label>
                      <input
                        type="password"
                        value={cpOld}
                        onChange={(e) => setCpOld(e.target.value)}
                        className="profile-field-input"
                        placeholder="Nhập mật khẩu cũ"
                        autoComplete="current-password"
                      />
                    </div>

                    <div className="profile-field">
                      <label className="profile-field-label">
                        Mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={cpNew}
                        onChange={(e) => setCpNew(e.target.value)}
                        className="profile-field-input"
                        placeholder="Ít nhất 8 ký tự"
                        autoComplete="new-password"
                      />
                    </div>

                    <div className="profile-field">
                      <label className="profile-field-label">
                        Xác nhận mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={cpConfirm}
                        onChange={(e) => setCpConfirm(e.target.value)}
                        className="profile-field-input"
                        placeholder="Nhập lại mật khẩu mới"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                  <div className="cp-actions">
                    <button
                      type="button"
                      className="profile-btn profile-btn-secondary"
                      onClick={() => {
                        setCpOld(''); setCpNew(''); setCpConfirm(''); setCpError(''); setCpMessage('');
                      }}
                      disabled={cpLoading}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="profile-btn profile-btn-primary"
                      disabled={cpLoading}
                    >
                      {cpLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}
                    </button>
              </div>
            </form>
            </div>

          </div>

          {/* AI History Section - Commented out for now due to AISuggestion table issue */}
          {/* <div className="profile-details-card" style={{ marginTop: '2rem' }}>
            <AIHistory />
          </div> */}
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
