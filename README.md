# Telecom Cart Experience API

A thin Experience API for a telecom cart built on top of a simulated (non-persistent) Salesforce cart context.

## Features

- Create cart contexts with 15-minute TTL
- Add/update line items by SKU (upsert semantics)
- Automatic tax calculation (13% HST)
- Cart expiry enforcement
- In-memory storage (no database)
- Comprehensive error handling with typed errors

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Express (minimal)
- **Testing**: Jest + Supertest
- **Money**: Integer cents throughout

## Setup
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Run with coverage
npm test:coverage

# Start server
npm start

# Or run in development mode
npm run dev
```

## API Usage

### Create Cart
```bash
POST http://localhost:3000/cart
Response: 201
{
  "cartId": "c_abc123",
  "cart": {
    "items": [],
    "totals": { "subtotalCents": 0, "taxCents": 0, "totalCents": 0 },
    "status": "ACTIVE",
    "expiresAt": "2025-11-02T15:30:00.000Z"
  }
}
```

### Get Cart
```bash
GET http://localhost:3000/cart/:cartId
Response: 200 (or 404/410)
```

### Add/Update Item
```bash
POST http://localhost:3000/cart/:cartId/items
Content-Type: application/json

{
  "sku": "IPHONE-15-BLACK-128GB",
  "quantity": 2
}

Response: 200
{
  "cart": {
    "items": [
      {
        "sku": "IPHONE-15-BLACK-128GB",
        "quantity": 2,
        "unitPriceCents": 129999,
        "lineTotalCents": 259998
      }
    ],
    "totals": {
      "subtotalCents": 259998,
      "taxCents": 33800,
      "totalCents": 293798
    },
    "status": "ACTIVE",
    "expiresAt": "2025-11-02T15:30:00.000Z"
  }
}
```

## Available SKUs

| SKU | Price (cents) |
|-----|---------------|
| IPHONE-15-BLACK-128GB | 129,999 |
| PLAN-UNLTD-5G | 6,500 |

## Error Responses

All errors follow the format:
```json
{
  "error": {
    "type": "<ErrorType>",
    "message": "<Human readable message>"
  }
}
```

| Scenario | HTTP Status | Error Type |
|----------|-------------|------------|
| Cart not found | 404 | CartNotFound |
| Cart expired | 410 | CartExpired |
| Validation failure | 400 | ValidationError |
| Server error | 500 | Internal |

## Project Structure
```
.
├── src/
│   ├── server.ts                 # Express server setup
│   ├── routes/cartRoutes.ts      # Route definitions
│   ├── controllers/cartController.ts  # HTTP layer
│   ├── services/cartService.ts   # Business logic
│   ├── sf/SalesforceCartClient.ts # Test double
│   ├── domain/
│   │   ├── cartTypes.ts          # Type definitions
│   │   └── cartLogic.ts          # Pure functions
│   └── util/errors.ts            # Custom errors
└── tests/
    ├── cartRoutes.test.ts
    ├── cartService.test.ts
    └── SalesforceCartClient.test.ts
```

## Known Gaps

- No real Salesforce integration (in-memory test double only)
- No persistence (carts lost on restart)
- No authentication/authorization
- No concurrency control
- Simplified tax logic (flat 13% HST, no provincial variations)
- No promotional pricing or discounts
- No device financing
- No observability/metrics
- Cart expiry based on simple TTL (no sliding window)

## Testing

The project includes comprehensive unit tests covering:
- Salesforce client cart lifecycle and expiry
- Service layer validation and error propagation
- HTTP routes with proper status codes and error envelopes

Run tests with:
```bash
npm test
```

## License

ISC