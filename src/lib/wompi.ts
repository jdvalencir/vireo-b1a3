import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Integracion con Wompi (Colombia) via Web Checkout.
 *
 * Flujo completo:
 *  1. El cliente arma su carrito en el navegador.
 *  2. Pulsa "Pagar" -> POST a /api/checkout.
 *  3. El SERVIDOR recalcula el total desde el catalogo, guarda la orden
 *     y firma la transaccion con el secreto de integridad.
 *  4. Redirigimos al cliente a checkout.wompi.co, donde paga.
 *  5. Wompi lo devuelve a /checkout/resultado?id=<transaccion>.
 *  6. En paralelo, Wompi llama a /api/wompi/webhook. Ese webhook es la
 *     fuente de verdad: solo ahi damos una orden por pagada.
 *
 * Documentacion: https://docs.wompi.co/docs/colombia/widget-checkout-web/
 */

const CHECKOUT_URL = "https://checkout.wompi.co/p/";

/** sandbox.wompi.co para pruebas, production.wompi.co cuando salgas a vivo. */
export const WOMPI_API_URL =
  process.env.WOMPI_API_URL ?? "https://sandbox.wompi.co/v1";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Copiala de .env.example a .env.local ` +
        `con tus llaves del dashboard de Wompi (Desarrolladores > Secretos).`,
    );
  }
  return value;
}

function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Referencia unica de pago. Wompi rechaza referencias repetidas,
 * asi que mezclamos timestamp + aleatorio.
 */
export function generateReference(): string {
  return `CUERO-${Date.now()}-${randomBytes(4).toString("hex")}`;
}

/**
 * Firma de integridad.
 * Concatenacion exacta que exige Wompi:
 *   <referencia><monto-en-centavos><moneda><secreto>
 * y con vencimiento:
 *   <referencia><monto-en-centavos><moneda><vencimiento><secreto>
 * Todo pasado por SHA256.
 */
export function integritySignature(params: {
  reference: string;
  amountInCents: number;
  currency: string;
  expirationTime?: string;
}): string {
  const { reference, amountInCents, currency, expirationTime } = params;
  const secret = requireEnv("WOMPI_INTEGRITY_SECRET");
  const plain = `${reference}${amountInCents}${currency}${expirationTime ?? ""}${secret}`;
  return sha256(plain);
}

export type CheckoutParams = {
  reference: string;
  amountInCents: number;
  currency?: string;
  redirectUrl: string;
  expirationTime?: string;
  customer?: {
    email?: string;
    fullName?: string;
    phoneNumber?: string;
    legalId?: string;
    legalIdType?: string;
  };
  shipping?: {
    addressLine1?: string;
    city?: string;
    region?: string;
    country?: string;
    phoneNumber?: string;
  };
};

/**
 * Construye la URL del Web Checkout.
 *
 * Nota: armamos el query string a mano en vez de usar URLSearchParams
 * porque Wompi espera el nombre literal `signature:integrity`. Los dos
 * puntos son validos en un query string (RFC 3986) y no se deben escapar.
 */
export function buildCheckoutUrl(params: CheckoutParams): string {
  const currency = params.currency ?? "COP";
  const signature = integritySignature({
    reference: params.reference,
    amountInCents: params.amountInCents,
    currency,
    expirationTime: params.expirationTime,
  });

  const pairs: Array<[string, string | undefined]> = [
    ["public-key", requireEnv("NEXT_PUBLIC_WOMPI_PUBLIC_KEY")],
    ["currency", currency],
    ["amount-in-cents", String(params.amountInCents)],
    ["reference", params.reference],
    ["signature:integrity", signature],
    ["redirect-url", params.redirectUrl],
    ["expiration-time", params.expirationTime],
    ["customer-data:email", params.customer?.email],
    ["customer-data:full-name", params.customer?.fullName],
    ["customer-data:phone-number", params.customer?.phoneNumber],
    ["customer-data:legal-id", params.customer?.legalId],
    ["customer-data:legal-id-type", params.customer?.legalIdType],
    ["shipping-address:address-line-1", params.shipping?.addressLine1],
    ["shipping-address:city", params.shipping?.city],
    ["shipping-address:region", params.shipping?.region],
    ["shipping-address:country", params.shipping?.country],
    ["shipping-address:phone-number", params.shipping?.phoneNumber],
  ];

  const query = pairs
    .filter((pair): pair is [string, string] => Boolean(pair[1]))
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  return `${CHECKOUT_URL}?${query}`;
}

/* ------------------------------------------------------------------ */
/*  Webhooks                                                           */
/* ------------------------------------------------------------------ */

export type WompiEvent = {
  event: string;
  data: Record<string, unknown>;
  environment?: string;
  timestamp: number;
  sent_at?: string;
  signature: {
    properties: string[];
    checksum: string;
  };
};

/** Lee "transaction.status" dentro de data usando la ruta con puntos. */
function readPath(source: unknown, path: string): string {
  let current: unknown = source;
  for (const key of path.split(".")) {
    if (current === null || typeof current !== "object") return "";
    current = (current as Record<string, unknown>)[key];
  }
  return current === undefined || current === null ? "" : String(current);
}

/**
 * Valida que el evento venga de verdad de Wompi.
 *
 * Wompi concatena, EN ORDEN: los valores listados en signature.properties,
 * luego el timestamp, luego tu secreto de eventos. SHA256 de todo eso debe
 * dar signature.checksum.
 *
 * Sin esta validacion cualquiera podria enviarte un POST diciendo
 * "esta orden esta pagada". Nunca la quites.
 */
export function verifyEventChecksum(event: WompiEvent): boolean {
  const secret = requireEnv("WOMPI_EVENTS_SECRET");

  if (!event?.signature?.checksum || !Array.isArray(event.signature.properties)) {
    return false;
  }

  const concatenated =
    event.signature.properties.map((path) => readPath(event.data, path)).join("") +
    String(event.timestamp) +
    secret;

  const expected = sha256(concatenated);
  const received = event.signature.checksum.toLowerCase();

  // Comparacion en tiempo constante para no filtrar informacion.
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/* ------------------------------------------------------------------ */
/*  Consulta de transacciones                                          */
/* ------------------------------------------------------------------ */

export type WompiTransaction = {
  id: string;
  status: "APPROVED" | "DECLINED" | "VOIDED" | "ERROR" | "PENDING";
  reference: string;
  amount_in_cents: number;
  currency: string;
  payment_method_type?: string;
  status_message?: string | null;
};

/** Consulta el estado real de una transaccion contra la API de Wompi. */
export async function getTransaction(id: string): Promise<WompiTransaction | null> {
  const response = await fetch(`${WOMPI_API_URL}/transactions/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${requireEnv("WOMPI_PRIVATE_KEY")}` },
    cache: "no-store",
  });

  if (!response.ok) return null;
  const body = (await response.json()) as { data?: WompiTransaction };
  return body.data ?? null;
}
