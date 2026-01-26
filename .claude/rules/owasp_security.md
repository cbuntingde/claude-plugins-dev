# OWASP Security Compliance

All code MUST comply with OWASP Top 10 security principles. Treat security as non-negotiable.

## 1. Input Validation & Sanitization (A03:2021)
- **ALL** external inputs must be validated against strict allow-lists
- Use parameterized queries for ALL database operations (NO string concatenation)
- Sanitize ALL user inputs before any processing or display
- Validate data types, lengths, formats, and ranges
- Reject unexpected characters or patterns immediately
- Use whitelist validation: deny by default, permit by exception

```javascript
// NEVER - SQL Injection vulnerability
const query = "SELECT * FROM users WHERE id = " + userId;

// ALWAYS - Parameterized queries
const query = "SELECT * FROM users WHERE id = ?";
db.execute(query, [userId]);
```

## 2. Authentication & Authorization
- NEVER hardcode credentials, API keys, tokens, or secrets
- **ALL** secrets MUST use environment variables with no defaults
- Implement proper session management with secure defaults
- Use scoped permissions - request minimum required access
- Verify authorization on EVERY request, not just initial auth
- Implement proper token expiration and rotation
- Use JWE for sensitive data transmission

## 3. Cryptography Requirements
- Use TLS 1.2+ for ALL network communications
- Hash passwords with bcrypt (cost factor >= 10) or Argon2
- Use cryptographically secure random number generators (crypto.randomBytes)
- NEVER roll custom crypto - use established libraries
- Encrypt sensitive data at rest using AES-256-GCM
- Use HMAC-SHA256 for message authentication
- Store encryption keys separately from encrypted data

## 4. Output Encoding (Injection Prevention)
- Encode data for context: HTML, JavaScript, URL, CSS
- Use context-appropriate encoding for all user data output
- Set proper Content-Type and Content-Disposition headers
- Sanitize all user-supplied content before rendering
- Use DOMPurify for HTML sanitization

## 5. Access Control
- Implement least privilege principle
- Deny access by default, grant explicitly
- Log all access control decisions
- Validate permissions on every resource access
- Implement role-based access control (RBAC)
- Use attribute-based access control (ABAC) for complex scenarios

## 6. Security Headers
- Set security headers: Content-Security-Policy, X-Content-Type-Options, Strict-Transport-Security
- Prevent MIME type sniffing
- Enable browser XSS protection
- Set X-Frame-Options to prevent clickjacking
- Implement Referrer-Policy for data leakage prevention
- Set Permissions-Policy for feature restrictions

## 7. Error Handling & Logging
- NEVER expose stack traces or internal details to users
- Log security events: authentication failures, authorization denials, input validation failures
- Use structured logging with consistent format
- Ensure logs do NOT contain credentials, tokens, or sensitive data
- Implement correlation IDs for request tracing
- Use appropriate log levels (DEBUG, INFO, WARN, ERROR, FATAL)

## 8. File System Security
- Never use user input directly in file paths
- Validate and sanitize all file paths (prevent path traversal)
- Restrict file permissions to minimum required
- Verify file types before processing
- Scan uploaded files for malware
- Store files outside web root

## 9. Dependency Security
- Review ALL dependencies for known vulnerabilities
- Use npm audit, snyk, or equivalent regularly
- Pin dependency versions (no ^ or ~)
- Monitor CVE databases for your dependencies
- Use lockfiles for reproducible builds
- Remove unused dependencies

## 10. Command Injection Prevention
- NEVER pass user input to shell commands
- Use child_process with arrays (not shell: true)
- Validate command arguments against strict allow-lists
- Use shell-escape libraries when shell is unavoidable
- Prefer native implementations over shell commands

## 11. Session Management
- Use secure, HTTP-only, SameSite cookies
- Implement session timeout and absolute expiration
- Invalidate sessions on password changes and logout
- Regenerate session IDs after authentication
- Implement secure session storage
- Use sliding expiration with reasonable limits

## 12. API Security
- Implement rate limiting on all endpoints
- Use API keys or tokens for service authentication
- Validate all request payloads
- Implement idempotency keys for critical operations
- Use API versioning for backward compatibility
- Document all security requirements