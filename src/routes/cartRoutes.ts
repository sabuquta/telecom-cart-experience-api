// filename: src/routes/cartRoutes.ts
import { Router } from 'express';
import { CartController } from '../controllers/cartController';

export function createCartRoutes(controller: CartController): Router {
  const router = Router();

  router.post('/cart', controller.createCart);
  router.get('/cart/:cartId', controller.getCart);
  router.post('/cart/:cartId/items', controller.addOrUpdateItem);

  return router;
}