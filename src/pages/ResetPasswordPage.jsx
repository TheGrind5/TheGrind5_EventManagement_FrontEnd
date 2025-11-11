import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authAPI } from '../services/apiClient';
import { useModal } from '../contexts/ModalContext';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const { openLoginModal } = useModal();

  const presetEmail = query.get('email') || '';
  const presetToken = query.get('token') || '';

  const [email] = useState(presetEmail);
  const [token] = useState(presetToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !email.includes('@') || !token) {
      setError('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu không khớp');
      return;
    }

    try {
      setLoading(true);
      const res = await authAPI.resetPassword(email.trim(), token.trim(), newPassword);
      setMessage(res.message || 'Đổi mật khẩu thành công!');
      // Mở dropbox Đăng nhập và chuyển về trang chủ
      setTimeout(() => {
        openLoginModal();
        navigate('/');
      }, 800);
    } catch (err) {
      setError(err.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '520px', margin: '40px auto' }}>
      <h1 style={{ marginBottom: '8px' }}>Đặt lại mật khẩu</h1>
      <p style={{ color: 'var(--color-text-secondary)' }}>
        Nhập mật khẩu mới và xác nhận để hoàn tất.
      </p>

      {message && <div className="alert alert-success" style={{ marginTop: '16px' }}>{message}</div>}
      {error && <div className="alert alert-danger" style={{ marginTop: '16px' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ marginTop: '24px' }}>

        <div className="form-group">
          <label className="form-label">Mật khẩu mới</label>
          <input
            type="password"
            className="form-input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Xác nhận mật khẩu</label>
          <input
            type="password"
            className="form-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button className="auth-button" type="submit" disabled={loading} style={{ marginTop: '16px', width: '100%' }}>
          {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
        </button>
      </form>

      <div style={{ marginTop: '16px' }}>
        <Link to="/login" style={{ color: 'var(--color-primary)' }}>Quay lại đăng nhập</Link>
      </div>
    </div>
  );
};

export default ResetPasswordPage;


