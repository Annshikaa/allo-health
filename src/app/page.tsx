import Link from "next/link";

const STATS = [
  { value: "10 min", label: "Reservation hold", color: "#3b82f6", icon: "⏱" },
  { value: "3", label: "Fulfilment hubs", color: "#2dd4bf", icon: "🏭" },
  { value: "0", label: "Double bookings", color: "#10b981", icon: "✅" },
  { value: "24 h", label: "Idempotency TTL", color: "#a78bfa", icon: "🔐" },
];

const STEPS = [
  {
    step: "01", icon: "🛒", title: "Pick & Reserve",
    desc: "Choose a product and fulfilment city. Click Reserve — your unit is locked for 10 minutes via SELECT FOR UPDATE.",
    color: "#3b82f6",
  },
  {
    step: "02", icon: "⏱", title: "Complete Checkout",
    desc: "Finish payment within the countdown window. The unit is held exclusively for you — no one else can claim it.",
    color: "#06b6d4",
  },
  {
    step: "03", icon: "✅", title: "Confirmed",
    desc: "Payment succeeds → reservation confirmed, stock permanently decremented. Cancel anytime → slot instantly returns to the pool.",
    color: "#10b981",
  },
];

const FEATURES = [
  { icon: "⚡", title: "Race-condition proof", desc: "Postgres row-level locking ensures exactly one winner, even under simultaneous requests.", color: "#f59e0b" },
  { icon: "🔑", title: "Idempotent API", desc: "Replay-safe reservations via 24-hour Redis idempotency keys — no accidental double bookings.", color: "#3b82f6" },
  { icon: "🕐", title: "Auto-expiry", desc: "Two-layer expiry: lazy GET check + cron batch release every 5 minutes frees stale holds.", color: "#2dd4bf" },
  { icon: "🏙️", title: "Multi-warehouse", desc: "Three clinic cities — Mumbai, Delhi, Bangalore — each with independent real-time stock.", color: "#10b981" },
  { icon: "💳", title: "4 payment methods", desc: "Card, UPI, Net Banking, and Wallets — with animated processing states and 90% demo success rate.", color: "#818cf8" },
  { icon: "📋", title: "Booking history", desc: "Persistent localStorage reservation log with live status polling and instant status badges.", color: "#f43f5e" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Hero ─────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-10 pb-24 relative">
        {/* Live badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-bold uppercase tracking-widest float"
          style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#6ee7b7" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 stock-dot" />
          Live Health Inventory Platform
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.02] mb-6 max-w-4xl" style={{ letterSpacing: "-0.04em" }}>
          <span className="shimmer-text">Your Health.</span>
          <br />
          <span className="shimmer-text">Reserved.</span>
          <br />
          <span className="text-white">Secured.</span>
        </h1>

        <p className="text-white/45 text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-10">
          Reserve supplements, hair care, skin care, and wellness products with a
          guaranteed <span className="text-teal-400 font-semibold">10-minute hold window</span> — so the last unit is always yours.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <Link
            href="/products"
            className="px-8 py-4 rounded-2xl font-bold text-white text-base transition-all duration-200 flex items-center justify-center gap-3 hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #0d9488, #0284c7)",
              boxShadow: "0 8px 32px rgba(13,148,136,0.4), 0 0 0 1px rgba(45,212,191,0.15)",
            }}
          >
            Shop Health Products
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <a
            href="#how-it-works"
            className="px-8 py-4 rounded-2xl font-bold text-white/60 text-base transition-all duration-200 hover:text-white/90 hover:bg-white/[0.06]"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
          >
            How it works ↓
          </a>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl w-full">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center p-5 rounded-2xl group hover:scale-[1.03] transition-transform duration-200"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <span className="text-xl mb-1">{s.icon}</span>
              <span className="text-2xl font-black mb-0.5" style={{ color: s.color }}>{s.value}</span>
              <span className="text-white/35 text-xs text-center">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features grid ───────────────────────── */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-white/25 text-xs font-bold uppercase tracking-widest mb-3">Platform capabilities</p>
          <h2 className="text-2xl md:text-3xl font-black text-center text-white mb-10" style={{ letterSpacing: "-0.025em" }}>
            Built for reliability at scale
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-5 rounded-2xl group hover:scale-[1.02] transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <span className="text-2xl mb-3 block">{f.icon}</span>
                <h3 className="text-white font-bold text-sm mb-1.5" style={{ color: f.color }}>{f.title}</h3>
                <p className="text-white/38 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────── */}
      <section id="how-it-works" className="px-4 pb-28">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-white/25 text-xs font-bold uppercase tracking-widest mb-3">Step by step</p>
          <h2 className="text-2xl md:text-3xl font-black text-center text-white mb-3" style={{ letterSpacing: "-0.025em" }}>
            How reservation works
          </h2>
          <p className="text-center text-white/35 mb-12 text-sm">
            Race-condition-proof. Powered by Postgres row-level locking.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(45,212,191,0.25), rgba(59,130,246,0.25), transparent)" }}
            />

            {STEPS.map((item, i) => (
              <div
                key={item.step}
                className="relative p-6 rounded-2xl group hover:scale-[1.02] transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.028)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                    style={{ background: `${item.color}18`, border: `1px solid ${item.color}40`, color: item.color }}
                  >
                    {item.step}
                  </div>
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <h3 className="text-white font-bold text-base mb-2">{item.title}</h3>
                <p className="text-white/38 text-sm leading-relaxed">{item.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="md:hidden flex justify-center mt-4">
                    <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:scale-[1.03] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #0d9488, #0284c7)",
                boxShadow: "0 4px 20px rgba(13,148,136,0.3)",
              }}
            >
              View all products →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────── */}
      <footer className="border-t px-4 py-8" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#0d9488,#0284c7)", boxShadow: "0 0 10px rgba(13,148,136,0.4)" }}
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <span className="text-white/40 text-xs font-semibold">AlloHealth · Health Inventory</span>
          </div>
          <p className="text-white/20 text-xs">Built with Next.js 15 · Prisma · PostgreSQL · Redis · Three.js</p>
        </div>
      </footer>
    </div>
  );
}
