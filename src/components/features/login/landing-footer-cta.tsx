interface Props {
  onLogin: () => void;
  loading?: boolean;
}

/** Final blue CTA section + minimal footer — mirrors Duolingo's bottom green band */
export default function LandingFooterCta({ onLogin, loading }: Props) {
  return (
    <>
      {/* ── CTA Band ── */}
      <section className="lp-cta-band">
        <div className="lp-cta-inner">
          <div className="lp-cta-mascot" aria-hidden="true">🎓</div>
          <h2 className="lp-cta-heading">Bắt đầu hành trình học tập của bạn</h2>
          <p className="lp-cta-sub">Miễn phí. Không cần cài đặt. Chỉ cần email @gm.uit.edu.vn.</p>
          <div className="lp-cta-btns">
            <button
              className="lp-btn-white lp-btn-lg"
              onClick={onLogin}
              disabled={loading}
            >
              {loading ? "Đang chuyển hướng…" : "BẮT ĐẦU MIỄN PHÍ"}
            </button>
            <button
              className="lp-btn-outline-white lp-btn-lg"
              onClick={onLogin}
              disabled={loading}
            >
              ĐÃ CÓ TÀI KHOẢN
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <img src="/uit-logo.png" alt="UIT" width={28} height={28} />
            <span>UIT Hub</span>
          </div>
          <div className="lp-footer-links"></div>
          <div className="lp-footer-copy">
            © {new Date().getFullYear()} UIT Hub · Trường Đại học Công nghệ Thông tin
          </div>
        </div>
      </footer>
    </>
  );
}
