"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/products";
import { formatCOP } from "@/lib/money";

/** Selector de color + boton de compra de la ficha de producto. */
export default function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const [color, setColor] = useState(product.colors[0]);

  return (
    <div>
      <fieldset className="mb-8">
        <legend className="mb-3 text-sm font-medium">
          Color — <span className="text-muted">{color}</span>
        </legend>
        <div className="flex flex-wrap gap-3">
          {product.colors.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setColor(option)}
              aria-pressed={color === option}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                color === option
                  ? "border-ink bg-ink text-white"
                  : "border-hairline text-ink hover:border-ink"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={() =>
          add({
            slug: product.slug,
            name: product.name,
            price: product.price,
            image: product.image,
            color,
          })
        }
        className="w-full rounded-full bg-accent py-3.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        Añadir a la bolsa — {formatCOP(product.price)}
      </button>

      <p className="mt-4 text-center text-xs text-muted">
        Envío gratis · Devoluciones sin costo durante 30 días
      </p>
    </div>
  );
}
