"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { throttle } from "@/lib/throttle";
import { brandConfig } from "@/lib/brandConfig";

/**
 * Navigation header component with logo and mobile menu.
 * Fixed position at top of viewport with mobile-first design.
 * Uses throttled scroll/resize handlers for mobile performance.
 * Premium slide/fade animations on mobile menu open/close.
 * @returns The header navigation element.
 */
export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isEntered, setIsEntered] = useState(false);
  const menuPanelRef = useRef<HTMLElement>(null);

  const pathname = usePathname();
  /** When not on home, section links must go to /#section so the main site scrolls there. */
  const sectionBase = pathname === "/" ? "" : "/";

  const navLinks = [
    { href: `${sectionBase}#productos`, label: "Productos" },
    { href: `${sectionBase}#nosotros`, label: "Nosotros" },
    { href: "/noticias", label: "Noticias" },
    { href: "/reserva-vuelo", label: "Reserva de vuelo" },
    { href: `${sectionBase}#reservar`, label: "Cómo reservar" },
    { href: `${sectionBase}#contacto`, label: "Contacto" },
  ];

  const stateRef = useRef({ isMenuOpen, isClosing });
  stateRef.current = { isMenuOpen, isClosing };
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Starts close animation; unmount after animation or fallback timeout */
  const startCloseMenu = () => {
    if (!stateRef.current.isMenuOpen || stateRef.current.isClosing) return;
    setIsClosing(true);

    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      closeTimeoutRef.current = null;
      setIsMenuOpen(false);
      setIsClosing(false);
    }, 350);
  };

  /** Called when panel exit transition finishes */
  const handlePanelTransitionEnd = (e: React.TransitionEvent<HTMLElement>) => {
    if (e.target !== menuPanelRef.current || e.propertyName !== "transform") return;
    if (!stateRef.current.isClosing) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsMenuOpen(false);
    setIsClosing(false);
  };

  /** Trigger enter transition on next frame after mount */
  useEffect(() => {
    if (isMenuOpen && !isClosing) {
      const id = requestAnimationFrame(() => setIsEntered(true));
      return () => cancelAnimationFrame(id);
    }
    if (!isMenuOpen) setIsEntered(false);
  }, [isMenuOpen, isClosing]);

  const throttledCloseMenu = useMemo(
    () => throttle(() => startCloseMenu(), 100),
    []
  );

  // Close menu on scroll or resize with throttled handler
  useEffect(() => {
    window.addEventListener("scroll", throttledCloseMenu, { passive: true });
    window.addEventListener("resize", throttledCloseMenu, { passive: true });
    return () => {
      window.removeEventListener("scroll", throttledCloseMenu);
      window.removeEventListener("resize", throttledCloseMenu);
    };
  }, [throttledCloseMenu]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const isMenuActive = isMenuOpen || isClosing;

  // Prevent body scroll when menu is open or closing
  useEffect(() => {
    document.body.style.overflow = isMenuActive ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuActive]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[1000] backdrop-blur-sm border-b border-brand-border/20"
      style={{ backgroundColor: "rgba(25, 23, 59, 0.97)" }}
    >
      <nav className="relative z-[1001] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo: no background so it sits on dark header (use white logo asset on dark). */}
          <Link href="/" className="flex items-center gap-2 py-1.5">
            <Image
              src={brandConfig.logoPath}
              alt={brandConfig.brandName}
              width={100}
              height={32}
              className="h-8 sm:h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-night-text/80 hover:text-brand-sky transition-colors text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
            <a
              href={`${sectionBase}#contacto`}
              className="btn-primary px-4 py-2 rounded-full text-sm font-semibold"
            >
              Comprar Ahora
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            className={`md:hidden p-2 rounded-lg touch-manipulation transition-all duration-300 ${
              isMenuOpen || isClosing
                ? "bg-brand-sunset text-brand-ink border-2 border-brand-sunset"
                : "bg-transparent text-night-text border-none"
            }`}
            aria-label={isMenuOpen || isClosing ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMenuOpen || isClosing}
            onClick={() => (isMenuOpen || isClosing ? startCloseMenu() : setIsMenuOpen(true))}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen || isClosing ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu: portal to body, Tailwind-only styles */}
      {(isMenuOpen || isClosing) &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 md:hidden z-[1100] flex" aria-hidden="true">
            {/* Backdrop: blur + dark overlay */}
            <div
              className={`absolute inset-0 bg-night-900/85 backdrop-blur-xl transition-opacity duration-300 ease-out ${
                isClosing ? "opacity-0" : isEntered ? "opacity-100" : "opacity-0"
              }`}
              onClick={startCloseMenu}
              aria-hidden="true"
            />
            {/* Panel: solid bg, slides from right */}
            <nav
              ref={menuPanelRef}
              className={`absolute right-0 top-0 bottom-0 w-full max-w-sm flex flex-col pt-20 px-6 bg-brand-navy transition-transform duration-300 ease-out ${
                isClosing ? "translate-x-full" : isEntered ? "translate-x-0" : "translate-x-full"
              }`}
              onTransitionEnd={handlePanelTransitionEnd}
              onClick={(e) => e.stopPropagation()}
            >
            {/* Close button */}
            <button
              type="button"
              onClick={startCloseMenu}
              className="absolute top-4 right-4 p-2 rounded-lg bg-brand-sunset text-brand-ink touch-manipulation transition-colors hover:opacity-90"
              aria-label="Cerrar menú"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={startCloseMenu}
                className="py-4 text-xl font-medium border-b border-night-border text-night-text hover:text-brand-sky transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-6 flex flex-col gap-3">
              <a
                href={`${sectionBase}#productos`}
                onClick={startCloseMenu}
                className="py-4 rounded-full text-center text-lg font-semibold touch-manipulation bg-brand-sunset text-brand-ink"
              >
                Ver Catálogo
              </a>
              <a
                href={`${sectionBase}#contacto`}
                onClick={startCloseMenu}
                className="py-4 rounded-full text-center text-lg font-semibold touch-manipulation border border-brand-navy bg-night-600 text-night-text"
              >
                Contactar
              </a>
            </div>
            <div className="flex-1" />
            <p className="text-center text-sm pb-6 text-night-muted">
              {brandConfig.brandName} © {new Date().getFullYear()}
            </p>
          </nav>
        </div>,
        document.body
        )}
    </header>
  );
}
