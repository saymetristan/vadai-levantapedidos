import type { ExternalSale, OrderSuggestion } from '@/types.ts';

interface AggregatedSale {
  sku: string;
  descripcion: string;
  precio: number;
  existencia: number;
  qtyTotal: number;
  months: Set<string>;
}

export function calculateSuggestions(sales: ExternalSale[]): OrderSuggestion[] {
  if (!sales || sales.length === 0) {
    return [];
  }

  const map = new Map<string, AggregatedSale>();

  // Aggregate sales by SKU
  for (const sale of sales) {
    const key = sale.clave;
    
    const entry = map.get(key) ?? {
      sku: key,
      descripcion: sale.descripcion,
      precio: sale.precio,
      existencia: sale.existencia,
      qtyTotal: 0,
      months: new Set<string>(),
    };

    entry.qtyTotal += sale.cantidad;
    entry.months.add(sale.fecha.slice(0, 7)); // "YYYY-MM"
    map.set(key, entry);
  }

  // Calculate averages and create suggestions
  const suggestions = Array.from(map.values()).map((entry) => {
    const monthsCount = entry.months.size;
    const avg = monthsCount > 0 ? Math.round(entry.qtyTotal / monthsCount) : 0;
    
    return {
      sku: entry.sku,
      descripcion: entry.descripcion,
      precio: entry.precio,
      existencia: entry.existencia,
      avgQty: avg,
      subtotal: +(avg * entry.precio).toFixed(2),
    };
  });

  // Sort by subtotal descending to highlight high-value items
  return suggestions.sort((a, b) => b.subtotal - a.subtotal);
} 