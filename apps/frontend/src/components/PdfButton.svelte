<script lang="ts">
  import type { UiOrderRow } from '../lib/types';

  export let rows: UiOrderRow[] = [];
  export let clientId: string = '';
  export let dateFrom: string = '';
  export let dateTo: string = '';

  let isGenerating = false;

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  async function generatePdf() {
    if (rows.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    isGenerating = true;

    try {
      // Dynamically import html2pdf
      const html2pdf = (await import('html2pdf.js')).default;

      const totalItems = rows.reduce((sum, row) => sum + row.qty, 0);
      const totalValue = rows.reduce((sum, row) => sum + (row.qty * row.precio), 0);

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Pedido Sugerido - Cliente ${clientId}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .info { 
              margin-bottom: 20px; 
              background: #f5f5f5;
              padding: 15px;
              border-radius: 5px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left; 
            }
            th { 
              background-color: #f2f2f2; 
              font-weight: bold;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .total-row { 
              background-color: #f9f9f9; 
              font-weight: bold; 
            }
            .stock-available { 
              color: #16a34a; 
              font-weight: bold; 
            }
            .stock-unavailable { 
              color: #dc2626; 
              font-weight: bold; 
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Pedido Sugerido</h1>
            <h2>Cliente: ${clientId}</h2>
          </div>
          
          <div class="info">
            <p><strong>Período analizado:</strong> ${formatDate(dateFrom)} - ${formatDate(dateTo)}</p>
            <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString('es-MX')}</p>
            <p><strong>Total de productos:</strong> ${rows.length}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Descripción</th>
                <th class="text-right">Cantidad</th>
                <th class="text-right">Precio</th>
                <th class="text-right">Subtotal</th>
                <th class="text-center">Stock</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => `
                <tr>
                  <td>${row.sku}</td>
                  <td>${row.descripcion}</td>
                  <td class="text-right">${row.qty}</td>
                  <td class="text-right">${formatCurrency(row.precio)}</td>
                  <td class="text-right">${formatCurrency(row.qty * row.precio)}</td>
                  <td class="text-center ${row.existencia > 0 ? 'stock-available' : 'stock-unavailable'}">
                    ${row.existencia > 0 ? 'Disponible' : 'Sin stock'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="2"><strong>TOTALES</strong></td>
                <td class="text-right"><strong>${totalItems}</strong></td>
                <td></td>
                <td class="text-right"><strong>${formatCurrency(totalValue)}</strong></td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          <div class="footer">
            <p>Documento generado automáticamente por Levantapedidos</p>
          </div>
        </body>
        </html>
      `;

      const opt = {
        margin: 10,
        filename: `pedido-sugerido-${clientId}-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(htmlContent).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Por favor, intenta de nuevo.');
    } finally {
      isGenerating = false;
    }
  }
</script>

<button
  on:click={generatePdf}
  disabled={isGenerating || rows.length === 0}
  class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
>
  {#if isGenerating}
    <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span>Generando PDF...</span>
  {:else}
    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    <span>Exportar PDF</span>
  {/if}
</button> 