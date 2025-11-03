// filename: tests/cartService.test.ts
import { CartService } from '../src/services/cartService';
import { SalesforceCartClient } from '../src/sf/SalesforceCartClient';
import { ValidationError } from '../src/util/errors';

describe('CartService', () => {
  let service: CartService;
  let sfClient: SalesforceCartClient;

  beforeEach(() => {
    sfClient = new SalesforceCartClient();
    service = new CartService(sfClient);
  });

  describe('createCart', () => {
    it('should create a new cart', () => {
      const result = service.createCart();

      expect(result.cartId).toMatch(/^c_/);
      expect(result.cart.items).toEqual([]);
      expect(result.cart.totals.subtotalCents).toBe(0);
    });
  });

  describe('getCart', () => {
    it('should retrieve an existing cart', () => {
      const { cartId } = service.createCart();
      const cart = service.getCart(cartId);

      expect(cart).toBeTruthy();
      expect(cart.status).toBe('ACTIVE');
    });
  });

  describe('addOrUpdateItem', () => {
    it('should validate quantity >= 1', () => {
      const { cartId } = service.createCart();

      expect(() => 
        service.addOrUpdateItem(cartId, 'IPHONE-15-BLACK-128GB', 0)
      ).toThrow(ValidationError);

      expect(() => 
        service.addOrUpdateItem(cartId, 'IPHONE-15-BLACK-128GB', -1)
      ).toThrow(ValidationError);
    });

    it('should validate quantity is an integer', () => {
      const { cartId } = service.createCart();

      expect(() => 
        service.addOrUpdateItem(cartId, 'IPHONE-15-BLACK-128GB', 1.5)
      ).toThrow(ValidationError);
    });

    it('should reject unknown SKU', () => {
      const { cartId } = service.createCart();

      expect(() => 
        service.addOrUpdateItem(cartId, 'UNKNOWN-SKU', 1)
      ).toThrow(ValidationError);
      
      expect(() => 
        service.addOrUpdateItem(cartId, 'UNKNOWN-SKU', 1)
      ).toThrow('Unknown SKU');
    });

    it('should validate sku is a string', () => {
      const { cartId } = service.createCart();

      expect(() => 
        service.addOrUpdateItem(cartId, '' as any, 1)
      ).toThrow(ValidationError);
    });

    it('should add item with correct pricing and totals', () => {
      const { cartId } = service.createCart();
      const cart = service.addOrUpdateItem(cartId, 'IPHONE-15-BLACK-128GB', 1);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].unitPriceCents).toBe(129_999);
      expect(cart.items[0].lineTotalCents).toBe(129_999);
      expect(cart.totals.subtotalCents).toBe(129_999);
      expect(cart.totals.taxCents).toBe(16_900); // 13% HST
      expect(cart.totals.totalCents).toBe(146_899);
    });

    it('should update existing item', () => {
      const { cartId } = service.createCart();
      
      service.addOrUpdateItem(cartId, 'PLAN-UNLTD-5G', 1);
      const cart = service.addOrUpdateItem(cartId, 'PLAN-UNLTD-5G', 2);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.totals.subtotalCents).toBe(13_000);
      expect(cart.totals.taxCents).toBe(1_690); // 13% HST
      expect(cart.totals.totalCents).toBe(14_690);
    });

    it('should handle multiple items with correct totals', () => {
      const { cartId } = service.createCart();
      
      service.addOrUpdateItem(cartId, 'IPHONE-15-BLACK-128GB', 1);
      const cart = service.addOrUpdateItem(cartId, 'PLAN-UNLTD-5G', 1);

      expect(cart.items).toHaveLength(2);
      expect(cart.totals.subtotalCents).toBe(136_499); // 129999 + 6500
      expect(cart.totals.taxCents).toBe(17_745); // 13% HST
      expect(cart.totals.totalCents).toBe(154_244);
    });
  });
});