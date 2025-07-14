<script lang="ts">
  import type { UiOrderRow, FormState, ClientData } from '../lib/types';

  export let rows: UiOrderRow[] = [];
  export let formState: FormState = { clientId: '', month: 1, year: new Date().getFullYear() };
  export let clientData: ClientData | null = null;

  let isGenerating = false;

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  function formatMonth(month: number): string {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return monthNames[month - 1] || 'Mes inválido';
  }

  function getStockStatus(existencia: number, qtyRequested: number): string {
    if (existencia === 0) {
      return 'Sin stock';
    } else if (qtyRequested > existencia) {
      return `Insuficiente (${existencia} disponibles)`;
    } else if (existencia < 10) {
      return `Stock bajo (${existencia})`;
    } else {
      return `Disponible (${existencia})`;
    }
  }

  async function generatePdf() {
    if (rows.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const rowsWithStock = rows.filter(row => row.existencia > 0);

    if (rowsWithStock.length === 0) {
      alert('No hay productos con stock para incluir en el PDF');
      return;
    }

    isGenerating = true;

    try {
      const html2pdf = (await import('html2pdf.js')).default;

      const totalItems = rowsWithStock.reduce((sum, row) => sum + row.qty, 0);
      const totalValue = rowsWithStock.reduce((sum, row) => sum + (row.qty * row.precio), 0);

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 30px;
              color: #1f2937;
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding: 30px;
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
              color: white;
              border-radius: 20px;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
              font-weight: 700;
              letter-spacing: -0.025em;
            }
            .header h2 {
              margin: 15px 0 0 0;
              font-size: 20px;
              font-weight: 400;
              opacity: 0.9;
            }
            .info {
              background: rgba(255, 255, 255, 0.9);
              backdrop-filter: blur(10px);
              padding: 25px;
              border-radius: 16px;
              margin-bottom: 30px;
              border: 1px solid rgba(255, 255, 255, 0.2);
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
            }
            .info-item {
              background: rgba(79, 70, 229, 0.05);
              padding: 15px;
              border-radius: 12px;
              border-left: 4px solid #4f46e5;
            }
            .info-item strong {
              color: #4f46e5;
              display: block;
              margin-bottom: 5px;
              font-weight: 600;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              font-size: 13px;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            th, td {
              padding: 16px 12px;
              text-align: left;
              border-bottom: 1px solid #e5e7eb;
            }
            th {
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
              color: white;
              font-weight: 600;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            tbody tr:hover {
              background-color: #f9fafb;
            }
            tbody tr:last-child td {
              border-bottom: none;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .stock-available {
              color: #059669;
              font-weight: 600;
              background: #d1fae5;
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 11px;
            }
            .stock-low {
              color: #d97706;
              font-weight: 600;
              background: #fef3c7;
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 11px;
            }
            .stock-unavailable {
              color: #dc2626;
              font-weight: 600;
              background: #fecaca;
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 11px;
            }
            .total-row {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              font-weight: 700;
              font-size: 14px;
              border-top: 2px solid #4f46e5;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding: 20px;
              font-size: 11px;
              color: #6b7280;
              background: rgba(255, 255, 255, 0.5);
              border-radius: 12px;
              border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .sku-cell {
              font-weight: 600;
              color: #4f46e5;
            }
            .price-cell {
              font-weight: 600;
              color: #059669;
            }
            .qty-cell {
              font-weight: 600;
              background: #ede9fe;
              border-radius: 6px;
              padding: 6px 10px;
              display: inline-block;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📋 Pedido Sugerido</h1>
            <h2>${clientData ? clientData.nombre : `Cliente: ${formState.clientId}`}</h2>
          </div>
          
          <div class="info">
            <div class="info-grid">
              ${clientData ? `
              <div class="info-item">
                <strong>👤 Cliente ID</strong>
                ${clientData.clave}
              </div>
              <div class="info-item">
                <strong>🏷️ Tipo de Precio</strong>
                ${clientData.precios}
              </div>
              <div class="info-item">
                <strong>💰 Descuento</strong>
                ${clientData.descuento}%
              </div>
              ` : `
              <div class="info-item">
                <strong>👤 Cliente ID</strong>
                ${formState.clientId}
              </div>
              `}
              <div class="info-item">
                <strong>📅 Periodo objetivo</strong>
                ${formatMonth(formState.month)} ${formState.year}
              </div>
              <div class="info-item">
                <strong>📊 Productos analizados</strong>
                ${rowsWithStock.length} con stock disponible
              </div>
              <div class="info-item">
                <strong>🕒 Fecha de generación</strong>
                ${new Date().toLocaleDateString('es-MX', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div class="info-item">
                <strong>🤖 Metodología IA</strong>
                Análisis predictivo comparativo de tendencias
              </div>
            </div>
          </div>

          <!-- Resumen del Mes Actual -->
          <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 20px; border-radius: 16px; margin-bottom: 30px; border: 2px solid #3b82f6;">
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <span style="font-size: 18px; margin-right: 8px;">📊</span>
              <strong style="color: #1e40af; font-size: 16px;">Resumen del Mes Actual vs. Pedido Sugerido</strong>
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
              <div style="background: rgba(255, 255, 255, 0.8); padding: 15px; border-radius: 12px;">
                <div style="color: #1e40af; font-weight: 600; margin-bottom: 5px;">Ya comprado este mes</div>
                <div style="font-size: 18px; font-weight: 700; color: #2563eb;">${Math.round(rowsWithStock.reduce((sum, row) => sum + row.acumuladoMesActual, 0))} unidades</div>
                <div style="font-size: 14px; color: #3b82f6;">${formatCurrency(rowsWithStock.reduce((sum, row) => sum + (row.acumuladoMesActual * row.precio), 0))}</div>
              </div>
              <div style="background: rgba(255, 255, 255, 0.8); padding: 15px; border-radius: 12px;">
                <div style="color: #1e40af; font-weight: 600; margin-bottom: 5px;">Pedido sugerido adicional</div>
                <div style="font-size: 18px; font-weight: 700; color: #059669;">${totalItems} unidades</div>
                <div style="font-size: 14px; color: #059669;">${formatCurrency(totalValue)}</div>
              </div>
            </div>
            <div style="margin-top: 15px; padding: 10px; background: rgba(59, 130, 246, 0.1); border-radius: 8px;">
              <div style="text-align: center; color: #1e40af; font-size: 14px;">
                <strong>Total proyectado para el mes:</strong> ${Math.round(rowsWithStock.reduce((sum, row) => sum + row.acumuladoMesActual + row.qty, 0))} unidades
                (${formatCurrency(rowsWithStock.reduce((sum, row) => sum + (row.acumuladoMesActual * row.precio) + (row.qty * row.precio), 0))})
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Descripción del Producto</th>
                <th class="text-center">Prom. 3M</th>
                <th class="text-center">Año Anterior</th>
                <th class="text-center">Mes Actual</th>
                <th class="text-center">Cantidad</th>
                <th class="text-right">Precio Unit.</th>
                <th class="text-right">Subtotal</th>
                <th class="text-center">Estado Stock</th>
              </tr>
            </thead>
            <tbody>
              ${rowsWithStock.map(row => {
                const stockClass = row.qty > row.existencia ? 'stock-unavailable' :
                                  row.existencia < 10 ? 'stock-low' : 'stock-available';
                const priceDisplay = row.hasClientPrice ? 
                  `${formatCurrency(row.precio)} <span style="color: #d97706; font-size: 10px; background: #fef3c7; padding: 2px 6px; border-radius: 4px; margin-left: 5px;">⭐ Tu precio</span>` :
                  formatCurrency(row.precio);
                return `
                  <tr>
                    <td class="sku-cell">${row.sku}</td>
                    <td>${row.descripcion}</td>
                    <td class="text-center">${row.avgLast3Months.toFixed(1)}</td>
                    <td class="text-center">${row.avgSameMonthLastYear.toFixed(1)}</td>
                    <td class="text-center" style="color: #2563eb; font-weight: 600;">${row.acumuladoMesActual.toFixed(1)}</td>
                    <td class="text-center"><span class="qty-cell">${row.qty}</span></td>
                    <td class="text-right price-cell">${priceDisplay}</td>
                    <td class="text-right price-cell">${formatCurrency(row.qty * row.precio)}</td>
                    <td class="text-center">
                      <span class="${stockClass}">
                        ${getStockStatus(row.existencia, row.qty)}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="5"><strong>💰 TOTALES DEL PEDIDO</strong></td>
                <td class="text-center"><strong>${totalItems} unidades</strong></td>
                <td></td>
                <td class="text-right"><strong>${formatCurrency(totalValue)}</strong></td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          ${(() => {
            const hasAnyClientPricing = rowsWithStock.some(row => row.hasClientPrice);
            return hasAnyClientPricing ? `
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid #d97706;">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                  <span style="font-size: 18px; margin-right: 8px;">⭐</span>
                  <strong style="color: #92400e; font-size: 16px;">Precios Personalizados</strong>
                </div>
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  Los productos marcados con "⭐ Tu precio" tienen precios especiales configurados para tu negocio.
                  Estos precios han sido aplicados automáticamente en tu pedido sugerido.
                </p>
              </div>
            ` : '';
          })()}

          <div class="footer">
            <p><strong>🔮 Levantapedidos - Sistema Inteligente de Predicción</strong></p>
            <p>Generado automáticamente mediante análisis de patrones históricos y algoritmos predictivos</p>
            <p>Los cálculos se basan en la comparación entre promedios de últimos 3 meses vs. mismo período del año anterior</p>
          </div>
        </body>
        </html>
      `;

      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `pedido-sugerido-${clientData ? clientData.nombre.replace(/\s+/g, '-') : formState.clientId}-${formatMonth(formState.month)}-${formState.year}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true,
          allowTaint: false
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        }
      };

      await html2pdf().set(opt).from(htmlContent).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    } finally {
      isGenerating = false;
    }
  }
</script>

{#if rows.length > 0}
  <button
    on:click={generatePdf}
    disabled={isGenerating}
    class="group relative inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:hover:scale-100 overflow-hidden"
  >
    <!-- Background animation -->
    <div class="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    
    <!-- Content -->
    <div class="relative flex items-center space-x-3">
      {#if isGenerating}
        <div class="flex items-center space-x-2">
          <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span>Generando PDF...</span>
        </div>
      {:else}
        <svg class="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 21v-4a2 2 0 00-2-2h-4a2 2 0 00-2 2v4" />
        </svg>
        <span>Exportar PDF</span>
        <div class="inline-flex items-center justify-center w-6 h-6 bg-white/20 rounded-full">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      {/if}
    </div>

    <!-- Shimmer effect -->
    <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out"></div>
  </button>
{:else}
  <div class="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-500 rounded-2xl border border-gray-200">
    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    <span>Sin datos para exportar</span>
  </div>
{/if} 