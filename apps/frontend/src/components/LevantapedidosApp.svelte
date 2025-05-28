<script lang="ts">
  import OrderForm from './OrderForm.svelte';
  import OrdersTable from './OrdersTable.svelte';
  import PdfButton from './PdfButton.svelte';
  import type { OrderSuggestion, UiOrderRow, FormState } from '../lib/types';

  let summary: OrderSuggestion[] = [];
  let currentRows: UiOrderRow[] = [];
  let isLoading = false;
  let error: string | null = null;
  let formState: FormState = { clientId: '', dateFrom: '', dateTo: '' };

  function handleSummary(event: CustomEvent<OrderSuggestion[]>) {
    summary = event.detail;
    error = null;
  }

  function handleLoading(event: CustomEvent<boolean>) {
    isLoading = event.detail;
  }

  function handleError(event: CustomEvent<string | null>) {
    error = event.detail;
    summary = [];
  }

  function handleRowsChanged(event: CustomEvent<UiOrderRow[]>) {
    currentRows = event.detail;
  }

  function handleFormStateChange(event: CustomEvent<FormState>) {
    formState = event.detail;
  }
</script>

<div class="space-y-8">
  <!-- Order Form -->
  <OrderForm 
    on:summary={handleSummary}
    on:loading={handleLoading}
    on:error={handleError}
    on:formStateChange={handleFormStateChange}
  />

  <!-- Loading State -->
  {#if isLoading}
    <div class="bg-white p-8 rounded-lg shadow-md text-center">
      <div class="flex items-center justify-center space-x-3">
        <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-lg text-gray-700">Generando pedido sugerido...</span>
      </div>
      <p class="text-sm text-gray-500 mt-2">Analizando datos de ventas históricas</p>
    </div>
  {/if}

  <!-- Error State -->
  {#if error && !isLoading}
    <div class="bg-red-50 border border-red-200 rounded-lg p-6">
      <div class="flex items-center">
        <svg class="h-6 w-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h3 class="text-lg font-medium text-red-800">Error al generar pedido</h3>
          <p class="text-red-700 mt-1">{error}</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Results Table -->
  {#if summary.length > 0 && !isLoading}
    <OrdersTable 
      {summary} 
      on:rowsChanged={handleRowsChanged}
      let:uiRows
    >
      <!-- PDF Export Button -->
      <div class="flex justify-end">
        <PdfButton 
          rows={currentRows}
          clientId={formState.clientId}
          dateFrom={formState.dateFrom}
          dateTo={formState.dateTo}
        />
      </div>
    </OrdersTable>
  {/if}

  <!-- Empty State -->
  {#if summary.length === 0 && !isLoading && !error}
    <div class="bg-white p-12 rounded-lg shadow-md text-center">
      <svg class="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Listo para generar pedidos</h3>
      <p class="text-gray-500">Completa el formulario arriba para generar un pedido sugerido basado en el historial de ventas.</p>
    </div>
  {/if}
</div> 