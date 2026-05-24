"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import CountdownTimer from "@/components/CountdownTimer";
import PaymentModal from "@/components/PaymentModal";
import { formatPrice } from "@/lib/utils";

interface Reservation {
  id: string;
  quantity: number;
  status: "PENDING" | "CONFIRMED" | "RELEASED";
  expiresAt: string;
  createdAt: string;
  product: { id: string; name: string; price: number; imageUrl: string; description?: string };
  warehouse: { id: string; name: string; city: string } | null;
}

// Save reservation ID to localStorage for history page
function saveToHistory(id: string) {
  try {
    const existing: string[] = JSON.parse(localStorage.getItem("allo_history") ?? "[]");
    if (!existing.includes(id)) {
      localStorage.setItem("allo_history", JSON.stringify([id, ...existing].slice(0, 50)));
    }
  } catch {}
}

function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ["#2dd4bf", "#3b82f6", "#10b981", "#818cf8", "#f59e0b"];
    const particles = Array.from({ length: 100 }, () => ({
      x: canvas.width / 2, y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 10 - 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 7 + 3, rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8,
    }));
    let frame = 0;
    const run = () => {
      if (frame > 130) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.35; p.vx *= 0.985; p.rotation += p.rotSpeed;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, 1 - frame / 130);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
        ctx.restore();
      });
      frame++; requestAnimationFrame(run);
    };
    run();
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" style={{ mixBlendMode: "screen" }} />;
}

function StatusPill({ status }: { status: Reservation["status"] | "EXPIRED" }) {
  const cfg = {
    PENDING:   { label: "Pending",   cls: "text-amber-300 bg-amber-500/10 border-amber-500/25",   dot: "bg-amber-400" },
    CONFIRMED: { label: "Confirmed", cls: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25", dot: "bg-emerald-400" },
    RELEASED:  { label: "Released",  cls: "text-white/35 bg-white/5 border-white/10",              dot: "bg-white/30" },
    EXPIRED:   { label: "Expired",   cls: "text-red-300 bg-red-500/10 border-red-500/25",          dot: "bg-red-400" },
  };
  const c = cfg[status];
  return (
    <motion.span key={status} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border tracking-wide uppercase ${c.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full stock-dot ${c.dot}`} />
      {c.label}
    </motion.span>
  );
}

function InfoCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.065)" }}>
      <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1.5">{label}</p>
      <p className={`font-bold text-sm leading-snug ${accent ? "" : "text-white"}`}
        style={accent ? { background: "linear-gradient(90deg,#2dd4bf,#3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontSize: "1.1rem" } : undefined}
      >{value}</p>
    </div>
  );
}

export default function ReservationPage() {
  const { id } = useParams<{ id: string }>();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"confirm" | "release" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<{ msg: string; code: number } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [expired, setExpired] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const fetchReservation = useCallback(async () => {
    try {
      const res = await fetch(`/api/reservations/${id}`);
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? "Not found"); return; }
      const data = await res.json();
      setReservation(data);
      saveToHistory(id);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchReservation(); }, [fetchReservation]);

  useEffect(() => {
    if (!reservation || reservation.status !== "PENDING") return;
    const t = setInterval(fetchReservation, 10000);
    return () => clearInterval(t);
  }, [reservation, fetchReservation]);

  const doConfirm = useCallback(async () => {
    if (!reservation || actionLoading) return;
    setActionLoading("confirm");
    setInlineError(null);
    try {
      const res = await fetch(`/api/reservations/${id}/confirm`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.status === 410) { setInlineError({ msg: "Reservation expired — hold time ran out.", code: 410 }); setReservation(p => p ? { ...p, status: "RELEASED" } : p); return; }
      // Already confirmed (e.g. double submit) — just show success
      if (res.status === 409 && data?.error?.includes("CONFIRMED")) { setReservation(p => p ? { ...p, status: "CONFIRMED" } : p); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 2800); return; }
      if (!res.ok) { setInlineError({ msg: data.error ?? "Confirmation failed", code: res.status }); return; }
      setReservation(data);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2800);
    } catch { setInlineError({ msg: "Network error", code: 0 }); }
    finally { setActionLoading(null); }
  }, [id, reservation, actionLoading]);

  const handleRelease = async () => {
    if (!reservation || actionLoading) return;
    setActionLoading("release");
    setInlineError(null);
    try {
      const res = await fetch(`/api/reservations/${id}/release`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setInlineError({ msg: data.error ?? "Release failed", code: res.status }); return; }
      setReservation(data);
    } catch { setInlineError({ msg: "Network error", code: 0 }); }
    finally { setActionLoading(null); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <svg className="w-9 h-9 animate-spin" style={{ color: "#2dd4bf" }} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-white/35 text-sm">Loading reservation…</p>
      </div>
    </div>
  );

  if (error || !reservation) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="glass-card p-8">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-white text-xl font-bold mb-2">Reservation Not Found</h2>
        <p className="text-white/40 text-sm mb-6">{error ?? "This reservation doesn't exist."}</p>
        <Link href="/products" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white"
          style={{ background: "linear-gradient(135deg,#0d9488,#0284c7)" }}>
          ← Browse Health Plans
        </Link>
      </div>
    </div>
  );

  const isPending = reservation.status === "PENDING" && !expired;
  const isConfirmed = reservation.status === "CONFIRMED";
  const isReleased = reservation.status === "RELEASED" || expired;
  const totalSeconds = (new Date(reservation.expiresAt).getTime() - new Date(reservation.createdAt).getTime()) / 1000;

  return (
    <>
      {showConfetti && <ConfettiCanvas />}
      <PaymentModal
        open={showPayment}
        amount={reservation.product.price * reservation.quantity}
        productName={reservation.product.name}
        onSuccess={() => { setShowPayment(false); doConfirm(); }}
        onClose={() => setShowPayment(false)}
      />

      <div className="max-w-2xl mx-auto px-4 pb-20">
        <div className="mb-6">
          <Link href="/products" className="text-white/35 hover:text-white/60 text-sm transition-colors flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Health Plans
          </Link>
        </div>

        {/* Inline error */}
        <AnimatePresence>
          {inlineError && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-5 px-5 py-4 rounded-2xl flex items-start gap-3"
              style={{ background: inlineError.code === 410 ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${inlineError.code === 410 ? "rgba(245,158,11,0.25)" : "rgba(239,68,68,0.25)"}` }}
            >
              <span className="text-xl shrink-0">{inlineError.code === 410 ? "⏰" : "⚠️"}</span>
              <div>
                <p className={`font-semibold text-sm ${inlineError.code === 410 ? "text-amber-300" : "text-red-300"}`}>
                  {inlineError.code === 410 ? "Reservation Expired" : "Action Failed"}
                </p>
                <p className="text-white/45 text-sm mt-0.5">{inlineError.msg}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
          {/* Banner */}
          <div className="relative h-44 overflow-hidden">
            <Image src={reservation.product.imageUrl} alt={reservation.product.name} fill className="object-cover scale-105 blur-sm" sizes="672px" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(7,8,15,0.3), rgba(7,8,15,0.96))" }} />
            <div className="absolute inset-0 flex items-end px-6 pb-5">
              <div>
                <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-0.5">
                  Reservation · #{reservation.id.slice(-8).toUpperCase()}
                </p>
                <h1 className="text-white text-2xl font-black leading-tight">{reservation.product.name}</h1>
              </div>
            </div>
          </div>

          <div className="p-6 flex flex-col gap-5">
            {/* Status row */}
            <div className="flex items-center justify-between">
              <AnimatePresence mode="wait">
                <StatusPill key={reservation.status + String(expired)} status={expired && reservation.status === "PENDING" ? "EXPIRED" : reservation.status} />
              </AnimatePresence>
              <span className="text-white/25 text-xs font-mono">
                {new Date(reservation.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            <div className="divider" />

            {/* Confirmed */}
            <AnimatePresence>
              {isConfirmed && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 py-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(16,185,129,0.12)", border: "2px solid rgba(16,185,129,0.4)", boxShadow: "0 0 40px rgba(16,185,129,0.2)" }}
                  >
                    <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <motion.path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.2 }} />
                    </svg>
                  </motion.div>
                  <div className="text-center">
                    <h2 className="text-emerald-300 text-2xl font-black" style={{ textShadow: "0 0 24px rgba(16,185,129,0.4)" }}>Booking Confirmed!</h2>
                    <p className="text-white/40 text-sm mt-1">Your health plan has been booked. Check your email for details.</p>
                  </div>
                  <Link href="/history" className="text-teal-400 hover:text-teal-300 text-sm transition-colors flex items-center gap-1 mt-1">
                    View in history →
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Released */}
            <AnimatePresence>
              {isReleased && !isConfirmed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 py-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <svg className="w-7 h-7 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-white/35 text-sm">This slot has been released back to the pool.</p>
                  <Link href="/products" className="text-teal-400 hover:text-teal-300 text-sm transition-colors">
                    Reserve another slot →
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Countdown */}
            {isPending && (
              <div className="flex justify-center py-2">
                <CountdownTimer expiresAt={reservation.expiresAt} totalSeconds={totalSeconds} onExpire={() => setExpired(true)} />
              </div>
            )}

            {/* Details */}
            <div className="grid grid-cols-2 gap-3">
              <InfoCard label="Plan" value={reservation.product.name} />
              <InfoCard label="Clinic" value={reservation.warehouse ? `${reservation.warehouse.city}` : "—"} />
              <InfoCard label="Quantity" value={`${reservation.quantity} slot`} />
              <InfoCard label="Amount" value={formatPrice(reservation.product.price * reservation.quantity)} accent />
            </div>

            {/* Actions */}
            {isPending && (
              <div className="flex gap-3 mt-1">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowPayment(true)}
                  disabled={!!actionLoading}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#0d9488,#0284c7)", boxShadow: "0 4px 24px rgba(13,148,136,0.3)" }}
                >
                  {actionLoading === "confirm" ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  )}
                  {actionLoading === "confirm" ? "Confirming…" : "Proceed to Pay"}
                </motion.button>

                <motion.button whileTap={{ scale: 0.97 }} onClick={handleRelease}
                  disabled={!!actionLoading}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white/50 hover:text-red-300 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {actionLoading === "release" ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : "Cancel Booking"}
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
