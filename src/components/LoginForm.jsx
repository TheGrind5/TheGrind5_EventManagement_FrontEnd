import React, { useEffect, useRef, useState } from "react";
// Nếu chưa nối API, tạm bỏ dòng dưới và dùng mock ở handleSubmit
// import { login } from "../api/auth";

export default function LoginForm({ onSuccess }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const idRef = useRef(null);

  useEffect(() => {
    const last = localStorage.getItem("ems:last_id");
    if (last) setIdentifier(last);
    idRef.current?.focus();
  }, []);

  function validate() {
    if (!identifier.trim()) return "Vui lòng nhập email hoặc username.";
    if (!password) return "Vui lòng nhập mật khẩu.";
    if (password.length < 6) return "Mật khẩu tối thiểu 6 ký tự.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const v = validate();
    if (v) return setError(v);

    setLoading(true);
    try {
      // ===== MOCK cho đến khi có backend =====
      await new Promise(r => setTimeout(r, 500));
      if (identifier.trim() === "admin" && password === "123456") {
        if (remember) localStorage.setItem("ems:last_id", identifier.trim());
        else localStorage.removeItem("ems:last_id");
        onSuccess?.({ user: { name: "Admin" } });
        alert("Đăng nhập thành công ✅");
      } else {
        throw new Error("Thông tin đăng nhập không đúng. Vui lòng thử lại.");
      }

      // ===== Khi có API, dùng cái dưới =====
      // const data = await login(identifier.trim(), password);
      // if (remember) localStorage.setItem("ems:last_id", identifier.trim());
      // else localStorage.removeItem("ems:last_id");
      // onSuccess?.(data);
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="card">
        <h2>Đăng nhập</h2>
        <p className="subtitle">TheGrind5 EMS</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <label className="label">Email/Username</label>
            <input
              ref={idRef}
              className="input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="vd: admin"
              type="text"
              autoComplete="username"
            />
          </div>

          <div className="form-row">
            <label className="label">Mật khẩu</label>
            <div className="input-wrap">
              <input
                className={`input has-icon`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPwd((s) => !s)}
                aria-label={showPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                title={showPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPwd ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="row-inline">
            <input
              id="remember"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <label htmlFor="remember">Nhớ tài khoản</label>
          </div>

          {error && <div className="alert" role="alert">{error}</div>}

          <button className="button" disabled={loading} type="submit">
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p className="small-center">
          Chưa có tài khoản? <a href="#">Đăng ký</a>
        </p>
      </div>
    </div>
  );
}
