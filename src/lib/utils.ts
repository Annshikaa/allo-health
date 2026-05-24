import { NextResponse } from "next/server";

const TTL_MINUTES = parseInt(process.env.RESERVATION_TTL_MINUTES ?? "10", 10);

export function getExpiresAt(): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + TTL_MINUTES);
  return d;
}

export function secondsUntil(date: Date | string): number {
  const target = typeof date === "string" ? new Date(date) : date;
  return Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
}

export function formatPrice(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
