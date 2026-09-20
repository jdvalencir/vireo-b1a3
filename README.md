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

Este proyecto se puede construir de dos formas distintas, y la diferencia
importa mucho.

### La tienda real (cobra de verdad)

Necesita un hosting que ejecute Node, porque tres rutas corren en servidor:
`/api/checkout`, `/api/wompi/webhook` y `/checkout/resultado`.

```bash
npm run build   # build normal
npx vercel       # o Railway, Render, un VPS...
```

Añade las variables de entorno en el panel del hosting y actualiza
`NEXT_PUBLIC_SITE_URL` y la URL de eventos de Wompi con tu dominio.

### La demo en GitHub Pages (NO cobra)

`.github/workflows/pages.yml` publica el catálogo en GitHub Pages en cada
push a `main`. Sirve para enseñar el diseño, no para vender.

**Por qué no puede cobrar.** GitHub Pages sirve archivos estáticos y nada
más: no ejecuta código de servidor. Y eso no se arregla con configuración,
porque firmar un cobro requiere `WOMPI_INTEGRITY_SECRET`, que por
definición no puede viajar al navegador — quien lo tenga puede firmar un
cobro por el monto que se le antoje. Por eso el checkout aparece
deshabilitado con un aviso en la demo.

El workflow hace tres cosas particulares:

1. `rm -rf src/app/api src/app/checkout/resultado` — Next se niega a
   exportar a estático si hay rutas de servidor. Se borran solo en la copia
   desechable del runner; en tu repo siguen intactas.
2. `NEXT_PUBLIC_BASE_PATH=/tienda-cuero` — en Pages el sitio cuelga de un
   subdirectorio. Next reescribe los `<Link>` solo, pero las rutas de
   imágenes escritas a mano no, y por eso existe `src/lib/asset.ts`.
3. `NEXT_PUBLIC_DEMO_MODE=true` — apaga el botón de pagar y muestra el
   aviso.

Para probar ese build en tu máquina:

```bash
mv src/app/api /tmp/ && mv src/app/checkout/resultado /tmp/
BUILD_TARGET=pages NEXT_PUBLIC_BASE_PATH=/tienda-cuero \
  NEXT_PUBLIC_DEMO_MODE=true npm run build
mv /tmp/api src/app/ && mv /tmp/resultado src/app/checkout/
```

El resultado queda en `out/`.

> GitHub Pages en repositorios **privados** requiere un plan de pago
> (GitHub Pro o superior). Con el plan gratuito hay que hacer el repo
> público para publicar la demo.

## 8. Comprobaciones automáticas

`.github/workflows/ci.yml` corre en cada push: lint, tipos, pruebas y build.

Las pruebas (`npm test`, en `src/lib/wompi.test.ts`) validan las firmas de
Wompi contra el ejemplo publicado en su documentación, e incluyen los casos
en que alguien manipula el monto o el estado de un webhook. Si se ponen
rojas, no despliegues: es lo único que separa tu tienda de un cobro falso.
