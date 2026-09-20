"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";
import { formatCOP } from "@/lib/money";

/** Panel lateral del carrito. Se abre al añadir un producto o desde la barra. */
export default function CartDrawer() {
  const { lines, subtotal, isOpen, closeCart, setQuantity, remove } = useCart();

  // Cerrar con la tecla Escape y bloquear el scroll del fondo.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeCart]);

  return (
    <>
      <div
        onClick={closeCart}
        className={`fixed inset-0 z-[60] bg-black/25 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className={`fixed right-0 top-0 z-[70] flex h-dvh w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
          <h2 className="text-base font-semibold">Tu bolsa</h2>
          <button
            type="button"
            onClick={closeCart}
            className="text-2xl leading-none text-muted transition-colors hover:text-ink"
            aria-label="Cerrar carrito"
          >
            ×
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-sm text-muted">Tu bolsa está vacía.</p>
            <Link
              href="/productos"
              onClick={closeCart}
              className="text-sm text-accent hover:underline"
            >
              Ver productos
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-hairline overflow-y-auto px-6">
              {lines.map((line) => (
                <li key={`${line.slug}-${line.color}`} className="flex gap-4 py-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={line.image}
                    alt={line.name}
                    className="h-20 w-20 shrink-0 rounded-xl bg-surface-alt object-cover"
                  />
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{line.name}</p>
                    <p className="text-xs text-muted">{line.color}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <select
                        value={line.quantity}
                        onChange={(event) =>
                          setQuantity(line.slug, line.color, Number(event.target.value))
                        }
                        className="rounded-md border border-hairline px-2 py-1 text-xs"
                        aria-label={`Cantidad de ${line.name}`}
                      >
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => remove(line.slug, line.color)}
                        className="text-xs text-accent hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-medium">{formatCOP(line.price * line.quantity)}</p>
                </li>
              ))}
            </ul>

            <div className="border-t border-hairline px-6 py-5">
              <div className="mb-1 flex justify-between text-base font-semibold">
                <span>Subtotal</span>
                <span>{formatCOP(subtotal)}</span>
              </div>
              <p className="mb-4 text-xs text-muted">Envío gratis a toda Colombia.</p>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="block rounded-full bg-accent py-3 text-center text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Pagar
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
