import { calculateSuggestions } from '../utils/calc.ts';
import { fetchSalesByDateRange, getDateRangesForCalculation, fetchClientPricing } from '../utils/dominiodzApi.ts';
import type { ExternalSale, OrderSummary } from '../types.ts';

export async function suggestedOrder(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { clientId } = body;

    if (!clientId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameter: clientId' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calcular mes y año siguiente
    const currentDate = new Date();
    let targetMonth = currentDate.getMonth() + 2; // +1 para mes actual, +1 más para siguiente
    let targetYear = currentDate.getFullYear();
    if (targetMonth > 12) {
      targetMonth = 1;
      targetYear += 1;
    }

    console.log(`Generando pedido sugerido para cliente ${clientId}, mes ${targetMonth}/${targetYear}`);

    const { last3Months, sameMonthLastYear } = getDateRangesForCalculation(targetMonth, targetYear);

    const last3MonthsSales: ExternalSale[] = [];
    for (const range of last3Months) {
      try {
        const sales = await fetchSalesByDateRange(clientId, range.dateFrom, range.dateTo);
        last3MonthsSales.push(...sales);
      } catch (error) {
        console.warn(`Failed to fetch data for range ${range.dateFrom} to ${range.dateTo}:`, error);
      }
    }

    const sameMonthLastYearSales: ExternalSale[] = [];
    for (const range of sameMonthLastYear) {
      try {
        const sales = await fetchSalesByDateRange(clientId, range.dateFrom, range.dateTo);
        sameMonthLastYearSales.push(...sales);
      } catch (error) {
        console.warn(`Failed to fetch data for range ${range.dateFrom} to ${range.dateTo}:`, error);
      }
    }

    const currentMonthStart = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-01`;
    const currentMonthEnd = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate().toString().padStart(2, '0')}`;
    
    let currentMonthSales: ExternalSale[] = [];
    try {
      currentMonthSales = await fetchSalesByDateRange(clientId, currentMonthStart, currentMonthEnd);
    } catch (error) {
      console.warn('No se pudieron obtener ventas del mes actual:', error);
    }

    let clientPricing: { precio?: number; price?: number; clave?: string; sku?: string; codigo?: string }[] = [];
    try {
      clientPricing = await fetchClientPricing(clientId);
    } catch (error) {
      console.warn('No se pudieron obtener precios específicos del cliente:', error);
    }

    const summary: OrderSummary = calculateSuggestions(targetMonth, targetYear, {
      last3MonthsSales,
      sameMonthLastYearSales,
      currentMonthSales,
      clientPricing
    });

    // Calcular métricas adicionales para el resumen como en la imagen
    const stockCount = summary.suggestions.filter(s => s.existencia > 0).length;
    const sinStockCount = summary.suggestions.filter(s => s.existencia === 0 && s.cantidadSugerida > 0).length;

    const responseSummary = {
      pedidoSugeridoUnits: summary.summary.totalItems,
      pedidoSugeridoValue: summary.summary.totalValue,
      undsInicial: summary.summary.totalItems, // Asumiendo que es lo mismo, ajustar si es necesario
      valorMesActual: summary.summary.totalValueAcumuladoMesActual,
      stock: stockCount,
      sinStock: sinStockCount,
      totalProducts: summary.summary.totalProducts,
      month: targetMonth,
      year: targetYear
    };

    return new Response(JSON.stringify(responseSummary), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error in suggestedOrder:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: (error as Error).message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 