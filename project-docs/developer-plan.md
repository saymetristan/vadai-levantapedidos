A-continuación tienes **todo** lo que necesitará cualquier IA pair-programmer (Copilot, Cursor, etc.) para entender el contexto de *Levantapedidos*, el objetivo del MVP y los pasos exactos para dejarlo funcionando, sin asumir que conozca nada previo.

---

## 0. Contexto resumido en una línea

*Levantapedidos* es una app full-stack (Astro + Svelte + Tailwind en el front, Deno + TypeScript en el back, monorepo Turborepo/pnpm) que **toma ventas históricas desde un API externo, calcula un “pedido sugerido” por cliente/producto (promedio por mes ponderado por stock) y lo muestra en la UI con opción de exportar a PDF**.

---

## 1. Especificación funcional del MVP

| Paso             | Actores                | Descripción                                                                                                                                                               |
| ---------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Selección     | **Usuario interno**    | Rellena un formulario con **ID de cliente** y **rango de fechas** (p.ej. *2025-01-01 → 2025-03-31*).                                                                      |
| 2. Fetch         | **Backend Deno**       | Hace **POST** a `https://nodejsback.dominiodz.com/sconsultas/procedimientogen2` con el body requerido (empresa, token, procedimiento, etc.) y obtiene la lista de ventas. |
| 3. Cálculo       | **Backend**            | Agrupa por `clave` (SKU), calcula: ① *promedio mensual de `cantidad`* dentro del rango, ② *subtotal = promedio × precio*, ③ *flag de stock* (`existencia` > 0?).          |
| 4. Respuesta API | **Backend**            | Devuelve JSON **normalizado** listo para tabla: `[{ sku, descripcion, avgQty, precio, subtotal, existencia }]`.                                                           |
| 5. UI render     | **Frontend**           | Muestra tabla editable (Shadcn `DataTable`) con totales y botón **“Exportar PDF”**.                                                                                       |
| 6. Export PDF    | **Frontend o Backend** | Genera un PDF (html2pdf.js en front ó `deno-pdf` en back) y lo descarga.                                                                                                  |

> **Por ahora NO** se persiste nada ni se envían los pedidos al cliente.

---

## 2. Arquitectura técnica (monorepo)

```
levantapedidos/
├── apps/
│   ├── frontend/              # Astro + Svelte + Shadcn
│   │   ├── src/pages/
│   │   │   └── index.astro    # Formulario + tabla
│   │   ├── src/components/
│   │   │   ├── OrderForm.svelte
│   │   │   ├── OrdersTable.svelte
│   │   │   └── PdfButton.svelte
│   ├── backend/               # Deno runtime
│   │   ├── src/
│   │   │   ├── main.ts        # HTTP server & router
│   │   │   └── routes/
│   │   │       └── salesSummary.ts
└── turbo.json
```

---

## 3. Contratos de datos

```ts
/* ===== BACKEND types ===== */
export interface ExternalSale {
  fecha: string;          // ISO
  clave: string;          // SKU
  descripcion: string;
  cantidad: number;
  precio: number;
  existencia: number;
}

export interface OrderSuggestion {
  sku: string;
  descripcion: string;
  avgQty: number;         // promedio redondeado
  precio: number;
  subtotal: number;       // avgQty * precio
  existencia: number;
}

/* ===== FRONTEND stores ===== */
interface FormState {
  clientId: string;
  dateFrom: string;       // YYYY-MM-DD
  dateTo: string;         // YYYY-MM-DD
}

interface UiOrderRow extends OrderSuggestion {
  qty: number;            // editable: default = avgQty
}
```

---

## 4. End-to-end flujo con snippets

### 4.1. Backend — `src/routes/salesSummary.ts`

```ts
import { calculateSuggestions } from "../utils/calc.ts";
import { fetchSales } from "../utils/dominiodzApi.ts";

export async function salesSummary(req: Request): Promise<Response> {
  const { clientId, dateFrom, dateTo } = await req.json();
  if (!clientId || !dateFrom || !dateTo) {
    return new Response("Missing params", { status: 400 });
  }

  // 1) Call external API
  const sales = await fetchSales({ clientId, dateFrom, dateTo });

  // 2) Compute averages
  const summary = calculateSuggestions(sales);

  return Response.json(summary);
}
```

#### 4.1.1. Utilidades

```ts
/* utils/dominiodzApi.ts */
const ENDPOINT =
  "https://nodejsback.dominiodz.com/sconsultas/procedimientogen2";

export async function fetchSales({
  clientId,
  dateFrom,
  dateTo,
}: { clientId: string; dateFrom: string; dateTo: string }) {
  const body = {
    empresa: "CONTI",
    usuario: "consultas",
    token: Deno.env.get("DOMINIO_TOKEN"),
    cusert: "CUSERT",
    procedimiento: "apiconsultas",
    paramjs: {
      cliente: clientId,
      fecha1: dateFrom,
      fecha2: dateTo,
    },
    paramjs2: {
      opcion: "ventaxclientexperiodo",
      guser: "conti",
      token: Deno.env.get("DOMINIO_TOKEN"),
    },
  };

  const resp = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) throw new Error(`DominioDZ API ${resp.status}`);
  return (await resp.json()) as ExternalSale[];
}

/* utils/calc.ts */
export function calculateSuggestions(sales: ExternalSale[]): OrderSuggestion[] {
  const map = new Map<string, OrderSuggestion>();

  for (const s of sales) {
    const key = s.clave;
    const entry = map.get(key) ??
      {
        sku: key,
        descripcion: s.descripcion,
        precio: s.precio,
        existencia: s.existencia,
        qtyTotal: 0,
        months: new Set<string>(),
      };

    entry.qtyTotal += s.cantidad;
    entry.months.add(s.fecha.slice(0, 7)); // "YYYY-MM"
    map.set(key, entry);
  }

  return Array.from(map.values()).map((e) => {
    const avg = Math.round(e.qtyTotal / e.months.size);
    return {
      sku: e.sku,
      descripcion: e.descripcion,
      precio: e.precio,
      existencia: e.existencia,
      avgQty: avg,
      subtotal: +(avg * e.precio).toFixed(2),
    };
  });
}
```

### 4.2. Frontend — `pages/index.astro`

```astro
---
import OrderForm from "@/components/OrderForm.svelte";
import OrdersTable from "@/components/OrdersTable.svelte";
import PdfButton from "@/components/PdfButton.svelte";
---

<OrderForm let:summary>
  <OrdersTable {summary} let:getCurrentRows>
    <PdfButton on:click={() => downloadPdf(getCurrentRows())}/>
  </OrdersTable>
</OrderForm>
```

### 4.3. Frontend — `OrderForm.svelte`

```svelte
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  let clientId = "", dateFrom = "", dateTo = "";
  async function submit() {
    const r = await fetch("/api/sales-summary", {
      method: "POST",
      body: JSON.stringify({ clientId, dateFrom, dateTo }),
    });
    dispatch("summary", await r.json());
  }
</script>

<form on:submit|preventDefault={submit} class="space-y-4">
  <!-- inputs -->
  <button class="btn btn-primary w-full">Generar pedido sugerido</button>
</form>
<slot summary />
```

### 4.4. Generar PDF (lado front)

```svelte
// PdfButton.svelte
<script>
  export let onClick;
</script>
<button class="btn btn-secondary" on:click={onClick}>
  Exportar PDF
</button>
```

```ts
// utils/pdf.ts (frontend)
import html2pdf from "html2pdf.js";
export function downloadPdf(rows: UiOrderRow[]) {
  const tableHtml = buildHtmlTable(rows); // simple string builder
  html2pdf().set({ margin: 10, filename: "pedido.pdf" }).from(tableHtml).save();
}
```

---

## 5. cURLs de referencia

### 5.1. Externo (DominioDZ)

```bash
curl -X POST https://nodejsback.dominiodz.com/sconsultas/procedimientogen2 \
  -H "Content-Type: application/json" \
  -d '{
    "empresa": "CONTI",
    "usuario": "consultas",
    "token": "YOUR_TOKEN",
    "cusert": "CUSERT",
    "procedimiento": "apiconsultas",
    "paramjs": {
      "cliente": "006250",
      "fecha1": "2025-03-01",
      "fecha2": "2025-03-31"
    },
    "paramjs2": {
      "opcion": "ventaxclientexperiodo",
      "guser": "conti",
      "token": "YOUR_TOKEN"
    }
  }'
```

### 5.2. Interno (tu backend)

```bash
curl -X POST http://localhost:8000/api/sales-summary \
  -H "Content-Type: application/json" \
  -d '{"clientId":"006250","dateFrom":"2025-01-01","dateTo":"2025-03-31"}'
```