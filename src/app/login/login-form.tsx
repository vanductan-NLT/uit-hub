"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import LandingNav from "@/components/features/login/landing-nav";
import LandingHero from "@/components/features/login/landing-hero";
import LandingFeatureSections from "@/components/features/login/landing-feature-sections";
import LandingStatsRow from "@/components/features/login/landing-stats-row";
import LandingFooterCta from "@/components/features/login/landing-footer-cta";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

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
        <LandingStatsRow />
        <LandingFooterCta onLogin={handleLogin} loading={loading} />
      </main>
    </div>
  );
}
