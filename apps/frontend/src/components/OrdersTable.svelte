<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { OrderSuggestion, OrderSummary, UiOrderRow, ClientData } from '../lib/types';
  import ProductSearch from './ProductSearch.svelte';

  export let summary: OrderSuggestion[] = [];
  export let orderSummary: OrderSummary | null = null;
  export let clientData: ClientData | null = null;

  const dispatch = createEventDispatcher<{
    rowsChanged: UiOrderRow[];
  }>();

  let products: OrderSuggestion[] = [];
  let quantities: Record<string, number> = {};
  let originalQuantities: Record<string, number> = {};
  let showWithoutStock = false;
  let hasChanges = false;
  let searchTerm = '';
  let bulkQuantity = 1;
  let selectedView = 'table'; // 'grid' or 'table'
  
  $: {
    products = summary;
    if (summary.length > 0) {
      const newQuantities = {};
      const newOriginalQuantities = {};
      summary.forEach(item => {
        if (!(item.sku in quantities)) {
          newQuantities[item.sku] = item.cantidadSugerida;
          newOriginalQuantities[item.sku] = item.cantidadSugerida;
        } else {
          newQuantities[item.sku] = quantities[item.sku];
          newOriginalQuantities[item.sku] = originalQuantities[item.sku] || item.cantidadSugerida;
        }
      });
      quantities = newQuantities;
      originalQuantities = newOriginalQuantities;
    }
  }

  $: hasChanges = Object.keys(quantities).some(sku => 
    quantities[sku] !== originalQuantities[sku]
  );

  $: filteredProducts = products.filter(p => 
    searchTerm === '' || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  $: withStock = filteredProducts.filter(p => p.existencia > 0);
  $: withoutStock = filteredProducts.filter(p => p.existencia === 0);

  $: totalItems = withStock.reduce((sum, p) => sum + (quantities[p.sku] || 0), 0);
  $: totalValue = withStock.reduce((sum, p) => sum + ((quantities[p.sku] || 0) * p.precio), 0);

  $: getSubtotal = (sku: string, precio: number) => (quantities[sku] || 0) * precio;
  $: hasChanged = (sku: string) => quantities[sku] !== originalQuantities[sku];

  let updateTimeout: NodeJS.Timeout;
  function updateQuantity(sku: string, newQty: number) {
    clearTimeout(updateTimeout);
    
    quantities = {
      ...quantities,
      [sku]: Math.max(0, newQty)
    };
    
    updateTimeout = setTimeout(() => {
      const uiRows: UiOrderRow[] = products.map(p => ({
        sku: p.sku,
        descripcion: p.descripcion,
        avgLast3Months: p.avgLast3Months,
        avgSameMonthLastYear: p.avgSameMonthLastYear,
        acumuladoMesActual: p.acumuladoMesActual,
        qty: quantities[p.sku] || 0,
        precio: p.precio,
        existencia: p.existencia,
        hasClientPrice: p.hasClientPrice,
      }));
      
      dispatch('rowsChanged', uiRows);
    }, 300);
  }

  function resetToSuggested() {
    quantities = { ...originalQuantities };
    const uiRows: UiOrderRow[] = products.map(p => ({
      sku: p.sku,
      descripcion: p.descripcion,
      avgLast3Months: p.avgLast3Months,
      avgSameMonthLastYear: p.avgSameMonthLastYear,
      acumuladoMesActual: p.acumuladoMesActual,
      qty: quantities[p.sku] || 0,
      precio: p.precio,
      existencia: p.existencia,
      hasClientPrice: p.hasClientPrice,
    }));
    dispatch('rowsChanged', uiRows);
  }

  function applyToAll(qty: number) {
    const newQuantities = { ...quantities };
    withStock.forEach(p => {
      newQuantities[p.sku] = Math.min(qty, p.existencia);
    });
    quantities = newQuantities;
    
    const uiRows: UiOrderRow[] = products.map(p => ({
      sku: p.sku,
      descripcion: p.descripcion,
      avgLast3Months: p.avgLast3Months,
      avgSameMonthLastYear: p.avgSameMonthLastYear,
      acumuladoMesActual: p.acumuladoMesActual,
      qty: quantities[p.sku] || 0,
      precio: p.precio,
      existencia: p.existencia,
      hasClientPrice: p.hasClientPrice,
    }));
    dispatch('rowsChanged', uiRows);
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  function getStockStatus(existencia: number, qtyRequested: number): { text: string; class: string; icon: string } {
    if (existencia === 0) {
      return { text: 'Sin stock', class: 'bg-red-100 text-red-800 border-red-200', icon: 'M6 18L18 6M6 6l12 12' };
    } else if (qtyRequested > existencia) {
      return { text: 'Insuficiente', class: 'bg-orange-100 text-orange-800 border-orange-200', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z' };
    } else if (existencia < 10) {
      return { text: 'Stock bajo', class: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z' };
    } else {
      return { text: 'Disponible', class: 'bg-green-100 text-green-800 border-green-200', icon: 'M5 13l4 4L19 7' };
    }
  }

  function toggleWithoutStock() {
    showWithoutStock = !showWithoutStock;
  }

  function handleAddProduct(event: CustomEvent<any>) {
    const newProduct = event.detail;
    
    // Agregar el producto a la lista de productos
    products = [...products, newProduct];
    
    // Inicializar cantidad para el nuevo producto
    quantities = {
      ...quantities,
      [newProduct.sku]: 1
    };
    
    originalQuantities = {
      ...originalQuantities,
      [newProduct.sku]: 1
    };

    // Emitir cambio
    const uiRows: UiOrderRow[] = products.map(p => ({
      sku: p.sku,
      descripcion: p.descripcion,
      avgLast3Months: p.avgLast3Months,
      avgSameMonthLastYear: p.avgSameMonthLastYear,
      acumuladoMesActual: p.acumuladoMesActual,
      qty: quantities[p.sku] || 0,
      precio: p.precio,
      existencia: p.existencia,
      hasClientPrice: p.hasClientPrice,
    }));
    dispatch('rowsChanged', uiRows);
  }

  // SKUs existentes para el buscador
  $: existingSkus = new Set(products.map(p => p.sku));
</script>

{#if summary.length > 0}
  <div class="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
    <!-- Header with metrics -->
    <div class="px-8 py-6 bg-gradient-to-r from-gray-50/80 to-blue-50/80 backdrop-blur-sm border-b border-gray-200/50">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
        <!-- Title and metrics -->
        <div class="space-y-4">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-900 flex items-center">
                Pedido Sugerido
                {#if hasChanges}
                  <span class="ml-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Modificado
                  </span>
                {/if}
              </h3>
              <p class="text-gray-600 mt-1">{withStock.length} productos disponibles</p>
            </div>
          </div>
          
          <!-- Metrics cards -->
          <div class="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <div class="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50">
              <div class="text-2xl font-bold text-gray-900">{totalItems}</div>
              <div class="text-sm text-gray-600">Unidades sugeridas</div>
            </div>
            <div class="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50">
              <div class="text-2xl font-bold text-green-600">{formatCurrency(totalValue)}</div>
              <div class="text-sm text-gray-600">Valor sugerido</div>
            </div>
            {#if orderSummary?.summary}
              <div class="bg-blue-50/60 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/50">
                <div class="text-2xl font-bold text-blue-600">{orderSummary.summary.totalAcumuladoMesActual.toFixed(0)}</div>
                <div class="text-sm text-blue-600">Unidades mes actual</div>
              </div>
              <div class="bg-blue-50/60 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/50">
                <div class="text-2xl font-bold text-blue-600">{formatCurrency(orderSummary.summary.totalValueAcumuladoMesActual)}</div>
                <div class="text-sm text-blue-600">Valor mes actual</div>
              </div>
            {/if}
            <div class="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50">
              <div class="text-2xl font-bold text-indigo-600">{withStock.length}</div>
              <div class="text-sm text-gray-600">Con stock</div>
            </div>
            <div class="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50">
              <div class="text-2xl font-bold text-red-600">{withoutStock.length}</div>
              <div class="text-sm text-gray-600">Sin stock</div>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
          {#if hasChanges}
            <button
              on:click={resetToSuggested}
              class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white/80 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Resetear
            </button>
          {/if}
          
          <!-- View toggle -->
          <div class="flex rounded-xl bg-gray-100/80 p-1">
            <button 
              on:click={() => selectedView = 'grid'}
              class="flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 {selectedView === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button 
              on:click={() => selectedView = 'table'}
              class="flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 {selectedView === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Search and filters -->
      <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-6">
        <!-- Search -->
        <div class="flex-1 max-w-md">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              bind:value={searchTerm}
              type="text"
              placeholder="Buscar por SKU o descripción..."
              class="block w-full pl-10 pr-3 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl leading-5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            />
          </div>
        </div>

        <!-- Bulk actions -->
        <div class="flex items-center space-x-2">
          <input
            bind:value={bulkQuantity}
            type="number"
            min="0"
            max="100"
            class="w-20 px-3 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            on:click={() => applyToAll(bulkQuantity)}
            class="px-4 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
          >
            Aplicar a todos
          </button>
        </div>

        <!-- Show without stock toggle -->
        <button
          on:click={toggleWithoutStock}
          class="flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 {showWithoutStock ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}"
        >
          <span>{showWithoutStock ? 'Ocultar' : 'Mostrar'} sin stock</span>
          <span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{withoutStock.length}</span>
        </button>
      </div>
    </div>

    <!-- Product Search -->
    <div class="px-8 py-4 border-b border-gray-200/50">
      <ProductSearch 
        {clientData} 
        {existingSkus} 
        on:addProduct={handleAddProduct} 
      />
    </div>

    <!-- Content -->
    <div class="p-6">
      {#if selectedView === 'grid'}
        <!-- Grid View -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {#each withStock as product (product.sku)}
            {@const status = getStockStatus(product.existencia, quantities[product.sku] || 0)}
            <div class="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 hover:border-indigo-200 hover:bg-white/80 transition-all duration-300 transform hover:scale-[1.02] {hasChanged(product.sku) ? 'ring-2 ring-indigo-200 bg-indigo-50/50' : ''}">
              <!-- Product header -->
              <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-900 text-lg mb-1">{product.sku}</h4>
                  <p class="text-sm text-gray-600 line-clamp-2">{product.descripcion}</p>
                </div>
                <div class="ml-3">
                  <span class="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border {status.class}">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{status.icon}" />
                    </svg>
                    {status.text}
                  </span>
                </div>
              </div>

              <!-- Metrics -->
              <div class="grid grid-cols-2 gap-3 mb-4">
                <div class="text-center p-2 bg-gray-50/80 rounded-xl">
                  <div class="text-sm font-medium text-gray-900">{product.avgLast3Months.toFixed(1)}</div>
                  <div class="text-xs text-gray-500">Prom. 3M</div>
                </div>
                <div class="text-center p-2 bg-gray-50/80 rounded-xl">
                  <div class="text-sm font-medium text-gray-900">{product.avgSameMonthLastYear.toFixed(1)}</div>
                  <div class="text-xs text-gray-500">Año ant.</div>
                </div>
                <div class="col-span-2 text-center p-2 bg-blue-50/80 rounded-xl border border-blue-200">
                  <div class="text-sm font-semibold text-blue-600">{product.acumuladoMesActual.toFixed(1)}</div>
                  <div class="text-xs text-blue-600">Mes actual</div>
                </div>
              </div>

              <!-- Price and stock -->
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-2">
                  <span class="text-lg font-bold text-green-600">{formatCurrency(product.precio)}</span>
                  {#if product.hasClientPrice}
                    <div class="relative group">
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200">
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Tu precio
                      </span>
                      <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-[100] pointer-events-none shadow-lg">
                        Precio personalizado para tu negocio
                        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    </div>
                  {/if}
                </div>
                <div class="text-sm text-gray-600">Stock: {product.existencia}</div>
              </div>

              <!-- Quantity input -->
              <div class="space-y-2">
                <label for="qty-{product.sku}" class="block text-sm font-medium text-gray-700">Cantidad a pedir</label>
                <input
                  id="qty-{product.sku}"
                  type="number"
                  min="0"
                  max={product.existencia}
                  bind:value={quantities[product.sku]}
                  on:input={(e) => updateQuantity(product.sku, parseInt(e.target.value) || 0)}
                  class="w-full px-3 py-2 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 {hasChanged(product.sku) ? 'border-indigo-300 bg-indigo-50' : ''}"
                />
              </div>

              <!-- Subtotal -->
              {#if quantities[product.sku] > 0}
                <div class="mt-3 pt-3 border-t border-gray-200">
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Subtotal</span>
                    <span class="font-semibold text-gray-900">{formatCurrency(getSubtotal(product.sku, product.precio))}</span>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <!-- Table View -->
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div class="flex items-center justify-center space-x-1">
                    <span>Prom. 3M</span>
                    <div class="relative group">
                      <svg class="w-3 h-3 text-gray-400 hover:text-indigo-600 cursor-help transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-[100] pointer-events-none shadow-lg">
                        Promedio de productos comprados los últimos 3 meses
                        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    </div>
                  </div>
                </th>
                <th class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div class="flex items-center justify-center space-x-1">
                    <span>Año Ant.</span>
                    <div class="relative group">
                      <svg class="w-3 h-3 text-gray-400 hover:text-indigo-600 cursor-help transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[100] pointer-events-none shadow-lg" style="max-width: 300px; white-space: normal;">
                        Promedio de productos comprados el año pasado en el período del mes a pedir más los 3 meses anteriores
                        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    </div>
                  </div>
                </th>
                <th class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div class="flex items-center justify-center space-x-1">
                    <span>Mes Actual</span>
                    <div class="relative group">
                      <svg class="w-3 h-3 text-gray-400 hover:text-indigo-600 cursor-help transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-[100] pointer-events-none shadow-lg">
                        Total comprado hasta hoy en el mes actual
                        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    </div>
                  </div>
                </th>
                <th class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                <th class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div class="flex items-center justify-center space-x-1">
                    <span>Stock</span>
                    <div class="relative group">
                      <svg class="w-3 h-3 text-gray-400 hover:text-indigo-600 cursor-help transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-[100] pointer-events-none shadow-lg">
                        Cantidad de productos disponibles en almacén
                        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    </div>
                  </div>
                </th>
                <th class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {#each withStock as product (product.sku)}
                {@const status = getStockStatus(product.existencia, quantities[product.sku] || 0)}
                <tr class="hover:bg-gray-50/50 transition-colors duration-200 {hasChanged(product.sku) ? 'bg-indigo-50/50' : ''}">
                  <td class="px-6 py-4">
                    <div class="flex items-center space-x-3">
                      <div class="flex-1">
                        <div class="text-sm font-medium text-gray-900">{product.sku}</div>
                        <div class="text-sm text-gray-500 max-w-xs truncate">{product.descripcion}</div>
                      </div>
                      <span class="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border {status.class}">
                        {status.text}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-center text-sm text-gray-900">{product.avgLast3Months.toFixed(1)}</td>
                  <td class="px-6 py-4 text-center text-sm text-gray-900">{product.avgSameMonthLastYear.toFixed(1)}</td>
                  <td class="px-6 py-4 text-center">
                    <span class="text-sm font-semibold text-blue-600">{product.acumuladoMesActual.toFixed(1)}</span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center space-x-2">
                      <span class="text-sm font-medium text-green-600">{formatCurrency(product.precio)}</span>
                      {#if product.hasClientPrice}
                        <div class="relative group">
                          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200">
                            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            Tu precio
                          </span>
                          <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-[100] pointer-events-none shadow-lg">
                            Precio personalizado para tu negocio
                            <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                          </div>
                        </div>
                      {/if}
                    </div>
                  </td>
                  <td class="px-6 py-4 text-center text-sm text-gray-900">{product.existencia}</td>
                  <td class="px-6 py-4 text-center">
                    <input
                      type="number"
                      min="0"
                      max={product.existencia}
                      bind:value={quantities[product.sku]}
                      on:input={(e) => updateQuantity(product.sku, parseInt(e.target.value) || 0)}
                      class="w-20 px-2 py-1 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center {hasChanged(product.sku) ? 'border-indigo-300 bg-indigo-50' : ''}"
                    />
                  </td>
                  <td class="px-6 py-4 text-center text-sm font-medium text-gray-900">
                    {formatCurrency(getSubtotal(product.sku, product.precio))}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}

      <!-- Without stock section -->
      {#if showWithoutStock && withoutStock.length > 0}
        <div class="mt-8 pt-6 border-t border-gray-200">
          <h4 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg class="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Productos sin stock ({withoutStock.length})
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each withoutStock as product (product.sku)}
              <div class="bg-red-50/50 border border-red-200 rounded-xl p-4">
                <div class="font-medium text-red-900">{product.sku}</div>
                <div class="text-sm text-red-700 truncate">{product.descripcion}</div>
                <div class="text-xs text-red-600 mt-1">Sugerido: {product.cantidadSugerida}</div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Footer with action button -->
    <div class="px-8 py-6 bg-gray-50/80 border-t border-gray-200/50">
      <slot />
    </div>
  </div>
{/if} 