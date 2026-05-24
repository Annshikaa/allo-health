"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface Reservation {
  id: string;
  quantity: number;
  status: "PENDING" | "CONFIRMED" | "RELEASED";
  expiresAt: string;
  createdAt: string;
  product: { id: string; name: string; price: number; imageUrl: string };
  warehouse: { id: string; name: string; city: string } | null;
}

const statusConfig = {
  PENDING:   { label: "Active",     cls: "text-amber-300 bg-amber-500/10 border-amber-500/20",     dot: "bg-amber-400" },
  CONFIRMED: { label: "Confirmed",  cls: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400" },
  RELEASED:  { label: "Released",   cls: "text-white/35 bg-white/5 border-white/10",               dot: "bg-white/25" },
};

function ReservationRow({ id, index, onLoad }: { id: string; index: number; onLoad?: (id: string, status: string) => void }) {
  const [res, setRes] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/reservations/${id}`)
      .then((r) => { if (r.status === 404) { setNotFound(true); return null; } return r.json(); })
      .then((d) => { if (d) { setRes(d); onLoad?.(id, d.status); } })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, onLoad]);

  if (notFound) return null;

  const cfg = res ? statusConfig[res.status] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 200 }}
      className="glass-card overflow-hidden"
    >
      {loading ? (
        <div className="p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/5 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-white/5 rounded-lg w-2/3 animate-pulse" />
            <div className="h-3 bg-white/5 rounded-lg w-1/3 animate-pulse" />
          </div>
        </div>
      ) : res && cfg ? (
        <Link href={`/reservation/${res.id}`} className="flex items-start gap-4 p-5 hover:bg-white/[0.02] transition-colors group">
          {/* Image */}
          <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
            <Image src={res.product.imageUrl} alt={res.product.name} fill className="object-cover" sizes="64px" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(7,8,15,0.2), rgba(7,8,15,0.5))" }} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <p className="text-white font-semibold text-sm leading-snug truncate pr-2 group-hover:text-teal-300 transition-colors">
                {res.product.name}
              </p>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0 ${cfg.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${res.status === "PENDING" ? "stock-dot" : ""} ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {res.warehouse && (
                <span className="text-white/35 text-xs flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {res.warehouse.city}
                </span>
              )}
              <span className="text-white/35 text-xs">
                {new Date(res.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <span className="text-teal-400 text-xs font-semibold">
                {formatPrice(res.product.price * res.quantity)}
              </span>
            </div>
          </div>

          {/* Arrow */}
          <svg className="w-4 h-4 text-white/20 group-hover:text-teal-400 transition-colors shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ) : null}
    </motion.div>
  );
}

export default function HistoryPage() {
  const [ids, setIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const stored: string[] = JSON.parse(localStorage.getItem("allo_history") ?? "[]");
      setIds(stored);
    } catch {}
    setLoaded(true);
  }, []);

  const handleStatusLoad = (id: string, status: string) => {
    setStatuses((prev) => ({ ...prev, [id]: status }));
  };

  const clearHistory = () => {
    localStorage.removeItem("allo_history");
    setIds([]);
    setStatuses({});
  };

  const confirmed = Object.values(statuses).filter((s) => s === "CONFIRMED").length;
  const pending   = Object.values(statuses).filter((s) => s === "PENDING").length;
  const released  = Object.values(statuses).filter((s) => s === "RELEASED").length;

  return (
    <div className="max-w-2xl mx-auto px-4 pb-20">
      {/* Header */}
      <div className="pt-8 pb-8">
        <Link href="/products" className="text-white/35 hover:text-white/60 text-sm transition-colors flex items-center gap-1.5 mb-6">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Health Plans
        </Link>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1">Your Account</p>
            <h1 className="text-3xl font-black text-white" style={{ letterSpacing: "-0.03em" }}>
              Booking History
            </h1>
          </div>

          {ids.length > 0 && (
            <button onClick={clearHistory} className="text-white/25 hover:text-red-400 text-xs transition-colors px-2 py-1 rounded hover:bg-red-500/10">
              Clear all
            </button>
          )}
        </div>

        {/* Stats row */}
        {ids.length > 0 && (
          <div className="grid grid-cols-4 gap-2.5 mt-6">
            {[
              { label: "Total", value: ids.length, color: "#2dd4bf" },
              { label: "Confirmed", value: confirmed, color: "#10b981" },
              { label: "Active", value: pending, color: "#f59e0b" },
              { label: "Released", value: released, color: "rgba(255,255,255,0.3)" },
            ].map((s) => (
              <div key={s.label} className="p-3.5 rounded-xl text-center"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="font-black text-xl" style={{ color: s.color }}>{s.value}</p>
                <p className="text-white/30 text-[11px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="divider mb-6" />

      {/* List */}
      <AnimatePresence mode="wait">
        {!loaded ? (
          <div className="flex justify-center py-20">
            <svg className="w-8 h-8 animate-spin" style={{ color: "#2dd4bf" }} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : ids.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-white font-bold text-lg mb-2">No bookings yet</h2>
            <p className="text-white/35 text-sm mb-6">
              Your reservations will appear here after you reserve a health plan.
            </p>
            <Link href="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white"
              style={{ background: "linear-gradient(135deg,#0d9488,#0284c7)" }}
            >
              Browse Health Plans
            </Link>
          </motion.div>
        ) : (
          <motion.div key="list" className="flex flex-col gap-3">
            {ids.map((id, i) => (
              <ReservationRow key={id} id={id} index={i} onLoad={handleStatusLoad} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
