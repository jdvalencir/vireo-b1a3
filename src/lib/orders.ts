import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Almacen de ordenes MUY simple: un archivo JSON en disco.
 *
 * Sirve perfecto para desarrollo y para entender el flujo, pero tiene
 * dos limites reales:
 *   - En Vercel/Netlify el disco es de solo lectura -> esto no persiste.
 *   - Si dos pedidos llegan exactamente a la vez, uno puede pisar al otro.
 *
 * Antes de vender de verdad, reemplaza este archivo por una base de datos
 * (Supabase, Neon, Postgres). El resto del codigo no tiene que cambiar:
 * solo respeta estas mismas funciones.
 */

export type OrderItem = {
  slug: string;
  name: string;
  unitPrice: number; // COP
  quantity: number;
};

export type OrderStatus = "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR";

export type Order = {
  reference: string;
  items: OrderItem[];
  amount: number; // COP
  amountInCents: number;
  status: OrderStatus;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    region: string;
  };
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "orders.json");

async function readAll(): Promise<Record<string, Order>> {
  try {
    return JSON.parse(await readFile(DB_PATH, "utf8")) as Record<string, Order>;
  } catch {
    return {};
  }
}

async function writeAll(orders: Record<string, Order>): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DB_PATH, JSON.stringify(orders, null, 2), "utf8");
}

export async function saveOrder(order: Order): Promise<void> {
  const orders = await readAll();
  orders[order.reference] = order;
  await writeAll(orders);
}

export async function getOrder(reference: string): Promise<Order | null> {
  const orders = await readAll();
  return orders[reference] ?? null;
}

export async function updateOrderStatus(
  reference: string,
  status: OrderStatus,
  transactionId?: string,
): Promise<Order | null> {
  const orders = await readAll();
  const order = orders[reference];
  if (!order) return null;

  order.status = status;
  order.updatedAt = new Date().toISOString();
  if (transactionId) order.transactionId = transactionId;

  await writeAll(orders);
  return order;
}
