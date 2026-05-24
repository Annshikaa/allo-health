"use client";

import { useState, useEffect, type ReactElement } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/lib/utils";

interface PaymentModalProps {
  open: boolean;
  amount: number;
  productName: string;
  onSuccess: () => void;
  onClose: () => void;
}

function formatCardNumber(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

type Stage = "form" | "processing" | "success" | "failed";
type Method = "card" | "upi" | "netbanking" | "wallet";

const BANKS = [
  { id: "hdfc", name: "HDFC Bank", color: "#004C8F" },
  { id: "icici", name: "ICICI Bank", color: "#F37324" },
  { id: "sbi", name: "State Bank", color: "#2D4FA1" },
  { id: "axis", name: "Axis Bank", color: "#800020" },
  { id: "kotak", name: "Kotak Bank", color: "#EE3124" },
  { id: "yes", name: "Yes Bank", color: "#00305F" },
  { id: "pnb", name: "Punjab Nat.", color: "#CF0000" },
  { id: "bob", name: "Bank of Baroda", color: "#F26522" },
];

const WALLETS = [
  { id: "gpay", name: "Google Pay", gradient: "from-blue-500 to-green-400", icon: "G" },
  { id: "phonepe", name: "PhonePe", gradient: "from-purple-600 to-indigo-500", icon: "P" },
  { id: "paytm", name: "Paytm", gradient: "from-blue-400 to-cyan-400", icon: "₹" },
  { id: "amazonpay", name: "Amazon Pay", gradient: "from-orange-400 to-yellow-400", icon: "A" },
];

const METHOD_TABS: { id: Method; label: string; icon: ReactElement }[] = [
  {
    id: "card",
    label: "Card",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    id: "upi",
    label: "UPI",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    id: "netbanking",
    label: "Net Banking",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: "wallet",
    label: "Wallet",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
];

export default function PaymentModal({ open, amount, productName, onSuccess, onClose }: PaymentModalProps) {
  const [stage, setStage] = useState<Stage>("form");
  const [method, setMethod] = useState<Method>("card");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [cardErrors, setCardErrors] = useState<Partial<typeof card>>({});
  const [upiId, setUpiId] = useState("");
  const [upiError, setUpiError] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedWallet, setSelectedWallet] = useState("");
  const [progress, setProgress] = useState(0);
  const [processingLabel, setProcessingLabel] = useState("");

  useEffect(() => {
    if (open) {
      setStage("form");
      setCard({ number: "", expiry: "", cvv: "", name: "" });
      setCardErrors({});
      setUpiId("");
      setUpiError("");
      setSelectedBank("");
      setSelectedWallet("");
      setProgress(0);
    }
  }, [open]);

  useEffect(() => {
    if (stage !== "processing") return;
    setProgress(0);
    const steps = [15, 40, 65, 85, 100];
    const timers = steps.map((p, i) => setTimeout(() => setProgress(p), i * 480));
    const done = setTimeout(() => {
      setStage(Math.random() > 0.1 ? "success" : "failed");
    }, steps.length * 480 + 300);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, [stage]);

  useEffect(() => {
    if (stage === "success") {
      const t = setTimeout(onSuccess, 1600);
      return () => clearTimeout(t);
    }
  }, [stage, onSuccess]);

  useEffect(() => {
    if (stage !== "processing") return;
    if (method === "card") setProcessingLabel("Verifying card details…");
    else if (method === "upi") setProcessingLabel("Awaiting UPI confirmation…");
    else if (method === "netbanking") setProcessingLabel("Redirecting to bank…");
    else setProcessingLabel("Opening wallet app…");
  }, [stage, method]);

  const processingSubLabel = () => {
    if (progress < 40) return processingLabel;
    if (progress < 75) return "Authorising transaction…";
    return "Confirming with bank…";
  };

  const cardBrand = () => {
    const n = card.number.replace(/\s/g, "");
    if (n.startsWith("4")) return "VISA";
    if (n.startsWith("5")) return "MC";
    if (n.startsWith("3")) return "AMEX";
    return null;
  };

  const handlePay = () => {
    if (method === "card") {
      const e: Partial<typeof card> = {};
      if (card.number.replace(/\s/g, "").length < 16) e.number = "Enter a valid 16-digit card number";
      if (card.expiry.length < 5) e.expiry = "Enter valid expiry MM/YY";
      if (card.cvv.length < 3) e.cvv = "Enter 3-digit CVV";
      if (!card.name.trim()) e.name = "Enter name on card";
      setCardErrors(e);
      if (Object.keys(e).length > 0) return;
    } else if (method === "upi") {
      if (!upiId.trim() || !upiId.includes("@")) {
        setUpiError("Enter a valid UPI ID (e.g. name@upi)");
        return;
      }
      setUpiError("");
    } else if (method === "netbanking") {
      if (!selectedBank) return;
    } else if (method === "wallet") {
      if (!selectedWallet) return;
    }
    setStage("processing");
  };

  const canPay = () => {
    if (method === "netbanking") return !!selectedBank;
    if (method === "wallet") return !!selectedWallet;
    return true;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(7,8,15,0.88)", backdropFilter: "blur(10px)" }}
          onClick={(e) => { if (e.target === e.currentTarget && stage === "form") onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="w-full max-w-md glass-card overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-start justify-between"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-1">Secure Checkout</p>
                <h2 className="text-white font-bold text-lg leading-tight line-clamp-1">{productName}</h2>
              </div>
              {stage === "form" && (
                <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors mt-1 shrink-0 ml-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="px-6 py-5">
              {stage === "form" && (
                <div className="flex flex-col gap-4">
                  {/* Amount */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl"
                    style={{ background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.15)" }}
                  >
                    <span className="text-white/60 text-sm">Total payable</span>
                    <span className="text-2xl font-black"
                      style={{ background: "linear-gradient(90deg,#2dd4bf,#3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
                    >{formatPrice(amount)}</span>
                  </div>

                  {/* Payment method tabs */}
                  <div className="grid grid-cols-4 gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {METHOD_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setMethod(tab.id)}
                        className="flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200"
                        style={method === tab.id
                          ? { background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.35)", color: "#93c5fd" }
                          : { color: "rgba(255,255,255,0.35)", border: "1px solid transparent" }
                        }
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* ── CARD ── */}
                  <AnimatePresence mode="wait">
                    {method === "card" && (
                      <motion.div key="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col gap-3">
                        <div>
                          <label className="text-white/40 text-xs font-semibold uppercase tracking-wider block mb-1.5">Card Number</label>
                          <div className="relative">
                            <input className="field-input pr-16" placeholder="1234 5678 9012 3456"
                              value={card.number}
                              onChange={(e) => setCard(p => ({ ...p, number: formatCardNumber(e.target.value) }))}
                              maxLength={19}
                            />
                            {cardBrand() && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-teal-400 opacity-70">{cardBrand()}</span>
                            )}
                          </div>
                          {cardErrors.number && <p className="text-red-400 text-xs mt-1">{cardErrors.number}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-white/40 text-xs font-semibold uppercase tracking-wider block mb-1.5">Expiry</label>
                            <input className="field-input" placeholder="MM/YY"
                              value={card.expiry}
                              onChange={(e) => setCard(p => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                              maxLength={5}
                            />
                            {cardErrors.expiry && <p className="text-red-400 text-xs mt-1">{cardErrors.expiry}</p>}
                          </div>
                          <div>
                            <label className="text-white/40 text-xs font-semibold uppercase tracking-wider block mb-1.5">CVV</label>
                            <input className="field-input" placeholder="•••" type="password"
                              value={card.cvv}
                              onChange={(e) => setCard(p => ({ ...p, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                              maxLength={4}
                            />
                            {cardErrors.cvv && <p className="text-red-400 text-xs mt-1">{cardErrors.cvv}</p>}
                          </div>
                        </div>
                        <div>
                          <label className="text-white/40 text-xs font-semibold uppercase tracking-wider block mb-1.5">Name on Card</label>
                          <input className="field-input uppercase" placeholder="YOUR NAME"
                            value={card.name}
                            onChange={(e) => setCard(p => ({ ...p, name: e.target.value }))}
                          />
                          {cardErrors.name && <p className="text-red-400 text-xs mt-1">{cardErrors.name}</p>}
                        </div>
                      </motion.div>
                    )}

                    {/* ── UPI ── */}
                    {method === "upi" && (
                      <motion.div key="upi" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col gap-4">
                        {/* Quick UPI app buttons */}
                        <div>
                          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Quick Pay via</p>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { name: "Google Pay", short: "GPay", color: "#4285F4" },
                              { name: "PhonePe", short: "PhonePe", color: "#5f259f" },
                              { name: "Paytm", short: "Paytm", color: "#00BAF2" },
                            ].map((app) => (
                              <button key={app.name}
                                onClick={() => setUpiId(`username@${app.short.toLowerCase()}`)}
                                className="py-2.5 rounded-lg text-xs font-bold transition-all"
                                style={{ background: `${app.color}18`, border: `1px solid ${app.color}35`, color: app.color }}
                              >
                                {app.short}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
                          <span className="text-white/25 text-xs">or enter UPI ID</span>
                          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
                        </div>

                        <div>
                          <label className="text-white/40 text-xs font-semibold uppercase tracking-wider block mb-1.5">UPI ID</label>
                          <input className="field-input" placeholder="yourname@upi"
                            value={upiId}
                            onChange={(e) => { setUpiId(e.target.value); setUpiError(""); }}
                          />
                          {upiError && <p className="text-red-400 text-xs mt-1">{upiError}</p>}
                          {upiId.includes("@") && !upiError && (
                            <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              UPI ID looks valid
                            </p>
                          )}
                        </div>

                        <div className="p-3 rounded-lg flex items-start gap-2.5"
                          style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}
                        >
                          <svg className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-indigo-300 text-xs leading-relaxed">A payment request will be sent to your UPI app. Open your app to approve within 10 minutes.</p>
                        </div>
                      </motion.div>
                    )}

                    {/* ── NET BANKING ── */}
                    {method === "netbanking" && (
                      <motion.div key="netbanking" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col gap-3">
                        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Select Your Bank</p>
                        <div className="grid grid-cols-2 gap-2">
                          {BANKS.map((bank) => (
                            <button key={bank.id}
                              onClick={() => setSelectedBank(bank.id)}
                              className="px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition-all flex items-center gap-2.5"
                              style={selectedBank === bank.id
                                ? { background: `${bank.color}22`, border: `1px solid ${bank.color}60`, color: "#fff" }
                                : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }
                              }
                            >
                              <span className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-black shrink-0"
                                style={{ background: bank.color, color: "#fff" }}
                              >
                                {bank.name[0]}
                              </span>
                              {bank.name}
                              {selectedBank === bank.id && (
                                <svg className="w-3 h-3 ml-auto text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                        {selectedBank && (
                          <p className="text-white/30 text-xs text-center">
                            You will be redirected to {BANKS.find(b => b.id === selectedBank)?.name} secure portal
                          </p>
                        )}
                      </motion.div>
                    )}

                    {/* ── WALLET ── */}
                    {method === "wallet" && (
                      <motion.div key="wallet" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col gap-3">
                        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Select Wallet</p>
                        <div className="grid grid-cols-2 gap-3">
                          {WALLETS.map((w) => (
                            <button key={w.id}
                              onClick={() => setSelectedWallet(w.id)}
                              className="p-4 rounded-xl flex flex-col items-center gap-2 transition-all"
                              style={selectedWallet === w.id
                                ? { background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.4)" }
                                : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }
                              }
                            >
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-lg bg-gradient-to-br ${w.gradient}`}>
                                {w.icon}
                              </div>
                              <span className="text-xs font-semibold text-white/70">{w.name}</span>
                              {selectedWallet === w.id && (
                                <span className="text-emerald-400 text-[10px] font-bold">Selected</span>
                              )}
                            </button>
                          ))}
                        </div>
                        {selectedWallet && (
                          <div className="p-3 rounded-lg flex items-center gap-2.5"
                            style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}
                          >
                            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="text-emerald-300 text-xs">
                              {WALLETS.find(w2 => w2.id === selectedWallet)?.name} selected — wallet balance will be used
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Pay button */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePay}
                    disabled={!canPay()}
                    className="w-full py-3.5 rounded-xl font-bold text-white text-base mt-1 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                    style={{
                      background: "linear-gradient(135deg,#0d9488,#0284c7)",
                      boxShadow: "0 6px 28px rgba(13,148,136,0.35)",
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    {method === "upi" ? `Pay ${formatPrice(amount)} via UPI` :
                     method === "netbanking" ? `Pay ${formatPrice(amount)} via Net Banking` :
                     method === "wallet" ? `Pay ${formatPrice(amount)} via Wallet` :
                     `Pay ${formatPrice(amount)}`}
                  </motion.button>

                  <p className="text-center text-white/20 text-xs flex items-center justify-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    256-bit SSL encrypted · PCI-DSS compliant · Demo mode
                  </p>
                </div>
              )}

              {/* PROCESSING */}
              {stage === "processing" && (
                <div className="flex flex-col items-center gap-6 py-8">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#0d9488" strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 34}
                        strokeDashoffset={2 * Math.PI * 34 * (1 - progress / 100)}
                        style={{ transition: "stroke-dashoffset 0.45s ease" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-teal-400 font-bold text-sm">{progress}%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold text-lg">Processing Payment</p>
                    <p className="text-white/35 text-sm mt-1">{processingSubLabel()}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div key={i} className="w-2 h-2 rounded-full bg-teal-500"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* SUCCESS */}
              {stage === "success" && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(16,185,129,0.15)", border: "2px solid rgba(16,185,129,0.4)", boxShadow: "0 0 40px rgba(16,185,129,0.25)" }}
                  >
                    <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <motion.path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
                      />
                    </svg>
                  </motion.div>
                  <div className="text-center">
                    <p className="text-emerald-300 font-bold text-xl" style={{ textShadow: "0 0 20px rgba(16,185,129,0.4)" }}>
                      Payment Successful
                    </p>
                    <p className="text-white/40 text-sm mt-1">Confirming your reservation…</p>
                  </div>
                </div>
              )}

              {/* FAILED */}
              {stage === "failed" && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.3)" }}
                  >
                    <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-red-300 font-bold text-xl">Payment Declined</p>
                    <p className="text-white/40 text-sm mt-1">
                      {method === "upi" ? "UPI request timed out or was declined." :
                       method === "wallet" ? "Insufficient wallet balance." :
                       "Your payment was declined. Please try again."}
                    </p>
                  </div>
                  <button onClick={() => setStage("form")}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white mt-2"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
