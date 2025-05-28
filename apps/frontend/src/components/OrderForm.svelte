<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ApiService } from '../lib/api';
  import type { FormState, OrderSuggestion } from '../lib/types';

  const dispatch = createEventDispatcher<{
    summary: OrderSuggestion[];
    loading: boolean;
    error: string | null;
    formStateChange: FormState;
  }>();

  let formState: FormState = {
    clientId: '',
    dateFrom: '',
    dateTo: ''
  };

  let isLoading = false;
  let error: string | null = null;

  // Reactive statement to dispatch form state changes
  $: dispatch('formStateChange', formState);

  async function handleSubmit() {
    if (!formState.clientId || !formState.dateFrom || !formState.dateTo) {
      error = 'Todos los campos son requeridos';
      return;
    }

    isLoading = true;
    error = null;
    dispatch('loading', true);

    try {
      const summary = await ApiService.getSalesSummary(formState);
      dispatch('summary', summary);
      error = null;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error desconocido';
      dispatch('error', error);
    } finally {
      isLoading = false;
      dispatch('loading', false);
    }
  }

  // Set default dates (last 3 months)
  const today = new Date();
  const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
  
  if (!formState.dateFrom) {
    formState.dateFrom = threeMonthsAgo.toISOString().split('T')[0];
  }
  if (!formState.dateTo) {
    formState.dateTo = today.toISOString().split('T')[0];
  }
</script>

<div class="bg-white p-6 rounded-lg shadow-md">
  <h2 class="text-2xl font-bold mb-6 text-gray-800">Generar Pedido Sugerido</h2>
  
  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <div>
      <label for="clientId" class="block text-sm font-medium text-gray-700 mb-1">
        ID Cliente
      </label>
      <input
        id="clientId"
        type="text"
        bind:value={formState.clientId}
        placeholder="Ej: 006250"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required
      />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="dateFrom" class="block text-sm font-medium text-gray-700 mb-1">
          Fecha Desde
        </label>
        <input
          id="dateFrom"
          type="date"
          bind:value={formState.dateFrom}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label for="dateTo" class="block text-sm font-medium text-gray-700 mb-1">
          Fecha Hasta
        </label>
        <input
          id="dateTo"
          type="date"
          bind:value={formState.dateTo}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
    </div>

    {#if error}
      <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    {/if}

    <button
      type="submit"
      disabled={isLoading}
      class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {#if isLoading}
        <span class="flex items-center justify-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Generando...
        </span>
      {:else}
        Generar Pedido Sugerido
      {/if}
    </button>
  </form>
</div>

<slot {formState} /> 