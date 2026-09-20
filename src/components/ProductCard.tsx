import Link from "next/link";
import type { Product } from "@/lib/products";
import { formatCOP } from "@/lib/money";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/productos/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl bg-surface-alt transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1"
    >
      <div className="overflow-hidden">
        {/* Placeholder SVG. Al tener fotos reales, cambia por next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          className="aspect-square w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
        />
      </div>

      <div className="px-6 pb-8 pt-6 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">{product.tagline}</p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight">{product.name}</h3>
        <p className="mt-2 text-sm text-muted">Desde {formatCOP(product.price)}</p>
        <span className="mt-4 inline-block text-sm text-accent group-hover:underline">
          Comprar &rsaquo;
        </span>
      </div>
    </Link>
  );
}
