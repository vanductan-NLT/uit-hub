import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { Agentation } from "agentation";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
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

export const viewport = {
  width: "device-width",
  initialScale: 1,
  // Extend under the iOS notch/home-indicator so env(safe-area-inset-*) reports
  // real values — required for the sidebar footer to clear Safari's bottom bar.
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${jakarta.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);})();` }}
        />
        {children}
        {/* Dev-only visual feedback tool — click a UI element to generate structured context for AI agents */}
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
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
