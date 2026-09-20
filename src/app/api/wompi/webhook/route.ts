import { NextResponse } from "next/server";
import { getOrder, updateOrderStatus, type OrderStatus } from "@/lib/orders";
import { verifyEventChecksum, type WompiEvent } from "@/lib/wompi";

/**
 * POST /api/wompi/webhook
 *
 * Esta es la UNICA fuente de verdad sobre si una orden se pagó.
 *
 * ¿Por qué no basta con la pantalla de resultado? Porque el usuario puede
 * cerrar el navegador justo después de pagar, o quedarse sin internet.
 * El webhook llega igual, directo de Wompi a tu servidor.
 *
 * Configuralo en el dashboard de Wompi:
 *   Desarrolladores > URL de eventos > https://TU-DOMINIO/api/wompi/webhook
 *
 * En local, expón tu puerto con ngrok o cloudflared para poder probarlo.
 */

// Siempre en servidor, nunca cacheado.
export const dynamic = "force-dynamic";

const STATUS_MAP: Record<string, OrderStatus> = {
  APPROVED: "APPROVED",
  DECLINED: "DECLINED",
  VOIDED: "VOIDED",
  ERROR: "ERROR",
  PENDING: "PENDING",
};

export async function POST(request: Request) {
  let event: WompiEvent;
  try {
    event = (await request.json()) as WompiEvent;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  /* ---- 1. Comprobar que el evento viene de Wompi ---- */
  let isAuthentic = false;
  try {
    isAuthentic = verifyEventChecksum(event);
  } catch (error) {
    console.error("[webhook] falta WOMPI_EVENTS_SECRET:", error);
    return NextResponse.json({ error: "Webhook no configurado." }, { status: 500 });
  }

  if (!isAuthentic) {
    console.warn("[webhook] checksum inválido, evento descartado.");
    return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
  }

  /* ---- 2. Solo nos interesan las transacciones ---- */
  if (event.event !== "transaction.updated") {
    return NextResponse.json({ received: true });
  }

  const transaction = event.data?.transaction as
    | { id?: string; reference?: string; status?: string; amount_in_cents?: number }
    | undefined;

  if (!transaction?.reference || !transaction.status) {
    return NextResponse.json({ received: true });
  }

  /* ---- 3. Cruzar contra nuestra orden ---- */
  const order = await getOrder(transaction.reference);
  if (!order) {
    console.warn(`[webhook] referencia desconocida: ${transaction.reference}`);
    // Devolvemos 200: la orden no es nuestra, no queremos que Wompi reintente.
    return NextResponse.json({ received: true });
  }

  // El monto cobrado debe coincidir con lo que calculamos nosotros.
  if (transaction.amount_in_cents !== order.amountInCents) {
    console.error(
      `[webhook] monto distinto en ${order.reference}: ` +
        `esperado ${order.amountInCents}, recibido ${transaction.amount_in_cents}`,
    );
    return NextResponse.json({ received: true });
  }

  const status = STATUS_MAP[transaction.status] ?? "ERROR";
  await updateOrderStatus(order.reference, status, transaction.id);

  if (status === "APPROVED") {
    // Aquí va lo que pasa cuando el pago entra de verdad:
    // enviar correo de confirmación, descontar inventario, avisar al taller.
    console.log(`[webhook] pago aprobado: ${order.reference} (${order.amount} COP)`);
  }

  // Wompi espera un 200. Si respondes otra cosa, reintenta hasta 3 veces.
  return NextResponse.json({ received: true });
}
