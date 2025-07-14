<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ApiService } from '../lib/api';
  import type { ClientData } from '../lib/types';

  export let clientData: ClientData | null = null;
  export let existingSkus: Set<string> = new Set();

  const dispatch = createEventDispatcher<{
    addProduct: any;
  }>();

  let searchTerm = '';
  let searchResults: any[] = [];
  let isSearching = false;
  let searchError: string | null = null;
  let showResults = false;
  let searchTimeout: number;

  $: if (searchTerm.length >= 3) {
    performSearch();
  } else {
    searchResults = [];
    showResults = false;
  }

  async function performSearch() {
    if (!clientData?.clave) return;
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      isSearching = true;
      searchError = null;
      
      try {
        const results = await ApiService.searchProducts(clientData.clave, searchTerm, 15);
        
        // Filtrar productos que ya están en el pedido
        searchResults = results.filter(product => {
          const sku = product.clave || product.sku;
          return !existingSkus.has(sku);
        });
        
        showResults = searchResults.length > 0;
      } catch (error) {
        searchError = error instanceof Error ? error.message : 'Error al buscar productos';
        searchResults = [];
        showResults = false;
      } finally {
        isSearching = false;
      }
    }, 300);
  }

  function handleAddProduct(product: any) {
    dispatch('addProduct', {
      sku: product.clave || product.sku,
      descripcion: product.descripcion || product.description,
      precio: product.precio || product.price || 0,
      existencia: product.existencia || product.stock || 0,
      hasClientPrice: true, // Viene de la lista de precios del cliente
      avgLast3Months: 0,
      avgSameMonthLastYear: 0,
      cantidadSugerida: 1,
      subtotal: product.precio || product.price || 0,
    });
    
    // Limpiar búsqueda después de agregar
    searchTerm = '';
    searchResults = [];
    showResults = false;
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  function closeResults() {
    showResults = false;
  }

  // Cerrar resultados al hacer clic fuera
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-container')) {
      closeResults();
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

{#if clientData}
  <div class="search-container bg-white/90 backdrop-blur-lg rounded-2xl border border-indigo-200/50 p-6 shadow-lg">
    <div class="flex items-center space-x-3 mb-4">
      <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Agregar Productos</h3>
        <p class="text-sm text-gray-600">Busca productos adicionales para incluir en tu pedido</p>
      </div>
    </div>

    <div class="relative">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          bind:value={searchTerm}
          type="text"
          placeholder="Buscar por SKU o descripción (mín. 3 caracteres)..."
          class="block w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl leading-5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
        />
        <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
          {#if isSearching}
            <div class="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          {:else if searchTerm}
            <button
              on:click={() => { searchTerm = ''; closeResults(); }}
              class="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          {/if}
        </div>
      </div>

      <!-- Search Results -->
      {#if showResults && searchResults.length > 0}
        <div class="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
          {#each searchResults as product (product.clave || product.sku)}
            {@const stock = product.existencia || product.stock || 0}
            {@const price = product.precio || product.price || 0}
            <div class="flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors">
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-3">
                  <div class="flex-1">
                    <h4 class="text-sm font-medium text-gray-900 truncate">{product.clave || product.sku}</h4>
                    <p class="text-sm text-gray-600 truncate">{product.descripcion || product.description}</p>
                  </div>
                  <div class="flex items-center space-x-4">
                    <div class="text-right">
                      <div class="flex items-center space-x-1">
                        <span class="text-sm font-medium text-green-600">{formatCurrency(price)}</span>
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200">
                          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          Tu precio
                        </span>
                      </div>
                      <div class="text-xs text-gray-500">Stock: {stock}</div>
                    </div>
                    <button
                      on:click={() => handleAddProduct(product)}
                      disabled={stock === 0}
                      class="px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {stock === 0 ? 'Sin stock' : 'Agregar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Error message -->
      {#if searchError}
        <div class="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-600">{searchError}</p>
        </div>
      {/if}

      <!-- No results message -->
      {#if searchTerm.length >= 3 && !isSearching && searchResults.length === 0 && !searchError}
        <div class="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p class="text-sm text-gray-600">No se encontraron productos para "{searchTerm}"</p>
        </div>
      {/if}

      <!-- Help text -->
      {#if searchTerm.length > 0 && searchTerm.length < 3}
        <div class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p class="text-sm text-blue-600">Escribe al menos 3 caracteres para buscar productos</p>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .search-container {
    position: relative;
  }
</style> 