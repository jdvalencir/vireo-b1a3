"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useCart } from "@/lib/cart-context";
import { formatCOP } from "@/lib/money";

/**
 * Formulario de datos de envío.
 *
 * No pedimos datos de tarjeta aquí — y eso es intencional. Los datos
 * sensibles los captura Wompi en su propio dominio, así que tu sitio
 * nunca los toca y te ahorras el cumplimiento PCI.
 */

const FIELDS = [
  { name: "fullName", label: "Nombre completo", type: "text", autoComplete: "name" },
  { name: "email", label: "Correo electrónico", type: "email", autoComplete: "email" },
  { name: "phone", label: "Teléfono", type: "tel", autoComplete: "tel" },
  { name: "address", label: "Dirección", type: "text", autoComplete: "street-address" },
  { name: "city", label: "Ciudad", type: "text", autoComplete: "address-level2" },
  { name: "region", label: "Departamento", type: "text", autoComplete: "address-level1" },
] as const;

export default function CheckoutPage() {
  const { lines, subtotal, count } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const customer = Object.fromEntries(
      FIELDS.map((field) => [field.name, String(formData.get(field.name) ?? "")]),
    );

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Solo mandamos qué y cuánto. El precio lo pone el servidor.
          items: lines.map((line) => ({
            slug: line.slug,
            color: line.color,
            quantity: line.quantity,
          })),
          customer,
        }),
      });

      const data = (await response.json()) as { checkoutUrl?: string; error?: string };

      if (!response.ok || !data.checkoutUrl) {
        setError(data.error ?? "No pudimos iniciar el pago. Inténtalo de nuevo.");
        setIsSubmitting(false);
        return;
      }

      // Salimos del sitio hacia Wompi. El carrito se limpia al volver aprobado.
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Error de conexión. Revisa tu internet e inténtalo de nuevo.");
      setIsSubmitting(false);
    }
  }

  if (count === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Tu bolsa está vacía</h1>
        <Link href="/productos" className="text-accent hover:underline">
          Ver productos &rsaquo;
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white px-6 pb-24 pt-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-center text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
          Finalizar compra
        </h1>

        <div className="mt-14 grid gap-14 lg:grid-cols-[1fr_380px]">
          {/* ---- Datos de envío ---- */}
          <form onSubmit={handleSubmit} noValidate>
            <h2 className="mb-6 text-lg font-semibold">Datos de envío</h2>

            <div className="grid gap-5 sm:grid-cols-2">
              {FIELDS.map((field) => (
                <label
                  key={field.name}
                  className={`block text-sm ${field.name === "address" ? "sm:col-span-2" : ""}`}
                >
                  <span className="mb-1.5 block font-medium">{field.label}</span>
                  <input
                    name={field.name}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    required
                    className="w-full rounded-xl border border-hairline px-4 py-3 outline-none transition-colors focus:border-accent"
                  />
                </label>
              ))}
            </div>

            {error && (
              <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-8 w-full rounded-full bg-accent py-3.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {isSubmitting ? "Redirigiendo a Wompi…" : `Pagar ${formatCOP(subtotal)}`}
            </button>

            <p className="mt-4 text-center text-xs text-muted">
              Te llevaremos al entorno seguro de Wompi para completar el pago con
              tarjeta, PSE, Nequi o Bancolombia.
            </p>
          </form>

          {/* ---- Resumen ---- */}
          <aside className="h-fit rounded-3xl bg-surface-alt p-6 lg:sticky lg:top-24">
            <h2 className="mb-5 text-lg font-semibold">Tu pedido</h2>

            <ul className="space-y-4 border-b border-hairline pb-5">
              {lines.map((line) => (
                <li key={`${line.slug}-${line.color}`} className="flex gap-3 text-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={line.image}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-lg bg-white object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{line.name}</p>
                    <p className="text-xs text-muted">
                      {line.color} · {line.quantity} und.
                    </p>
                  </div>
                  <span>{formatCOP(line.price * line.quantity)}</span>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 py-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatCOP(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Envío</dt>
                <dd>Gratis</dd>
              </div>
            </dl>

            <div className="flex justify-between border-t border-hairline pt-5 text-base font-semibold">
              <span>Total</span>
              <span>{formatCOP(subtotal)}</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
