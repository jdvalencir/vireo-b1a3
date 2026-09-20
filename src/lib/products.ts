/**
 * Catalogo. Es la UNICA fuente de verdad de los precios.
 *
 * Importante: el servidor siempre recalcula el total desde aqui.
 * Nunca confiamos en el precio que manda el navegador, porque
 * cualquiera puede editarlo desde las devtools.
 *
 * Cuando crezcas, esto se reemplaza por una tabla en una base de
 * datos (Postgres / Supabase) sin cambiar el resto del codigo.
 */

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number; // COP, entero
  image: string;
  gallery: string[];
  details: string[];
  colors: string[];
};

export const products: Product[] = [
  {
    slug: "billetera-slim",
    name: "Billetera Slim",
    tagline: "Seis tarjetas. Cero volumen.",
    description:
      "Cuero vacuno curtido al vegetal, plegado a mano en una sola pieza. Ocho milimetros de grosor que desaparecen en el bolsillo.",
    price: 189000,
    image: "/productos/billetera-slim.svg",
    gallery: ["/productos/billetera-slim.svg", "/productos/billetera-slim-2.svg"],
    details: [
      "Cuero vacuno curtido al vegetal, 1.2 mm",
      "6 ranuras para tarjetas + compartimento para billetes",
      "Costura a mano con hilo encerado",
      "8 mm de grosor",
    ],
    colors: ["Coñac", "Negro", "Café oscuro"],
  },
  {
    slug: "cinturon-clasico",
    name: "Cinturón Clásico",
    tagline: "Una pieza. Sin empalmes.",
    description:
      "Cortado de un solo lomo de cuero, no laminado. La hebilla es de latón macizo y se puede cambiar sin herramientas.",
    price: 239000,
    image: "/productos/cinturon-clasico.svg",
    gallery: ["/productos/cinturon-clasico.svg", "/productos/cinturon-clasico-2.svg"],
    details: [
      "Cuero de un solo lomo, 3.5 mm",
      "Hebilla de latón macizo intercambiable",
      "Ancho de 35 mm",
      "Tallas 30 a 42",
    ],
    colors: ["Café", "Negro"],
  },
  {
    slug: "morral-viajero",
    name: "Morral Viajero",
    tagline: "Para el lunes y para el sábado.",
    description:
      "Dieciocho litros, compartimento acolchado para portátil de 16 pulgadas y una base reforzada que aguanta el peso sin deformarse.",
    price: 890000,
    image: "/productos/morral-viajero.svg",
    gallery: ["/productos/morral-viajero.svg", "/productos/morral-viajero-2.svg"],
    details: [
      "18 litros de capacidad",
      "Compartimento acolchado para portátil de 16\"",
      "Forro interior de lona de algodón",
      "Herrajes de latón antiguo",
    ],
    colors: ["Coñac", "Negro"],
  },
  {
    slug: "bolso-tote",
    name: "Bolso Tote",
    tagline: "Cabe el día entero.",
    description:
      "Cuero suave que se ablanda con el uso y toma la forma de lo que llevas. Asas reforzadas con remaches de cobre.",
    price: 690000,
    image: "/productos/bolso-tote.svg",
    gallery: ["/productos/bolso-tote.svg", "/productos/bolso-tote-2.svg"],
    details: [
      "Cuero suave curtido al vegetal",
      "Bolsillo interior con cremallera",
      "Asas reforzadas con remaches de cobre",
      "40 x 35 x 12 cm",
    ],
    colors: ["Camel", "Negro", "Verde oliva"],
  },
  {
    slug: "portadocumentos",
    name: "Portadocumentos",
    tagline: "El maletín, reducido a lo esencial.",
    description:
      "Un sobre de cuero rígido para el portátil y los papeles del día. Cierre magnético oculto bajo la solapa.",
    price: 520000,
    image: "/productos/portadocumentos.svg",
    gallery: ["/productos/portadocumentos.svg", "/productos/portadocumentos-2.svg"],
    details: [
      "Cuero rígido de 2 mm",
      "Cierre magnético oculto",
      "Cabe portátil de 14\"",
      "Interior forrado en microfibra",
    ],
    colors: ["Café oscuro", "Negro"],
  },
  {
    slug: "correa-reloj",
    name: "Correa de Reloj",
    tagline: "El detalle que todos notan.",
    description:
      "Cuero Horween de Chicago, cosido a mano. Compatible con cualquier caja de 20 o 22 milímetros.",
    price: 145000,
    image: "/productos/correa-reloj.svg",
    gallery: ["/productos/correa-reloj.svg", "/productos/correa-reloj-2.svg"],
    details: [
      "Cuero Horween Chicago",
      "Compatible con cajas de 20 y 22 mm",
      "Pasadores de liberación rápida incluidos",
      "Costura a mano",
    ],
    colors: ["Coñac", "Negro", "Azul marino"],
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
