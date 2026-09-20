import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

/**
 * Pruebas de la integracion con Wompi.
 *
 * Ejecutar:  npm test
 *
 * Lo que se prueba aqui es lo unico que, si se rompe, te hace perder
 * dinero de verdad: las firmas. Si un dia cambias src/lib/wompi.ts y
 * estas pruebas fallan, NO lo subas.
 *
 * Los secretos de abajo son los ejemplos publicos de la documentacion
 * de Wompi, no llaves reales.
 */

const EVENTS_SECRET = "prod_events_OcHnIzeBl5socpwByQ4hA52Em3USQ93Z";
const INTEGRITY_SECRET = "prod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6";

process.env.WOMPI_EVENTS_SECRET = EVENTS_SECRET;
process.env.WOMPI_INTEGRITY_SECRET = INTEGRITY_SECRET;
process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY = "pub_test_ejemplo";

// Import dinamico: el modulo lee las variables de entorno al usarlas,
// asi que primero las definimos y despues lo cargamos.
const { verifyEventChecksum, integritySignature, buildCheckoutUrl } = await import("./wompi.ts");

const sha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");

/** Evento de ejemplo, identico al que publica Wompi en su documentacion. */
function makeEvent(overrides: { status?: string; amountInCents?: number } = {}) {
  const transaction = {
    id: "1234-1610641025-49201",
    status: overrides.status ?? "APPROVED",
    amount_in_cents: overrides.amountInCents ?? 4490000,
  };
  const timestamp = 1530291411;
  const properties = ["transaction.id", "transaction.status", "transaction.amount_in_cents"];

  const concatenated =
    transaction.id + transaction.status + transaction.amount_in_cents + timestamp + EVENTS_SECRET;

  return {
    event: "transaction.updated",
    data: { transaction },
    timestamp,
    signature: { properties, checksum: sha256(concatenated) },
  };
}

test("el ejemplo literal de la documentacion de Wompi se valida", () => {
  // Cadena exacta que aparece en docs.wompi.co. Si nuestra concatenacion
  // se desviara aunque sea un caracter, este assert fallaria.
  const documented =
    "1234-1610641025-49201APPROVED44900001530291411prod_events_OcHnIzeBl5socpwByQ4hA52Em3USQ93Z";
  const event = makeEvent();
  assert.equal(event.signature.checksum, sha256(documented));
  assert.equal(verifyEventChecksum(event), true);
});

test("rechaza un webhook con el monto manipulado", () => {
  const event = makeEvent();
  // Un atacante cambia el monto pero no puede recalcular el checksum
  // porque no conoce el secreto de eventos.
  event.data.transaction.amount_in_cents = 100;
  assert.equal(verifyEventChecksum(event), false);
});

test("rechaza un webhook con el estado manipulado", () => {
  const event = makeEvent({ status: "DECLINED" });
  event.data.transaction.status = "APPROVED";
  assert.equal(verifyEventChecksum(event), false);
});

test("rechaza un checksum con basura o ausente", () => {
  const event = makeEvent();
  event.signature.checksum = "deadbeef";
  assert.equal(verifyEventChecksum(event), false);

  const sinFirma = makeEvent() as unknown as { signature: unknown };
  sinFirma.signature = {};
  assert.equal(verifyEventChecksum(sinFirma as Parameters<typeof verifyEventChecksum>[0]), false);
});

test("firma de integridad: <referencia><centavos><moneda><secreto>", () => {
  assert.equal(
    integritySignature({ reference: "REF-1", amountInCents: 18900000, currency: "COP" }),
    sha256(`REF-118900000COP${INTEGRITY_SECRET}`),
  );
});

test("firma de integridad con vencimiento incluye la fecha", () => {
  assert.equal(
    integritySignature({
      reference: "REF-2",
      amountInCents: 5000,
      currency: "COP",
      expirationTime: "2026-10-01T12:00:00.000Z",
    }),
    sha256(`REF-25000COP2026-10-01T12:00:00.000Z${INTEGRITY_SECRET}`),
  );
});

test("la URL de checkout se construye como espera Wompi", () => {
  const url = buildCheckoutUrl({
    reference: "REF-3",
    amountInCents: 23900000,
    redirectUrl: "https://mitienda.co/checkout/resultado",
    customer: { email: "ana@ejemplo.co", fullName: "Ana Ruiz" },
  });

  assert.ok(url.startsWith("https://checkout.wompi.co/p/?"));
  // Wompi exige el nombre literal con dos puntos, sin escapar.
  assert.ok(url.includes("&signature:integrity="));
  assert.ok(url.includes("redirect-url=https%3A%2F%2Fmitienda.co%2Fcheckout%2Fresultado"));
  assert.ok(url.includes("Ana%20Ruiz"));
  // Ningun parametro opcional vacio debe colarse.
  assert.ok(!url.includes("=&"));
  assert.ok(!url.endsWith("="));
});

test("falla con un mensaje claro si falta un secreto", () => {
  const original = process.env.WOMPI_INTEGRITY_SECRET;
  delete process.env.WOMPI_INTEGRITY_SECRET;
  assert.throws(
    () => integritySignature({ reference: "X", amountInCents: 1, currency: "COP" }),
    /WOMPI_INTEGRITY_SECRET/,
  );
  process.env.WOMPI_INTEGRITY_SECRET = original;
});
