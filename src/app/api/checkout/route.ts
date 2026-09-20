import { NextResponse } from "next/server";
import { getProduct } from "@/lib/products";
import { toCents } from "@/lib/money";
import { saveOrder, type OrderItem } from "@/lib/orders";
import { buildCheckoutUrl, generateReference } from "@/lib/wompi";

/**
 * POST /api/checkout
 *
 * Recibe el carrito y los datos del comprador, y devuelve la URL de Wompi
 * a la que hay que redirigir.
 *
 * REGLA DE ORO: el precio que llega del navegador se ignora por completo.
 * Recalculamos todo desde src/lib/products.ts. Si no lo hicieramos,
 * cualquiera podria comprar un morral de $890.000 por $1.000 editando
 * el localStorage.
 */

type IncomingItem = { slug?: unknown; color?: unknown; quantity?: unknown };

type Payload = {
  items?: unknown;
  customer?: Record<string, unknown>;
};

function asText(value: unknown, maxLength = 200): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  /* ---- 1. Validar el carrito y recalcular precios ---- */
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return NextResponse.json({ error: "El carrito está vacío." }, { status: 400 });
  }

  const items: OrderItem[] = [];
  for (const raw of payload.items as IncomingItem[]) {
    const product = getProduct(asText(raw?.slug, 80));
    if (!product) {
      return NextResponse.json(
        { error: "Uno de los productos ya no está disponible." },
        { status: 400 },
      );
    }

    const quantity = Number(raw?.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      return NextResponse.json(
        { error: `Cantidad inválida para ${product.name}.` },
        { status: 400 },
      );
    }

    items.push({
      slug: product.slug,
      name: product.name,
      unitPrice: product.price, // precio del servidor, no del cliente
      quantity,
    });
  }

  /* ---- 2. Validar los datos del comprador ---- */
  const customer = {
    fullName: asText(payload.customer?.fullName, 120),
    email: asText(payload.customer?.email, 120),
    phone: asText(payload.customer?.phone, 30),
    address: asText(payload.customer?.address, 200),
    city: asText(payload.customer?.city, 80),
    region: asText(payload.customer?.region, 80),
  };

  const missing = Object.entries(customer)
    .filter(([, value]) => value.length === 0)
    .map(([key]) => key);

  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Faltan datos de envío.", fields: missing },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    return NextResponse.json({ error: "El correo no es válido." }, { status: 400 });
  }

  /* ---- 3. Guardar la orden como PENDIENTE ---- */
  const amount = items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  const amountInCents = toCents(amount);
  const reference = generateReference();
  const now = new Date().toISOString();

  await saveOrder({
    reference,
    items,
    amount,
    amountInCents,
    status: "PENDING",
    customer,
    createdAt: now,
    updatedAt: now,
  });

  /* ---- 4. Firmar y construir la URL de Wompi ---- */
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  try {
    const checkoutUrl = buildCheckoutUrl({
      reference,
      amountInCents,
      currency: "COP",
      redirectUrl: `${siteUrl}/checkout/resultado`,
      customer: {
        email: customer.email,
        fullName: customer.fullName,
        phoneNumber: customer.phone,
      },
      shipping: {
        addressLine1: customer.address,
        city: customer.city,
        region: customer.region,
        country: "CO",
        phoneNumber: customer.phone,
      },
    });

    return NextResponse.json({ checkoutUrl, reference });
  } catch (error) {
    // Normalmente: faltan las llaves de Wompi en .env.local
    console.error("[checkout] no se pudo firmar la transacción:", error);
    return NextResponse.json(
      { error: "La pasarela de pago no está configurada." },
      { status: 500 },
    );
  }
}
