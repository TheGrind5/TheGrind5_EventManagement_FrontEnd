import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { Link, useNavigate } from 'react-router-dom';

const LoginModal = () => {
  const { isLoginModalOpen, closeLoginModal, openRegisterModal } = useModal();
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Close modal and redirect based on role when user logs in successfully
  useEffect(() => {
    if (user && isLoginModalOpen) {
      closeLoginModal();
      
      // Redirect based on role
      if (user.role === 'Admin') {
        navigate('/admin/users', { replace: true });
      } else if (user.role === 'Host') {
        navigate('/host-dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, isLoginModalOpen, closeLoginModal, navigate]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isLoginModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isLoginModalOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isLoginModalOpen) {
      setFormData({ email: '', password: '' });
      setError('');
      setShowPassword(false);
    }
  }, [isLoginModalOpen]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Email không hợp lệ');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Định dạng email không đúng');
      return false;
    }
    if (!formData.password || formData.password.length < 1) {
      setError('Mật khẩu không được để trống');
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
      const result = await login(formData.email, formData.password);
      if (result.success) {
        // Modal close and redirect will be handled by useEffect when user state is updated
        // No need to navigate here
      } else {
        setError(result.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
        setLoading(false);
      }
    } catch (err) {
      setError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    closeLoginModal();
    setFormData({ email: '', password: '' });
    setError('');
  };

  const handleSwitchToRegister = () => {
    closeLoginModal();
    openRegisterModal();
  };

  if (!isLoginModalOpen) return null;

  return (
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
          maxWidth: '480px',
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
            Đăng nhập
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="form-group">
              <label htmlFor="modal-email" className="form-label">
                Email *
              </label>
              <input
                type="email"
                id="modal-email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="Nhập email hoặc số điện thoại"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="modal-password" className="form-label">
                Mật khẩu *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="modal-password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Nhập mật khẩu"
                  required
                  autoComplete="current-password"
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
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  // TODO: Implement forgot password
                  alert('Tính năng quên mật khẩu sẽ được triển khai sớm');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: 0,
                  transition: 'color var(--transition-base)'
                }}
                onMouseEnter={(e) => e.target.style.color = 'var(--color-primary-light)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--color-primary)'}
              >
                Quên mật khẩu?
              </button>
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
                  Đang đăng nhập...
                </span>
              ) : (
                'Tiếp tục'
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
              marginBottom: '16px'
            }}>
              Chưa có tài khoản?{' '}
              <button
                onClick={handleSwitchToRegister}
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
                Tạo tài khoản ngay
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

        .modal-overlay::-webkit-scrollbar {
          display: none;
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
  );
};

export default LoginModal;

