// filename: src/controllers/cartController.ts
import { Request, Response } from 'express';
import { CartService } from '../services/cartService';
import { CartNotFoundError, CartExpiredError, ValidationError } from '../util/errors';

export class CartController {
  constructor(private cartService: CartService) {}

  createCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = this.cartService.createCart();
      res.status(201).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  getCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const { cartId } = req.params;
      const cart = this.cartService.getCart(cartId);
      res.status(200).json({ cart });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  addOrUpdateItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const { cartId } = req.params;
      const { sku, quantity } = req.body;

      const cart = this.cartService.addOrUpdateItem(cartId, sku, quantity);
      res.status(200).json({ cart });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  private handleError(res: Response, error: unknown): void {
    if (error instanceof CartNotFoundError) {
      res.status(404).json({
        error: {
          type: 'CartNotFound',
          message: 'Cart not found'
        }
      });
    } else if (error instanceof CartExpiredError) {
      res.status(410).json({
        error: {
          type: 'CartExpired',
          message: 'Cart has expired'
        }
      });
    } else if (error instanceof ValidationError) {
      res.status(400).json({
        error: {
          type: 'ValidationError',
          message: error.message
        }
      });
    } else {
      res.status(500).json({
        error: {
          type: 'Internal',
          message: 'Unexpected error'
        }
      });
    }
  }
}