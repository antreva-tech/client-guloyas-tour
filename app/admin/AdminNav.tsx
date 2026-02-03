"use client";

import { useState, useEffect } from "react";
import { canSeeResumen, canSeeProducts } from "@/lib/permissions";
import type { SessionRole } from "@/lib/permissions";

export type AdminView =
  | "overview"
  | "products"
  | "sales"
  | "messages"
  | "news"
  | "hotelOffers"
  | "flightRequests";

interface NavItem {
  id: AdminView;
  label: string;
  shortLabel?: string;
  icon: React.ReactNode;
  show: (role: SessionRole) => boolean;
}

/** Icons as inline SVG for zero deps; 20×20 viewBox. */
const Icons = {
  overview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  products: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
      <path d="M2 10h20M2 14h20M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
    </svg>
  ),
  sales: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  messages: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  ),
  news: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
      <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2z" />
      <path d="M15 2v4M9 2v4M3 10h18" />
    </svg>
  ),
  hotelOffers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  ),
  flightRequests: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  ),
};

/**
 * Builds the list of nav items visible for the given role.
 * @param role - Current session role (admin, support, supervisor).
 * @returns Array of nav items to display.
 */
function getNavItems(role: SessionRole): NavItem[] {
  const items: NavItem[] = [
    { id: "overview", label: "Resumen", shortLabel: "Resumen", icon: Icons.overview, show: canSeeResumen },
    { id: "products", label: "Tours", shortLabel: "Tours", icon: Icons.products, show: canSeeProducts },
    { id: "hotelOffers", label: "Ofertas Hoteles", shortLabel: "Hoteles", icon: Icons.hotelOffers, show: (r) => r === "admin" || r === "support" },
    { id: "flightRequests", label: "Reservas Vuelo", shortLabel: "Vuelo", icon: Icons.flightRequests, show: (r) => r === "admin" || r === "support" },
    { id: "sales", label: "Reservas", shortLabel: "Reservas", icon: Icons.sales, show: () => true },
    { id: "messages", label: "Mensajes", shortLabel: "Mensajes", icon: Icons.messages, show: () => true },
    { id: "news", label: "Noticias", shortLabel: "Noticias", icon: Icons.news, show: (r) => r === "admin" || r === "support" },
  ];
  return items.filter((item) => item.show(role));
}

interface AdminNavProps {
  activeView: AdminView;
  onViewChange: (view: AdminView) => void;
  /** Current session role; null is treated as supervisor for nav visibility. */
  role: SessionRole | null;
}

/**
 * Admin navigation: mobile-first drawer on small screens, sticky sidebar on md+.
 * Role-based visibility; icons + labels for clarity.
 */
export function AdminNav({ activeView, onViewChange, role }: AdminNavProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const effectiveRole: SessionRole = role ?? "supervisor";
  const items = getNavItems(effectiveRole);

  /** Close drawer on escape or when resizing to md+. */
  useEffect(() => {
    const close = () => setDrawerOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    const mq = window.matchMedia("(min-width: 768px)");
    const onResize = () => mq.matches && close();
    mq.addEventListener("change", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onResize);
    };
  }, []);

  /** Lock body scroll when drawer is open on mobile. */
  useEffect(() => {
    if (drawerOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const handleSelect = (id: AdminView) => {
    onViewChange(id);
    setDrawerOpen(false);
  };

  const navList = (
    <ul className="flex flex-col gap-0.5 py-2" role="navigation" aria-label="Vistas del panel">
      {items.map((item) => {
        const isActive = activeView === item.id;
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors
                md:px-3 md:py-2
                ${isActive
                  ? "bg-aqua-700 text-white shadow-sm"
                  : "text-jet/80 hover:bg-aqua-700/10 hover:text-aqua-700 active:bg-aqua-700/15"
                }
              `}
              aria-current={isActive ? "page" : undefined}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Mobile: top bar with menu trigger */}
      <div className="flex items-center justify-between gap-3 md:hidden">
        <h2 className="text-lg font-semibold text-jet truncate">Panel</h2>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-jet/5 text-jet hover:bg-jet/10 active:bg-jet/15 transition-colors"
          aria-label="Abrir menú de vistas"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile: slide-over drawer */}
      <div
        className={`
          fixed inset-0 z-50 md:hidden
          transition-opacity duration-200
          ${drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
      >
        <button
          type="button"
          aria-label="Cerrar menú"
          className="absolute inset-0 bg-jet/40 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          className={`
            absolute top-0 left-0 bottom-0 w-[min(18rem,85vw)] bg-porcelain shadow-xl
            flex flex-col
            transition-transform duration-250 ease-out
            ${drawerOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="flex items-center justify-between p-4 border-b border-brand-border">
            <span className="text-sm font-semibold text-jet">Vistas</span>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-jet/70 hover:bg-jet/10"
              aria-label="Cerrar"
            >
              <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-2">{navList}</nav>
        </aside>
      </div>

      {/* Desktop: sticky sidebar */}
      <aside
        className="
          hidden md:flex md:flex-col md:w-52 md:shrink-0
          md:sticky md:top-4 md:self-start
          rounded-xl border border-brand-border bg-porcelain/95 shadow-sm
        "
      >
        <div className="p-3 border-b border-brand-border">
          <p className="text-xs font-medium text-jet/60 uppercase tracking-wider">Vistas</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 min-h-0">{navList}</nav>
      </aside>
    </>
  );
}
