# Core Development Standards

## Implementation Completeness (Non-Negotiable)

**ALL features must be 100% fully implemented before merge. There are no exceptions.**

- NO mock implementations, stub functions, or placeholder code
- NO commented-out code that represents unimplemented features
- NO `console.log` debugging statements in production code
- NO `TODO` comments without associated ticket references
- NO `FIXME` comments allowed in any codebase
- NO empty catch blocks - all errors must be handled meaningfully
- NO hardcoded test data or fixtures that appear in production code
- Every public API function must have complete error handling
- Every feature flag must have a clear removal timeline
- All edge cases must be handled, not just the "happy path"

If a feature cannot be fully implemented, it must be removed entirely, not left as incomplete code.

## Code Quality Standards

- **Self-documenting code**: Complex logic should be readable without excessive comments
- **Clear naming**: Variables, functions, and classes must have descriptive names
- **Single responsibility**: Each function does one thing well
- **DRY principle**: Avoid duplication, but prioritize readability over brevity
- **Fail fast**: Validate inputs early and throw descriptive errors
- **Fail safely**: Clean up resources even when errors occur

## Type Safety & TypeScript Standards

### Strict Typing Required

- NO use of `any` type - use specific types or unions
- NO implicit `any` - enable `noImplicitAny` in TypeScript config
- Use discriminated unions for error handling
- Define domain models with precise types
- Use Branded types for type-safe primitives
- Implement proper generics for reusable logic

```typescript
// NEVER
function processInput(input: any): any {
  return input;
}

// ALWAYS
type UserId = string & { readonly brand: unique symbol };
type Email = string & { readonly brand: unique symbol };

interface ProcessResult {
  success: boolean;
  data?: UserId;
  error?: {
    code: string;
    message: string;
  };
}

function processInput(input: string): ProcessResult {
  // Implementation
}
```

### Type Coverage
- All API responses must have defined types
- All configuration objects must be typed
- All event payloads must have types
- Error types must be exhaustive

## Error Handling Standards

### Comprehensive Error Handling

```typescript
// NEVER - Silent failures
try {
  await operation();
} catch (e) {
  // Empty - swallowed error
}

// NEVER - Non-descriptive errors
try {
  await operation();
} catch (e) {
  throw new Error("Failed");
}

// ALWAYS - Contextual errors with proper types
try {
  await operation();
} catch (error) {
  if (error instanceof ValidationError) {
    throw new ClientError("Invalid input", { validationErrors: error.details });
  }
  throw new InternalError("Operation failed", { originalError: error.message });
}
```

### Error Types Hierarchy
- Create specific error classes for different failure modes
- Implement error codes for programmatic handling
- Include correlation IDs in distributed systems
- Log errors with appropriate context
- Implement retry logic with exponential backoff
- Use circuit breaker for external dependencies

## Professional Quality Standards

When asked to ensure code meets professional/production quality standards:

- **Never use the word "enterprise"** in any code, comments, documentation, or output
- Demonstrate quality through:
  - Strict adherence to all security rules
  - Comprehensive input validation and error handling
  - Proper TypeScript types or JSDoc signatures
  - Well-structured, readable code with clear naming
  - Complete test coverage for critical paths
  - Observability via structured logging and health checks
- Let the implementation speak for itself rather than using marketing language