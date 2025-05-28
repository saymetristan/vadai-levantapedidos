# vadai-levantapedidos

Sistema inteligente de generación de pedidos sugeridos basado en análisis de ventas históricas.

## 🚀 Características del MVP

- **Análisis de ventas históricas**: Consume datos de ventas desde API externo
- **Cálculo inteligente**: Genera sugerencias basadas en promedios mensuales ponderados
- **Interfaz moderna**: UI responsive con Astro + Svelte + Tailwind CSS
- **Exportación PDF**: Genera reportes profesionales en PDF
- **Validación de stock**: Indica disponibilidad de productos
- **Edición en tiempo real**: Permite ajustar cantidades sugeridas

## 🏗️ Arquitectura

```
levantapedidos/
├── apps/
│   ├── backend/               # Deno + TypeScript
│   │   ├── src/
│   │   │   ├── main.ts        # Servidor HTTP
│   │   │   ├── types.ts       # Definiciones TypeScript
│   │   │   ├── routes/        # Endpoints API
│   │   │   └── utils/         # Utilidades (API externa, cálculos)
│   └── frontend/              # Astro + Svelte + Tailwind
│       ├── src/
│       │   ├── pages/         # Páginas Astro
│       │   ├── components/    # Componentes Svelte
│       │   └── lib/           # Utilidades y tipos
└── turbo.json                 # Configuración monorepo
```

## 🛠️ Tecnologías

### Backend
- **Deno**: Runtime moderno para TypeScript
- **TypeScript**: Tipado estático
- **HTTP Server**: Servidor nativo de Deno

### Frontend
- **Astro**: Framework de sitios estáticos
- **Svelte**: Framework reactivo
- **Tailwind CSS**: Framework de estilos
- **html2pdf.js**: Generación de PDFs

## 📋 Requisitos

- **Deno** 1.40+ (para backend)
- **Node.js** 18+ (para frontend)
- **pnpm** 8+ (gestor de paquetes)

## 🚀 Instalación y Uso

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd levantapedidos
```

### 2. Instalar dependencias
```bash
pnpm install
```

### 3. Configurar variables de entorno
```bash
# Backend
cd apps/backend
cp env.example .env
# Editar .env con tu token de DominioDZ
```

### 4. Iniciar el backend
```bash
cd apps/backend
DOMINIO_TOKEN=tu_token_aqui deno run --allow-net --allow-read --allow-env src/main.ts
```

### 5. Iniciar el frontend (en otra terminal)
```bash
cd apps/frontend
pnpm dev
```

### 6. Acceder a la aplicación
- Frontend: http://localhost:4321
- Backend API: http://localhost:8000

## 🔧 Uso de la Aplicación

### Generar Pedido Sugerido

1. **Completar formulario**:
   - ID Cliente (ej: 006250)
   - Fecha desde (YYYY-MM-DD)
   - Fecha hasta (YYYY-MM-DD)

2. **Hacer clic en "Generar Pedido Sugerido"**

3. **Revisar resultados**:
   - Tabla con productos sugeridos
   - Cantidades calculadas automáticamente
   - Precios y subtotales
   - Indicadores de stock

4. **Ajustar cantidades** (opcional):
   - Editar cantidades en la tabla
   - Los subtotales se actualizan automáticamente

5. **Exportar PDF**:
   - Hacer clic en "Exportar PDF"
   - Se descarga un reporte profesional

## 🧮 Algoritmo de Cálculo

El sistema calcula las sugerencias usando:

1. **Agrupación por SKU**: Agrupa todas las ventas por producto
2. **Promedio mensual**: Calcula el promedio de cantidad vendida por mes
3. **Redondeo**: Redondea a enteros para cantidades prácticas
4. **Ordenamiento**: Ordena por valor total (cantidad × precio) descendente
5. **Validación de stock**: Marca productos sin existencia

## 🔌 API Endpoints

### POST `/api/sales-summary`
Genera sugerencias de pedido basadas en ventas históricas.

**Request:**
```json
{
  "clientId": "006250",
  "dateFrom": "2025-01-01",
  "dateTo": "2025-03-31"
}
```

**Response:**
```json
[
  {
    "sku": "PROD001",
    "descripcion": "Producto ejemplo",
    "avgQty": 15,
    "precio": 25.50,
    "subtotal": 382.50,
    "existencia": 100
  }
]
```

### GET `/`
Health check del API.

## 🧪 Modo de Prueba

El MVP incluye datos de prueba para testing. Para usar datos reales:

1. Configurar `DOMINIO_TOKEN` en variables de entorno
2. Modificar `apps/backend/src/routes/salesSummary.ts`
3. Cambiar `mockSalesData` por `await fetchSales(...)`

## 🚀 Despliegue

### Backend (Deno Deploy)
```bash
cd apps/backend
deno deploy --project=tu-proyecto src/main.ts
```

### Frontend (Vercel)
```bash
cd apps/frontend
pnpm build
vercel --prod
```

## 📝 Próximas Funcionalidades

- [ ] Autenticación de usuarios
- [ ] Persistencia de pedidos
- [ ] Envío automático de pedidos
- [ ] Dashboard de analytics
- [ ] Configuración de algoritmos
- [ ] Integración con sistemas ERP

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

---

**Desarrollado con ❤️ para optimizar la gestión de inventarios**
