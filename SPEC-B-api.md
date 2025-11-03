# Base
JSON everywhere. Money in cents (integers). ISO8601 UTC times. Error envelope:
```json
{ "error": { "type": "<Type>", "message": "<Message>" } }
```

## POST /cart → 201
Response:
```json
{
  "cartId": "c_abc123",
  "cart": {
    "items": [],
    "totals": { "subtotalCents": 0, "taxCents": 0, "totalCents": 0 },
    "status": "ACTIVE",
    "expiresAt": "2025-10-28T02:15:00.000Z"
  }
}
```

## GET /cart/:cartId → 200 | 404 | 410

**404**: `{ "error": { "type": "CartNotFound", "message": "Cart not found" } }`

**410**: `{ "error": { "type": "CartExpired", "message": "Cart has expired" } }`

## POST /cart/:cartId/items → 200 | 400 | 404 | 410
Request:
```json
{ "sku": "IPHONE-15-BLACK-128GB", "quantity": 2 }
```

Validation: sku required string; quantity integer ≥ 1.
Unknown SKU → ValidationError (400).