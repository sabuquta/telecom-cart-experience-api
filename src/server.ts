// filename: src/server.ts
import express from 'express';
import { SalesforceCartClient } from './sf/SalesforceCartClient';
import { CartService } from './services/cartService';
import { CartController } from './controllers/cartController';
import { createCartRoutes } from './routes/cartRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Dependency injection
const sfClient = new SalesforceCartClient();
const cartService = new CartService(sfClient);
const cartController = new CartController(cartService);

// Routes
app.use(createCartRoutes(cartController));

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export { app };