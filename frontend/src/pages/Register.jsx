import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../service/authService";

/* ── SVG Icons ─────────────────────────────────────────────────── */
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M20 21a8 8 0 1 0-16 0"/>
  </svg>
);
const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
    <line x1="2" x2="22" y1="2" y2="22"/>
  </svg>
);
const IconAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" x2="12" y1="8" y2="12"/>
    <line x1="12" x2="12.01" y1="16" y2="16"/>
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);
const IconChat = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/>
  </svg>
);

/* ── Password Strength ─────────────────────────────────────────── */
function getStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const strengthLabels = ["", "Yếu", "Trung bình", "Khá mạnh", "Mạnh"];
const strengthColors = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"];

/* ── Component ─────────────────────────────────────────────────── */
function Register() {
  const [form, setForm]               = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");
  const navigate = useNavigate();

  const strength = getStrength(form.password);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    try {
      await registerUser(form);
      setSuccess("Đăng ký thành công! Đang chuyển sang đăng nhập...");
      setTimeout(() => navigate("/"), 1800);
    } catch (err) {
      setError(err?.response?.data?.message || "Đăng ký thất bại, vui lòng thử lại");
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">


        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Full Name */}
          <div className="input-group">
            <label htmlFor="reg-name" className="input-label">Họ và tên</label>
            <div className="input-wrap">
              <input
                id="reg-name"
                className="auth-input"
                type="text"
                name="name"
                placeholder="Nguyễn Văn A"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
              <span className="input-icon"><IconUser /></span>
            </div>
          </div>

          {/* Email */}
          <div className="input-group">
            <label htmlFor="reg-email" className="input-label">Email</label>
            <div className="input-wrap">
              <input
                id="reg-email"
                className="auth-input"
                type="email"
                name="email"
                placeholder="ban@email.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
              <span className="input-icon"><IconMail /></span>
            </div>
          </div>

          {/* Password */}
          <div className="input-group">
            <label htmlFor="reg-password" className="input-label">Mật khẩu</label>
            <div className="input-wrap">
              <input
                id="reg-password"
                className="auth-input has-toggle"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Tối thiểu 6 ký tự"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
              <span className="input-icon"><IconLock /></span>
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>

            {/* Strength bar */}
            {form.password.length > 0 && (
              <>
                <div className={`strength-bar strength-${strength}`}>
                  {[1,2,3,4].map((i) => (
                    <div
                      key={i}
                      className="strength-segment"
                      style={{ background: i <= strength ? strengthColors[strength] : undefined }}
                    />
                  ))}
                </div>
                <p className="strength-label" style={{ color: strengthColors[strength] }}>
                  {strengthLabels[strength]}
                </p>
              </>
            )}
          </div>

          {/* Error / Success */}
          {error && (
            <div className="alert-box alert-error" role="alert">
              <IconAlert />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="alert-box alert-success" role="status">
              <IconCheck />
              <span>{success}</span>
            </div>
          )}

          {/* Submit */}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <><span className="spinner" /> Đang đăng ký...</>
            ) : (
              "Đăng Ký"
            )}
          </button>

          {/* Divider */}
          <div className="auth-divider">
            <span>hoặc</span>
          </div>

          {/* Google Register */}
          <a
            href="http://localhost:5000/api/auth/google"
            className="btn-google"
          >
            <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Đăng ký với Google
          </a>
        </form>

        <div className="auth-alt">
          Đã có tài khoản?
          <Link to="/">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
