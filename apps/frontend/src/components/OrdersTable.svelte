<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { OrderSuggestion, UiOrderRow } from '../lib/types';

  export let summary: OrderSuggestion[] = [];

  const dispatch = createEventDispatcher<{
    rowsChanged: UiOrderRow[];
  }>();

  // Convert OrderSuggestion to UiOrderRow (editable)
  $: uiRows = summary.map(item => ({
    ...item,
    qty: item.avgQty // Default editable quantity to suggested average
  })) as UiOrderRow[];

  // Calculate totals
  $: totalItems = uiRows.reduce((sum, row) => sum + row.qty, 0);
  $: totalValue = uiRows.reduce((sum, row) => sum + (row.qty * row.precio), 0);

  // Dispatch changes when rows change
  $: dispatch('rowsChanged', uiRows);

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  function handleQtyChange(index: number, newQty: number) {
    uiRows[index].qty = Math.max(0, newQty); // Ensure non-negative
    uiRows = [...uiRows]; // Trigger reactivity
  }
</script>

{#if summary.length > 0}
  <div class="bg-white rounded-lg shadow-md overflow-hidden">
    <div class="px-6 py-4 bg-gray-50 border-b">
      <h3 class="text-lg font-semibold text-gray-800">
        Pedido Sugerido ({summary.length} productos)
      </h3>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              SKU
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Descripción
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sugerido
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cantidad
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Precio
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Subtotal
            </th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stock
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each uiRows as row, index}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {row.sku}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                {row.descripcion}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                {row.avgQty}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={row.qty}
                  on:input={(e) => handleQtyChange(index, parseInt(e.currentTarget.value) || 0)}
                  class="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                {formatCurrency(row.precio)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                {formatCurrency(row.qty * row.precio)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {row.existencia > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                  {row.existencia > 0 ? 'Disponible' : 'Sin stock'}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
        <tfoot class="bg-gray-50">
          <tr>
            <td colspan="3" class="px-6 py-4 text-sm font-medium text-gray-900">
              TOTALES
            </td>
            <td class="px-6 py-4 text-sm font-bold text-gray-900 text-right">
              {totalItems}
            </td>
            <td class="px-6 py-4"></td>
            <td class="px-6 py-4 text-sm font-bold text-gray-900 text-right">
              {formatCurrency(totalValue)}
            </td>
            <td class="px-6 py-4"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div class="px-6 py-4 bg-gray-50 border-t">
      <slot {uiRows} />
    </div>
  </div>
{/if} 