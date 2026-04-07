import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword, resetPassword } from "../service/authService";

/* ── SVG Icons ─────────────────────────────────────────────────── */
const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/>
    <path d="M19 12H5"/>
  </svg>
);
const IconAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" x2="12" y1="8" y2="12"/>
    <line x1="12" x2="12.01" y1="16" y2="16"/>
  </svg>
);
const IconMailSent = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    <path d="m16 19 2 2 4-4"/>
  </svg>
);
const IconChat = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/>
  </svg>
);
const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconKey = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

/* ── Component ─────────────────────────────────────────────────── */
function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [step, setStep]       = useState(1); // 1: Email, 2: OTP, 3: Success
  const [otp, setOtp]         = useState("");
  const [password, setPassword] = useState("");

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return;
    setError("");
    setLoading(true);
    try {
      await forgotPassword({ email });
      setStep(2);
    } catch (err) {
      setError(err?.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !password) {
        setError("Vui lòng nhập đầy đủ OTP và mật khẩu mới");
        return;
    }
    setError("");
    setLoading(true);
    try {
      await resetPassword({ email, otp, password });
      setStep(3);
    } catch (err) {
      setError(err?.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <IconChat />
          </div>
          <span className="auth-logo-name">ChatApp</span>
        </div>

        {step === 3 && (
          /* ── Success State ── */
          <div className="success-state">
            <div className="success-icon">
              <IconMailSent />
            </div>
            <h2 style={{ color: "var(--text-primary)" }}>Thành công!</h2>
            <p>
              Mật khẩu của bạn đã được đặt lại thành công.<br />
              Vui lòng đăng nhập bằng mật khẩu mới.
            </p>
            <Link to="/" className="btn-primary" style={{ textDecoration: "none", marginTop: 4 }}>
              Quay lại Đăng nhập
            </Link>
          </div>
        )}

        {step === 2 && (
          /* ── OTP & New Password Form ── */
          <>
            <div className="auth-header">
              <h1>Nhập mã OTP</h1>
              <p>Mã OTP đã được gửi đến <strong>{email}</strong></p>
            </div>

            <form onSubmit={handleResetPassword} className="auth-form" noValidate>
              <div className="input-group">
                <label htmlFor="otp" className="input-label">Mã OTP (6 số)</label>
                <div className="input-wrap">
                  <input
                    id="otp"
                    className="auth-input"
                    type="text"
                    placeholder="Nhập mã OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength="6"
                    autoFocus
                  />
                  <span className="input-icon"><IconKey /></span>
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="new-password" className="input-label">Mật khẩu mới</label>
                <div className="input-wrap">
                  <input
                    id="new-password"
                    className="auth-input"
                    type="password"
                    placeholder="Nhập mật khẩu mới"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength="6"
                  />
                  <span className="input-icon"><IconLock /></span>
                </div>
              </div>

              {error && (
                <div className="alert-box alert-error" role="alert">
                  <IconAlert />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <><span className="spinner" /> Đang xử lý...</>
                ) : (
                  "Đặt lại mật khẩu"
                )}
              </button>
            </form>

            <div className="auth-alt" style={{ marginTop: "1rem", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Không nhận được?{" "}
                <button
                  onClick={handleSendOTP}
                  disabled={loading}
                  style={{
                    background: "none", border: "none",
                    color: "var(--accent-light)", cursor: "pointer",
                    fontWeight: 600, padding: 0, fontFamily: "inherit"
                  }}
                >
                  Gửi lại mã
                </button>
              </p>
            </div>
          </>
        )}

        {step === 1 && (
          /* ── Email Form State ── */
          <>
            <div className="auth-header">
              <h1>Quên mật khẩu?</h1>
              <p>Nhập email để nhận mã OTP</p>
            </div>

            <form onSubmit={handleSendOTP} className="auth-form" noValidate>
              <div className="input-group">
                <label htmlFor="forgot-email" className="input-label">Email</label>
                <div className="input-wrap">
                  <input
                    id="forgot-email"
                    className="auth-input"
                    type="email"
                    placeholder="ban@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                  <span className="input-icon"><IconMail /></span>
                </div>
              </div>

              {error && (
                <div className="alert-box alert-error" role="alert">
                  <IconAlert />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <><span className="spinner" /> Đang gửi...</>
                ) : (
                  "Gửi mã OTP"
                )}
              </button>
            </form>

            <div className="auth-alt">
              <Link to="/" className="back-link" style={{ justifyContent: "center", marginTop: 8 }}>
                <IconArrowLeft />
                Quay lại Đăng nhập
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
