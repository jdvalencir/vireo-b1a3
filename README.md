# CUERO — E-commerce de marroquinería

Tienda en línea estilo Apple para productos de cuero, con pagos por
**Wompi** (Colombia). Construida con Next.js 16, React 19 y Tailwind CSS v4.

---

## 1. Arrancar en local

```bash
npm install
cp .env.example .env.local   # y rellena tus llaves de Wompi
npm run dev
```

Abre http://localhost:3000

Sin las llaves de Wompi el sitio funciona completo (catálogo, carrito,
formulario); solo falla el último paso, el redirect a la pasarela.

## 2. Conseguir las llaves de Wompi

1. Crea una cuenta en https://comercios.wompi.co
2. Ve a **Desarrolladores > Secretos para integración técnica**
3. Copia los cuatro valores a tu `.env.local`:

| Variable | Qué es | ¿Secreta? |
|---|---|---|
| `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` | Identifica tu comercio | No, viaja al navegador |
| `WOMPI_PRIVATE_KEY` | Consulta transacciones | **Sí** |
| `WOMPI_INTEGRITY_SECRET` | Firma el monto a cobrar | **Sí** |
| `WOMPI_EVENTS_SECRET` | Valida los webhooks | **Sí** |

Empieza siempre con las llaves de prueba (`pub_test_`, `prv_test_`).
Wompi publica tarjetas de prueba en su documentación.

## 3. Cómo funciona un pago, paso a paso

```
Navegador                  Tu servidor                 Wompi
    │                          │                          │
    │  POST /api/checkout      │                          │
    │─────────────────────────>│                          │
    │                          │ recalcula el total       │
    │                          │ desde products.ts        │
    │                          │ guarda orden PENDING     │
    │                          │ firma con SHA256         │
    │  { checkoutUrl }         │                          │
    │<─────────────────────────│                          │
    │                                                     │
    │  redirect a checkout.wompi.co                       │
    │────────────────────────────────────────────────────>│
    │                          │      el usuario paga     │
    │  vuelve a /checkout/resultado?id=...                │
    │<────────────────────────────────────────────────────│
    │                          │                          │
    │                          │  POST /api/wompi/webhook │
    │                          │<─────────────────────────│
    │                          │ valida checksum          │
    │                          │ marca orden APPROVED     │
```

Dos ideas que conviene tener claras:

**El servidor nunca confía en el precio del navegador.** `/api/checkout`
recalcula todo desde `src/lib/products.ts`. Si no lo hiciera, cualquiera
podría editar el `localStorage` y comprar un morral por mil pesos.

**El webhook es la verdad, no la pantalla de resultado.** El usuario puede
cerrar el navegador justo después de pagar. El webhook llega igual.
Solo se despacha un pedido cuando el webhook lo marca `APPROVED`.

## 4. Probar los webhooks en local

Wompi no puede llamar a tu `localhost`, así que necesitas un túnel:

```bash
npx cloudflared tunnel --url http://localhost:3000
```

Copia la URL que te da y pégala en el dashboard de Wompi, en
**Desarrolladores > URL de eventos**, añadiendo `/api/wompi/webhook`.

Mientras tanto, la página de resultado consulta el estado directo a la
API de Wompi, así que el flujo se puede probar sin túnel.

## 5. Estructura

```
src/
  app/
    page.tsx                      Home (hero, materiales, taller, garantía)
    productos/page.tsx            Listado
    productos/[slug]/page.tsx     Ficha de producto
    checkout/page.tsx             Datos de envío
    checkout/resultado/page.tsx   Estado del pago
    api/checkout/route.ts         Crea y firma la orden
    api/wompi/webhook/route.ts    Recibe y valida eventos
  components/                     Nav, carrito, tarjetas, animaciones
  lib/
    products.ts                   Catálogo (fuente de verdad de precios)
    wompi.ts                      Firma, checkout URL, webhooks
    cart-context.tsx              Carrito en el navegador
    orders.ts                     Almacén de órdenes
    money.ts                      Formato COP
```

## 6. Antes de vender de verdad

- [ ] **Base de datos.** `src/lib/orders.ts` guarda en un JSON en disco.
      En Vercel el disco es de solo lectura: eso no persiste. Cámbialo por
      Supabase, Neon o Postgres respetando las mismas funciones.
- [ ] **Fotos reales.** Las imágenes de `public/productos/` son SVG
      generados. Reemplázalas por `.webp` y cambia los `<img>` por
      `next/image` para tener optimización automática.
- [ ] **Correo de confirmación** en el webhook (Resend o similar).
- [ ] **Inventario**, para no vender lo que no tienes.
- [ ] **Llaves de producción** y `WOMPI_API_URL=https://production.wompi.co/v1`.
- [ ] **`NEXT_PUBLIC_SITE_URL`** con tu dominio real.
- [ ] Páginas legales: términos, privacidad, política de devoluciones.

## 7. Desplegar

La ruta más corta es Vercel:

```bash
npx vercel
```

Añade las variables de entorno en el panel de Vercel (las de `.env.local`
no se suben nunca) y actualiza `NEXT_PUBLIC_SITE_URL` y la URL de eventos
de Wompi con tu dominio final.
