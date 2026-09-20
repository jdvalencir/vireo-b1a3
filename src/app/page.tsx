import Link from "next/link";
import Reveal from "@/components/Reveal";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/products";
import { formatCOP } from "@/lib/money";
import { asset } from "@/lib/asset";

/**
 * Home. El lenguaje visual sigue tres reglas tipo Apple:
 *   1. Una idea por pantalla, centrada y con mucho aire.
 *   2. Tipografia enorme y apretada (tracking negativo) para los titulares.
 *   3. Secciones que alternan blanco / gris muy claro para marcar el ritmo.
 */

const featured = products.filter((p) =>
  ["morral-viajero", "bolso-tote"].includes(p.slug),
);

const materials = [
  {
    title: "Curtido al vegetal",
    body: "Sin cromo ni metales pesados. Tres meses en tinas de corteza de árbol, como se hace desde hace siglos. El cuero respira, envejece y se vuelve tuyo.",
    image: "/productos/portadocumentos.svg",
  },
  {
    title: "Costura a mano",
    body: "Punto de silla con hilo de lino encerado. Si un punto se rompe, el resto aguanta. Ninguna máquina hace esto todavía.",
    image: "/productos/correa-reloj.svg",
  },
];

export default function Home() {
  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="relative flex min-h-[86vh] items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${asset("/hero.svg")})` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/35" aria-hidden="true" />

        <Reveal className="relative z-10 px-6 text-center text-white">
          <p className="text-sm font-medium tracking-[0.2em] uppercase opacity-80">
            Colección 2026
          </p>
          <h1 className="mt-4 text-6xl font-semibold tracking-[-0.03em] sm:text-8xl">
            Cuero.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-xl font-medium sm:text-2xl">
            Hecho a mano para durar más que tú.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-lg">
            <Link href="/productos" className="text-[#2997ff] hover:underline">
              Comprar &rsaquo;
            </Link>
            <Link href="#materiales" className="text-[#2997ff] hover:underline">
              Cómo lo hacemos &rsaquo;
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ---------------- Dos protagonistas ---------------- */}
      <section className="bg-surface-alt px-4 py-4">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2">
          {featured.map((product, index) => (
            <Reveal key={product.slug} delay={index * 120}>
              <article className="flex h-full flex-col items-center justify-start rounded-3xl bg-white px-6 pb-2 pt-16 text-center">
                <h2 className="text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
                  {product.name}
                </h2>
                <p className="mt-3 max-w-sm text-lg text-muted">{product.tagline}</p>
                <div className="mt-5 flex items-center gap-6 text-base">
                  <Link href={`/productos/${product.slug}`} className="text-accent hover:underline">
                    Comprar &rsaquo;
                  </Link>
                  <span className="text-muted">Desde {formatCOP(product.price)}</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset(product.image)}
                  alt={product.name}
                  className="mt-8 w-full max-w-md object-contain"
                />
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- Materiales ---------------- */}
      <section id="materiales" className="scroll-mt-12 bg-white px-6 py-28">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="max-w-3xl text-4xl font-semibold tracking-[-0.02em] sm:text-6xl">
              No inventamos nada.
              <br />
              <span className="text-muted">Solo no tomamos atajos.</span>
            </h2>
          </Reveal>

          <div className="mt-20 space-y-24">
            {materials.map((material, index) => (
              <Reveal key={material.title}>
                <div
                  className={`flex flex-col items-center gap-10 md:gap-16 ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset(material.image)}
                    alt=""
                    className="w-full max-w-sm rounded-3xl object-cover"
                  />
                  <div className="max-w-md">
                    <h3 className="text-3xl font-semibold tracking-[-0.01em]">{material.title}</h3>
                    <p className="mt-4 text-lg leading-relaxed text-muted">{material.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- El taller ---------------- */}
      <section id="taller" className="scroll-mt-12 bg-surface-alt px-6 py-28 text-center">
        <Reveal>
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">El taller</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.02em] sm:text-6xl">
              Cuatro personas.
              <br />
              Ocho piezas al día.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
              No fabricamos en serie. Cada pieza pasa por una sola persona de principio
              a fin, y lleva sus iniciales grabadas en el reverso.
            </p>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-10 sm:grid-cols-4">
            {[
              ["12", "años de taller"],
              ["4", "artesanos"],
              ["100%", "cuero colombiano"],
              ["∞", "garantía"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-4xl font-semibold tracking-tight">{value}</dt>
                <dd className="mt-1 text-sm text-muted">{label}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      {/* ---------------- Catalogo ---------------- */}
      <section className="bg-white px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="text-center text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
              La colección
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <Reveal key={product.slug} delay={(index % 3) * 100}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Garantia ---------------- */}
      <section id="garantia" className="scroll-mt-12 bg-ink px-6 py-32 text-center text-white">
        <Reveal>
          <h2 className="mx-auto max-w-3xl text-4xl font-semibold tracking-[-0.02em] sm:text-6xl">
            Si se rompe, lo arreglamos.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/70">
            Para siempre y sin factura. Mándanos la pieza y te la devolvemos reparada.
            Es cuero: casi todo tiene arreglo.
          </p>
          <Link
            href="/productos"
            className="mt-10 inline-block rounded-full bg-white px-8 py-3.5 text-sm font-medium text-ink transition-opacity hover:opacity-85"
          >
            Ver productos
          </Link>
        </Reveal>
      </section>
    </>
  );
}
