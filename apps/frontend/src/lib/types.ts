// Frontend types based on backend contract

export interface OrderSuggestion {
  sku: string;
  descripcion: string;
  avgQty: number;
  precio: number;
  subtotal: number;
  existencia: number;
}

export interface FormState {
  clientId: string;
  dateFrom: string;       // YYYY-MM-DD
  dateTo: string;         // YYYY-MM-DD
}

export interface UiOrderRow extends OrderSuggestion {
  qty: number;            // editable: default = avgQty
}

export interface ApiError {
  error: string;
  message?: string;
} 