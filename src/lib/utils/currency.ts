// src/lib/utils/currency.ts
/**
 * Utilidad de formato de moneda internacional para Sayta Mall.
 * Moneda por defecto: Córdoba nicaragüense (NIO - C$).
 * Totalmente configurable por sucursal.
 */

export function formatCurrency(
  amount: number,
  currencyCode = 'NIO',
  locale = 'es-NI'
): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 'C$ 0.00';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback manual en caso de locale no soportado
    const formattedNum = amount.toLocaleString('es-NI', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return currencyCode === 'NIO' ? `C$ ${formattedNum}` : `$ ${formattedNum} ${currencyCode}`;
  }
}
