"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);
    const { error: authErr } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        queryParams: {
          // Gợi ý user dùng tài khoản @gm.uit.edu.vn
          hd: "gm.uit.edu.vn",
        },
      },
    });
    if (authErr) {
      setError(authErr.message);
      setLoading(false);
    }
    // Nếu thành công, browser sẽ redirect sang Google — không cần setLoading(false)
  }

  return (
    <div className="es-login-centered">
      {/* Animated galactic background with stairs */}
      <div className="es-galactic-bg">
        <div className="es-galactic-stars"></div>
        <div className="es-stairs-container">
          <div className="es-stair es-stair-1"></div>
          <div className="es-stair es-stair-2"></div>
          <div className="es-stair es-stair-3"></div>
          <div className="es-stair es-stair-4"></div>
          <div className="es-stair es-stair-5"></div>
        </div>
      </div>

      {/* Content wrapper */}
      <div className="es-login-content">
        {/* Logo */}
        <div className="es-login-centered-logo">
          <img src="/uit-logo.png" alt="UIT" />
          <div>
            <div className="es-login-centered-brand">UIT Hub</div>
            <div className="es-login-centered-brand-sub">UIT · 2024–2025</div>
          </div>
        </div>


      {/* Form Container */}
      <div className="es-login-centered-form">
        <div className="es-login-centered-heading">Chào mừng trở lại</div>
        <div className="es-login-centered-sub">Đăng nhập để tiếp tục lộ trình học tập của bạn</div>

        {error && <div className="es-login-error">{error}</div>}

        <button className="es-login-gg-btn" onClick={handleGoogleLogin} disabled={loading}>
          {loading ? (
            <span style={{ opacity: 0.7 }}>Đang chuyển hướng...</span>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.33 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.67 14.62 48 24 48z" />
              </svg>
              Tiếp tục với Google
            </>
          )}
        </button>

        <div className="es-login-hint">
          Chỉ chấp nhận email có đuôi <strong>@gm.uit.edu.vn</strong>
        </div>
      </div>

      {/* Tagline below */}
      <div className="es-login-centered-tagline">
        <div className="es-login-centered-tagline-h">Cá nhân hóa lộ trình học của bạn</div>
        <div className="es-login-centered-tagline-sub">
          Dự báo GPA · Tracker tiến độ · Kế hoạch ôn thi · Tài nguyên học tập
        </div>
      </div>
      </div>
    </div>
  );
}
