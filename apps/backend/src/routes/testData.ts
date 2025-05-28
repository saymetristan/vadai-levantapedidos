import type { ExternalSale } from '@/types.ts';

// Mock data for testing
const mockSalesData: ExternalSale[] = [
  {
    fecha: '2025-01-15',
    clave: 'PROD001',
    descripcion: 'Producto de prueba 1',
    cantidad: 10,
    precio: 25.50,
    existencia: 100
  },
  {
    fecha: '2025-02-15',
    clave: 'PROD001',
    descripcion: 'Producto de prueba 1',
    cantidad: 15,
    precio: 25.50,
    existencia: 100
  },
  {
    fecha: '2025-03-15',
    clave: 'PROD001',
    descripcion: 'Producto de prueba 1',
    cantidad: 8,
    precio: 25.50,
    existencia: 100
  },
  {
    fecha: '2025-01-20',
    clave: 'PROD002',
    descripcion: 'Producto de prueba 2',
    cantidad: 5,
    precio: 45.00,
    existencia: 0
  },
  {
    fecha: '2025-02-20',
    clave: 'PROD002',
    descripcion: 'Producto de prueba 2',
    cantidad: 7,
    precio: 45.00,
    existencia: 0
  },
  {
    fecha: '2025-01-10',
    clave: 'PROD003',
    descripcion: 'Producto de prueba 3',
    cantidad: 20,
    precio: 12.75,
    existencia: 50
  },
  {
    fecha: '2025-02-10',
    clave: 'PROD003',
    descripcion: 'Producto de prueba 3',
    cantidad: 25,
    precio: 12.75,
    existencia: 50
  },
  {
    fecha: '2025-03-10',
    clave: 'PROD003',
    descripcion: 'Producto de prueba 3',
    cantidad: 18,
    precio: 12.75,
    existencia: 50
  }
];

export async function testData(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify(mockSalesData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
} 