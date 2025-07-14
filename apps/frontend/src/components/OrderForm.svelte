<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ApiService } from '../lib/api';
  import type { FormState, OrderSummary, ClientData } from '../lib/types';

  const dispatch = createEventDispatcher<{
    summary: OrderSummary;
    loading: boolean;
    error: string | null;
    formStateChange: FormState;
    clientData: ClientData | null;
  }>();

  let formState: FormState = {
    clientId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  };

  let isLoading = false;
  let error: string | null = null;
  let focusedField = '';

  // Estado para datos del cliente
  let clientData: ClientData | null = null;
  let isLoadingClient = false;
  let clientError: string | null = null;
  let clientSearchTimeout: number;

  $: dispatch('formStateChange', formState);

  // Buscar datos del cliente cuando se cambie el ID
  $: if (formState.clientId.length >= 3) {
    searchClient();
  } else {
    clientData = null;
    clientError = null;
    dispatch('clientData', null);
  }

  async function searchClient() {
    clearTimeout(clientSearchTimeout);
    clientSearchTimeout = setTimeout(async () => {
      if (!formState.clientId || formState.clientId.length < 3) return;
      
      isLoadingClient = true;
      clientError = null;
      
      try {
        clientData = await ApiService.getClientData(formState.clientId);
        dispatch('clientData', clientData);
      } catch (err) {
        clientError = err instanceof Error ? err.message : 'Error al buscar cliente';
        clientData = null;
        dispatch('clientData', null);
      } finally {
        isLoadingClient = false;
      }
    }, 500); // Debounce de 500ms
  }

  async function handleSubmit() {
    if (!formState.clientId || !formState.month || !formState.year) {
      error = 'Todos los campos son requeridos';
      return;
    }

    if (formState.month < 1 || formState.month > 12) {
      error = 'El mes debe estar entre 1 y 12';
      return;
    }

    if (formState.year < 2000 || formState.year > 2030) {
      error = 'El año debe estar entre 2000 y 2030';
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

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
</script>

<div class="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-white/20 transition-all duration-300">
  <div class="flex items-center space-x-4 mb-8">
    <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
      </svg>
    </div>
    <div>
      <h2 class="text-3xl font-bold text-gray-900">Generar Pedido Sugerido</h2>
      <p class="text-gray-600 mt-1">Configura los parámetros para el análisis inteligente</p>
    </div>
  </div>
  
  <form on:submit|preventDefault={handleSubmit} class="space-y-6">
    <!-- Client ID Field -->
    <div class="relative group">
      <input
        id="clientId"
        type="text"
        bind:value={formState.clientId}
        on:focus={() => focusedField = 'clientId'}
        on:blur={() => focusedField = ''}
        placeholder=" "
        class="peer w-full px-4 py-4 bg-white/60 backdrop-blur-sm border-2 border-gray-200/50 rounded-2xl 
               focus:outline-none focus:border-indigo-500 focus:bg-white/80 transition-all duration-300
               placeholder-transparent text-gray-900 text-lg"
        required
      />
      <label 
        for="clientId" 
        class="absolute left-4 transition-all duration-300 text-gray-600 pointer-events-none
               {formState.clientId || focusedField === 'clientId' 
                 ? '-top-3 text-sm bg-white px-2 rounded-full text-indigo-600 font-medium' 
                 : 'top-4 text-lg'}"
      >
        ID Cliente
      </label>
      <div class="absolute right-4 top-4 text-gray-400">
        {#if isLoadingClient}
          <div class="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        {:else}
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        {/if}
      </div>
    </div>

    <!-- Client Data Display -->
    {#if clientData}
      <div class="bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm p-6 rounded-2xl border border-green-200/50 transition-all duration-300">
        <div class="flex items-start space-x-4">
          <div class="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-green-900 mb-3">{clientData.nombre}</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-white/60 p-3 rounded-xl">
                <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 118 0v2m-4 0a2 2 0 104 0m-4 0v2m0 0l3 3m0 0l3-3m-3 3V4" />
                  </svg>
                  <div>
                    <div class="text-xs text-green-600 font-medium">Cliente ID</div>
                    <div class="text-sm text-green-800 font-semibold">{clientData.clave}</div>
                  </div>
                </div>
              </div>

              <div class="bg-white/60 p-3 rounded-xl">
                <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <div>
                    <div class="text-xs text-green-600 font-medium">Tipo de Precio</div>
                    <div class="text-sm text-green-800 font-semibold">{clientData.precios}</div>
                  </div>
                </div>
              </div>

              <div class="bg-white/60 p-3 rounded-xl">
                <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <div>
                    <div class="text-xs text-green-600 font-medium">Descuento</div>
                    <div class="text-sm text-green-800 font-semibold">{clientData.descuento}%</div>
                  </div>
                </div>
              </div>
            </div>

            {#if clientData.descuento > 0}
              <div class="mt-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span class="text-xs text-yellow-700">Este cliente tiene descuento especial aplicado</span>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {:else if clientError}
      <div class="bg-orange-50/80 backdrop-blur-sm p-4 rounded-2xl border border-orange-200/50">
        <div class="flex items-center space-x-3">
          <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-orange-700 text-sm">{clientError}</span>
        </div>
      </div>
    {:else if formState.clientId.length > 0 && formState.clientId.length < 3}
      <div class="bg-blue-50/80 backdrop-blur-sm p-4 rounded-2xl border border-blue-200/50">
        <div class="flex items-center space-x-3">
          <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-blue-700 text-sm">Escribe al menos 3 caracteres para buscar el cliente</span>
        </div>
      </div>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Month Field -->
      <div class="relative group">
        <select
          id="month"
          bind:value={formState.month}
          on:focus={() => focusedField = 'month'}
          on:blur={() => focusedField = ''}
          class="peer w-full px-4 py-4 bg-white/60 backdrop-blur-sm border-2 border-gray-200/50 rounded-2xl 
                 focus:outline-none focus:border-indigo-500 focus:bg-white/80 transition-all duration-300
                 text-gray-900 text-lg appearance-none cursor-pointer"
          required
        >
          {#each monthNames as monthName, index}
            <option value={index + 1}>{monthName}</option>
          {/each}
        </select>
        <label 
          for="month" 
          class="absolute left-4 -top-3 text-sm bg-white px-2 rounded-full text-indigo-600 font-medium pointer-events-none"
        >
          Mes para Pedido
        </label>
        <div class="absolute right-4 top-4 text-gray-400 pointer-events-none">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      <!-- Year Field -->
      <div class="relative group">
        <input
          id="year"
          type="number"
          bind:value={formState.year}
          on:focus={() => focusedField = 'year'}
          on:blur={() => focusedField = ''}
          min="2000"
          max="2030"
          placeholder=" "
          class="peer w-full px-4 py-4 bg-white/60 backdrop-blur-sm border-2 border-gray-200/50 rounded-2xl 
                 focus:outline-none focus:border-indigo-500 focus:bg-white/80 transition-all duration-300
                 placeholder-transparent text-gray-900 text-lg"
          required
        />
        <label 
          for="year" 
          class="absolute left-4 -top-3 text-sm bg-white px-2 rounded-full text-indigo-600 font-medium pointer-events-none"
        >
          Año
        </label>
        <div class="absolute right-4 top-4 text-gray-400">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Info Box -->
    <div class="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm p-6 rounded-2xl border border-blue-200/50">
      <div class="flex items-start space-x-3">
        <div class="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p class="font-semibold text-blue-900 mb-1">Análisis Predictivo</p>
          <p class="text-blue-800 text-sm leading-relaxed">
            Comparamos los datos de los últimos 3 meses contra el mismo mes del año anterior + 3 meses previos para generar recomendaciones precisas.
          </p>
        </div>
      </div>
    </div>

    {#if error}
      <div class="bg-red-50/80 backdrop-blur-sm border border-red-200/50 text-red-700 px-6 py-4 rounded-2xl">
        <div class="flex items-center space-x-3">
          <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="font-medium">{error}</span>
        </div>
      </div>
    {/if}

    <button
      type="submit"
      disabled={isLoading}
      class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 
             text-white py-4 px-6 rounded-2xl font-semibold text-lg shadow-xl 
             focus:outline-none focus:ring-4 focus:ring-indigo-300 
             disabled:opacity-50 disabled:cursor-not-allowed 
             transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
             disabled:hover:scale-100"
    >
      {#if isLoading}
        <span class="flex items-center justify-center space-x-3">
          <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span>Generando análisis...</span>
        </span>
      {:else}
        <span class="flex items-center justify-center space-x-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Generar Pedido Sugerido</span>
        </span>
      {/if}
    </button>
  </form>
</div>

<slot {formState} /> 