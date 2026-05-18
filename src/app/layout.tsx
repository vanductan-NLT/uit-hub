import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-var",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "UIT Hub",
  description: "Cá nhân hóa lộ trình học tập UIT",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${jakarta.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      {/* Anti-flash: set theme before React hydration to prevent white flash */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);})();` }} />
      </head>
      <body>{children}</body>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-069BHYPWZ9" strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-069BHYPWZ9');
      `}</Script>
    </html>
  );
}
