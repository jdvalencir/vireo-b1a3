"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/**
 * Carrito de compras.
 *
 * El carrito vive FUERA de React, en un pequeño "store" con suscriptores,
 * y los componentes lo leen con useSyncExternalStore. Esto puede parecer
 * rebuscado frente a un useState + useEffect, pero resuelve dos problemas
 * de raíz:
 *
 *  1. Hidratación. El servidor no tiene localStorage, así que renderiza el
 *     carrito vacío. Si el cliente leyera localStorage en el primer render,
 *     los dos HTML no coincidirían y React se quejaría. useSyncExternalStore
 *     usa `getServerSnapshot` mientras hidrata y luego cambia al real.
 *  2. Renders en cascada. Cargar el carrito con setState dentro de un efecto
 *     obliga a React a renderizar dos veces siempre.
 *
 * Guardamos el precio solo para pintar el total al instante: cuando el
 * usuario paga, el servidor lo recalcula desde el catálogo e ignora
 * estos valores.
 */

export type CartLine = {
  slug: string;
  name: string;
  price: number;
  image: string;
  color: string;
  quantity: number;
};

const STORAGE_KEY = "cuero.cart.v1";

// Identidad estable: useSyncExternalStore compara por referencia, así que
// devolver [] nuevo en cada llamada provocaría un bucle infinito.
const EMPTY: CartLine[] = [];

/* ------------------------- store externo ------------------------- */

let lines: CartLine[] = readStorage();
const listeners = new Set<() => void>();

function readStorage(): CartLine[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(parsed) ? (parsed as CartLine[]) : EMPTY;
  } catch {
    return EMPTY; // localStorage bloqueado o JSON corrupto
  }
}

function commit(next: CartLine[]): void {
  lines = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Modo incógnito o almacenamiento lleno: el carrito sigue en memoria.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => lines;
const getServerSnapshot = () => EMPTY;

/* --------------------------- contexto ---------------------------- */

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  remove: (slug: string, color: string) => void;
  setQuantity: (slug: string, color: string, quantity: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

// Una misma referencia en dos colores son dos líneas distintas.
const sameLine = (line: CartLine, slug: string, color: string) =>
  line.slug === slug && line.color === color;

export function CartProvider({ children }: { children: ReactNode }) {
  const currentLines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // El panel abierto/cerrado sí es estado puro de interfaz: va en React.
  const [isOpen, setIsOpen] = useState(false);

  const add = useCallback((line: Omit<CartLine, "quantity">, quantity = 1) => {
    const existing = lines.find((l) => sameLine(l, line.slug, line.color));
    commit(
      existing
        ? lines.map((l) =>
            sameLine(l, line.slug, line.color) ? { ...l, quantity: l.quantity + quantity } : l,
          )
        : [...lines, { ...line, quantity }],
    );
    setIsOpen(true);
  }, []);

  const remove = useCallback((slug: string, color: string) => {
    commit(lines.filter((l) => !sameLine(l, slug, color)));
  }, []);

  const setQuantity = useCallback((slug: string, color: string, quantity: number) => {
    commit(
      quantity <= 0
        ? lines.filter((l) => !sameLine(l, slug, color))
        : lines.map((l) => (sameLine(l, slug, color) ? { ...l, quantity } : l)),
    );
  }, []);

  const clear = useCallback(() => commit(EMPTY), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines: currentLines,
      count: currentLines.reduce((total, l) => total + l.quantity, 0),
      subtotal: currentLines.reduce((total, l) => total + l.price * l.quantity, 0),
      isOpen,
      add,
      remove,
      setQuantity,
      clear,
      openCart,
      closeCart,
    }),
    [currentLines, isOpen, add, remove, setQuantity, clear, openCart, closeCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return context;
}
