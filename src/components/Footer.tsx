import Link from "next/link";

const columns = [
  {
    title: "Comprar",
    links: [
      { label: "Todos los productos", href: "/productos" },
      { label: "Billeteras", href: "/productos" },
      { label: "Bolsos y morrales", href: "/productos" },
      { label: "Accesorios", href: "/productos" },
    ],
  },
  {
    title: "Ayuda",
    links: [
      { label: "Envíos", href: "/productos" },
      { label: "Cambios y devoluciones", href: "/productos" },
      { label: "Cuidado del cuero", href: "/productos" },
      { label: "Contacto", href: "/productos" },
    ],
  },
  {
    title: "Taller",
    links: [
      { label: "Nuestra historia", href: "/#taller" },
      { label: "Materiales", href: "/#materiales" },
      { label: "Garantía de por vida", href: "/#garantia" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-hairline bg-surface-alt text-muted">
      <div className="mx-auto max-w-5xl px-6 py-12 text-xs leading-relaxed">
        <div className="grid grid-cols-2 gap-8 border-b border-hairline pb-8 md:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="mb-3 font-semibold text-ink">{column.title}</h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="transition-colors hover:text-ink">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="pt-6">
          Hecho a mano en Colombia. Precios en pesos colombianos (COP), IVA incluido.
        </p>
        <p className="pt-2">
          © {new Date().getFullYear()} CUERO. Pagos procesados por Wompi.
        </p>
      </div>
    </footer>
  );
}
