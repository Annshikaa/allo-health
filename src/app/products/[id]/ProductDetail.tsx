"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { ToastContainer } from "@/components/Toast";

interface Stock {
  id: string; totalUnits: number; reservedUnits: number; availableUnits: number;
  warehouse: { id: string; name: string; city: string };
}

interface Product {
  id: string; name: string; description: string; price: number;
  imageUrl: string; category: string;
  stocks: Stock[];
}

interface Review {
  id: string;
  authorName: string;
  rating: number;
  body: string;
  createdAt: string;
}

const categoryMeta: Record<string, { icon: string; color: string; tag: string }> = {
  Supplements:           { icon: "💊", color: "#f59e0b", tag: "Lab-tested" },
  "Hair Care":           { icon: "💆", color: "#8b5cf6", tag: "Dermatologist approved" },
  "Skin Care":           { icon: "✨", color: "#3b82f6", tag: "Clinically formulated" },
  "Sexual Wellness":     { icon: "❤️", color: "#ef4444", tag: "Body-safe" },
  "Vitamins & Minerals": { icon: "🧬", color: "#10b981", tag: "USP-verified" },
};

const highlights: Record<string, string[]> = {
  Supplements:           ["Third-party lab tested (COA included)", "GMP-certified manufacturing facility", "No proprietary blends or fillers", "Free shipping on orders above ₹999"],
  "Hair Care":           ["Dermatologist-approved formula", "Sulphate-free & paraben-free", "Clinically studied active ingredients", "Discreet, tamper-proof packaging"],
  "Skin Care":           ["Fragrance-free & non-comedogenic", "Dermatologically tested formula", "Suitable for Indian skin tones", "Cruelty-free, not tested on animals"],
  "Sexual Wellness":     ["Dermatologically tested & body-safe", "Discreet plain-box delivery", "Easy 7-day return policy", "pH-balanced & latex-compatible"],
  "Vitamins & Minerals": ["USP-verified ingredient purity", "Chelated for maximum absorption", "No artificial colours or fillers", "Subscribe & save 15% monthly"],
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} className="w-3.5 h-3.5" fill={s <= rating ? "#f59e0b" : "none"} viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={s <= rating ? 0 : 1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
        </svg>
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map((s) => (
        <button key={s} type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110"
        >
          <svg className="w-7 h-7" fill={(hovered || value) >= s ? "#f59e0b" : "none"} viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={(hovered || value) >= s ? 0 : 1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
          </svg>
        </button>
      ))}
    </div>
  );
}

function StockBar({ available, total }: { available: number; total: number }) {
  const pct = total === 0 ? 0 : Math.min(100, (available / total) * 100);
  const color = available === 0 ? "#ef4444" : available <= 2 ? "#f59e0b" : available <= 5 ? "#f59e0b" : "#10b981";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-white/35">Availability</span>
        <span className="font-semibold" style={{ color }}>
          {available === 0 ? "Fully booked" : `${available} of ${total} slots available`}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
        <motion.div className="h-full rounded-full" style={{ background: color }}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ── Reviews section ──────────────────────────────────────────────────────────
function ReviewsSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [eligibleReservationId, setEligibleReservationId] = useState<string | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Fetch reviews
  useEffect(() => {
    fetch(`/api/reviews?productId=${productId}`)
      .then((r) => r.ok ? r.json() : [])
      .then((d) => Array.isArray(d) && setReviews(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  // Check localStorage for a confirmed reservation for this product
  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem("allo_history") ?? "[]");
    if (ids.length === 0) return;

    // Check each reservation in history to find one that matches this product and is CONFIRMED
    Promise.all(
      ids.map((id) =>
        fetch(`/api/reservations/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    ).then((results) => {
      const match = results.find(
        (r) => r && r.productId === productId && r.status === "CONFIRMED"
      );
      if (match) {
        setEligibleReservationId(match.id);
        // Check if already reviewed
        fetch(`/api/reviews?productId=${productId}`)
          .then((r) => r.json())
          .then((all: Review[]) => {
            // We don't expose reservationId in the GET response, so just check via POST which returns 409
            setAlreadyReviewed(false); // will be caught on submit
            setReviews(all);
          });
      }
    });
  }, [productId, reviews.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!rating) { setFormError("Please select a star rating."); return; }
    if (!name.trim()) { setFormError("Please enter your name."); return; }
    if (body.trim().length < 10) { setFormError("Review must be at least 10 characters."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          reservationId: eligibleReservationId,
          authorName: name,
          rating,
          reviewBody: body,
        }),
      });
      const data = await res.json();
      if (res.status === 409) { setAlreadyReviewed(true); setShowForm(false); return; }
      if (!res.ok) { setFormError(data.error ?? "Something went wrong."); return; }
      setReviews((prev) => [data, ...prev]);
      setSubmitted(true);
      setShowForm(false);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const avg = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }} className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-1">Patient Reviews</p>
          {avg ? (
            <div className="flex items-center gap-2">
              <StarRating rating={Math.round(Number(avg))} />
              <span className="text-white font-black text-xl">{avg}</span>
              <span className="text-white/30 text-sm">· {reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span>
            </div>
          ) : (
            <p className="text-white/30 text-sm">{loading ? "Loading…" : "No reviews yet — be the first!"}</p>
          )}
        </div>

        {/* CTA to write review */}
        {eligibleReservationId && !alreadyReviewed && !submitted && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={showForm
              ? { background: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.3)", color: "#2dd4bf" }
              : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }
            }
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {showForm ? "Cancel" : "Write a Review"}
          </motion.button>
        )}

        {submitted && (
          <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Review submitted!
          </span>
        )}

        {alreadyReviewed && (
          <span className="text-white/30 text-xs italic">You&apos;ve already reviewed this product.</span>
        )}
      </div>

      {/* Write review form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleSubmit}
            className="mb-6 p-5 rounded-2xl overflow-hidden"
            style={{ background: "rgba(45,212,191,0.04)", border: "1px solid rgba(45,212,191,0.15)" }}
          >
            <p className="text-white font-bold text-sm mb-4">Share your experience</p>

            {/* Star picker */}
            <div className="mb-4">
              <label className="text-white/40 text-xs font-semibold uppercase tracking-wider block mb-2">Your Rating</label>
              <StarPicker value={rating} onChange={setRating} />
              {rating > 0 && (
                <p className="text-white/35 text-xs mt-1">
                  {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
                </p>
              )}
            </div>

            {/* Name */}
            <div className="mb-3">
              <label className="text-white/40 text-xs font-semibold uppercase tracking-wider block mb-1.5">Your Name</label>
              <input
                className="field-input"
                placeholder="e.g. Anshika J."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
              />
            </div>

            {/* Review body */}
            <div className="mb-4">
              <label className="text-white/40 text-xs font-semibold uppercase tracking-wider block mb-1.5">Your Review</label>
              <textarea
                className="field-input resize-none"
                rows={3}
                placeholder="Tell others about your experience…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={500}
              />
              <p className="text-white/20 text-[10px] mt-1 text-right">{body.length}/500</p>
            </div>

            {formError && (
              <p className="text-red-400 text-xs mb-3 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formError}
              </p>
            )}

            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              disabled={submitting}
              className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#0d9488,#0284c7)", boxShadow: "0 4px 16px rgba(13,148,136,0.25)" }}
            >
              {submitting ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Submitting…</>
              ) : "Submit Review"}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Review list */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[0,1].map((i) => (
            <div key={i} className="p-4 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.065)" }}>
              <div className="h-3 bg-white/5 rounded w-1/3 mb-2" />
              <div className="h-3 bg-white/5 rounded w-full mb-1" />
              <div className="h-3 bg-white/5 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 rounded-2xl" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-3xl mb-2">💬</p>
          <p className="text-white/30 text-sm">No reviews yet.</p>
          {!eligibleReservationId && (
            <p className="text-white/20 text-xs mt-1">Reserve and complete this plan to leave a review.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {reviews.map((r, i) => (
            <motion.div key={r.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="p-4 rounded-xl"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.065)" }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-white text-xs font-bold">{r.authorName}</p>
                  <p className="text-white/25 text-[10px]">{timeAgo(r.createdAt)}</p>
                </div>
                <StarRating rating={r.rating} />
              </div>
              <p className="text-white/50 text-xs leading-relaxed">&ldquo;{r.body}&rdquo;</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Prompt for non-eligible users */}
      {!eligibleReservationId && !loading && (
        <p className="text-center text-white/20 text-xs mt-4">
          Complete a reservation to unlock the ability to write a review.
        </p>
      )}
    </motion.div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const router = useRouter();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(
    product.stocks.find((s) => s.availableUnits > 0)?.warehouse.id ?? product.stocks[0]?.warehouse.id ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "error" | "success" | "warning" }>>([]);

  const selectedStock = product.stocks.find((s) => s.warehouse.id === selectedWarehouseId);
  const available = selectedStock?.availableUnits ?? 0;
  const meta = categoryMeta[product.category] ?? { icon: "🏥", color: "#2dd4bf", tag: "Health" };
  const bullets = highlights[product.category] ?? [];

  const addToast = useCallback((message: string, type: "error" | "success" | "warning") => {
    setToasts((p) => [...p, { id: `${Date.now()}`, message, type }]);
  }, []);

  const handleReserve = async () => {
    if (available === 0 || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": `${product.id}-${selectedWarehouseId}-${Date.now()}` },
        body: JSON.stringify({ productId: product.id, warehouseId: selectedWarehouseId, quantity: 1 }),
      });
      if (res.status === 409) { addToast("No slots left — someone just grabbed the last one.", "error"); return; }
      if (!res.ok) { const d = await res.json().catch(() => ({})); addToast(d.error ?? "Something went wrong.", "error"); return; }
      const data = await res.json();
      router.push(`/reservation/${data.id}`);
    } catch { addToast("Network error. Please try again.", "error"); }
    finally { setLoading(false); }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      <div className="max-w-5xl mx-auto px-4 pb-24 pt-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-white/25 mb-8 flex-wrap">
          <Link href="/" className="hover:text-white/50 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-white/50 transition-colors">Plans</Link>
          <span>/</span>
          <span className="text-white/40 truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* LEFT */}
          <div className="flex flex-col gap-4">
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {imgError ? (
                <div className="absolute inset-0 flex items-center justify-center text-6xl"
                  style={{ background: `linear-gradient(135deg, ${meta.color}18, ${meta.color}08)` }}
                >
                  {meta.icon}
                </div>
              ) : (
                <Image src={product.imageUrl} alt={product.name} fill className="object-cover"
                  sizes="600px" priority onError={() => setImgError(true)} />
              )}
              <div className="absolute inset-0" style={{ background: "linear-gradient(160deg,rgba(7,8,15,0.08),rgba(7,8,15,0.5))" }} />
              <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md"
                style={{ background: "rgba(7,8,15,0.7)", border: `1px solid ${meta.color}45`, color: meta.color }}
              >
                {meta.icon} {product.category}
              </span>
              <span className="absolute bottom-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-lg text-white/55"
                style={{ background: "rgba(7,8,15,0.72)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                ✓ {meta.tag}
              </span>
            </motion.div>

            {/* What's included */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-3">What&apos;s included</p>
              <ul className="space-y-2.5">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-white/65">
                    <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}35` }}
                    >
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke={meta.color} strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Trust row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: "🔒", label: "Authentic", sub: "100% genuine products" },
                { icon: "📦", label: "Discreet", sub: "Plain-box delivery" },
                { icon: "🧪", label: "Lab Tested", sub: "COA on every batch" },
              ].map((t) => (
                <div key={t.label} className="p-3 rounded-xl text-center"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="text-lg mb-1">{t.icon}</div>
                  <p className="text-white text-xs font-semibold">{t.label}</p>
                  <p className="text-white/25 text-[10px] mt-0.5">{t.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.07 }}
            className="flex flex-col gap-5"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: meta.color }}>{product.category}</p>
              <h1 className="text-3xl font-black text-white leading-tight" style={{ letterSpacing: "-0.025em" }}>{product.name}</h1>
              <p className="text-white/50 text-sm leading-relaxed mt-3">{product.description}</p>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black" style={{ color: meta.color }}>{formatPrice(product.price)}</span>
              <span className="text-white/25 text-sm">/ unit</span>
            </div>

            <div className="divider" />

            {/* Clinic selector */}
            <div>
              <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-3">Ships from city</p>
              <div className="grid grid-cols-3 gap-2">
                {product.stocks.map((stock) => {
                  const sel = selectedWarehouseId === stock.warehouse.id;
                  const full = stock.availableUnits === 0;
                  return (
                    <button key={stock.warehouse.id} onClick={() => setSelectedWarehouseId(stock.warehouse.id)}
                      disabled={full}
                      className="p-3 rounded-xl text-left transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed"
                      style={sel
                        ? { background: `${meta.color}16`, border: `1.5px solid ${meta.color}55`, boxShadow: `0 0 18px ${meta.color}14` }
                        : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }
                      }
                    >
                      <p className="text-xs font-bold" style={{ color: sel ? meta.color : "rgba(255,255,255,0.55)" }}>{stock.warehouse.city}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: full ? "#ef4444" : "rgba(255,255,255,0.28)" }}>
                        {full ? "Fully booked" : `${stock.availableUnits} left`}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedStock && <StockBar available={selectedStock.availableUnits} total={selectedStock.totalUnits} />}

            {/* CTA */}
            <motion.button whileTap={{ scale: 0.98 }} onClick={handleReserve} disabled={available === 0 || loading}
              className="w-full py-4 rounded-xl font-bold text-white text-base flex items-center justify-center gap-3 disabled:opacity-45 disabled:cursor-not-allowed"
              style={available > 0
                ? { background: `linear-gradient(135deg,${meta.color},#0284c7)`, boxShadow: `0 6px 28px ${meta.color}30` }
                : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }
              }
            >
              {loading ? (
                <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Reserving…</>
              ) : available === 0 ? "Out of Stock" : (
                <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>Reserve Unit · {formatPrice(product.price)}</>
              )}
            </motion.button>

            <p className="text-center text-white/18 text-xs">
              Unit held for <span className="text-white/35 font-semibold">10 minutes</span> · Cancel anytime before payment · No charge now
            </p>

            <div className="divider" />

            {/* How it works */}
            <div className="space-y-2.5">
              <p className="text-white/35 text-xs font-semibold uppercase tracking-widest">How this works</p>
              {[
                { n: "1", t: "Reserve your unit — held for 10 min, no payment yet" },
                { n: "2", t: "Complete secure payment (Card, UPI, Net Banking, Wallet)" },
                { n: "3", t: "Dispatched within 24 hrs in discreet plain-box packaging" },
              ].map((s) => (
                <div key={s.n} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}35` }}
                  >{s.n}</span>
                  <p className="text-white/45 text-xs leading-relaxed">{s.t}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Clinic availability overview */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="mt-10 p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-4">Warehouse stock</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {product.stocks.map((stock) => (
              <div key={stock.warehouse.id} className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div>
                  <p className="text-white font-semibold text-sm">{stock.warehouse.city}</p>
                  <p className="text-white/28 text-xs mt-0.5">{stock.warehouse.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-base" style={{ color: stock.availableUnits === 0 ? "#ef4444" : stock.availableUnits <= 2 ? "#f59e0b" : "#10b981" }}>
                    {stock.availableUnits === 0 ? "Full" : stock.availableUnits}
                  </p>
                  <p className="text-white/22 text-[10px]">units</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Real reviews section */}
        <ReviewsSection productId={product.id} />

        {/* Related plans */}
        {related.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-1">You might also like</p>
                <h2 className="text-white font-black text-xl">Related {product.category}s</h2>
              </div>
              <Link href="/products" className="text-xs font-semibold transition-colors" style={{ color: meta.color }}>
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 + i * 0.07 }}>
                  <Link href={`/products/${r.id}`}
                    className="group block rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.02]"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div className="relative h-32 overflow-hidden">
                      <Image src={r.imageUrl} alt={r.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="300px" />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom,transparent 30%,rgba(7,8,15,0.92))" }} />
                    </div>
                    <div className="p-3.5">
                      <p className="text-white font-bold text-sm line-clamp-1 group-hover:text-teal-300 transition-colors">{r.name}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="font-black text-sm" style={{ color: meta.color }}>{formatPrice(r.price)}</span>
                        <span className="text-white/25 text-[10px]">
                          {r.stocks.reduce((s, st) => s + st.availableUnits, 0)} in stock
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}
