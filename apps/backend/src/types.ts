// Types for external API and internal data structures

export interface ExternalSale {
  fecha: string;          // ISO
  clave: string;          // SKU
  descripcion: string;
  cantidad: number;
  precio: number;
  existencia: number;
}

export interface ClientData {
  clave: string;          // ID del cliente
  nombre: string;         // Nombre del cliente
  precios: string;        // Tipo de precio (ej: "PRECIO2")
  descuento: number;      // Descuento aplicable
}

export interface OrderSuggestion {
  sku: string;
  descripcion: string;
  avgLast3Months: number;     // promedio 3 meses anteriores
  avgSameMonthLastYear: number; // promedio mismo mes año pasado + 3 anteriores
  acumuladoMesActual: number; // total comprado en el mes actual
  cantidadSugerida: number;   // mayor de los dos promedios, ajustado por stock
  precio: number;
  subtotal: number;           // cantidadSugerida * precio
  existencia: number;
  hasClientPrice?: boolean;   // true si se está usando precio específico del cliente
}

export interface SalesQueryParams {
  clientId: string;
  month: number;              // 1-12
  year: number;               // e.g. 2025
}

export interface OrderSummary {
  suggestions: OrderSuggestion[];
  summary: {
    totalItems: number;           // total de unidades sugeridas
    totalValue: number;           // valor total del pedido sugerido
    totalProducts: number;        // número de productos únicos
    totalAcumuladoMesActual: number;  // total acumulado comprado en el mes actual
    totalValueAcumuladoMesActual: number;  // valor total del acumulado del mes actual
  };
  month: number;
  year: number;
} 