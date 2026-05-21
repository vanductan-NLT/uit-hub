"use client";

import { useEffect, useState } from "react";

interface Props {
  onLogin: () => void;
  loading?: boolean;
}

/** Sticky nav — gains shadow + border on scroll */
export default function LandingNav({ onLogin, loading }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className={`lp-nav${scrolled ? " lp-nav--scrolled" : ""}`}>
      <a href="#" className="lp-nav-logo" aria-label="UIT Hub trang chủ">
        <img src="/uit-logo.png" alt="" width={32} height={32} className="lp-nav-logo-img" />
        <span className="lp-nav-logo-text">UIT Hub</span>
      </a>

      <div className="lp-nav-actions">
        <button
          className="lp-btn-outline lp-btn-sm"
          onClick={onLogin}
          disabled={loading}
        >
          {loading ? "Đang chuyển hướng…" : "Đăng nhập"}
        </button>
        <button
          className="lp-btn-primary lp-btn-sm"
          onClick={onLogin}
          disabled={loading}
        >
          Bắt đầu
        </button>
      </div>
    </nav>
  );
}
