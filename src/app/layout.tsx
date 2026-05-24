import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import ThreeBackgroundLoader from "@/components/ThreeBackgroundLoader";
import NavLinks from "@/components/NavLinks";

export const metadata: Metadata = {
  title: "AlloHealth — Reserve. Secure. Yours.",
  description: "Multi-warehouse health inventory & reservation platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen" style={{ background: "#060d0c" }}>
        <ThreeBackgroundLoader />

        <nav
          className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-3.5"
          style={{
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            background: "linear-gradient(180deg, rgba(6,13,12,0.88) 0%, rgba(6,13,12,0.72) 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 1px 32px rgba(0,0,0,0.4)",
          }}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #0d9488, #0284c7)",
                boxShadow: "0 0 16px rgba(13,148,136,0.55), 0 0 32px rgba(13,148,136,0.2)",
              }}
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
            </div>
            <span className="font-black text-base tracking-tight" style={{ letterSpacing: "-0.025em" }}>
              <span className="text-white">Allo</span>
              <span style={{ color: "#2dd4bf" }}>Health</span>
            </span>
          </Link>

          <NavLinks />
        </nav>

        <main className="relative z-10 pt-[68px] min-h-screen">{children}</main>
      </body>
    </html>
  );
}
