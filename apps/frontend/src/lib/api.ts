import type { FormState, OrderSuggestion, ApiError } from './types';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8001';

export class ApiService {
  static async getSalesSummary(params: FormState): Promise<OrderSuggestion[]> {
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
      
      // Validate response is array
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected array');
      }

      return data as OrderSuggestion[];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch sales summary');
    }
  }
} 