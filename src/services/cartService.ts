// filename: src/services/cartService.ts
import { SalesforceCartClient } from '../sf/SalesforceCartClient';
import { Cart } from '../domain/cartTypes';
import { ValidationError } from '../util/errors';

// Hardcoded pricing table
const PRICING: Record<string, number> = {
  'IPHONE-15-BLACK-128GB': 129_999,
  'PLAN-UNLTD-5G': 6_500
};

export class CartService {
  constructor(private sfClient: SalesforceCartClient) {}

  createCart(): { cartId: string; cart: Cart } {
    return this.sfClient.createCartContext();
  }

  getCart(cartId: string): Cart {
    return this.sfClient.getCartContext(cartId);
  }

  addOrUpdateItem(cartId: string, sku: string, quantity: number): Cart {
    // Validate inputs
    if (!sku || typeof sku !== 'string') {
      throw new ValidationError('sku is required and must be a string');
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new ValidationError('quantity must be >= 1');
    }

    // Resolve pricing
    const unitPriceCents = PRICING[sku];
    if (unitPriceCents === undefined) {
      throw new ValidationError(`Unknown SKU: ${sku}`);
    }

    return this.sfClient.addOrUpdateLineItem(cartId, sku, quantity, unitPriceCents);
  }
}