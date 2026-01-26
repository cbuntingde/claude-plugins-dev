# Production Readiness

Before any code is committed, verify:

## Code Quality
- [ ] All functions have typed signatures (TypeScript) or JSDoc
- [ ] No `any` types - use specific types or unions
- [ ] Code is self-documenting with clear naming
- [ ] Complex logic has explanatory comments
- [ ] No commented-out code
- [ ] No TODO comments (or they must have ticket references)
- [ ] No console.log statements
- [ ] No hardcoded values (use environment variables)

## Error Handling
- [ ] ALL async operations have try/catch
- [ ] Errors include context but no sensitive data
- [ ] Fallback behavior is defined for all error cases
- [ ] Resource cleanup in finally blocks (files, connections, etc.)
- [ ] Rate limiting and circuit breaker patterns for external calls
- [ ] All error cases have tests

## Testing
- [ ] Unit tests for ALL business logic (80%+ coverage)
- [ ] Integration tests for critical paths
- [ ] Security tests for input validation
- [ ] Tests validate both success AND failure paths
- [ ] Tests are deterministic and isolated
- [ ] No flaky tests

## Performance
- [ ] No blocking operations on main thread
- [ ] Connection pooling for databases/external services
- [ ] Response streaming for large payloads
- [ ] Proper cleanup of event listeners and subscriptions
- [ ] Caching implemented where appropriate
- [ ] Database queries are indexed and optimized

## Observability
- [ ] Structured logging with consistent format
- [ ] Log levels: DEBUG, INFO, WARN, ERROR, FATAL
- [ ] Performance metrics for critical operations
- [ ] Health check endpoints for services
- [ ] Alerting configured for error thresholds
- [ ] Distributed tracing for microservices

## Configuration
- [ ] No hardcoded values - use environment variables
- [ ] Secrets NEVER logged or exposed in error messages
- [ ] Configuration validated at startup
- [ ] Defaults are safe (secure) values
- [ ] Configuration is version-controlled (non-sensitive)

## Documentation
- [ ] API documentation for all public interfaces
- [ ] Security considerations documented
- [ ] Deployment instructions with security notes
- [ ] Incident response procedures documented
- [ ] Architecture decision records (ADRs) for major changes

## Performance Standards

### Latency Requirements
- API responses should be under 200ms for 95th percentile
- Background jobs should report progress
- Long-running operations should be async

### Resource Management
- Connection pooling for all external services
- Memory-efficient streaming for large data
- Proper cleanup of event listeners
- Avoid memory leaks in long-running processes

### Scaling Considerations
- Stateless where possible
- Horizontal scaling ready
- Rate limiting implemented
- Queue-based processing for heavy tasks

## Monitoring & Alerting

### Metrics
- Track request latency percentiles (p50, p95, p99)
- Monitor error rates by endpoint
- Track business metrics (signups, conversions)
- Monitor resource utilization (CPU, memory, disk)

### Alerting
- Alert on error rate spikes
- Alert on latency degradation
- Alert on resource exhaustion
- Alert on security events
- Define runbooks for each alert

### Logging Standards
```typescript
interface LogEntry {
  timestamp: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";
  message: string;
  requestId?: string;
  userId?: string;
  service: string;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}
```

## Dependency Management

### Version Pinning
- Use exact versions in lockfiles
- Review dependency updates weekly
- Test updates before merging
- Remove unused dependencies

### Dependency Review
- Evaluate necessity of each dependency
- Check for known vulnerabilities
- Assess maintenance status
- Consider bundle size impact
- Verify license compatibility