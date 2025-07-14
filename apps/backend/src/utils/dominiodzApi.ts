import type { ExternalSale, SalesQueryParams } from '../types.ts';

const ENDPOINT = 'https://nodejsback.dominiodz.com/sconsultas/procedimientogen2';

export async function fetchSales({
  clientId,
  month,
  year,
}: SalesQueryParams): Promise<ExternalSale[]> {
  // Para obtener datos del mes específico, usar el primer día del mes hasta el último
  const dateFrom = `${year}-${month.toString().padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const dateTo = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

  return await fetchSalesByDateRange(clientId, dateFrom, dateTo);
}

export async function fetchSalesByDateRange(
  clientId: string,
  dateFrom: string,
  dateTo: string
): Promise<ExternalSale[]> {
  const body = {
    empresa: 'CONTI',
    usuario: 'consultas',
    token: globalThis.Deno?.env.get('DOMINIO_TOKEN'),
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
      token: globalThis.Deno?.env.get('DOMINIO_TOKEN'),
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
    throw new Error(`Failed to fetch sales data: ${(error as Error).message}`);
  }
}

export async function fetchClientData(clientId: string): Promise<any> {
  const body = {
    empresa: 'CONTI',
    usuario: 'consultas',
    token: globalThis.Deno?.env.get('DOMINIO_TOKEN'),
    cusert: 'CUSERT',
    procedimiento: 'apiconsultas',
    paramjs: { cliente: clientId },
    paramjs2: {
      opcion: 'clientexclave',
      guser: 'conti',
      token: globalThis.Deno?.env.get('DOMINIO_TOKEN'),
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
    
    // Return the first client data if it's an array, or the data itself
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('Error fetching client data from DominioDZ:', error);
    throw new Error(`Failed to fetch client data: ${(error as Error).message}`);
  }
}

interface DateRange {
  dateFrom: string;
  dateTo: string;
}

// Utility functions for date calculations
export function getDateRangesForCalculation(month: number, year: number) {
  // Últimos 3 meses anteriores al mes objetivo
  const last3Months: DateRange[] = [];
  for (let i = 1; i <= 3; i++) {
    let targetMonth = month - i;
    let targetYear = year;
    
    if (targetMonth <= 0) {
      targetMonth += 12;
      targetYear -= 1;
    }
    
    const firstDay = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const lastDayStr = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    last3Months.push({ dateFrom: firstDay, dateTo: lastDayStr });
  }

  // Mismo mes del año pasado + 3 meses anteriores
  const sameMonthLastYear: DateRange[] = [];
  const lastYear = year - 1;
  
  for (let i = 0; i <= 3; i++) {
    let targetMonth = month - i;
    let targetYear = lastYear;
    
    if (targetMonth <= 0) {
      targetMonth += 12;
      targetYear -= 1;
    }
    
    const firstDay = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const lastDayStr = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    sameMonthLastYear.push({ dateFrom: firstDay, dateTo: lastDayStr });
  }

  return { last3Months, sameMonthLastYear };
}

export async function fetchClientPricing(clientId: string): Promise<any[]> {
  const body = {
    empresa: 'CONTI',
    usuario: 'consultas',
    token: globalThis.Deno?.env.get('DOMINIO_TOKEN'),
    cusert: 'CUSERT',
    procedimiento: 'apiconsultas',
    paramjs: { cliente: clientId },
    paramjs2: {
      opcion: 'listatotalxcliente',
      guser: 'conti',
      token: globalThis.Deno?.env.get('DOMINIO_TOKEN'),
    },
  };

  try {
    console.log('💰 Obteniendo precios específicos del cliente:', clientId);
    
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
    console.log('📊 Total de productos con precio específico:', Array.isArray(data) ? data.length : 'Formato inesperado');
    
    // Validation: ensure it's an array
    if (!Array.isArray(data)) {
      console.warn('API returned non-array data for client pricing:', data);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Error fetching client pricing from DominioDZ:', error);
    throw new Error(`Failed to fetch client pricing: ${(error as Error).message}`);
  }
}

export async function searchClientProducts(clientId: string, searchTerm: string, limit: number = 20): Promise<any[]> {
  if (!searchTerm || searchTerm.length < 3) {
    return [];
  }

  const body = {
    empresa: 'CONTI',
    usuario: 'consultas',
    token: globalThis.Deno?.env.get('DOMINIO_TOKEN'),
    cusert: 'CUSERT',
    procedimiento: 'apiconsultas',
    paramjs: { cliente: clientId },
    paramjs2: {
      opcion: 'listatotalxcliente',
      guser: 'conti',
      token: globalThis.Deno?.env.get('DOMINIO_TOKEN'),
    },
  };

  try {
    console.log(`🔍 Buscando productos para cliente ${clientId} con término: "${searchTerm}"`);
    
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
    
    if (!Array.isArray(data)) {
      console.warn('API returned non-array data for product search:', data);
      return [];
    }

    // Filtrar productos que coincidan con el término de búsqueda
    const searchTermLower = searchTerm.toLowerCase();
    const filtered = data.filter((product: any) => {
      const sku = (product.clave || product.sku || '').toLowerCase();
      const description = (product.descripcion || product.description || '').toLowerCase();
      
      return sku.includes(searchTermLower) || description.includes(searchTermLower);
    });

    // Limitar resultados para performance
    const limited = filtered.slice(0, limit);
    
    console.log(`📊 Encontrados ${filtered.length} productos (mostrando ${limited.length})`);
    
    return limited;
  } catch (error) {
    console.error('Error searching client products:', error);
    throw new Error(`Failed to search client products: ${(error as Error).message}`);
  }
} 