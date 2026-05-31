"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LandingNav from "@/components/features/login/landing-nav";
import LandingHero from "@/components/features/login/landing-hero";
import LandingFeatureSections from "@/components/features/login/landing-feature-sections";
import LandingFooterCta from "@/components/features/login/landing-footer-cta";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_domain: "Chỉ chấp nhận email @gm.uit.edu.vn. Vui lòng đăng nhập bằng email UIT.",
  auth_failed: "Đăng nhập thất bại. Vui lòng thử lại.",
};

export default function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("error");
    if (code && ERROR_MESSAGES[code]) {
      setError(ERROR_MESSAGES[code]);
    }
  }, [searchParams]);

  async function handleLogin() {
    setError("");
    setLoading(true);
    const { error: authErr } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        queryParams: { hd: "gm.uit.edu.vn" },
      },
    });
    if (authErr) {
      setError(authErr.message);
      setLoading(false);
    }
  }

  return (
    <div className="lp-root">
      <LandingNav onLogin={handleLogin} loading={loading} />

      {error && (
        <div role="alert" className="lp-global-error">
          {error}
        </div>
      )}

      <main>
        <LandingHero onLogin={handleLogin} loading={loading} />
        <LandingFeatureSections />
<LandingFooterCta onLogin={handleLogin} loading={loading} />
      </main>
    </div>
  );
}
