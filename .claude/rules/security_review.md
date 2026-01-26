# Security Code Review

For EVERY code review, verify:

## Critical Vulnerabilities (Block Merge)
- [ ] No hardcoded secrets/credentials (scan with gitleaks, trufflehog)
- [ ] No SQL injection (parameterized queries only)
- [ ] No command injection (no user input in shell commands)
- [ ] No path traversal (validate and sanitize file paths)
- [ ] No XXE/XML injection
- [ ] No deserialization vulnerabilities
- [ ] No authentication bypass
- [ ] No authorization bypass

## High Severity (Block Merge)
- [ ] No weak cryptography (MD5, SHA1 for passwords, ECB mode)
- [ ] No insecure randomness (use crypto.randomBytes)
- [ ] No missing input validation
- [ ] No sensitive data exposure in logs/errors
- [ ] No missing rate limiting
- [ ] No missing security headers

## Medium Severity (Should Block)
- [ ] Error messages don't reveal internals
- [ ] Dependencies have no known CVEs
- [ ] CSRF tokens present where needed
- [ ] Output encoding for user data
- [ ] No missing input sanitization

## Low Severity (Should Fix)
- [ ] Logging is structured and consistent
- [ ] Comments explain security assumptions
- [ ] Code is readable and maintainable
- [ ] Security implications documented

## Secure Git Workflow

### Pre-Commit Security Gates
- Run `npm audit` or `pnpm audit` - fix ALL vulnerabilities
- Run `gitleaks` or `trufflehog` - ensure no secrets in code
- Run security linter (eslint-plugin-security)
- Ensure test coverage is maintained or improved
- Verify no `console.log` in production code
- Run type checking (TypeScript strict mode)

### Branch Protection Rules
- Require pull request reviews (at least 1 approval)
- Require status checks to pass
- Require signed commits (recommended)
- Require vulnerability scan passes
- Require test coverage gate
- Require linting checks

### Commit Messages
- Include `[SECURITY]` prefix for security-related changes
- Use conventional format: `type(scope): description`
- Types: feat, fix, docs, refactor, test, chore
- All changes must be reviewed before merging
- Reference issue numbers when applicable

## Security Review Focus Areas

### Authentication
- Token validation
- Session management
- Password handling
- Multi-factor authentication
- OAuth/OIDC implementation

### Authorization
- Permission checks
- Role validation
- Resource ownership verification
- Privilege escalation prevention

### Input Handling
- Validation completeness
- Sanitization effectiveness
- Type checking
- Length restrictions
- Format validation

### Data Protection
- Encryption at rest
- Encryption in transit
- Key management
- Sensitive data handling
- PII protection

### API Security
- Rate limiting
- Input validation
- Output encoding
- CORS configuration
- API authentication

### Secrets Management
- No hardcoded secrets
- Environment variable usage
- Secrets rotation
- Access control for secrets
- Audit logging

## Common Vulnerability Patterns

### SQL Injection
```javascript
// VULNERABLE
db.query(`SELECT * FROM users WHERE id = ${userId}`);

// SECURE
db.query('SELECT * FROM users WHERE id = ?', [userId]);
```

### Command Injection
```javascript
// VULNERABLE
exec(`convert ${userFile} output.png`);

// SECURE
execFile('convert', [userFile, 'output.png']);
```

### Path Traversal
```javascript
// VULNERABLE
fs.readFile(`/uploads/${userFilename}`);

// SECURE
const safePath = path.join('/uploads', path.basename(userFilename));
fs.readFile(safePath);
```

### XSS
```javascript
// VULNERABLE
element.innerHTML = userInput;

// SECURE
element.textContent = userInput;
// or use DOMPurify for HTML
element.innerHTML = DOMPurify.sanitize(userInput);
```

## Automated Security Tools

### Static Analysis
- ESLint with security plugins
- SonarQube
- Semgrep
- CodeQL

### Dependency Scanning
- npm audit / pnpm audit
- Snyk
- Dependabot
- OWASP Dependency-Check

### Secrets Scanning
- gitleaks
- trufflehog
- git-secrets
- detect-secrets

### Dynamic Analysis
- OWASP ZAP
- Burp Suite
- Nuclei
- Nikto