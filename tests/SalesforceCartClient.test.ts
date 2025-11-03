// filename: tests/SalesforceCartClient.test.ts
import { SalesforceCartClient } from '../src/sf/SalesforceCartClient';
import { CartNotFoundError, CartExpiredError } from '../src/util/errors';

describe('SalesforceCartClient', () => {
  let client: SalesforceCartClient;

  beforeEach(() => {
    client = new SalesforceCartClient();
  });

  describe('createCartContext', () => {
    it('should create a new cart with empty items', () => {
      const { cartId, cart } = client.createCartContext();

      expect(cartId).toMatch(/^c_/);
      expect(cart.items).toEqual([]);
      expect(cart.totals).toEqual({
        subtotalCents: 0,
        taxCents: 0,
        totalCents: 0
      });
      expect(cart.status).toBe('ACTIVE');
      expect(cart.expiresAt).toBeTruthy();
    });

    it('should create carts with unique IDs', () => {
      const cart1 = client.createCartContext();
      const cart2 = client.createCartContext();

      expect(cart1.cartId).not.toBe(cart2.cartId);
    });
  });

  describe('getCartContext', () => {
    it('should retrieve a non-expired cart', () => {
      const { cartId } = client.createCartContext();
      const cart = client.getCartContext(cartId);

      expect(cart).toBeTruthy();
      expect(cart.status).toBe('ACTIVE');
    });

    it('should throw CartNotFoundError for unknown cartId', () => {
      expect(() => client.getCartContext('unknown')).toThrow(CartNotFoundError);
    });

    it('should throw CartExpiredError for expired cart', () => {
      const { cartId } = client.createCartContext();
      
      // Force expiry
      client.forceExpiry(cartId);

      expect(() => client.getCartContext(cartId)).toThrow(CartExpiredError);
    });
  });

  describe('addOrUpdateLineItem', () => {
    it('should add a new item and recalculate totals', () => {
      const { cartId } = client.createCartContext();
      
      const cart = client.addOrUpdateLineItem(cartId, 'IPHONE-15-BLACK-128GB', 1, 129_999);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0]).toEqual({
        sku: 'IPHONE-15-BLACK-128GB',
        quantity: 1,
        unitPriceCents: 129_999,
        lineTotalCents: 129_999
      });
      expect(cart.totals.subtotalCents).toBe(129_999);
      expect(cart.totals.taxCents).toBe(16_900); // 13% HST rounded
      expect(cart.totals.totalCents).toBe(146_899);
    });

    it('should update existing item quantity', () => {
      const { cartId } = client.createCartContext();
      
      client.addOrUpdateLineItem(cartId, 'PLAN-UNLTD-5G', 1, 6_500);
      const cart = client.addOrUpdateLineItem(cartId, 'PLAN-UNLTD-5G', 3, 6_500);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(3);
      expect(cart.items[0].lineTotalCents).toBe(19_500);
      expect(cart.totals.subtotalCents).toBe(19_500);
      expect(cart.totals.taxCents).toBe(2_535); // 13% HST rounded
      expect(cart.totals.totalCents).toBe(22_035);
    });

    it('should handle multiple different items', () => {
      const { cartId } = client.createCartContext();
      
      client.addOrUpdateLineItem(cartId, 'IPHONE-15-BLACK-128GB', 2, 129_999);
      const cart = client.addOrUpdateLineItem(cartId, 'PLAN-UNLTD-5G', 1, 6_500);

      expect(cart.items).toHaveLength(2);
      expect(cart.totals.subtotalCents).toBe(266_498); // 259998 + 6500
      expect(cart.totals.taxCents).toBe(34_645); // 13% HST rounded
      expect(cart.totals.totalCents).toBe(301_143);
    });

    it('should throw CartExpiredError for expired cart', () => {
      const { cartId } = client.createCartContext();
      client.forceExpiry(cartId);

      expect(() => 
        client.addOrUpdateLineItem(cartId, 'IPHONE-15-BLACK-128GB', 1, 129_999)
      ).toThrow(CartExpiredError);
    });

    it('should throw CartNotFoundError for unknown cart', () => {
      expect(() => 
        client.addOrUpdateLineItem('unknown', 'IPHONE-15-BLACK-128GB', 1, 129_999)
      ).toThrow(CartNotFoundError);
    });
  });
});