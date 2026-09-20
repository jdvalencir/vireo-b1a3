"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

/**
 * Barra superior fija y translucida (el efecto "vidrio esmerilado" de Apple
 * es simplemente un fondo semitransparente + backdrop-blur).
 */
export default function Nav() {
  const { count, openCart } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/70 backdrop-blur-xl backdrop-saturate-150">
      <nav className="mx-auto flex h-12 max-w-5xl items-center justify-between px-6 text-xs">
        <Link href="/" className="text-sm font-semibold tracking-[0.2em] text-ink">
          CUERO
        </Link>

        <div className="hidden items-center gap-8 text-ink/80 sm:flex">
          <Link href="/productos" className="transition-opacity hover:opacity-60">
            Productos
          </Link>
          <Link href="/#taller" className="transition-opacity hover:opacity-60">
            El taller
          </Link>
          <Link href="/#garantia" className="transition-opacity hover:opacity-60">
            Garantía
          </Link>
        </div>

        <button
          type="button"
          onClick={openCart}
          className="relative flex items-center gap-1.5 text-ink/80 transition-opacity hover:opacity-60"
          aria-label={`Abrir carrito, ${count} artículos`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 7h12l-1 13H7L6 7Zm3 0a3 3 0 0 1 6 0"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {count > 0 && (
            <span className="min-w-4 rounded-full bg-accent px-1 text-[10px] font-medium leading-4 text-white">
              {count}
            </span>
          )}
        </button>
      </nav>
    </header>
  );
}
