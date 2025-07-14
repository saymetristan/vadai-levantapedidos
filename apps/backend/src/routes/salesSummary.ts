import { calculateSuggestions } from '../utils/calc.ts';
import { fetchSalesByDateRange, getDateRangesForCalculation, fetchClientPricing } from '../utils/dominiodzApi.ts';
import type { SalesQueryParams, ExternalSale } from '../types.ts';

// Mock data for testing (comentado para producción)
/*
const mockSalesData: ExternalSale[] = [
  {
    fecha: '2025-01-15',
    clave: 'PROD001',
    descripcion: 'Producto de prueba 1',
    cantidad: 10,
    precio: 25.50,
    existencia: 100
  },
  // ... resto de datos mock
];
*/

export async function salesSummary(req: Request): Promise<Response> {
  try {
    // Only allow POST method
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    let body: SalesQueryParams;
    try {
      body = await req.json();
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { clientId, month, year } = body;

    // Validate required parameters
    if (!clientId || !month || !year) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: clientId, month, year' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate month and year
    if (month < 1 || month > 12 || year < 2000 || year > 2030) {
      return new Response(JSON.stringify({ 
        error: 'Invalid month (1-12) or year (2000-2030)' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Generating suggestions for client ${clientId}, month ${month}/${year}`);

    // Get date ranges for both periods
    const { last3Months, sameMonthLastYear } = getDateRangesForCalculation(month, year);

    // Fetch sales data for last 3 months
    const last3MonthsSales: ExternalSale[] = [];
    for (const range of last3Months) {
      try {
        const sales = await fetchSalesByDateRange(clientId, range.dateFrom, range.dateTo);
        last3MonthsSales.push(...sales);
      } catch (error) {
        console.warn(`Failed to fetch data for range ${range.dateFrom} to ${range.dateTo}:`, error);
      }
    }

    // Fetch sales data for same month last year + 3 previous months
    const sameMonthLastYearSales: ExternalSale[] = [];
    for (const range of sameMonthLastYear) {
      try {
        const sales = await fetchSalesByDateRange(clientId, range.dateFrom, range.dateTo);
        sameMonthLastYearSales.push(...sales);
      } catch (error) {
        console.warn(`Failed to fetch data for range ${range.dateFrom} to ${range.dateTo}:`, error);
      }
    }

    // Fetch sales data for current month (mes actual)
    const currentDate = new Date();
    const currentMonthStart = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-01`;
    const currentMonthEnd = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
    
    let currentMonthSales: ExternalSale[] = [];
    try {
      console.log(`📅 Obteniendo ventas del mes actual: ${currentMonthStart} a ${currentMonthEnd}`);
      currentMonthSales = await fetchSalesByDateRange(clientId, currentMonthStart, currentMonthEnd);
      console.log(`✅ Obtenidas ${currentMonthSales.length} ventas del mes actual`);
    } catch (error) {
      console.warn('⚠️ No se pudieron obtener ventas del mes actual:', error);
    }

    console.log(`Fetched ${last3MonthsSales.length} sales from last 3 months`);
    console.log(`Fetched ${sameMonthLastYearSales.length} sales from same month last year period`);
    console.log(`Fetched ${currentMonthSales.length} sales from current month`);

    // Fetch client-specific pricing
    let clientPricing: any[] = [];
    try {
      console.log('💰 Obteniendo precios específicos del cliente...');
      clientPricing = await fetchClientPricing(clientId);
      console.log(`✅ Obtenidos ${clientPricing.length} precios específicos del cliente`);
    } catch (error) {
      console.warn('⚠️ No se pudieron obtener precios específicos del cliente, usando precios históricos:', error);
    }

    // Calculate suggestions with client pricing and current month data
    const summary = calculateSuggestions(month, year, {
      last3MonthsSales,
      sameMonthLastYearSales,
      currentMonthSales,
      clientPricing
    });

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error in salesSummary:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: (error as Error).message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 