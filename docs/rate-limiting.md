# API Rate Limiting and Traffic Management

## Throttling Rules
- **Standard Users**: 120 requests per minute per IP address.
- **Analytical Export Endpoints**: 10 bulk exports per hour per authenticated user.
- **AI Query Assistant (NLQ)**: 30 requests per minute per user session.

## Response Headers
- `X-RateLimit-Limit`: Maximum requests allowed in the current window.
- `X-RateLimit-Remaining`: Number of remaining allowed requests.
- `Retry-After`: Seconds to wait before retrying when HTTP 429 is encountered.
