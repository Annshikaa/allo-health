"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLinks() {
  const path = usePathname();

  const link = (href: string, label: string) => {
    const active = href === "/" ? path === "/" : path.startsWith(href);
    return (
      <Link
        href={href}
        className={`text-sm font-medium transition-colors relative ${active ? "nav-link-active" : "text-white/50 hover:text-white/85"}`}
      >
        {label}
      </Link>
    );
  };

  const historyActive = path.startsWith("/history");

  return (
    <div className="flex items-center gap-6">
      {link("/", "Home")}
      {link("/products", "Shop")}
      {link("/warehouses", "Inventory")}
      <Link
        href="/history"
        className="flex items-center gap-1.5 text-sm font-medium transition-all px-3 py-1.5 rounded-lg"
        style={
          historyActive
            ? { color: "#2dd4bf", background: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.3)", boxShadow: "0 0 12px rgba(45,212,191,0.1)" }
            : { color: "#2dd4bf", background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.13)" }
        }
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        History
      </Link>
    </div>
  );
}
