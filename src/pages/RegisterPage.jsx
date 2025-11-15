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
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // Password validation helpers
  const passwordRequirements = {
    minLength: formData.password.length >= 8,
    hasUppercase: /[A-Z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handlePhoneBlur = async () => {
    const rawPhone = formData.phone || '';
    const cleaned = rawPhone.replace(/\s/g, '');
    if (!/^[0-9]{10,11}$/.test(cleaned)) return;
    try {
      const res = await (await import('../services/apiClient')).authAPI.checkPhone(cleaned);
      if (res?.data?.exists) {
        setError('Số điện thoại này đã được sử dụng. Vui lòng sử dụng số điện thoại khác.');
      }
    } catch (e) {
      // ignore silent check errors
    }
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
    // At least 1 uppercase, 1 digit, 1 special char, min 8 chars
    const strongPwd = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!strongPwd.test(formData.password)) {
      setError('Mật khẩu phải có ít nhất 1 chữ hoa, 1 số, 1 ký tự đặc biệt và tối thiểu 8 ký tự');
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
    setUsernameSuggestions([]);
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
        setUsernameSuggestions(result.suggestions || []);
      }
    } catch (err) {
      console.error('Register error:', err); // Debug log
      const errorMessage = err.response?.data?.message || 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.';
      const suggestions = err.response?.data?.suggestions || [];
      setError(errorMessage);
      setUsernameSuggestions(suggestions);
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0, marginTop: '2px' }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, marginBottom: usernameSuggestions && usernameSuggestions.length > 0 ? '8px' : 0 }}>
              {error}
                    {usernameSuggestions && usernameSuggestions.length > 0 && (
                      <span style={{ display: 'block', marginTop: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        Bạn có thể dùng <strong style={{ color: 'var(--color-primary)' }}>{usernameSuggestions.slice(0, 3).join(', ')}</strong>
                        {usernameSuggestions.length > 3 && ` và ${usernameSuggestions.length - 3} gợi ý khác`} để thay thế.
            </span>
                    )}
                  </p>
                </div>
              </div>
              {usernameSuggestions && usernameSuggestions.length > 0 && (
                <div style={{ marginTop: '4px', paddingLeft: '28px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {usernameSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, username: suggestion }));
                          setError('');
                          setUsernameSuggestions([]);
                        }}
                        style={{
                          padding: '6px 12px',
                          background: 'rgba(255, 122, 0, 0.1)',
                          border: '1px solid rgba(255, 122, 0, 0.3)',
                          borderRadius: '6px',
                          color: 'var(--color-primary)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontWeight: 500
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(255, 122, 0, 0.2)';
                          e.target.style.borderColor = 'var(--color-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(255, 122, 0, 0.1)';
                          e.target.style.borderColor = 'rgba(255, 122, 0, 0.3)';
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
              onBlur={handlePhoneBlur}
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
            <div style={{ 
              marginTop: '8px',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <p style={{ 
                margin: '0 0 8px 0',
                color: 'var(--color-text-secondary)', 
              fontSize: '12px',
                fontWeight: 600
              }}>
                Mật khẩu phải đáp ứng các yêu cầu sau:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {passwordRequirements.minLength ? (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ color: '#10b981', flexShrink: 0 }}>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }}>
                      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                  )}
                  <span style={{ 
                    color: passwordRequirements.minLength ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)', 
                    fontSize: '12px'
                  }}>
                    Tối thiểu 8 ký tự
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {passwordRequirements.hasUppercase ? (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ color: '#10b981', flexShrink: 0 }}>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }}>
                      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                  )}
                  <span style={{ 
                    color: passwordRequirements.hasUppercase ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)', 
                    fontSize: '12px'
                  }}>
                    Có ít nhất 1 chữ hoa (A-Z)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {passwordRequirements.hasNumber ? (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ color: '#10b981', flexShrink: 0 }}>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }}>
                      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                  )}
                  <span style={{ 
                    color: passwordRequirements.hasNumber ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)', 
                    fontSize: '12px'
                  }}>
                    Có ít nhất 1 chữ số (0-9)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {passwordRequirements.hasSpecialChar ? (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ color: '#10b981', flexShrink: 0 }}>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }}>
                      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                  )}
                  <span style={{ 
                    color: passwordRequirements.hasSpecialChar ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)', 
                    fontSize: '12px'
                  }}>
                    Có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  style={{ transformOrigin: 'center', animation: 'spin 1s linear infinite' }}
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="6 10"
                  />
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
