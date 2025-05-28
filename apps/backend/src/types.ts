// Types for external API and internal data structures

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

export interface SalesQueryParams {
  clientId: string;
  dateFrom: string;       // YYYY-MM-DD
  dateTo: string;         // YYYY-MM-DD
} 