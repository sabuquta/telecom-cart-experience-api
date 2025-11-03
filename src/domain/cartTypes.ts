// filename: src/domain/cartTypes.ts
export interface LineItem {
    sku: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }
  
  export interface CartTotals {
    subtotalCents: number;
    taxCents: number;
    totalCents: number;
  }
  
  export interface Cart {
    items: LineItem[];
    totals: CartTotals;
    status: 'ACTIVE';
    expiresAt: string;
  }
  
  export interface CartContext {
    cartId: string;
    cart: Cart;
    createdAt: Date;
    lastAccessAt: Date;
    expiresAt: Date;
  }