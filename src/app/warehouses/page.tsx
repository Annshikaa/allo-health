"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface Stock {
  id: string;
  totalUnits: number;
  reservedUnits: number;
  product: Product;
}

interface Warehouse {
  id: string;
  name: string;
  city: string;
  stocks: Stock[];
}

const categoryColors: Record<string, string> = {
  Supplements:           "#f59e0b",
  "Hair Care":           "#8b5cf6",
  "Skin Care":           "#3b82f6",
  "Sexual Wellness":     "#ef4444",
  "Vitamins & Minerals": "#10b981",
};

const CITY_ICONS: Record<string, string> = {
  Mumbai:    "🌆",
  Delhi:     "🏛️",
  Bangalore: "🌿",
  Chennai:   "🌊",
  Hyderabad: "💎",
  Bhopal:    "🏞️",
};

function availableUnits(s: Stock) {
  return Math.max(0, s.totalUnits - s.reservedUnits);
}

function StockCell({ available, total, prevAvailable }: { available: number; total: number; prevAvailable?: number }) {
  const decreased = prevAvailable !== undefined && available < prevAvailable;
  const pct = total === 0 ? 0 : Math.min(100, (available / total) * 100);
  const color = available === 0 ? "#ef4444" : available <= 2 ? "#f59e0b" : available <= 5 ? "#f59e0b" : "#10b981";

  return (
    <div className="flex flex-col gap-1 min-w-[70px]">
      <motion.span
        key={available}
        initial={decreased ? { color: "#ef4444", scale: 1.2 } : {}}
        animate={{ color, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="font-black text-sm text-center"
      >
        {available === 0 ? "—" : available}
      </motion.span>
      <div className="h-1 rounded-full overflow-hidden mx-1" style={{ background: "rgba(255,255,255,0.07)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      {decreased && (
        <motion.span
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -8 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="text-[9px] text-red-400 text-center font-bold absolute"
        >
          -1
        </motion.span>
      )}
    </div>
  );
}

function WarehouseSummaryCard({ warehouse }: { warehouse: Warehouse }) {
  const total = warehouse.stocks.reduce((s, st) => s + st.totalUnits, 0);
  const reserved = warehouse.stocks.reduce((s, st) => s + st.reservedUnits, 0);
  const available = total - reserved;
  const products = warehouse.stocks.length;
  const outOfStock = warehouse.stocks.filter((s) => availableUnits(s) === 0).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)" }}
        >
          {CITY_ICONS[warehouse.city] ?? "🏭"}
        </div>
        <div>
          <p className="text-white font-bold text-sm">{warehouse.city}</p>
          <p className="text-white/30 text-xs">{warehouse.name}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 stock-dot" />
          <span className="text-emerald-400 text-xs font-semibold">Live</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Available", value: available, color: "#10b981" },
          { label: "Reserved", value: reserved, color: "#f59e0b" },
          { label: "Total Units", value: total, color: "#3b82f6" },
          { label: "Out of Stock", value: outOfStock, color: outOfStock > 0 ? "#ef4444" : "rgba(255,255,255,0.25)" },
        ].map((s) => (
          <div key={s.label} className="p-2.5 rounded-xl text-center"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="font-black text-lg" style={{ color: s.color }}>{s.value}</p>
            <p className="text-white/28 text-[10px] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="text-white/20 text-xs text-center mt-3">{products} products tracked</p>
    </motion.div>
  );
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const prevDataRef = useRef<Record<string, number>>({});

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/warehouses");
      if (!res.ok) return;
      const data: Warehouse[] = await res.json();
      setWarehouses(data);
      setLastUpdated(new Date());
    } catch {}
    finally { if (!silent) setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 5000);
    return () => clearInterval(interval);
  }, []);

  // Track previous available units for flash animation
  useEffect(() => {
    warehouses.forEach((wh) => {
      wh.stocks.forEach((st) => {
        prevDataRef.current[`${wh.id}-${st.id}`] = availableUnits(st);
      });
    });
  }, [warehouses]);

  const categories = ["All", ...Array.from(new Set(
    warehouses.flatMap((w) => w.stocks.map((s) => s.product.category))
  )).sort()];

  // Build product × warehouse matrix
  const allProducts = Array.from(
    new Map(
      warehouses.flatMap((w) => w.stocks.map((s) => [s.product.id, s.product]))
    ).values()
  ).filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = search === "" || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

  const totalAvailable = warehouses.reduce(
    (sum, w) => sum + w.stocks.reduce((s, st) => s + availableUnits(st), 0), 0
  );
  const totalReserved = warehouses.reduce(
    (sum, w) => sum + w.stocks.reduce((s, st) => s + st.reservedUnits, 0), 0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20 pt-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1">Live Dashboard</p>
            <h1 className="text-3xl md:text-4xl font-black text-white" style={{ letterSpacing: "-0.03em" }}>
              Warehouse Inventory
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)", color: "#6ee7b7" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 stock-dot" />
              {totalAvailable} available
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)", color: "#fcd34d" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {totalReserved} reserved
            </div>
            {lastUpdated && (
              <span className="text-white/20 text-xs">
                Updated {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <svg className="w-8 h-8 animate-spin text-teal-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <>
          {/* Warehouse summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {warehouses.map((wh) => <WarehouseSummaryCard key={wh.id} warehouse={wh} />)}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1 max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="field-input pl-9 py-2 text-sm"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={activeCategory === cat
                    ? { background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.4)", color: "#93c5fd" }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Inventory table */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* Table header */}
            <div className="grid gap-0 text-xs font-bold uppercase tracking-widest text-white/25 px-5 py-3"
              style={{
                background: "rgba(255,255,255,0.025)",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                gridTemplateColumns: `1fr repeat(${warehouses.length}, 80px)`,
              }}
            >
              <span>Product</span>
              {warehouses.map((wh) => (
                <span key={wh.id} className="text-center">{wh.city}</span>
              ))}
            </div>

            {/* Rows */}
            <AnimatePresence>
              {allProducts.length === 0 ? (
                <div className="text-center py-16 text-white/25 text-sm">No products match your filter.</div>
              ) : (
                allProducts.map((product, i) => {
                  const accent = categoryColors[product.category] ?? "#2dd4bf";
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="grid items-center gap-0 px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                      style={{
                        gridTemplateColumns: `1fr repeat(${warehouses.length}, 80px)`,
                        borderBottom: i < allProducts.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      }}
                    >
                      {/* Product info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}30` }}
                        >
                          {product.category}
                        </span>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{product.name}</p>
                          <p className="text-white/25 text-xs">{formatPrice(product.price)}</p>
                        </div>
                      </div>

                      {/* Per-warehouse stock cells */}
                      {warehouses.map((wh) => {
                        const stock = wh.stocks.find((s) => s.product.id === product.id);
                        if (!stock) return <div key={wh.id} className="text-center text-white/15 text-xs">—</div>;
                        const avail = availableUnits(stock);
                        const prev = prevDataRef.current[`${wh.id}-${stock.id}`];
                        return (
                          <div key={wh.id} className="flex justify-center relative">
                            <StockCell available={avail} total={stock.totalUnits} prevAvailable={prev} />
                          </div>
                        );
                      })}
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-5 flex-wrap">
            {[
              { color: "#10b981", label: "In stock (>5)" },
              { color: "#f59e0b", label: "Low stock (1–5)" },
              { color: "#ef4444", label: "Out of stock" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-white/30">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: l.color }} />
                {l.label}
              </div>
            ))}
            <span className="text-white/20 text-xs">Auto-refreshes every 5 seconds</span>
          </div>
        </>
      )}
    </div>
  );
}
