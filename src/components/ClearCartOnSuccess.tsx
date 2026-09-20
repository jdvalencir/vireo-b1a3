"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";

/** Vacía la bolsa cuando el pago quedó aprobado. No pinta nada. */
export default function ClearCartOnSuccess() {
  const { clear } = useCart();
  useEffect(() => clear(), [clear]);
  return null;
}
