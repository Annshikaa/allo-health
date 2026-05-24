"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { ToastContainer } from "@/components/Toast";

interface Stock {
  id: string;
  totalUnits: number;
  reservedUnits: number;
  availableUnits: number;
  warehouse: { id: string; name: string; city: string };
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stocks: Stock[];
}

const categoryColors: Record<string, string> = {
  Supplements:           "#f59e0b",
  "Hair Care":           "#8b5cf6",
  "Skin Care":           "#3b82f6",
  "Sexual Wellness":     "#ef4444",
  "Vitamins & Minerals": "#10b981",
};
const categoryIcons: Record<string, string> = {
  Supplements: "💊", "Hair Care": "💆", "Skin Care": "✨", "Sexual Wellness": "❤️", "Vitamins & Minerals": "🧬",
};

function StockBadge({ available }: { available: number }) {
  const cfg =
    available === 0  ? { cls: "text-red-400 bg-red-500/10 border-red-500/20",     dot: "bg-red-400",    label: "Out of Stock" } :
    available <= 2   ? { cls: "text-red-400 bg-red-500/10 border-red-500/20",     dot: "bg-red-400",    label: `${available} left` } :
    available <= 5   ? { cls: "text-amber-400 bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400", label: `${available} left` } :
                       { cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400", label: `${available} in stock` };
  return (
    <motion.span key={available} initial={{ scale: 1.15 }} animate={{ scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full stock-dot ${cfg.dot}`} />
      {cfg.label}
    </motion.span>
  );
}

export default function ProductCard({
  product,
  onReserved,
}: {
  product: Product;
  onReserved?: (warehouseId: string) => void;
}) {
  const router = useRouter();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(
    product.stocks.find((s) => s.availableUnits > 0)?.warehouse.id ?? product.stocks[0]?.warehouse.id ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "error" | "success" | "warning" }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [imgError, setImgError] = useState(false);
  const selectedStock = product.stocks.find((s) => s.warehouse.id === selectedWarehouseId);
  const available = selectedStock?.availableUnits ?? 0;
  const accent = categoryColors[product.category] ?? "#2dd4bf";
  const icon = categoryIcons[product.category] ?? "🏥";

  const addToast = useCallback((msg: string, type: "error" | "success" | "warning") => {
    setToasts((p) => [...p, { id: `${Date.now()}`, message: msg, type }]);
  }, []);

  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px;background:rgba(255,255,255,0.2);border-radius:50%;transform:scale(0);animation:ripple 0.6s linear;pointer-events:none;`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const handleReserve = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (available === 0 || loading) return;
    handleRipple(e);
    setLoading(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": `${product.id}-${selectedWarehouseId}-${Date.now()}` },
        body: JSON.stringify({ productId: product.id, warehouseId: selectedWarehouseId, quantity: 1 }),
      });
      if (res.status === 409) { setShake(true); setTimeout(() => setShake(false), 600); addToast("No slots left — someone just grabbed the last one.", "error"); return; }
      if (!res.ok) { const d = await res.json().catch(() => ({})); addToast(d.error ?? "Something went wrong.", "error"); return; }
      const data = await res.json();
      onReserved?.(selectedWarehouseId);
      router.push(`/reservation/${data.id}`);
    } catch { addToast("Network error.", "error"); }
    finally { setLoading(false); }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={shake ? { x: [-5,5,-4,4,-2,2,0] } : { opacity: 1, y: 0 }}
        whileHover={{ scale: 1.018, boxShadow: `0 20px 60px ${accent}18, 0 0 0 1px ${accent}28` }}
        transition={shake ? { duration: 0.35 } : { type: "spring", stiffness: 180, damping: 22 }}
        className="glass-card flex flex-col overflow-hidden group h-full"
        style={{ willChange: "transform" }}
      >
        {/* Clickable image → product detail */}
        <Link href={`/products/${product.id}`} className="block relative h-44 overflow-hidden">
          {imgError ? (
            <div className="absolute inset-0 flex items-center justify-center text-4xl"
              style={{ background: `linear-gradient(135deg, ${accent}18, ${accent}08)` }}
            >
              {icon}
            </div>
          ) : (
            <Image src={product.imageUrl} alt={product.name} fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width:768px) 100vw,33vw"
              onError={() => setImgError(true)}
            />
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 35%, rgba(7,8,15,0.96) 100%)" }} />
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm"
            style={{ background: "rgba(7,8,15,0.65)", border: `1px solid ${accent}40`, color: accent }}
          >
            {icon} {product.category}
          </span>
          {/* View details hint */}
          <span className="absolute bottom-3 right-3 text-[10px] text-white/30 group-hover:text-white/60 transition-colors font-medium">
            View details →
          </span>
        </Link>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          <Link href={`/products/${product.id}`} className="block group/name">
            <h3 className="font-bold text-white text-base leading-snug group-hover/name:text-teal-300 transition-colors line-clamp-1">
              {product.name}
            </h3>
            <p className="text-white/40 text-xs mt-1 leading-relaxed line-clamp-2">{product.description}</p>
          </Link>

          {/* Price */}
          <p className="text-xl font-black" style={{ color: accent }}>
            {formatPrice(product.price)}
          </p>

          {/* City pills — stop propagation so clicking city doesn't navigate */}
          <div>
            <p className="text-white/25 text-[10px] font-semibold uppercase tracking-wider mb-1.5">City</p>
            <div className="flex flex-wrap gap-1.5">
              {product.stocks.map((stock) => (
                <button key={stock.warehouse.id}
                  onClick={(e) => { e.preventDefault(); setSelectedWarehouseId(stock.warehouse.id); }}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-150"
                  style={
                    selectedWarehouseId === stock.warehouse.id
                      ? { background: `${accent}22`, border: `1px solid ${accent}55`, color: accent }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: stock.availableUnits === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.45)" }
                  }
                >
                  {stock.warehouse.city}
                  {stock.availableUnits === 0 && <span className="ml-1 text-[9px] text-red-400/50">full</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between mt-auto pt-1">
            <StockBadge available={available} />
            <motion.button ref={buttonRef} whileTap={{ scale: 0.96 }} onClick={handleReserve}
              disabled={available === 0 || loading}
              className="px-4 py-2 rounded-lg font-bold text-xs text-white flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden transition-all"
              style={available > 0
                ? { background: `linear-gradient(135deg, ${accent}, #0284c7)`, boxShadow: `0 3px 16px ${accent}35` }
                : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }
              }
            >
              {loading ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              )}
              {loading ? "…" : available === 0 ? "Sold Out" : "Reserve"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
