import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginForm({ onSuccess, onSwitchToRegister, onBack }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { loginUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError("Vui lòng nhập email hoặc username.");
      return;
    }
    if (!password) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser(identifier.trim(), password);
      localStorage.setItem("ems:last_id", identifier.trim());
      onSuccess?.(data);
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    // Placeholder for social login functionality
    console.log(`Login with ${provider}`);
  };

  return (
    <div className="auth-container">
      <button className="back-button" onClick={onBack}>
        ← Quay lại
      </button>
      
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Đăng nhập</h1>
          <p className="auth-subtitle">
            Chưa có tài khoản?{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToRegister?.(); }}>
              Đăng ký ngay
            </a>
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Social Login Buttons */}
          <div className="social-login">
            <button
              type="button"
              className="social-button"
              onClick={() => handleSocialLogin('google')}
            >
              <span className="social-icon">G</span>
              Tiếp tục với Google
            </button>
            <button
              type="button"
              className="social-button"
              onClick={() => handleSocialLogin('facebook')}
            >
              <span className="social-icon">f</span>
              Tiếp tục với Facebook
            </button>
            <button
              type="button"
              className="social-button"
              onClick={() => handleSocialLogin('apple')}
            >
              <span className="social-icon">🍎</span>
              Tiếp tục với Apple
            </button>
          </div>

          <div className="auth-divider">
            <span>Hoặc đăng nhập bằng email</span>
          </div>

          {/* Email/Username Field */}
          <div className="form-group">
            <label className="form-label">Email hoặc tên đăng nhập</label>
            <input
              className="form-input"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Nhập email hoặc tên đăng nhập"
              disabled={loading}
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <div className="form-input-group">
              <input
                className="form-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="remember"
                className="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="remember" className="checkbox-label">
                Ghi nhớ đăng nhập
              </label>
            </div>
            <a href="#" style={{ color: '#667eea', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
              Quên mật khẩu?
            </a>
          </div>

          {/* Error Message */}
          {error && (
            <div className="auth-alert error">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Bằng cách đăng nhập, bạn đồng ý với{" "}
            <a href="#">Điều khoản sử dụng</a> và{" "}
            <a href="#">Chính sách bảo mật</a> của chúng tôi.
          </p>
        </div>
      </div>
    </div>
  );
}