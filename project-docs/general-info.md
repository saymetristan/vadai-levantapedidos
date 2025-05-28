# Levantapedidos – Documento de Información General

> **Propósito de este documento**
>
> Proveer una visión holística del proyecto **Levantapedidos**: objetivos de negocio, alcance funcional completo (actual + futuro), decisiones tecnológicas, flujos de datos, actores, requisitos no‑funcionales y plan de evolución. No contiene código; se centra en la lógica, para que cualquier stakeholder (producto, ingeniería, comercial) comparta un entendimiento común.

---

## 1. Visión

Levantapedidos será la plataforma SaaS que simplifica el *auto‑levantamiento* de pedidos B2B recurrentes. Su propuesta de valor clave es **anticipar las necesidades de compra del cliente** y reducir el ciclo cotización → pedido a un par de clics. A largo plazo se convertirá en un **orquestador de ventas repetitivas** con IA para pronósticos, pricing dinámico y comunicación omnicanal.

### 1.1 Objetivos estratégicos

| Nº | Objetivo                                            | Métrica North Star                                 |
| -- | --------------------------------------------------- | -------------------------------------------------- |
| O1 | Elevar la **tasa de re‑orden** de clientes actuales | % de pedidos confirmados sobre pedidos sugeridos   |
| O2 | Reducir **tiempo promedio de cierre**               | Horas desde envío de sugerencia hasta confirmación |
| O3 | Incrementar **ticket promedio** vía upsell          | ARPU clientes recurrentes                          |
| O4 | Escalar sin fricción a nuevos nichos/ERPs           | Tiempo de onboarding < 7 días                      |

---

## 2. Alcance funcional (visión completa)

### 2.1 MVP (fase actual)

1. **Form Interno** – usuario back‑office elige *ID de cliente* y rango de fechas.
2. **Fetch ventas históricas** via API DominioDZ (o conector equivalente).
3. **Cálculo de pedido sugerido** (promedio mensual ponderado por número de meses + validación de existencia).
4. **UI tabla editable** con totales y exportación a PDF.

### 2.2 Próximas fases (roadmap)

| Fase | Capacidad nueva                                                       | Beneficio                                  |
| ---- | --------------------------------------------------------------------- | ------------------------------------------ |
| 2    | **Persistencia + Historias** de pedidos (Supabase)                    | Trazabilidad y reportes                    |
| 3    | **Portal Cliente** con login mágico + vista *“Confirme/Edite pedido”* | Self‑service, reduce fricción              |
| 4    | **Webhook ERP** para insertar pedido confirmado                       | Cero captura manual                        |
| 5    | **Motor de precios** (reglas + IA)                                    | Margen optimizado, descuentos inteligentes |
| 6    | **Recomendaciones ML** (modelo RFM + LightGBM)                        | Mayor precisión y upsell                   |
| 7    | **Notificación omnicanal** (WhatsApp via Whaapy, email, SMS fallback) | Cobertura > 95 %                           |
| 8    | **Multitenancy & Marca blanca**                                       | Monetización SaaS, reseller friendly       |
| 9    | **Marketplace de conectores** (ERP, CRM, WMS)                         | Onboarding en horas                        |

---

## 3. Actores y casos de uso

| Actor                                    | Rol                        | Casos de uso principales                                                        |
| ---------------------------------------- | -------------------------- | ------------------------------------------------------------------------------- |
| **Usuario interno** (ventas/operaciones) | Gestiona sugerencias       | 1. Generar sugerencia 2. Editar cantidades 3. Exportar PDF 4. Enviar al cliente |
| **Cliente final**                        | Recibe propuesta, confirma | 1. Ver pedido sugerido 2. Ajustar cantidades 3. Confirmar                       |
| **Sistema ERP**                          | Fuente/ destino            | 1. Proveer ventas e inventario 2. Recibir pedido confirmado                     |
| **Motor IA**                             | Servicio interno           | 1. Calcular promedios/forecast 2. Generar precio dinámico                       |

---

## 4. Flujo de datos (end‑to‑end)

```text
[Front‑office Form]
      │ POST /api/sales-summary
      ▼
[Backend Deno Router] ──> [Conector ERP API] ──> JSON ventas
      │                                ▲
      │ calcula sugerencia             │
      ▼                                │
[JSON respuesta] ◀──────────────────────┘
      ▼
[Tabla Svelte] → (edición) → Export PDF / Enviar pedido
```

### 4.1 Detalle de cálculo *Pedido Sugerido*

1. Agrupar ventas por `SKU`.
2. Determinar **número de meses distintos** en el rango.
3. Promedio = `Σ cantidad / meses` (redondeo entero).
4. Subtotal = `promedio × precio_unitario`.
5. Flag stock bajo si `existencia < promedio`.
6. Ordenar por mayor subtotal para resaltar ítems críticos.

---

## 5. Modelo de datos lógico

### 5.1 Entidades internas (post‑persistencia)

| Entidad           | Atributos clave                                           |
| ----------------- | --------------------------------------------------------- |
| `Client`          | id, nombre, contacto, canal\_notif                        |
| `Product`         | sku, descripción, precio\_std, unidad                     |
| `StockSnapshot`   | sku, fecha, existencia                                    |
| `Sale`            | sku, client\_id, fecha, cantidad, precio                  |
| `OrderSuggestion` | id, client\_id, rango\_fechas, json\_detalle, estado      |
| `Order`           | id, client\_id, fecha\_confirmación, json\_detalle, total |

*(En el MVP solo existen en memoria; se persisten desde Fase 2).*

---

## 6. Requisitos no‑funcionales

| Categoría          | Requisito                                                                 |
| ------------------ | ------------------------------------------------------------------------- |
| **Rendimiento**    | Tiempo de generación de sugerencia < 3 s para 5 000 registros             |
| **Escalabilidad**  | Concurrencia 100 usuarios → uso Ram < 512 MB gracias a fetch‑on‑demand    |
| **Seguridad**      | Token ERP cifrado (env vars) ; CORS restrictivo ; JWT para portal cliente |
| **Disponibilidad** | SLA 99 % (Railway + CDN estático)                                         |
| **Observabilidad** | Logs request + latencia; alertas error rate > 5 %                         |
| **Portabilidad**   | Docker image única; IaC (Terraform + Fly.io opcional)                     |

---

## 7. Stack tecnológico

| Capa                | Selección                                                            | Razón                                      |
| ------------------- | -------------------------------------------------------------------- | ------------------------------------------ |
| Frontend            | **Astro 4 + Svelte 4 + Shadcn‑Svelte + Tailwind**                    | SSR/SSG híbrido, DX rápida, UI consistente |
| Backend             | **Deno runtime (std/http)**                                          | TypeScript nativo, seguridad por permisos  |
| Workflow            | **Turborepo + pnpm**                                                 | Builds paralelos, monorepo manage          |
| Persistencia futura | **Supabase Postgres**                                                | SQL, Realtime y Auth integrados            |
| IA/ML               | **Python micro‑svc o Deno FFI** (LightGBM)                           | Modelos tabulares rápidos                  |
| PDF                 | **html2pdf.js** en front (MVP) • migrable a server side (`deno-pdf`) |                                            |
| Notificaciones      | **Whaapy** (WhatsApp BaaS) + SMTP + Twilio SMS                       |                                            |

---

## 8. Roadmap de implementación (alto nivel)

1. **Fase 0 – Onboarding datos** (en curso)
2. **Fase 1 – MVP tabla + PDF** (4‑6 sem)
3. **Fase 2 – Persistencia Supabase** (2 sem)
4. **Fase 3 – Portal Cliente + Auth** (4 sem)
5. **Fase 4 – Webhook ERP + WhatsApp** (3 sem)
6. **Fase 5 – IA Pricing + Forecast** (6 sem)
7. **Fase 6 – Multitenancy SaaS + Marketplace** (continuo)

---

## 9. Métricas iniciales a instrumentar

* **% Aceptación pedido sugerido**.
* **Tiempo medio confirmación**.
* **Subtotal incremental (upsell)**.
* **Errores API DominioDZ por 1000 llamadas**.
* **Duración generación PDF**.

---

## 10. Riesgos y mitigaciones

| Riesgo                           | Impacto                     | Mitigación                                          |
| -------------------------------- | --------------------------- | --------------------------------------------------- |
| Inestabilidad API ERP externa    | Fallo generación sugerencia | Retries con backoff + cache local 1 h               |
| Conversión cliente final baja    | Menor ROI                   | UX simplificada, notificaciones recordatorio        |
| Crecimiento de catálogos grandes | Latencia alta               | Fetch paginado, stream processing                   |
| Cumplimiento WhatsApp Business   | Bloqueo canal               | Partner oficial (Whaapy) y plantillas pre‑aprobadas |

---

## 11. Glosario rápido

* **Pedido sugerido**: Lista de productos y cantidades calculada por IA/heurística para cada cliente.
* **ERP**: Sistema de planificación de recursos empresariales que almacena ventas e inventario.
* **Upsell**: Incremento del valor del pedido mediante recomendaciones.
* **RFM**: *Recency, Frequency, Monetary*; metodología de segmentación de clientes.

---

> **Estado del documento:** v0.1 – 27 May 2025. Se actualizará tras el cierre de cada fase.
