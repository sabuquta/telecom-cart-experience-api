// filename: src/sf/SalesforceCartClient.ts
import { Cart, CartContext } from '../domain/cartTypes';
import { upsertLineItem, calculateTotals } from '../domain/cartLogic';
import { CartNotFoundError, CartExpiredError } from '../util/errors';

export class SalesforceCartClient {
  private carts: Map<string, CartContext> = new Map();
  private cartCounter = 0;
  private readonly TTL_MS = 15 * 60 * 1000; // 15 minutes

  /**
   * Create a new cart context with 15-minute expiry.
   */
  createCartContext(): { cartId: string; cart: Cart } {
    this.cartCounter++;
    const cartId = `c_${Math.random().toString(36).substring(2, 9)}${this.cartCounter}`;
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.TTL_MS);

    const cart: Cart = {
      items: [],
      totals: {
        subtotalCents: 0,
        taxCents: 0,
        totalCents: 0
      },
      status: 'ACTIVE',
      expiresAt: expiresAt.toISOString()
    };

    const context: CartContext = {
      cartId,
      cart,
      createdAt: now,
      lastAccessAt: now,
      expiresAt
    };

    this.carts.set(cartId, context);

    return { cartId, cart };
  }

  /**
   * Get cart context, enforcing expiry.
   * Throws CartNotFoundError if cart doesn't exist.
   * Throws CartExpiredError if cart has expired.
   */
  getCartContext(cartId: string): Cart {
    const context = this.carts.get(cartId);
    
    if (!context) {
      throw new CartNotFoundError(cartId);
    }

    const now = new Date();
    if (now > context.expiresAt) {
      throw new CartExpiredError(cartId);
    }

    // Update last access time
    context.lastAccessAt = now;

    return context.cart;
  }

  /**
   * Add or update a line item, then recalculate totals.
   * Throws CartNotFoundError or CartExpiredError.
   */
  addOrUpdateLineItem(
    cartId: string,
    sku: string,
    quantity: number,
    unitPriceCents: number
  ): Cart {
    const context = this.carts.get(cartId);
    
    if (!context) {
      throw new CartNotFoundError(cartId);
    }

    const now = new Date();
    if (now > context.expiresAt) {
      throw new CartExpiredError(cartId);
    }

    // Update last access
    context.lastAccessAt = now;

    // Upsert item
    const updatedItems = upsertLineItem(
      context.cart.items,
      sku,
      quantity,
      unitPriceCents
    );

    // Recalculate totals
    const totals = calculateTotals(updatedItems);

    context.cart = {
      ...context.cart,
      items: updatedItems,
      totals
    };

    return context.cart;
  }

  /**
   * Force a cart to expire (test helper).
   */
  forceExpiry(cartId: string): void {
    const context = this.carts.get(cartId);
    if (context) {
      context.expiresAt = new Date(Date.now() - 1000); // 1 second in the past
    }
  }
}