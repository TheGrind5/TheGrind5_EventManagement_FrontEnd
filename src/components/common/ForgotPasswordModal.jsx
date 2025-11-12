import React, { useEffect, useState } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { authAPI } from '../../services/apiClient';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordModal = () => {
  const { isForgotPasswordModalOpen, closeForgotPasswordModal, openLoginModal, openRegisterModal } = useModal();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isForgotPasswordModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isForgotPasswordModalOpen]);

  useEffect(() => {
    if (isForgotPasswordModalOpen) {
      setEmail('');
      setMessage('');
      setError('');
      setLoading(false);
    }
  }, [isForgotPasswordModalOpen]);

  const validate = () => {
    if (!email || !email.includes('@')) {
      setError('Email không hợp lệ');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Định dạng email không đúng');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!validate()) return;
    try {
      setLoading(true);
      const res = await authAPI.forgotPassword(email.trim());
      setMessage(res.message || 'Nếu email tồn tại và đã xác minh, chúng tôi đã gửi liên kết đặt lại mật khẩu.');
    } catch (err) {
      setError(err.message || 'Không thể gửi email. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    closeForgotPasswordModal();
    setTimeout(() => {
      openLoginModal();
    }, 200);
  };

  if (!isForgotPasswordModalOpen) return null;

  return (
    <div
      className="modal-overlay"
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
            Quên mật khẩu
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

        <div style={{ padding: '32px' }}>
          {message && (
            <div className="alert alert-success animate-fade-in" style={{ marginBottom: '24px' }}>
              {message}
            </div>
          )}
          {error && (
            <div className="alert alert-danger animate-fade-in" style={{ marginBottom: '24px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
              style={{ width: '100%', marginTop: '8px' }}
            >
              {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
            </button>
          </form>

          <div style={{
            marginTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <button
              onClick={() => {
                closeForgotPasswordModal();
                openLoginModal();
              }}
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
              }}
              onMouseLeave={(e) => {
                e.target.style.color = 'var(--color-primary)';
              }}
            >
              Quay lại đăng nhập
            </button>
            <button
              onClick={() => {
                closeForgotPasswordModal();
                openRegisterModal();
              }}
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
              }}
              onMouseLeave={(e) => {
                e.target.style.color = 'var(--color-primary)';
              }}
            >
              Tạo tài khoản
            </button>
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
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
    </div>
  );
};

export default ForgotPasswordModal;


