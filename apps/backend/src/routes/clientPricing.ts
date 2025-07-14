import { fetchClientPricing } from '../utils/dominiodzApi.ts';

export async function handleClientPricing(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { clientId } = await req.json();

    if (!clientId || typeof clientId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Cliente ID requerido' }),
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

    console.log('💰 Obteniendo precios específicos del cliente:', clientId);
    
    const pricing = await fetchClientPricing(clientId);
    
    console.log(`✅ Encontrados ${pricing.length} productos con precios específicos para cliente ${clientId}`);

    return new Response(JSON.stringify(pricing), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo precios del cliente:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Error al consultar precios del cliente',
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