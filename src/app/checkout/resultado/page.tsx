import type { Metadata } from "next";
import Link from "next/link";
import ClearCartOnSuccess from "@/components/ClearCartOnSuccess";
import { formatCOP } from "@/lib/money";
import { getOrder, updateOrderStatus, type OrderStatus } from "@/lib/orders";
import { getTransaction } from "@/lib/wompi";

export const metadata: Metadata = { title: "Resultado del pago — CUERO" };

// El estado del pago cambia, así que nunca servimos esta página cacheada.
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ id?: string }> };

const VIEWS: Record<string, { title: string; body: string; tone: string }> = {
  APPROVED: {
    title: "¡Pago aprobado!",
    body: "Gracias por tu compra. Te enviamos la confirmación por correo y tu pedido sale del taller en 2 a 3 días hábiles.",
    tone: "text-emerald-600",
  },
  PENDING: {
    title: "Pago en proceso",
    body: "Tu pago está siendo verificado. Suele tardar unos minutos; te avisamos por correo en cuanto se confirme.",
    tone: "text-amber-600",
  },
  DECLINED: {
    title: "Pago rechazado",
    body: "Tu banco no autorizó la transacción. Puedes intentarlo con otro medio de pago.",
    tone: "text-red-600",
  },
  VOIDED: {
    title: "Pago anulado",
    body: "La transacción fue anulada. No se hizo ningún cobro.",
    tone: "text-muted",
  },
  ERROR: {
    title: "Hubo un error",
    body: "No pudimos procesar el pago. Si te aparece un cobro, escríbenos y lo revisamos.",
    tone: "text-red-600",
  },
  UNKNOWN: {
    title: "No encontramos la transacción",
    body: "Puede que el enlace esté incompleto. Si ya pagaste, revisa tu correo o escríbenos.",
    tone: "text-muted",
  },
};

export default async function ResultadoPage({ searchParams }: Props) {
  // Wompi nos devuelve aquí con ?id=<id de la transacción>.
  const { id } = await searchParams;

  let status: OrderStatus | "UNKNOWN" = "UNKNOWN";
  let reference: string | null = null;
  let amount: number | null = null;

  if (id) {
    try {
      const transaction = await getTransaction(id);
      if (transaction) {
        status = (transaction.status as OrderStatus) ?? "UNKNOWN";
        reference = transaction.reference;
        amount = transaction.amount_in_cents / 100;

        // Red de seguridad: si el webhook aún no llegó (típico en local,
        // donde Wompi no puede alcanzar tu localhost), sincronizamos aquí.
        const order = await getOrder(transaction.reference);
        if (order && order.status !== status) {
          await updateOrderStatus(transaction.reference, status, transaction.id);
        }
        if (order) amount = order.amount;
      }
    } catch (error) {
      console.error("[resultado] no se pudo consultar la transacción:", error);
    }
  }

  const view = VIEWS[status] ?? VIEWS.UNKNOWN;

  return (
    <div className="flex min-h-[75vh] items-center justify-center bg-white px-6 py-20">
      <div className="w-full max-w-lg text-center">
        {status === "APPROVED" && <ClearCartOnSuccess />}

        <p className={`text-sm font-medium uppercase tracking-[0.2em] ${view.tone}`}>
          {status === "UNKNOWN" ? "Sin datos" : status}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
          {view.title}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">{view.body}</p>

        {reference && (
          <dl className="mx-auto mt-10 max-w-sm space-y-3 rounded-2xl bg-surface-alt p-6 text-left text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Referencia</dt>
              <dd className="font-mono text-xs">{reference}</dd>
            </div>
            {amount !== null && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Total</dt>
                <dd className="font-medium">{formatCOP(amount)}</dd>
              </div>
            )}
            {id && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Transacción</dt>
                <dd className="font-mono text-xs">{id}</dd>
              </div>
            )}
          </dl>
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3">
          <Link href="/productos" className="text-accent hover:underline">
            Seguir comprando &rsaquo;
          </Link>
          {(status === "DECLINED" || status === "ERROR") && (
            <Link href="/checkout" className="text-accent hover:underline">
              Intentar de nuevo &rsaquo;
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
