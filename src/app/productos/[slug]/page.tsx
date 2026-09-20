import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCart from "@/components/AddToCart";
import ProductCard from "@/components/ProductCard";
import { getProduct, products } from "@/lib/products";
import { asset } from "@/lib/asset";

type Props = { params: Promise<{ slug: string }> };

/** Pre-genera una pagina estatica por producto en el build (rapidisimo). */
export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Producto no encontrado — CUERO" };

  return {
    title: `${product.name} — CUERO`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProduct(slug);

  // Si la URL no existe, Next muestra la pagina 404.
  if (!product) notFound();

  const related = products.filter((p) => p.slug !== product.slug).slice(0, 3);

  return (
    <>
      <article className="bg-white px-6 pb-24 pt-12">
        <div className="mx-auto max-w-6xl">
          <nav className="mb-8 text-xs text-muted">
            <Link href="/productos" className="hover:text-ink">
              Productos
            </Link>
            <span className="mx-2">/</span>
            <span className="text-ink">{product.name}</span>
          </nav>

          <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
            {/* Galeria */}
            <div className="space-y-4">
              {product.gallery.map((image, index) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={image}
                  src={asset(image)}
                  alt={`${product.name} — vista ${index + 1}`}
                  className="w-full rounded-3xl bg-surface-alt object-cover"
                />
              ))}
            </div>

            {/* Panel de compra: se queda fijo mientras bajas por la galeria */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                {product.tagline}
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
                {product.name}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-muted">{product.description}</p>

              <div className="my-8 h-px bg-hairline" />

              <AddToCart product={product} />

              <div className="mt-10">
                <h2 className="mb-3 text-sm font-semibold">Detalles</h2>
                <ul className="space-y-2 text-sm text-muted">
                  {product.details.map((detail) => (
                    <li key={detail} className="flex gap-3">
                      <span aria-hidden="true">—</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </article>

      <section className="bg-surface-alt px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-semibold tracking-[-0.02em]">
            También te puede gustar
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.slug} product={item} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
