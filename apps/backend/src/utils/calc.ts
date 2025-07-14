import type { ExternalSale, OrderSuggestion, OrderSummary } from '../types.ts';

interface AggregatedSale {
  sku: string;
  descripcion: string;
  precio: number;
  existencia: number;
  qtyTotal: number;
  months: Set<string>;
}

interface CalculationData {
  last3MonthsSales: ExternalSale[];
  sameMonthLastYearSales: ExternalSale[];
  currentMonthSales?: ExternalSale[]; // Ventas del mes actual
  clientPricing?: any[]; // Precios específicos del cliente
}

export function calculateSuggestions(
  targetMonth: number,
  targetYear: number,
  data: CalculationData
): OrderSummary {
  const { last3MonthsSales, sameMonthLastYearSales, currentMonthSales = [], clientPricing } = data;

  // Crear un mapa de precios específicos del cliente para búsqueda rápida
  const clientPriceMap = new Map<string, any>();
  if (clientPricing && Array.isArray(clientPricing)) {
    for (const item of clientPricing) {
      // Asumiendo que el item tiene una clave/sku, ajustar según la estructura real
      const sku = item.clave || item.sku || item.codigo;
      if (sku) {
        clientPriceMap.set(sku, item);
      }
    }
    console.log(`💰 Cargados ${clientPriceMap.size} precios específicos del cliente`);
  }

  // Calcular promedios de los últimos 3 meses
  const last3MonthsAverages = calculatePeriodAverages(last3MonthsSales);
  
  // Calcular promedios del mismo mes año pasado + 3 anteriores
  const sameMonthLastYearAverages = calculatePeriodAverages(sameMonthLastYearSales);

  // Calcular acumulado del mes actual
  const currentMonthTotals = calculateCurrentMonthTotals(currentMonthSales);

  // Combinar todos los SKUs únicos
  const allSkus = new Set([
    ...Object.keys(last3MonthsAverages),
    ...Object.keys(sameMonthLastYearAverages),
    ...Object.keys(currentMonthTotals)
  ]);

  const suggestions: OrderSuggestion[] = [];

  for (const sku of allSkus) {
    const last3Avg = last3MonthsAverages[sku];
    const sameMonthLastYearAvg = sameMonthLastYearAverages[sku];

    // Usar los datos del período más reciente para info del producto
    const productInfo = last3Avg || sameMonthLastYearAvg;
    if (!productInfo) continue;

    const avgLast3Months = last3Avg ? last3Avg.avgQty : 0;
    const avgSameMonthLastYear = sameMonthLastYearAvg ? sameMonthLastYearAvg.avgQty : 0;
    const acumuladoMesActual = currentMonthTotals[sku] || 0;

    // Cantidad sugerida es el mayor de los dos promedios
    let cantidadSugerida = Math.max(avgLast3Months, avgSameMonthLastYear);

    // Ajustar por stock disponible
    if (productInfo.existencia === 0) {
      cantidadSugerida = 0;
    } else if (productInfo.existencia < cantidadSugerida) {
      cantidadSugerida = productInfo.existencia;
    }

    // Usar precio específico del cliente si está disponible, sino usar precio histórico
    const clientPriceInfo = clientPriceMap.get(sku);
    const finalPrice = clientPriceInfo?.precio || clientPriceInfo?.price || productInfo.precio;
    const hasClientPrice = !!clientPriceInfo && (clientPriceInfo.precio !== undefined || clientPriceInfo.price !== undefined);
    
    console.log(`📊 SKU ${sku}: precio histórico ${productInfo.precio}, precio cliente ${clientPriceInfo?.precio || 'N/A'}, precio final ${finalPrice}, es precio cliente: ${hasClientPrice}`);

    suggestions.push({
      sku,
      descripcion: productInfo.descripcion,
      avgLast3Months,
      avgSameMonthLastYear,
      acumuladoMesActual,
      cantidadSugerida,
      precio: finalPrice,
      subtotal: +(cantidadSugerida * finalPrice).toFixed(2),
      existencia: productInfo.existencia,
      hasClientPrice,
    });
  }

  // Ordenar por subtotal descendente
  const sortedSuggestions = suggestions.sort((a, b) => b.subtotal - a.subtotal);

  // Calcular resumen
  const totalItems = sortedSuggestions.reduce((sum, s) => sum + s.cantidadSugerida, 0);
  const totalValue = sortedSuggestions.reduce((sum, s) => sum + s.subtotal, 0);
  const totalProducts = sortedSuggestions.length;
  const totalAcumuladoMesActual = sortedSuggestions.reduce((sum, s) => sum + s.acumuladoMesActual, 0);
  
  // Calcular valor del acumulado usando precios actuales
  const totalValueAcumuladoMesActual = sortedSuggestions.reduce((sum, s) => 
    sum + (s.acumuladoMesActual * s.precio), 0);

  return {
    suggestions: sortedSuggestions,
    summary: {
      totalItems,
      totalValue,
      totalProducts,
      totalAcumuladoMesActual,
      totalValueAcumuladoMesActual
    },
    month: targetMonth,
    year: targetYear
  };
}

function calculatePeriodAverages(sales: ExternalSale[]): Record<string, AggregatedSale & { avgQty: number }> {
  if (!sales || sales.length === 0) {
    return {};
  }

  const map = new Map<string, AggregatedSale>();

  // Agrupar ventas por SKU
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

  // Calcular promedios
  const result: Record<string, AggregatedSale & { avgQty: number }> = {};
  
  for (const [sku, entry] of map.entries()) {
    const monthsCount = entry.months.size;
    const avgQty = monthsCount > 0 ? Math.round(entry.qtyTotal / monthsCount) : 0;
    
    result[sku] = {
      ...entry,
      avgQty,
    };
  }

  return result;
}

function calculateCurrentMonthTotals(sales: ExternalSale[]): Record<string, number> {
  if (!sales || sales.length === 0) {
    return {};
  }

  const totals: Record<string, number> = {};

  for (const sale of sales) {
    const sku = sale.clave;
    totals[sku] = (totals[sku] || 0) + sale.cantidad;
  }

  return totals;
} 