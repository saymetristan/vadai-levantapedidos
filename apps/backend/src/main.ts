import { serve } from "std/http/server.ts";
import { salesSummary } from '@/routes/salesSummary.ts';

// Configuración básica
const PORT = parseInt(Deno.env.get('PORT') || '8001');

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
console.log(`🔑 Environment: ${Deno.env.get('DENO_ENV') || 'development'}`);

await serve(withLogging, { port: PORT }); 