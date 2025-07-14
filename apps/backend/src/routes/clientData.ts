import { fetchClientData } from '../utils/dominiodzApi.ts';
import type { ClientData } from '../types.ts';

export async function handleClientData(req: Request): Promise<Response> {
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

    // Consultar datos reales del cliente
    const clientData = await fetchClientData(clientId);

    // Log temporal para debugging - ver estructura real de la respuesta
    console.log('📋 Respuesta completa de la API:', JSON.stringify(clientData, null, 2));

    // Verificar que la respuesta tenga datos válidos
    if (!clientData || typeof clientData !== 'object') {
      return new Response(
        JSON.stringify({ 
          error: 'Cliente no encontrado',
          details: 'No se encontraron datos para el cliente especificado'
        }),
        { 
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    return new Response(JSON.stringify(clientData), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error in handleClientData:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error al consultar datos del cliente',
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