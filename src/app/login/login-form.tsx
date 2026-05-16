"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  // The Bones: Untouched Logic
  async function handleGoogleLogin() {
    setError("");
    setLoading(true);
    const { error: authErr } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        queryParams: {
          hd: "gm.uit.edu.vn",
        },
      },
    });
    if (authErr) {
      setError(authErr.message);
      setLoading(false);
    }
  }

  // The New Skin: Pure Tailwind CSS
  return (
    <div className="flex min-h-screen w-full bg-zinc-950 font-sans text-white">
      
      {/* LEFT SIDE: The Brand Canvas */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-16 bg-gradient-to-br from-blue-950 via-zinc-900 to-black border-r border-zinc-800/50 relative overflow-hidden">
        
        {/* Glowing Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 mt-12">
          <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 tracking-tighter mb-6">
            EduSphere.
          </h1>
          <p className="text-zinc-400 text-xl max-w-lg leading-relaxed font-light">
            Cá nhân hóa lộ trình học của bạn. Dự báo GPA, tracker tiến độ, và kế hoạch ôn thi tại UIT.
          </p>
        </div>

        <div className="relative z-10 mb-12">
          <div className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-md shadow-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-3 animate-pulse"></span>
            <span className="text-sm font-medium text-zinc-300 tracking-wide">Hệ thống đang hoạt động</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: The Login Engine */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 relative">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center lg:text-left">
            <h2 className="text-4xl font-bold tracking-tight mb-2">Chào mừng trở lại</h2>
            <p className="text-zinc-400 text-lg">Đăng nhập để tiếp tục lộ trình học tập của bạn.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <button 
            onClick={handleGoogleLogin} 
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-200 text-black transition-all py-4 px-4 rounded-2xl font-bold text-base disabled:opacity-70 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            {loading ? (
              <span className="opacity-70 animate-pulse">Đang chuyển hướng...</span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.33 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.67 14.62 48 24 48z" />
                </svg>
                Tiếp tục với Google
              </>
            )}
          </button>

          <div className="text-center text-sm text-zinc-500 pt-4 border-t border-zinc-800/50">
            Chỉ chấp nhận email có đuôi <strong className="text-zinc-300">@gm.uit.edu.vn</strong>
          </div>
          
        </div>
      </div>
      
    </div>
  );
}