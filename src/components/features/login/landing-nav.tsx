"use client";

import { useEffect, useState } from "react";

interface Props {
  onLogin: () => void;
  loading?: boolean;
}

/** Sticky nav — animates smoothly from centered stack to top row on scroll */
export default function LandingNav({ onLogin, loading }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Increased scroll threshold slightly to avoid triggering instantly on tiny bumps
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    // Run once on mount to check initial position
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      {/* Spacer to prevent content from jumping up when the nav height shrinks (fixes the jitter bug) and to reserve space for the fixed nav */}
      <div style={{ height: "280px" }} aria-hidden="true" />
      
      <nav className={`lp-nav${scrolled ? " lp-nav--scrolled" : ""}`}>
        <a href="#" className="lp-nav-logo" aria-label="UIT Hub trang chủ">
          <img src="/UITHUBLOGO.png" alt="" className="lp-nav-logo-img" />
          <span className="lp-nav-logo-text">UIT Hub</span>
        </a>

        <div className="lp-nav-actions">
          <button
            className="lp-btn-outline"
            onClick={onLogin}
            disabled={loading}
          >
            {loading ? "Đang chuyển hướng…" : "Đăng nhập"}
          </button>
          <button
            className="lp-btn-primary"
            onClick={onLogin}
            disabled={loading}
          >
            Bắt đầu
          </button>
        </div>
      </nav>
    </>
  );
}
