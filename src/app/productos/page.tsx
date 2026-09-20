import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/products";

export const metadata: Metadata = {
  title: "Productos — CUERO",
  description: "Toda la colección de marroquinería hecha a mano.",
};

export default function ProductosPage() {
  return (
    <div className="bg-white px-6 pb-28 pt-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <header className="text-center">
            <h1 className="text-5xl font-semibold tracking-[-0.03em] sm:text-7xl">Productos</h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
              Seis piezas. Ninguna de más. Todas con envío gratis y garantía de por vida.
            </p>
          </header>
        </Reveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => (
            <Reveal key={product.slug} delay={(index % 3) * 100}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
