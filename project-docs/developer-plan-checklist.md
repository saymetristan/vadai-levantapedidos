### A. Back-end (Deno)

* [ ] Crear `apps/backend/src/main.ts` con servidor HTTP y router básico.
* [ ] Implementar ruta `POST /api/sales-summary` (ver snippet).
* [ ] Añadir utilidades `dominiodzApi.ts` y `calc.ts`.
* [ ] Guardar `DOMINIO_TOKEN` en variables de entorno (`.env`, `deno.json` permissions).
* [ ] Configurar CORS (`Access-Control-Allow-Origin: *`) para desarrollo.

### B. Front-end (Astro + Svelte)

* [ ] Crear `OrderForm.svelte`, `OrdersTable.svelte`, `PdfButton.svelte`.
* [ ] Consumir `/api/sales-summary` y poblar tabla.
* [ ] Implementar edición de cantidad en la tabla (binding a `qty`).
* [ ] Calcular subtotales y total general en la UI.
* [ ] Integrar `html2pdf.js` para exportación.
* [ ] Añadir estilos Shadcn + Tailwind tokens.

### C. Dev Ops / Monorepo

* [ ] Añadir script `apps/backend/deno.json` con permisos `--allow-env --allow-net`.
* [ ] Actualizar `turbo.json` (`backend#dev`, `backend#build`).
* [ ] Configurar `dev` script raíz (`turbo run dev`).
* [ ] Dockerfile opcional para despliegue (alpine + deno + static front dist).
* [ ] Pipeline Railway / Fly.io (env vars, ports).

### D. QA / Testing

* [ ] Pruebas unitarias de `calculateSuggestions` (Deno test).
* [ ] Mock fetch en front para estados “sin datos” y errores.
* [ ] Lint + Prettier (ya en monorepo).
* [ ] Lighthouse audit (>90 performance).

> Una vez todo lo anterior marque ✅, tendrás el MVP navegable en `/` que genera el pedido sugerido y lo baja en PDF, sin depender de base de datos ni flujo de aprobación.
