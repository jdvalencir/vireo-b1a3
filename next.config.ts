import type { NextConfig } from "next";

/**
 * Dos formas de construir este sitio:
 *
 *  1. Normal (`npm run build`) — la tienda completa, con servidor.
 *     Las rutas /api/* y /checkout/resultado funcionan y se puede cobrar.
 *     Para Vercel, Railway, un VPS, etc.
 *
 *  2. Estática (`BUILD_TARGET=pages npm run build`) — solo HTML, CSS y JS.
 *     Es lo único que GitHub Pages sabe servir: Pages no ejecuta código de
 *     servidor. Sirve como escaparate del catálogo, pero NO puede cobrar,
 *     porque firmar un pago exige un secreto que jamás debe viajar al
 *     navegador. El workflow de Pages quita las rutas de servidor antes
 *     de construir.
 */
const isStaticExport = process.env.BUILD_TARGET === "pages";

const nextConfig: NextConfig = isStaticExport
  ? {
      output: "export",
      // En Pages el sitio cuelga de /<nombre-del-repo>, no de la raíz.
      basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
      // Genera /productos/index.html en vez de /productos.html.
      trailingSlash: true,
      // El optimizador de imágenes necesita servidor; aquí no hay.
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;
