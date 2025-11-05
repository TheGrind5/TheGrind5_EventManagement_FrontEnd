import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import OTPVerification from '../components/OTPVerification';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
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

    // Validate form
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const result = await register(formData);
      console.log('Register response:', result); // Debug log
      
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
      setError(err.response?.data?.message || 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerified = () => {
    // Chỉ khi verify OTP thành công (EmailVerified = true trong database) 
    // thì mới coi là đăng ký thành công và mới được navigate đến login
    setShowOTP(false);
    // Đăng ký thành công! Email đã được xác minh
    navigate('/login', { 
      state: { 
        message: 'Đăng ký thành công! Email đã được xác minh. Bạn có thể đăng nhập ngay.',
        email: registeredEmail 
      } 
    });
  };

  return (
    <>
      {showOTP && (
        <OTPVerification
          email={registeredEmail}
          onVerified={handleOTPVerified}
          onClose={() => setShowOTP(false)}
        />
      )}
      <div className="auth-container animate-fade-in">
      <div className="auth-card animate-slide-up">
        <div className="auth-header">
          <h1 className="auth-title">Đăng Ký</h1>
          <p className="auth-subtitle">
            Tạo tài khoản mới để bắt đầu hành trình của bạn
          </p>
        </div>

        {error && (
          <div className="alert alert-danger animate-fade-in">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Tên người dùng
            </label>
            <input
              type="text"
              id="username"
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
            <label htmlFor="fullName" className="form-label">
              Họ và tên
            </label>
            <input
              type="text"
              id="fullName"
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
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
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
            <label htmlFor="phone" className="form-label">
              Số điện thoại
            </label>
            <input
              type="tel"
              id="phone"
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
            <label htmlFor="password" className="form-label">
              Mật khẩu
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
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

        <div className="auth-subtitle" style={{ marginTop: '24px', textAlign: 'center' }}>
          Đã có tài khoản?{' '}
          <Link to="/login" style={{ 
            color: 'var(--color-primary)', 
            textDecoration: 'none',
            fontWeight: '600',
            transition: 'all var(--transition-base)',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.target.style.color = 'var(--color-primary-light)';
            e.target.style.textShadow = '0 0 8px rgba(255, 122, 0, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.color = 'var(--color-primary)';
            e.target.style.textShadow = 'none';
          }}>
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
    </>
  );
};

export default RegisterPage;
