# Kong Konnect Setup Guide

This guide walks you through setting up Kong Konnect (SaaS API Gateway) to protect your Agency Inc Dashboard APIs with Auth0 authentication.

## Overview

Kong Gateway sits between your frontend and backend APIs, providing:
- **JWT/OIDC Authentication** - Validates Auth0 tokens automatically
- **Rate Limiting** - Protects against API abuse
- **CORS Handling** - Pre-configured cross-origin requests
- **Request Transformation** - Adds user context headers
- **Logging & Analytics** - Request/response monitoring

## Architecture

```
┌─────────────┐
│   Browser   │
│  (Next.js)  │
└──────┬──────┘
       │ Auth0 JWT Token
       ▼
┌─────────────────┐
│  Kong Gateway   │  ◄── Validates JWT with Auth0
│   (Konnect)     │      Rate limits requests
└──────┬──────────┘      Transforms headers
       │
       ▼
┌─────────────────┐
│   Your APIs     │
│ /api/kong-      │
│  protected/*    │
└─────────────────┘
```

## Prerequisites

- Active Auth0 tenant (already configured in `.env.local`)
- Internet connection (Kong Konnect is cloud-based)
- Your application running on ngrok (for testing) or production URL

## Step 1: Sign Up for Kong Konnect

1. Visit: https://konghq.com/products/kong-konnect/register
2. Sign up for **Kong Konnect Plus** (Free Tier)
3. Verify your email and complete onboarding

**Free Tier Includes:**
- 10M requests/month
- All core plugins (JWT, OIDC, Rate Limiting, CORS)
- Basic analytics
- Community support

## Step 2: Create Gateway Services and Routes

Once logged into Kong Konnect:

### 2.1 Navigate to Gateway Manager
- Click **Gateway Manager** in the left sidebar
- Click **New Gateway Service** or **Configure New API**

### 2.2 Create Analytics Route

The current UI lets you create a service and route together:

**Service Configuration:**
```
Service Name: analytics-route
Service URL: http://localhost:4020
  (or https://fresh-bedbug-prepared.ngrok-free.app for ngrok testing)
```

**Route Configuration:**
```
Route Name: analytics-route
Route Path: /api/kong-protected/analytics
```

**Important Notes:**
- **Service URL** = Your upstream Next.js application URL (full URL with protocol)
- **Route Path** = The API endpoint path that Kong will expose
- Leave other settings as default for now

Click **Save**

### 2.3 Create Reports Route

Click **New Gateway Service** again:

**Service Configuration:**
```
Service Name: reports-route
Service URL: http://localhost:4020
  (or https://fresh-bedbug-prepared.ngrok-free.app)
```

**Route Configuration:**
```
Route Name: reports-route
Route Path: /api/kong-protected/reports
```

Click **Save**

### 2.4 Create Documents Route

Click **New Gateway Service** again:

**Service Configuration:**
```
Service Name: documents-route
Service URL: http://localhost:4020
  (or https://fresh-bedbug-prepared.ngrok-free.app)
```

**Route Configuration:**
```
Route Name: documents-route
Route Path: /api/kong-protected/documents
```

Click **Save**

**Alternative: Use decK (CLI)**

If you prefer declarative configuration, you can use the decK tool shown in the right panel of the UI. The YAML format is available in `kong/kong-oidc.yaml` in this repository.

## Step 3: Configure Auth0 OIDC Plugin (Recommended)

### 3.1 Add OpenID Connect Plugin
- In your service, click **Plugins**
- Click **Add Plugin**
- Search for **OpenID Connect** (Enterprise plugin, available in Konnect Plus)
- Click **Enable**

### 3.2 Configure OIDC Settings

**Basic Configuration:**
```yaml
issuer: https://archfaktor.us.auth0.com/
client_id: U8QtmFYd45QbH1nFwiIzpf0do8xmpmlg
client_secret: O33opbuZzr6ZdD0ug7bTgwKRonYn_HnmERnMY2FueOsZKwVRqDrqaWWEMQKyidX6
```

**Authentication Settings:**
```yaml
auth_methods:
  - bearer
  - introspection

scopes:
  - openid
  - profile
  - email

bearer_jwt_auth_enable: true
verify_claims: true
verify_signature: true
```

**Authorization / Audience Validation:**

In the Kong UI, under the **Authorization** section:
```yaml
audience_required:
  - https://b2b-saas-api.example.com

# Note: audience_claim defaults to "aud" (you don't need to change this)
```

**Important:**
- Use **`audience_required`** (the value that must be in the token)
- NOT `audience_claim` (which is the JWT field name - defaults to "aud")

**Downstream Headers** (Optional - user info forwarded to your API):

**⚠️ Important:** The header mapping fields may not be visible in newer Kong Konnect versions.

**If you see header mapping fields in the UI:**
```yaml
downstream_headers_names:
  - X-User-Id:sub
  - X-User-Email:email
  - X-User-Name:name
```

**If you DON'T see these fields:**
That's perfectly fine! Your API endpoints are already designed to work without these headers. They will:
1. Extract the Authorization header (JWT token)
2. Decode the JWT to get user information (sub, email, name)
3. Kong still validates the token - it just won't add extra headers

Click **Save**

## Step 4: Add Additional Plugins

### 4.1 Rate Limiting Plugin
Prevents API abuse:

```yaml
Plugin: rate-limiting
Config:
  minute: 100
  hour: 1000
  day: 10000
  policy: local
```

### 4.2 CORS Plugin
Allows browser requests from your frontend:

```yaml
Plugin: cors
Config:
  origins:
    - http://localhost:4020
    - https://fresh-bedbug-prepared.ngrok-free.app
  methods:
    - GET
    - POST
    - PUT
    - DELETE
    - PATCH
    - OPTIONS
  headers:
    - Accept
    - Authorization
    - Content-Type
    - X-Requested-With
  exposed_headers:
    - X-Auth-Token
    - X-User-Id
    - X-User-Email
  credentials: true
  max_age: 3600
```

### 4.3 Request Transformer Plugin
Adds custom headers:

```yaml
Plugin: request-transformer
Config:
  add:
    headers:
      - X-Kong-Protected:true
      - X-Gateway-Version:1.0
```

## Step 5: Configure Your Application

### 5.1 Get Your Kong Gateway URL

In Kong Konnect:
- Navigate to **Gateway Manager** > **Overview**
- Copy your **Gateway Proxy URL** (e.g., `https://your-gateway.konghq.com`)

### 5.2 Update Environment Variables

Add to your `.env.local`:

```bash
# Kong Gateway URL
NEXT_PUBLIC_KONG_GATEWAY_URL=https://your-gateway.konghq.com

# Optional: Enable Kong for specific features
KONG_ENABLED=true
```

### 5.3 Restart Your Application

```bash
npm run dev
```

## Step 6: Test the Integration

### 6.1 Access API Gateway Page

1. Log in to your application
2. Navigate to **API Gateway** in the sidebar
3. You should see the Kong Gateway Demo page

### 6.2 Test Endpoints

Click the test buttons:
- **Test Analytics** - GET request to `/api/kong-protected/analytics`
- **Get Reports** - GET request to `/api/kong-protected/reports`
- **Create Report** - POST request to `/api/kong-protected/reports`
- **Test Documents** - GET request to `/api/kong-protected/documents`

### 6.3 Verify in Kong Dashboard

In Kong Konnect:
- Navigate to **Analytics** or **Vitals**
- You should see request logs showing:
  - Request count
  - Response times
  - Status codes
  - Rate limit usage

## Troubleshooting

### Issue: "Failed to construct 'URL': Invalid URL" when creating service

**Cause:** You entered the API path in the Service URL field instead of the upstream server URL.

**Solution:**
- **Service URL** should be the full URL to your Next.js app:
  - Local: `http://localhost:4020`
  - Ngrok: `https://fresh-bedbug-prepared.ngrok-free.app`
- **Route Path** should be the API endpoint path:
  - Example: `/api/kong-protected/analytics`

**Correct Configuration:**
```
Service URL: http://localhost:4020          ✅ Full upstream URL
Route Path: /api/kong-protected/analytics   ✅ API path
```

**Incorrect Configuration:**
```
Service URL: /api/kong-protected/analytics  ❌ This is a path, not a URL
```

### Issue: "This endpoint must be accessed through Kong Gateway"

**Cause:** Your frontend is calling Next.js API directly instead of through Kong.

**Solution:**
- Verify `NEXT_PUBLIC_KONG_GATEWAY_URL` is set correctly
- Restart your Next.js dev server
- Check browser console for the actual URL being called

### Issue: "Unauthorized" or JWT validation failed

**Cause:** Auth0 token not being sent or Kong can't validate it.

**Solution:**
1. Check that Auth0 is issuing access tokens:
   - In browser console, run: `fetch('/api/auth/token').then(r => r.json()).then(console.log)`
   - Should return `{ accessToken: "eyJ..." }`

2. Verify OIDC plugin configuration:
   - Issuer matches your Auth0 tenant
   - Client ID/Secret are correct
   - Audience matches AUTH0_AUDIENCE

3. Check Auth0 JWKS endpoint is accessible:
   - Visit: `https://archfaktor.us.auth0.com/.well-known/jwks.json`
   - Should return public keys

### Issue: CORS errors in browser

**Cause:** Kong CORS plugin not configured for your frontend URL.

**Solution:**
- Add your frontend URL to CORS plugin origins
- Include both `http://localhost:4020` and ngrok URL
- Ensure `credentials: true` is set

### Issue: Rate limit exceeded

**Cause:** You're hitting the rate limit (100 req/min).

**Solution:**
- Increase rate limits in the Rate Limiting plugin
- Or wait for the next minute window
- Or disable rate limiting temporarily for testing

## Alternative: JWT Plugin (Manual Key Management)

If you prefer manual JWT validation instead of OIDC:

### 1. Get Auth0 Public Key

```bash
# Fetch JWKS
curl https://archfaktor.us.auth0.com/.well-known/jwks.json

# Convert to PEM format (use online tool or openssl)
```

### 2. Configure JWT Plugin

Use `kong/kong.yaml` configuration instead of `kong/kong-oidc.yaml`.

Replace `REPLACE_WITH_YOUR_AUTH0_PUBLIC_KEY` with your PEM-formatted public key.

## Advanced Configuration

### Custom Claims Validation

Add custom claim validation in OIDC plugin:

```yaml
claims_to_verify:
  - exp
  - aud
  - iss

required_scopes:
  - openid
  - email
```

### Request/Response Logging

Add File Log plugin for debugging:

```yaml
Plugin: file-log
Config:
  path: /tmp/kong-requests.log
  custom_fields_by_lua:
    user_id: return kong.request.get_header("X-User-Id")
```

### IP Restriction

Restrict API access to specific IPs:

```yaml
Plugin: ip-restriction
Config:
  allow:
    - 192.168.0.0/16
    - 10.0.0.0/8
```

## Production Considerations

### 1. Use Production Gateway

- Kong Konnect provides dedicated gateways for production
- Configure custom domains
- Enable HTTPS/TLS

### 2. Secure Secrets

- Store Kong configuration in environment variables
- Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- Rotate Auth0 client secrets regularly

### 3. Monitoring

- Enable Kong Vitals (included in Konnect Plus)
- Set up alerts for:
  - High error rates
  - Rate limit breaches
  - Slow response times

### 4. High Availability

- Kong Konnect handles HA automatically
- Configure health checks for your upstream services
- Set up circuit breakers for failing services

## Declarative Configuration

For version control and GitOps, use the declarative YAML files:

```bash
# Export current configuration
kong config db_export kong-current.yaml

# Import configuration
kong config db_import kong/kong-oidc.yaml
```

## Resources

- **Kong Konnect Dashboard**: https://cloud.konghq.com
- **Kong Documentation**: https://developer.konghq.com
- **OIDC Plugin Docs**: https://developer.konghq.com/plugins/openid-connect/
- **Auth0 + Kong Guide**: https://auth0.com/docs/integrations/api-gateways/kong

## Next Steps

- Review **KONG-TESTING.md** for detailed testing scenarios
- Explore additional Kong plugins (GraphQL, gRPC, Service Mesh)
- Set up monitoring and alerting
- Configure production deployment

## Support

**Kong Support:**
- Community Forum: https://discuss.konghq.com
- GitHub Issues: https://github.com/Kong/kong

**Auth0 Support:**
- Community Forum: https://community.auth0.com
- Documentation: https://auth0.com/docs

**Application Support:**
- See README.md for general application setup
- Check CLAUDE.md for architecture details
