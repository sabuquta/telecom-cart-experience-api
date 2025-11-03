// filename: src/util/errors.ts
export class CartNotFoundError extends Error {
    constructor(cartId: string) {
      super(`Cart not found`);
      this.name = 'CartNotFoundError';
    }
  }
  
  export class CartExpiredError extends Error {
    constructor(cartId: string) {
      super(`Cart has expired`);
      this.name = 'CartExpiredError';
    }
  }
  
  export class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  }