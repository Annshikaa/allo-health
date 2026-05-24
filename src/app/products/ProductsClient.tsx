"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/ProductCard";

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

const ALL = "All";

export default function ProductsClient({
  initialProducts,
  error,
}: {
  initialProducts: Product[];
  error: string | null;
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL);
  const [products, setProducts] = useState(initialProducts);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(initialProducts.map((p) => p.category)));
    return [ALL, ...cats];
  }, [initialProducts]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        search === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === ALL || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, activeCategory]);

  // Called by ProductCard after a successful reservation — optimistically decrement stock
  const handleReserved = (productId: string, warehouseId: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id !== productId
          ? p
          : {
              ...p,
              stocks: p.stocks.map((s) =>
                s.warehouse.id !== warehouseId
                  ? s
                  : {
                      ...s,
                      reservedUnits: s.reservedUnits + 1,
                      availableUnits: Math.max(0, s.availableUnits - 1),
                    }
              ),
            }
      )
    );
  };

  const totalAvailable = products.reduce(
    (sum, p) => sum + p.stocks.reduce((s, st) => s + st.availableUnits, 0),
    0
  );

  return (
    <div className="px-4 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="pt-8 pb-10">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <div className="flex-1">
              <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-2">
                Health & Wellness Products
              </p>
              <h1
                className="text-4xl md:text-5xl font-black text-white"
                style={{ letterSpacing: "-0.03em" }}
              >
                Shop{" "}
                <span
                  style={{
                    background: "linear-gradient(90deg,#3b82f6,#06b6d4)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Health Products
                </span>
              </h1>
            </div>

            {/* Live stock summary */}
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl shrink-0"
              style={{
                background: "rgba(16,185,129,0.07)",
                border: "1px solid rgba(16,185,129,0.15)",
              }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 text-sm font-semibold">
                {totalAvailable} units available
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-6 relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search supplements, hair care, skin care…"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl text-white placeholder-white/25 text-sm focus:outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              onFocus={(e) => {
                e.target.style.border = "1px solid rgba(59,130,246,0.4)";
                e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.border = "1px solid rgba(255,255,255,0.1)";
                e.target.style.boxShadow = "none";
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map((cat) => (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(cat)}
                className="px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200"
                style={
                  activeCategory === cat
                    ? {
                        background: "linear-gradient(135deg,rgba(59,130,246,0.3),rgba(6,182,212,0.3))",
                        border: "1px solid rgba(59,130,246,0.5)",
                        color: "#93c5fd",
                        boxShadow: "0 0 12px rgba(59,130,246,0.2)",
                      }
                    : {
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.4)",
                      }
                }
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Content */}
        {error ? (
          <div className="text-center py-20">
            <div
              className="inline-block px-6 py-4 rounded-2xl text-red-300 text-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              Failed to load products.
              <code className="block text-xs opacity-60 mt-1">{error}</code>
            </div>
          </div>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-20 text-white/30"
                >
                  No plans found for &quot;{search}&quot;
                </motion.div>
              ) : (
                <motion.div
                  key="grid"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {filtered.map((product, i) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.06, type: "spring", stiffness: 200 }}
                    >
                      <ProductCard
                        product={product}
                        onReserved={(warehouseId) => handleReserved(product.id, warehouseId)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {filtered.length > 0 && (
              <p className="text-center text-white/20 text-xs mt-10">
                Showing {filtered.length} of {products.length} plans
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
