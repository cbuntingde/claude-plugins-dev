# API Design Principles

## RESTful API Standards
- Use proper HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Implement proper status codes (200, 201, 400, 401, 403, 404, 500)
- Use plural nouns for resources
- Implement pagination for collections
- Support filtering and sorting
- Use HATEOAS for discoverability

## HTTP Methods Usage

### GET
- Retrieve resources
- Idempotent and safe
- No request body
- Cache-friendly

### POST
- Create new resources
- Not idempotent
- Returns 201 Created with Location header

### PUT
- Replace entire resource
- Idempotent
- Returns 200 OK or 204 No Content

### PATCH
- Partial resource update
- Idempotent
- Returns 200 OK

### DELETE
- Remove resource
- Idempotent
- Returns 204 No Content

## Status Codes

### Success (2xx)
- 200 OK - Successful GET, PUT, PATCH
- 201 Created - Successful POST
- 204 No Content - Successful DELETE

### Client Errors (4xx)
- 400 Bad Request - Invalid input
- 401 Unauthorized - Missing/invalid auth
- 403 Forbidden - Authenticated but not authorized
- 404 Not Found - Resource doesn't exist
- 422 Unprocessable Entity - Validation failed
- 429 Too Many Requests - Rate limit exceeded

### Server Errors (5xx)
- 500 Internal Server Error - Unexpected error
- 502 Bad Gateway - Upstream service error
- 503 Service Unavailable - Temporary outage
- 504 Gateway Timeout - Upstream timeout

## API Versioning
- Use URL versioning (/v1/, /v2/)
- Maintain backward compatibility for one major version
- Document breaking changes clearly
- Provide migration guides

## Response Formats

### Success Response
```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    pagination?: PaginationMeta;
    requestId: string;
    timestamp: string;
  };
}
```

### Error Response
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}
```

### Pagination
```typescript
interface PaginationMeta {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

## Resource Naming

### Collections and Resources
- Use plural nouns: `/users`, `/products`
- Use hierarchical structure: `/users/{id}/orders`
- Avoid verbs in URLs (use HTTP methods instead)

### Query Parameters
- Filtering: `?status=active&role=admin`
- Sorting: `?sort=created_at&order=desc`
- Pagination: `?page=2&limit=50`
- Searching: `?q=search+term`
- Field selection: `?fields=id,name,email`

## Request/Response Best Practices

### Request Headers
- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {token}
- X-Request-ID: {uuid}

### Response Headers
- Content-Type: application/json
- X-Request-ID: {uuid}
- X-RateLimit-Limit: 1000
- X-RateLimit-Remaining: 999
- X-RateLimit-Reset: 1640995200

### Request Body Validation
- Validate all inputs
- Return detailed error messages
- Use JSON Schema for validation
- Sanitize inputs

## Rate Limiting

### Implementation
- Use token bucket or sliding window
- Return 429 when exceeded
- Include rate limit headers
- Document limits clearly

### Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## API Documentation

### Required Information
- Endpoint description
- HTTP method
- URL path with parameters
- Request body schema
- Response body schema
- Error responses
- Example requests/responses
- Authentication requirements

### Tools
- OpenAPI/Swagger specification
- Postman collections
- Interactive API explorer
- Code examples in multiple languages