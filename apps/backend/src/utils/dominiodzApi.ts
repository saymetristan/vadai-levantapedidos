import type { ExternalSale, SalesQueryParams } from '@/types.ts';

const ENDPOINT = 'https://nodejsback.dominiodz.com/sconsultas/procedimientogen2';

export async function fetchSales({
  clientId,
  dateFrom,
  dateTo,
}: SalesQueryParams): Promise<ExternalSale[]> {
  const body = {
    empresa: 'CONTI',
    usuario: 'consultas',
    token: Deno.env.get('DOMINIO_TOKEN'),
    cusert: 'CUSERT',
    procedimiento: 'apiconsultas',
    paramjs: {
      cliente: clientId,
      fecha1: dateFrom,
      fecha2: dateTo,
    },
    paramjs2: {
      opcion: 'ventaxclientexperiodo',
      guser: 'conti',
      token: Deno.env.get('DOMINIO_TOKEN'),
    },
  };

  try {
    const resp = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      throw new Error(`DominioDZ API error: ${resp.status} ${resp.statusText}`);
    }

    const data = await resp.json();
    
    // Validation: ensure it's an array
    if (!Array.isArray(data)) {
      console.warn('API returned non-array data:', data);
      return [];
    }

    return data as ExternalSale[];
  } catch (error) {
    console.error('Error fetching sales from DominioDZ:', error);
    throw new Error(`Failed to fetch sales data: ${error.message}`);
  }
} 