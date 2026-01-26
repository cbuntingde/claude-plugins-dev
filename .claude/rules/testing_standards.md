# Testing Standards

## Test Coverage Requirements

- **80%+ unit test coverage** for all business logic
- **100% coverage** for security-critical code
- Integration tests for all external integrations
- End-to-end tests for critical user journeys
- Tests for both success AND failure paths
- Tests are deterministic and isolated (no flaky tests)
- Property-based testing for core algorithms
- Snapshot tests must be reviewed manually

## Test Quality Standards

```typescript
// NEVER - Weak test
it("should work", () => {
  expect(result).toBe("foo");
});

// ALWAYS - Comprehensive test with edge cases
describe("UserProcessor", () => {
  describe("processUser", () => {
    it("should process valid user successfully", () => {
      const user = createValidUser();
      const result = processor.processUser(user);
      expect(result.success).toBe(true);
      expect(result.data.id).toBeDefined();
    });

    it("should reject users with invalid email", () => {
      const user = { ...createValidUser(), email: "invalid" };
      const result = processor.processUser(user);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe("INVALID_EMAIL");
    });

    it("should reject users with missing required fields", () => {
      const user = createValidUser();
      delete user.email;
      const result = processor.processUser(user);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe("MISSING_FIELD");
    });
  });
});
```

## Test Infrastructure
- Tests must run in CI before merge
- Test database must be isolated per test suite
- Use test doubles (mocks, stubs) appropriately
- Clear test setup and teardown
- Meaningful test names describing behavior

## Test Organization

### Unit Tests
- Test individual functions/methods in isolation
- Mock external dependencies
- Fast execution (< 100ms per test)
- Focus on business logic and edge cases

### Integration Tests
- Test interaction between components
- Use real dependencies where possible
- Test database transactions
- Verify API contracts

### End-to-End Tests
- Test complete user workflows
- Use realistic test data
- Verify critical business paths
- Test error scenarios

## Testing Best Practices

### Test Naming
- Use descriptive names: "should reject invalid email format"
- Follow pattern: "should [expected behavior] when [condition]"
- Group related tests in describe blocks

### Test Data
- Use factories or builders for test data
- Avoid hardcoded magic values
- Make test data intention-revealing
- Isolate test data between tests

### Assertions
- One logical assertion per test
- Use specific matchers (toBe, toEqual, toContain)
- Assert on behavior, not implementation
- Test error messages and codes

### Test Doubles
- Use mocks sparingly - prefer real objects when possible
- Verify mock interactions when behavior matters
- Use stubs for consistent return values
- Use spies to verify side effects

## Property-Based Testing

For algorithms and core logic:
- Generate random valid inputs
- Verify invariants hold for all inputs
- Find edge cases automatically
- Use libraries like fast-check or jsverify

## Performance Testing

- Benchmark critical paths
- Test with realistic data volumes
- Verify response times meet SLAs
- Test concurrent usage scenarios

## Security Testing

- Test input validation thoroughly
- Verify authorization checks
- Test authentication flows
- Verify sensitive data handling
- Test rate limiting
- Verify CSRF protection