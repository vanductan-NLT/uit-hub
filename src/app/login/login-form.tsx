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
        
        {/* Constellation lines SVG */}
        <svg className="es-constellations" viewBox="0 0 1920 1080" preserveAspectRatio="none">
          {/* Big Dipper constellation */}
          <g className="es-constellation-group es-dipper" strokeWidth="1" stroke="rgba(59, 130, 246, 0.4)" fill="none" strokeLinecap="round">
            <line x1="200" y1="150" x2="280" y2="180" />
            <line x1="280" y1="180" x2="350" y2="160" />
            <line x1="350" y1="160" x2="400" y2="140" />
            <line x1="400" y1="140" x2="420" y2="100" />
            <line x1="420" y1="100" x2="380" y2="80" />
            <line x1="380" y1="80" x2="330" y2="90" />
            <line x1="330" y1="90" x2="280" y2="180" />
            <circle cx="200" cy="150" r="2" fill="rgba(59, 130, 246, 0.8)" />
            <circle cx="280" cy="180" r="2" fill="rgba(59, 130, 246, 0.8)" />
            <circle cx="350" cy="160" r="2" fill="rgba(59, 130, 246, 0.8)" />
            <circle cx="400" cy="140" r="2" fill="rgba(59, 130, 246, 0.8)" />
            <circle cx="420" cy="100" r="2" fill="rgba(59, 130, 246, 0.8)" />
            <circle cx="380" cy="80" r="2" fill="rgba(59, 130, 246, 0.8)" />
            <circle cx="330" cy="90" r="2" fill="rgba(59, 130, 246, 0.8)" />
          </g>
          
          {/* Orion constellation */}
          <g className="es-constellation-group es-orion" strokeWidth="1" stroke="rgba(59, 130, 246, 0.4)" fill="none" strokeLinecap="round">
            <line x1="1600" y1="300" x2="1650" y2="280" />
            <line x1="1650" y1="280" x2="1700" y2="260" />
            <line x1="1700" y1="260" x2="1680" y2="350" />
            <line x1="1680" y1="350" x2="1620" y2="380" />
            <line x1="1620" y1="380" x2="1550" y2="350" />
            <line x1="1550" y1="350" x2="1600" y2="300" />
            <line x1="1650" y1="280" x2="1620" y2="380" />
            <circle cx="1600" cy="300" r="2" fill="rgba(59, 130, 246, 0.8)" />
            <circle cx="1650" cy="280" r="2" fill="rgba(59, 130, 246, 0.8)" />
            <circle cx="1700" cy="260" r="2" fill="rgba(59, 130, 246, 0.8)" />
            <circle cx="1680" cy="350" r="2" fill="rgba(59, 130, 246, 0.8)" />
            <circle cx="1620" cy="380" r="2" fill="rgba(59, 130, 246, 0.8)" />
            <circle cx="1550" cy="350" r="2" fill="rgba(59, 130, 246, 0.8)" />
          </g>
          
          {/* Simple triangle constellation */}
          <g className="es-constellation-group es-triangle" strokeWidth="1" stroke="rgba(100, 150, 255, 0.5)" fill="none" strokeLinecap="round">
            <line x1="300" y1="800" x2="450" y2="750" />
            <line x1="450" y1="750" x2="400" y2="900" />
            <line x1="400" y1="900" x2="300" y2="800" />
            <circle cx="300" cy="800" r="2" fill="rgba(100, 150, 255, 0.9)" />
            <circle cx="450" cy="750" r="2" fill="rgba(100, 150, 255, 0.9)" />
            <circle cx="400" cy="900" r="2" fill="rgba(100, 150, 255, 0.9)" />
          </g>
        </svg>
        
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
