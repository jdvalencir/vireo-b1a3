import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { CartProvider } from "@/lib/cart-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "CUERO — Marroquinería hecha a mano",
  description:
    "Billeteras, cinturones y bolsos de cuero curtido al vegetal. Hechos a mano en Colombia para durar décadas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO">
      <body className="antialiased">
        {/* El carrito envuelve toda la app para que la barra superior y
            cualquier pagina puedan leerlo y modificarlo. */}
        <CartProvider>
          <Nav />
          <CartDrawer />
          <main>{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
