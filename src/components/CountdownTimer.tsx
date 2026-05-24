"use client";

import { useEffect, useState, useCallback } from "react";
import { secondsUntil } from "@/lib/utils";

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
  totalSeconds?: number;
}

export default function CountdownTimer({
  expiresAt,
  onExpire,
  totalSeconds = 600,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(() => secondsUntil(expiresAt));
  const [hasExpired, setHasExpired] = useState(false);

  const tick = useCallback(() => {
    const secs = secondsUntil(expiresAt);
    setRemaining(secs);
    if (secs === 0 && !hasExpired) {
      setHasExpired(true);
      onExpire?.();
    }
  }, [expiresAt, hasExpired, onExpire]);

  useEffect(() => {
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = remaining / totalSeconds;

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  // Color transitions: cyan → blue → amber → red
  let strokeColor = "#06b6d4";
  if (progress < 0.5) strokeColor = "#3b82f6";
  if (progress < 0.25) strokeColor = "#f59e0b";
  if (progress < 0.1) strokeColor = "#ef4444";

  const displayTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: 200, height: 200 }}>
        <svg width="200" height="200" style={{ transform: "rotate(-90deg)" }}>
          {/* Background track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: "stroke-dashoffset 0.9s linear, stroke 0.5s ease",
              filter: `drop-shadow(0 0 8px ${strokeColor})`,
            }}
          />
        </svg>

        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: "none" }}
        >
          <span
            className="font-mono text-4xl font-bold"
            style={{
              color: strokeColor,
              textShadow: `0 0 20px ${strokeColor}`,
              animation: hasExpired ? "pulse 0.5s ease infinite" : undefined,
              letterSpacing: "0.05em",
            }}
          >
            {displayTime}
          </span>
          <span className="text-white/50 text-xs mt-1 font-mono uppercase tracking-widest">
            {hasExpired ? "EXPIRED" : "remaining"}
          </span>
        </div>
      </div>

      {hasExpired && (
        <div
          className="text-red-400 text-sm font-semibold animate-pulse text-center"
          style={{ textShadow: "0 0 10px rgba(239,68,68,0.8)" }}
        >
          Reservation expired
        </div>
      )}
    </div>
  );
}
