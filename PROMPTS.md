// filename: PROMPTS.md
# Prompts Used

## Master Prompt
**Status**: Accepted

The initial prompt requested a complete TypeScript Node 20+ project implementing a thin Experience API for a telecom cart on top of a simulated Salesforce cart context. Key requirements:

- TypeScript with Express (minimal)
- In-memory SalesforceCartClient test double with context expiry
- No database, pure functions preferred
- Jest unit tests covering critical paths
- All money amounts in integer cents
- Structured error responses with type and message
- 13% HST tax calculation
- 15-minute cart TTL
- Specific file structure under src/ and tests/

The prompt included exact specifications for SPEC-A-architecture.md and SPEC-B-api.md to be included verbatim, plus requirements for README.md, .gitignore, and comprehensive documentation.

## Follow-ups
None required - implementation completed as specified in master prompt.