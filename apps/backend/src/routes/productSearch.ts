import { searchClientProducts } from '../utils/dominiodzApi.ts';

export async function handleProductSearch(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { clientId, searchTerm, limit } = await req.json();

    if (!clientId || typeof clientId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Cliente ID requerido' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Término de búsqueda requerido (mínimo 3 caracteres)' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Verificar que hay token configurado
    const token = globalThis.Deno?.env.get('DOMINIO_TOKEN');
    if (!token) {
      return new Response(
        JSON.stringify({ 
          error: 'Token de API no configurado. Contacta al administrador.',
          details: 'DOMINIO_TOKEN environment variable is required'
        }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    console.log(`🔍 Búsqueda de productos para cliente ${clientId}: "${searchTerm}"`);
    
    const products = await searchClientProducts(clientId, searchTerm, limit || 20);
    
    console.log(`✅ Encontrados ${products.length} productos para "${searchTerm}"`);

    return new Response(JSON.stringify(products), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('❌ Error en búsqueda de productos:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Error al buscar productos',
        details: (error as Error).message 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
} 