<script lang="ts">
  import OrderForm from './OrderForm.svelte';
  import OrdersTable from './OrdersTable.svelte';
  import PdfButton from './PdfButton.svelte';
  import type { OrderSuggestion, OrderSummary, UiOrderRow, FormState, ClientData } from '../lib/types';

  // Debug visual: imprime la variable de entorno
  console.log('PUBLIC_API_URL:', import.meta.env.PUBLIC_API_URL);

  let orderSummary: OrderSummary | null = null;
  let currentRows: UiOrderRow[] = [];
  let isLoading = false;
  let error: string | null = null;
  let formState: FormState = { clientId: '', month: 1, year: new Date().getFullYear() };
  let clientData: ClientData | null = null;

  $: summary = orderSummary?.suggestions || [];

  function handleSummary(event: CustomEvent<OrderSummary>) {
    orderSummary = event.detail;
    error = null;
  }

  function handleLoading(event: CustomEvent<boolean>) {
    isLoading = event.detail;
  }

  function handleError(event: CustomEvent<string | null>) {
    error = event.detail;
    orderSummary = null;
  }

  function handleRowsChanged(event: CustomEvent<UiOrderRow[]>) {
    currentRows = event.detail;
  }

  function handleFormStateChange(event: CustomEvent<FormState>) {
    formState = event.detail;
  }

  function handleClientData(event: CustomEvent<ClientData | null>) {
    clientData = event.detail;
  }
</script>

<div class="space-y-8">
  <!-- Order Form -->
  <div class="transform transition-all duration-300 hover:scale-[1.01]">
    <OrderForm 
      on:summary={handleSummary}
      on:loading={handleLoading}
      on:error={handleError}
      on:formStateChange={handleFormStateChange}
      on:clientData={handleClientData}
    />
  </div>

  <!-- Loading State -->
  {#if isLoading}
    <div class="bg-white/80 backdrop-blur-lg p-12 rounded-3xl shadow-2xl border border-white/20 text-center transform transition-all duration-500 animate-pulse">
      <div class="flex flex-col items-center space-y-6">
        <div class="relative">
          <div class="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600"></div>
          <div class="absolute top-4 left-4 w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full animate-pulse"></div>
        </div>
        <div class="space-y-2">
          <span class="text-2xl font-semibold text-gray-800">Generando pedido sugerido</span>
          <p class="text-gray-600 max-w-md mx-auto">Analizando patrones de ventas y tendencias históricas con inteligencia artificial</p>
        </div>
        <div class="flex space-x-1">
          {#each Array(3) as _, i}
            <div class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style="animation-delay: {i * 0.2}s;"></div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <!-- Error State -->
  {#if error && !isLoading}
    <div class="bg-red-50/80 backdrop-blur-lg border border-red-200/50 rounded-3xl p-8 shadow-xl transform transition-all duration-300">
      <div class="flex items-start space-x-4">
        <div class="flex-shrink-0">
          <div class="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
            <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div class="flex-1">
          <h3 class="text-xl font-semibold text-red-800 mb-2">Error al generar pedido</h3>
          <p class="text-red-700 leading-relaxed">{error}</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Results Table -->
  {#if summary.length > 0 && !isLoading}
    <div class="transform transition-all duration-500 hover:scale-[1.005]">
      <OrdersTable 
        {summary} 
        {orderSummary}
        {clientData}
        on:rowsChanged={handleRowsChanged}
      >
        <!-- PDF Export Button -->
        <div class="flex justify-end">
          <PdfButton 
            rows={currentRows.filter(row => row.existencia > 0)}
            {formState}
            {clientData}
          />
        </div>
      </OrdersTable>
    </div>
  {/if}

  <!-- Empty State -->
  {#if summary.length === 0 && !isLoading && !error}
    <div class="bg-white/60 backdrop-blur-lg p-16 rounded-3xl shadow-xl border border-white/20 text-center transform transition-all duration-300 hover:bg-white/70">
      <div class="max-w-md mx-auto">
        <div class="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
          <svg class="w-12 h-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 class="text-2xl font-semibold text-gray-900 mb-4">¡Comencemos!</h3>
        <p class="text-gray-600 leading-relaxed mb-8">
          Completa el formulario para generar un pedido inteligente basado en análisis avanzado de datos históricos de ventas.
        </p>
        <div class="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <div class="w-2 h-2 bg-indigo-300 rounded-full"></div>
          <span>Análisis predictivo</span>
          <div class="w-2 h-2 bg-purple-300 rounded-full"></div>
          <span>Optimización automática</span>
          <div class="w-2 h-2 bg-blue-300 rounded-full"></div>
        </div>
      </div>
    </div>
  {/if}
</div> 