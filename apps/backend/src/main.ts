import { serve } from "std/http/server.ts";
import { salesSummary } from './routes/salesSummary.ts';
import { handleClientData } from './routes/clientData.ts';
import { handleClientPricing } from './routes/clientPricing.ts';
import { handleProductSearch } from './routes/productSearch.ts';
import { suggestedOrder } from './routes/suggestedOrder.ts';

// Cargar variables de entorno desde .env si existe
try {
  // @ts-ignore
  const envText = await Deno.readTextFile('.env');
  const envLines = envText.split('\n');
  
  for (const line of envLines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=');
        // @ts-ignore
        Deno.env.set(key.trim(), value.trim());
      }
    }
  }
  // @ts-ignore
  console.log('✅ Variables de entorno cargadas desde .env');
} catch {
  // @ts-ignore
  console.log('ℹ️  Archivo .env no encontrado, usando variables del sistema');
}

// Configuración básica
const PORT = parseInt(Deno.env.get('PORT') || '8000');

// CORS handler
function handleCORS(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  return null;
}

// Middleware de logging
const withLogging = async (req: Request): Promise<Response> => {
  const start = Date.now();
  
  // Handle CORS preflight
  const corsResponse = handleCORS(req);
  if (corsResponse) {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${ms}ms (CORS preflight)`);
    return corsResponse;
  }
  
  const response = await handleRequest(req);
  const ms = Date.now() - start;
  console.log(`${req.method} ${req.url} - ${response.status} - ${ms}ms`);
  return response;
};

// Manejador principal de requests
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  
  // Health check
  if (url.pathname === "/" && req.method === "GET") {
    return new Response(JSON.stringify({ 
      message: 'Levantapedidos API is running!',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }

  // Sales summary endpoint
  if (url.pathname === "/api/sales-summary") {
    return await salesSummary(req);
  }

  // Client data endpoint
  if (url.pathname === "/api/client-data") {
    return await handleClientData(req);
  }

  // Client pricing endpoint
  if (url.pathname === "/api/client-pricing") {
    return await handleClientPricing(req);
  }

  // Product search endpoint
  if (url.pathname === "/api/product-search") {
    return await handleProductSearch(req);
  }

  // Suggested order endpoint
  if (url.pathname === "/api/suggested-order") {
    return await suggestedOrder(req);
  }

  // 404 for any other route
  return new Response(JSON.stringify({ error: 'Not Found' }), { 
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// Iniciar el servidor
console.log(`🚀 Levantapedidos Backend starting...`);
console.log(`📍 Server running on http://localhost:${PORT}`);
// @ts-ignore
console.log(`🔑 Environment: ${Deno.env.get('DENO_ENV') || 'development'}`);

// Para ignorar errores de Deno en linter si persisten
// @ts-ignore
await serve(withLogging, { port: PORT }); 