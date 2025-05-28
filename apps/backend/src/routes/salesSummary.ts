import { calculateSuggestions } from '@/utils/calc.ts';
import { fetchSales } from '@/utils/dominiodzApi.ts';
import type { SalesQueryParams, ExternalSale } from '@/types.ts';

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

    const { clientId, dateFrom, dateTo } = body;

    // Validate required parameters
    if (!clientId || !dateFrom || !dateTo) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: clientId, dateFrom, dateTo' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Basic date format validation
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateFrom) || !dateRegex.test(dateTo)) {
      return new Response(JSON.stringify({ 
        error: 'Date format must be YYYY-MM-DD' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1) Fetch sales from real API
    console.log(`Fetching sales for client ${clientId} from ${dateFrom} to ${dateTo}`);
    const sales = await fetchSales({ clientId, dateFrom, dateTo });

    // 2) Compute averages
    const summary = calculateSuggestions(sales);

    console.log(`Generated ${summary.length} order suggestions from ${sales.length} sales records`);

    // 3) Return response with CORS headers
    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('Error in salesSummary:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
} 