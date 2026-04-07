import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (token) {
      localStorage.setItem("token", token);
      navigate("/chat", { replace: true });
    } else {
      // Có lỗi hoặc không có token → về trang login
      navigate("/", {
        replace: true,
        state: { error: error || "Đăng nhập Google thất bại" },
      });
    }
  }, [searchParams, navigate]);

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ textAlign: "center", padding: "2.5rem" }}>
        <div className="google-callback-spinner">
          <span className="spinner" style={{ width: 36, height: 36, borderWidth: 4 }} />
        </div>
        <p style={{ marginTop: "1.25rem", color: "var(--text-secondary, #6b7280)", fontSize: "0.95rem" }}>
          Đang xử lý đăng nhập Google...
        </p>
      </div>
    </div>
  );
}

export default GoogleCallback;
