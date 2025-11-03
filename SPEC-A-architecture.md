// filename: SPEC-A-architecture.md
# Purpose
Define architecture & abstractions for a thin Telecom Cart Experience API fronting a non-persistent Salesforce "cart context". No DB; in-memory test double; typed errors; minimal logic.

## Layers

**HTTP**: server.ts, routes/cartRoutes.ts map REST to controller, set status codes.

**Controller**: controllers/cartController.ts translates HTTP ↔ service DTOs; no business logic.

**Service**: services/cartService.ts orchestrates operations, validates inputs, looks up pricing, calls SF client, returns DTOs; throws typed errors (CartNotFoundError, CartExpiredError, ValidationError).

**Salesforce client (test double)**: sf/SalesforceCartClient.ts holds in-memory map of carts with createdAt/lastAccessAt/expiresAt; enforces expiry; upserts items; recalculates totals via pure helpers.

**Domain**: domain/cartTypes.ts (types), domain/cartLogic.ts (pure helpers: upsert, totals).

**Errors**: util/errors.ts.

## Data Flow

**POST /cart** → service.createCart → sfClient.createCartContext → returns {cartId, cart}.

**GET /cart/:id** → service.getCart → sfClient.getCartContext; map errors to 404/410.

**POST /cart/:id/items** → service.addOrUpdateItem (validate sku, quantity ≥1; resolve unitPrice) → sfClient.addOrUpdateLineItem → returns updated cart.

## Out of scope
Real Salesforce IO, promos, device financing, province tax logic, auth, concurrency, observability.

## Test strategy
Unit tests for SF client, service validation/propagation, and route mappings.