// filename: tests/cartRoutes.test.ts
import request from 'supertest';
import { app } from '../src/server';

describe('Cart Routes', () => {
  describe('POST /cart', () => {
    it('should create a new cart with 201 status', async () => {
      const response = await request(app)
        .post('/cart')
        .expect(201);

      expect(response.body).toHaveProperty('cartId');
      expect(response.body.cartId).toMatch(/^c_/);
      expect(response.body.cart).toEqual({
        items: [],
        totals: {
          subtotalCents: 0,
          taxCents: 0,
          totalCents: 0
        },
        status: 'ACTIVE',
        expiresAt: expect.any(String)
      });
    });
  });

  describe('GET /cart/:cartId', () => {
    it('should return 404 for non-existent cart', async () => {
      const response = await request(app)
        .get('/cart/nonexistent')
        .expect(404);

      expect(response.body).toEqual({
        error: {
          type: 'CartNotFound',
          message: 'Cart not found'
        }
      });
    });

    it('should retrieve an existing cart', async () => {
      // Create cart first
      const createResponse = await request(app)
        .post('/cart')
        .expect(201);

      const cartId = createResponse.body.cartId;

      // Retrieve it
      const response = await request(app)
        .get(`/cart/${cartId}`)
        .expect(200);

      expect(response.body.cart).toBeTruthy();
      expect(response.body.cart.status).toBe('ACTIVE');
    });

    it('should return 410 for expired cart', async () => {
      // This test requires direct access to force expiry
      // We'll use the SalesforceCartClient directly
      const { SalesforceCartClient } = require('../src/sf/SalesforceCartClient');
      const client = new SalesforceCartClient();
      
      const { cartId } = client.createCartContext();
      client.forceExpiry(cartId);

      // Now create a new app instance with this client
      const express = require('express');
      const { CartService } = require('../src/services/cartService');
      const { CartController } = require('../src/controllers/cartController');
      const { createCartRoutes } = require('../src/routes/cartRoutes');

      const testApp = express();
      testApp.use(express.json());
      
      const cartService = new CartService(client);
      const cartController = new CartController(cartService);
      testApp.use(createCartRoutes(cartController));

      const response = await request(testApp)
        .get(`/cart/${cartId}`)
        .expect(410);

      expect(response.body).toEqual({
        error: {
          type: 'CartExpired',
          message: 'Cart has expired'
        }
      });
    });
  });

  describe('POST /cart/:cartId/items', () => {
    it('should return 400 for invalid quantity', async () => {
      const createResponse = await request(app)
        .post('/cart')
        .expect(201);

      const cartId = createResponse.body.cartId;

      const response = await request(app)
        .post(`/cart/${cartId}/items`)
        .send({ sku: 'IPHONE-15-BLACK-128GB', quantity: 0 })
        .expect(400);

      expect(response.body.error.type).toBe('ValidationError');
      expect(response.body.error.message).toContain('quantity must be >= 1');
    });

    it('should return 400 for unknown SKU', async () => {
      const createResponse = await request(app)
        .post('/cart')
        .expect(201);

      const cartId = createResponse.body.cartId;

      const response = await request(app)
        .post(`/cart/${cartId}/items`)
        .send({ sku: 'UNKNOWN-PRODUCT', quantity: 1 })
        .expect(400);

      expect(response.body.error.type).toBe('ValidationError');
      expect(response.body.error.message).toContain('Unknown SKU');
    });

    it('should add item and return correct totals', async () => {
      const createResponse = await request(app)
        .post('/cart')
        .expect(201);

      const cartId = createResponse.body.cartId;

      const response = await request(app)
        .post(`/cart/${cartId}/items`)
        .send({ sku: 'IPHONE-15-BLACK-128GB', quantity: 2 })
        .expect(200);

      expect(response.body.cart.items).toHaveLength(1);
      expect(response.body.cart.items[0]).toEqual({
        sku: 'IPHONE-15-BLACK-128GB',
        quantity: 2,
        unitPriceCents: 129_999,
        lineTotalCents: 259_998
      });
      expect(response.body.cart.totals).toEqual({
        subtotalCents: 259_998,
        taxCents: 33_800, // 13% HST
        totalCents: 293_798
      });
    });

    it('should update existing item quantity', async () => {
      const createResponse = await request(app)
        .post('/cart')
        .expect(201);

      const cartId = createResponse.body.cartId;

      // Add item
      await request(app)
        .post(`/cart/${cartId}/items`)
        .send({ sku: 'PLAN-UNLTD-5G', quantity: 1 })
        .expect(200);

      // Update same item
      const response = await request(app)
        .post(`/cart/${cartId}/items`)
        .send({ sku: 'PLAN-UNLTD-5G', quantity: 3 })
        .expect(200);

      expect(response.body.cart.items).toHaveLength(1);
      expect(response.body.cart.items[0].quantity).toBe(3);
      expect(response.body.cart.totals.subtotalCents).toBe(19_500);
    });

    it('should handle complete workflow with exact totals', async () => {
      // Create cart
      const createResponse = await request(app)
        .post('/cart')
        .expect(201);

      const cartId = createResponse.body.cartId;
      expect(cartId).toMatch(/^c_/);

      // Add PLAN-UNLTD-5G with quantity 1
      const response = await request(app)
        .post(`/cart/${cartId}/items`)
        .send({ sku: 'PLAN-UNLTD-5G', quantity: 1 })
        .expect(200);

      expect(response.body.cart.items).toHaveLength(1);
      expect(response.body.cart.items[0]).toEqual({
        sku: 'PLAN-UNLTD-5G',
        quantity: 1,
        unitPriceCents: 6_500,
        lineTotalCents: 6_500
      });
      expect(response.body.cart.totals).toEqual({
        subtotalCents: 6_500,
        taxCents: 845, // Math.round(6500 * 0.13)
        totalCents: 7_345
      });
    });

    it('should return 404 for non-existent cart', async () => {
      const response = await request(app)
        .post('/cart/nonexistent/items')
        .send({ sku: 'IPHONE-15-BLACK-128GB', quantity: 1 })
        .expect(404);

      expect(response.body).toEqual({
        error: {
          type: 'CartNotFound',
          message: 'Cart not found'
        }
      });
    });
  });
});