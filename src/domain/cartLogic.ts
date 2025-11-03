// filename: src/domain/cartLogic.ts
import { LineItem, CartTotals } from './cartTypes';

/**
 * Upsert a line item in the cart. If SKU exists, update quantity; otherwise add new item.
 */
export function upsertLineItem(
  items: LineItem[],
  sku: string,
  quantity: number,
  unitPriceCents: number
): LineItem[] {
  const existingIndex = items.findIndex(item => item.sku === sku);
  
  const newItem: LineItem = {
    sku,
    quantity,
    unitPriceCents,
    lineTotalCents: quantity * unitPriceCents
  };

  if (existingIndex >= 0) {
    // Update existing
    const updated = [...items];
    updated[existingIndex] = newItem;
    return updated;
  } else {
    // Add new
    return [...items, newItem];
  }
}

/**
 * Calculate cart totals with 13% HST tax.
 */
export function calculateTotals(items: LineItem[]): CartTotals {
  const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  const taxCents = Math.round(subtotalCents * 0.13);
  const totalCents = subtotalCents + taxCents;

  return {
    subtotalCents,
    taxCents,
    totalCents
  };
}