# Kong Gateway Request Flow

This diagram shows the complete flow for API requests through Kong Gateway with Auth0 JWT validation.

```mermaid
sequenceDiagram
    participant U as User Browser
    participant N as Next.js App
    participant A as Auth0 JWKS
    participant K as Kong Gateway
    participant API as Next.js API

    Note over U,API: API Request Flow (Every API Call)

    U->>N: 1. Click "Test Analytics"
    N->>N: 2. GET /api/auth/token<br/>(extract JWT from session cookie)
    N->>U: 3. Return access_token<br/>(JWT stored in session)

    U->>K: 4. GET /api/kong-protected/analytics<br/>Authorization: Bearer {JWT}

    K->>A: 5. Fetch JWKS (cached)<br/>GET /.well-known/jwks.json
    A->>K: 6. Return public keys<br/>(RSA keys for signature verification)

    K->>K: 7. Validate JWT:<br/>• Verify signature (RSA)<br/>• Check audience<br/>• Check issuer<br/>• Check expiry

    alt JWT Invalid
        K->>U: 8a. Return 401 Unauthorized
    else JWT Valid
        K->>K: 8b. Execute plugins:<br/>• Rate limiting (100/min)<br/>• Request transformer
        K->>K: 9. Add headers:<br/>X-Kong-Protected: true<br/>X-Gateway-Version: 1.0
        K->>API: 10. Forward request to upstream

        API->>API: 11. Check X-Kong-Protected header

        alt No Kong Header
            API->>K: 12a. Return 401 Unauthorized<br/>"Must access through Kong Gateway"
        else Kong Header Present
            API->>API: 12b. Decode JWT payload<br/>(extract: sub, email, org_id)
            API->>API: 13. Execute business logic<br/>(query analytics data)
            API->>K: 14. Return response<br/>{success: true, data: {...}}
            K->>K: 15. Add CORS headers
            K->>U: 16. Return response
            U->>U: 17. Display success badge<br/>and JSON data
        end
    end
```

## Key Points

### Kong Request Flow (17 Steps)
- Happens **on every API request** through Kong
- Frontend retrieves existing JWT from session (no Auth0 authentication call)
- Kong validates JWT locally using cached Auth0 public keys
- Kong only calls Auth0 JWKS endpoint occasionally to refresh key cache
- JWT validation uses asymmetric cryptography (RSA signature verification)

### Security Layers
1. **Kong validates JWT** - Ensures token is genuine, not expired, correct audience/issuer
2. **Kong adds protected header** - `X-Kong-Protected: true`
3. **Next.js checks header** - Ensures request came through Kong (prevents direct bypass)
4. **Next.js decodes JWT** - Extracts user context from validated token

### Kong Plugins Executed (Step 8b)
- **OpenID Connect** - JWT validation against Auth0
- **Rate Limiting** - 100 requests/minute, 1000/hour
- **CORS** - Cross-origin request handling
- **Request Transformer** - Add X-Kong-Protected header
- **Pre-Function** - Handle OPTIONS preflight

### JWKS Caching
- Auth0 public keys are **cached by Kong** (typically 1+ hours)
- Not fetched on every request (performance optimization)
- Keys only refreshed when cache expires or key rotation occurs

### Why This Architecture Works
- **Performance**: JWT validation is local (no Auth0 call per request)
- **Security**: Two-layer protection (Kong JWT validation + Next.js header check)
- **Scalability**: Kong handles rate limiting, CORS, request transformation at gateway layer
- **Separation of Concerns**:
  - Auth0: Identity provider (issues tokens during login)
  - Kong: API Gateway (validates tokens, enforces policies)
  - Next.js: Business logic (processes authenticated requests)
