import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function RegisterForm({ onSuccess, onSwitchToLogin, onBack }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { registerUser } = useAuth();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.firstName.trim()) {
      setError("Vui lòng nhập họ.");
      return;
    }
    if (!formData.lastName.trim()) {
      setError("Vui lòng nhập tên.");
      return;
    }
    if (!formData.email.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }
    if (!formData.password) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Mật khẩu tối thiểu 6 ký tự.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (!agreeToTerms) {
      setError("Vui lòng đồng ý với điều khoản sử dụng.");
      return;
    }

    setLoading(true);
    try {
      const userData = await registerUser({
        username: `${formData.firstName.trim()}_${formData.lastName.trim()}`.toLowerCase(),
        email: formData.email.trim(),
        password: formData.password,
        fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`
      });
      
      onSuccess?.(userData);
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialRegister = (provider) => {
    // Placeholder for social registration functionality
    console.log(`Register with ${provider}`);
  };

  return (
    <div className="auth-container">
      <button className="back-button" onClick={onBack}>
        ← Quay lại
      </button>
      
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Tạo tài khoản</h1>
          <p className="auth-subtitle">
            Đã có tài khoản?{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin?.(); }}>
              Đăng nhập ngay
            </a>
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Name Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Họ</label>
              <input
                className="form-input"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Nhập họ"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tên</label>
              <input
                className="form-input"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Nhập tên"
                disabled={loading}
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Nhập địa chỉ email"
              disabled={loading}
            />
          </div>

          {/* Password Fields */}
          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <div className="form-input-group">
              <input
                className="form-input"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
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

          <div className="form-group">
            <label className="form-label">Xác nhận mật khẩu</label>
            <div className="form-input-group">
              <input
                className="form-input"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Nhập lại mật khẩu"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>

          {/* Terms Agreement */}
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="terms"
              className="checkbox"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              disabled={loading}
            />
            <label htmlFor="terms" className="checkbox-label">
              Bằng cách tạo tài khoản, tôi đồng ý với{" "}
              <a href="#">Điều khoản sử dụng</a> và{" "}
              <a href="#">Chính sách bảo mật</a> của chúng tôi.
            </label>
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
            {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </button>

          <div className="auth-divider">
            <span>HOẶC</span>
          </div>

          {/* Social Registration */}
          <button
            type="button"
            className="social-button"
            onClick={() => handleSocialRegister('google')}
            disabled={loading}
          >
            <span className="social-icon">G</span>
            Tiếp tục với Google
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Bằng cách đăng ký, bạn đồng ý nhận email từ chúng tôi về các sự kiện và cập nhật.
          </p>
        </div>
      </div>
    </div>
  );
}