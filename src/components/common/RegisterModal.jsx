import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import OTPVerification from '../OTPVerification';

const RegisterModal = () => {
  const { isRegisterModalOpen, closeRegisterModal, openLoginModal } = useModal();
  const { register, user } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isRegisterModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isRegisterModalOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isRegisterModalOpen) {
      setFormData({ username: '', fullName: '', email: '', password: '', phone: '' });
      setError('');
      setSuccessMessage('');
      setShowPassword(false);
      setShowOTP(false);
      setRegisteredEmail('');
    }
  }, [isRegisterModalOpen]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Tên người dùng không được để trống');
      return false;
    }
    if (formData.username.trim().length < 3) {
      setError('Tên người dùng phải có ít nhất 3 ký tự');
      return false;
    }
    if (!formData.fullName.trim()) {
      setError('Họ tên không được để trống');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Email không hợp lệ');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Định dạng email không đúng');
      return false;
    }
    if (!formData.password || formData.password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Số điện thoại không được để trống');
      return false;
    }
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      setError('Số điện thoại không hợp lệ (10-11 chữ số)');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const result = await register(formData);
      console.log('Register response:', result); // Debug log
      
      // Xử lý network error trước - có thể account đã được tạo nhưng response không về được
      if (result.isNetworkError) {
        // Network error - có thể account đã được tạo và OTP đã được gửi
        // Cho phép user thử nhập OTP với email vừa đăng ký
        setError('Không thể kết nối đến server. Nếu bạn đã nhận được email OTP, vui lòng nhập mã OTP để tiếp tục.');
        setRegisteredEmail(result.email || formData.email);
        setShowOTP(true);
        setLoading(false);
        return;
      }
      
      // Kiểm tra nếu tài khoản đã được tạo
      if (result.accountCreated) {
        // Kiểm tra nếu cần xác minh OTP
        if (result.requiresVerification && result.otpSent) {
          // Hiển thị giao diện nhập OTP - CHƯA thành công, cần verify OTP
          // KHÔNG hiển thị thông báo thành công ở đây
          // Chỉ khi verify OTP thành công thì mới coi là đăng ký thành công
          setRegisteredEmail(result.email || formData.email);
          setShowOTP(true);
          // Clear error message khi hiển thị OTP modal
          setError('');
        } else if (result.requiresVerification && !result.otpSent) {
          // Cần verify nhưng không gửi được OTP
          setError('Tài khoản đã được tạo nhưng không thể gửi OTP. Vui lòng liên hệ hỗ trợ.');
        } else {
          // Không cần verify (không nên xảy ra với cấu hình hiện tại)
          setError('Tài khoản đã được tạo nhưng không cần xác minh email.');
        }
      } else {
        // Hiển thị lỗi từ backend (có thể là "Email này đã được sử dụng" hoặc lỗi khác)
        setError(result.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Register error:', err); // Debug log
      // Fallback error handling - nếu có exception không mong đợi
      setError(err.message || 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerified = () => {
    // Chỉ khi verify OTP thành công (EmailVerified = true trong database) 
    // thì mới coi là đăng ký thành công và mới được đóng modal và mở login modal
    setShowOTP(false);
    setError(''); // Xóa error message khi verify thành công
    setSuccessMessage('Đăng ký thành công! Email đã được xác minh.');
    // Đóng modal sau 1.5 giây và mở login modal
    setTimeout(() => {
      closeRegisterModal();
      setTimeout(() => {
        openLoginModal();
      }, 300);
    }, 1500);
  };

  const handleClose = () => {
    closeRegisterModal();
    setFormData({ username: '', fullName: '', email: '', password: '', phone: '' });
    setError('');
    setSuccessMessage('');
    setShowOTP(false);
    setRegisteredEmail('');
  };

  const handleSwitchToLogin = () => {
    closeRegisterModal();
    openLoginModal();
  };

  if (!isRegisterModalOpen) return null;

  // Nếu đang hiển thị OTP, chỉ render OTP modal, không render Register modal
  if (showOTP) {
    return (
      <OTPVerification
        email={registeredEmail}
        onVerified={handleOTPVerified}
        onClose={() => {
          setShowOTP(false);
          // Không đóng Register modal, chỉ quay lại form đăng ký
        }}
      />
    );
  }

  return (
    <>
      <div 
        className="modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.3s ease-out'
        }}
      >
        <div 
          className="modal-content animate-slide-up"
          style={{
            background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(18, 18, 18, 0.95) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
            border: '1px solid rgba(255, 122, 0, 0.2)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 122, 0, 0.2)',
            animation: 'slideUp 0.3s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header với gradient */}
          <div style={{
            background: 'linear-gradient(135deg, #0A1128 0%, #001F3F 100%)',
            padding: '24px 32px',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 122, 0, 0.2)'
          }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#FFFFFF',
              margin: 0,
              letterSpacing: '-0.5px'
            }}>
              Đăng ký
            </h2>
            <button
              onClick={handleClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: '#FFFFFF'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'rotate(90deg)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.transform = 'rotate(0deg)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '32px' }}>
            {successMessage && (
              <div className="alert alert-success animate-fade-in" style={{ marginBottom: '24px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {successMessage}
                </span>
              </div>
            )}
            {error && (
              <div className="alert alert-danger animate-fade-in" style={{ marginBottom: '24px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label htmlFor="modal-register-username" className="form-label">
                  Tên người dùng
                </label>
                <input
                  type="text"
                  id="modal-register-username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Nhập tên người dùng của bạn"
                  required
                  minLength={3}
                  autoComplete="username"
                />
              </div>

              <div className="form-group">
                <label htmlFor="modal-register-fullName" className="form-label">
                  Họ và tên
                </label>
                <input
                  type="text"
                  id="modal-register-fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Nhập họ và tên đầy đủ"
                  required
                  autoComplete="name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="modal-register-email" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  id="modal-register-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="your.email@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="modal-register-phone" className="form-label">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  id="modal-register-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="0123456789"
                  required
                  autoComplete="tel"
                  pattern="[0-9]{10,11}"
                />
              </div>

              <div className="form-group">
                <label htmlFor="modal-register-password" className="form-label">
                  Mật khẩu
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="modal-register-password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Tối thiểu 8 ký tự"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    style={{ paddingRight: '48px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color var(--transition-base)'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.906 1.28L2.293 2.293zM8 10a2 2 0 012-2l2 2-2 2-2-2zM2.285 5.285L5.5 8.5a4 4 0 014.5 4.5l2.715 2.715A10.015 10.015 0 01.458 10c.948-3.014 3.827-5.465 7.284-6.05l-1.457 1.457zm10.43 10.43L13.5 14.5a4 4 0 01-4.5-4.5l-.715-.715A10.015 10.015 0 0119.542 10c-.948 3.014-3.827 5.465-7.284 6.05l1.457-1.457z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
                <small style={{ 
                  color: 'var(--color-text-tertiary)', 
                  fontSize: '12px',
                  marginTop: '4px',
                  display: 'block'
                }}>
                  Mật khẩu phải có ít nhất 8 ký tự
                </small>
              </div>

              <button 
                type="submit" 
                className="auth-button"
                disabled={loading}
                style={{
                  width: '100%',
                  marginTop: '8px'
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <svg className="loading-spinner" width="20" height="20" viewBox="0 0 20 20" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="32" strokeDashoffset="24" opacity="0.3" />
                      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="32" strokeDashoffset="24" />
                    </svg>
                    Đang tạo tài khoản...
                  </span>
                ) : (
                  'Đăng Ký'
                )}
              </button>
            </form>

            <div style={{ 
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid var(--color-border)',
              textAlign: 'center'
            }}>
              <p style={{ 
                color: 'var(--color-text-secondary)',
                fontSize: '14px',
                margin: 0
              }}>
                Đã có tài khoản?{' '}
                <button
                  onClick={handleSwitchToLogin}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    padding: 0,
                    textDecoration: 'underline',
                    transition: 'color var(--transition-base)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = 'var(--color-primary-light)';
                    e.target.style.textShadow = '0 0 8px rgba(255, 122, 0, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'var(--color-primary)';
                    e.target.style.textShadow = 'none';
                  }}
                >
                  Đăng nhập ngay
                </button>
              </p>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slideUp {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          .modal-content::-webkit-scrollbar {
            width: 8px;
          }

          .modal-content::-webkit-scrollbar-track {
            background: transparent;
          }

          .modal-content::-webkit-scrollbar-thumb {
            background: var(--color-border);
            border-radius: 4px;
          }

          .modal-content::-webkit-scrollbar-thumb:hover {
            background: var(--color-primary);
          }
        `}</style>
      </div>
    </>
  );
};

export default RegisterModal;

