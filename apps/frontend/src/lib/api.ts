import type { FormState, OrderSuggestion, OrderSummary, ApiError, ClientData } from './types';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'https://backend-service-production-9e8d.up.railway.app';

export class ApiService {
  static async getSalesSummary(params: FormState): Promise<OrderSummary> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        let errorData: ApiError;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || 'Unknown API error');
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data || typeof data !== 'object' || !Array.isArray(data.suggestions)) {
        throw new Error('Invalid response format: expected OrderSummary object');
      }

      return data as OrderSummary;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch sales summary');
    }
  }

  static async getClientData(clientId: string): Promise<ClientData> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/client-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId }),
      });

      if (!response.ok) {
        let errorData: ApiError;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || 'Cliente no encontrado');
      }

      const data = await response.json();
      return data as ClientData;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch client data');
    }
  }

  static async getClientPricing(clientId: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/client-pricing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId }),
      });

      if (!response.ok) {
        let errorData: ApiError;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || 'Precios del cliente no encontrados');
      }

      const data = await response.json();
      
      // Validate response is array
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected array');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch client pricing');
    }
  }

  static async searchProducts(clientId: string, searchTerm: string, limit: number = 20): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/product-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, searchTerm, limit }),
      });

      if (!response.ok) {
        let errorData: ApiError;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || 'Error al buscar productos');
      }

      const data = await response.json();
      
      // Validate response is array
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected array');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to search products');
    }
  }
} 