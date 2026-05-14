"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const supabase = createClient();

  async function handleLogin() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Vui lòng nhập email UIT.");
      return;
    }
    if (!trimmed.endsWith("@gm.uit.edu.vn")) {
      setError("Email không hợp lệ. Chỉ chấp nhận đuôi @gm.uit.edu.vn");
      return;
    }
    setError("");
    setLoading(true);
    const { error: authErr } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setLoading(false);
    if (authErr) {
      setError(authErr.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="es-login-screen">
      <div className="es-login-split">
        {/* Left: form */}
        <div className="es-login-left">
          <div className="es-login-brand">
            <div className="es-login-brand-icon">E</div>
            <div>
              <div className="es-login-brand-name">EduSphere</div>
              <div className="es-login-brand-sub">UIT · 2024–2025</div>
            </div>
          </div>

          {sent ? (
            <>
              <div className="es-login-heading">Kiểm tra email 📬</div>
              <div className="es-login-sub">
                Chúng tôi đã gửi link đăng nhập tới <strong>{email}</strong>.
                Vào hộp thư và click vào link để tiếp tục.
              </div>
              <button className="es-login-btn" style={{ marginTop: 24 }} onClick={() => { setSent(false); setShowEmail(true); }}>
                Thử lại với email khác
              </button>
            </>
          ) : (
            <>
              <div className="es-login-heading">Chào mừng trở lại</div>
              <div className="es-login-sub">Đăng nhập để tiếp tục lộ trình học tập của bạn</div>

              {error && <div className="es-login-error">{error}</div>}

              {!showEmail ? (
                <button className="es-login-gg-btn" onClick={() => setShowEmail(true)}>
                  <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.33 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.67 14.62 48 24 48z" />
                  </svg>
                  Tiếp tục với Google
                </button>
              ) : (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <label className="es-login-label">Email trường UIT</label>
                    <input
                      className="es-login-input"
                      type="email"
                      placeholder="24521586@gm.uit.edu.vn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      autoFocus
                    />
                  </div>
                  <button className="es-login-btn" onClick={handleLogin} disabled={loading}>
                    {loading ? "Đang xác thực..." : "Xác nhận & Đăng nhập"}
                  </button>
                </div>
              )}

              <div className="es-login-hint">
                Chỉ chấp nhận email có đuôi <strong>@gm.uit.edu.vn</strong>
              </div>
            </>
          )}
        </div>

        {/* Right: preview */}
        <div className="es-login-right">
          <div style={{ maxWidth: 420, width: "100%", position: "relative", zIndex: 1 }}>
            <div className="es-lm-tagline-h">Cá nhân hóa<br />lộ trình học của bạn</div>
            <div className="es-lm-tagline-sub">
              Dự báo GPA · Tracker tiến độ · Kế hoạch ôn thi<br />
              Tài nguyên theo từng chương bạn đang học
            </div>
            <div className="es-lm-card">
              <div className="es-lm-label">Dự báo GPA học kỳ này</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 700, color: "#fff", letterSpacing: -1 }}>3.31</span>
                <span style={{ fontSize: 16, color: "#9CA3AF", paddingBottom: 6 }}>/4.0</span>
              </div>
              <div className="es-lm-row"><span className="es-lm-subject">CTDL & Giải thuật</span><span className="es-lm-badge-a">Cần ≥ 7.0 CK</span></div>
              <div className="es-lm-row"><span className="es-lm-subject">Lập trình Web</span><span className="es-lm-badge-g">Đúng hướng A</span></div>
              <div className="es-lm-row" style={{ marginBottom: 0 }}><span className="es-lm-subject">Đại số tuyến tính</span><span className="es-lm-badge-r">Cần chú ý</span></div>
            </div>
            <div className="es-lm-card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 32 }}>🔥</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>8 ngày streak</div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>Học đều mỗi ngày — tiếp tục nhé!</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
