import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/apiClient';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !email.includes('@')) {
      setError('Email không hợp lệ');
      return;
    }

    try {
      setLoading(true);
      const res = await authAPI.forgotPassword(email.trim());
      setMessage(res.message || 'Đã gửi link đặt lại mật khẩu đến email của bạn.');
    } catch (err) {
      setError(err.message || 'Không thể gửi email. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '520px', margin: '40px auto' }}>
      <h1 style={{ marginBottom: '8px' }}>Quên mật khẩu</h1>
      <p style={{ color: 'var(--color-text-secondary)' }}>
        Nhập email tài khoản, chúng tôi sẽ gửi link đặt lại mật khẩu.
      </p>

      {message && (
        <div className="alert alert-success" style={{ marginTop: '16px' }}>{message}</div>
      )}
      {error && (
        <div className="alert alert-danger" style={{ marginTop: '16px' }}>{error}</div>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: '24px' }}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <button className="auth-button" type="submit" disabled={loading} style={{ marginTop: '16px', width: '100%' }}>
          {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
        </button>
      </form>

      <div style={{ marginTop: '16px' }}>
        <Link to="/login" style={{ color: 'var(--color-primary)' }}>Quay lại đăng nhập</Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;


