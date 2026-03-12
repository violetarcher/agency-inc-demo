# Kong Gateway Testing Guide

This guide provides comprehensive testing scenarios for your Kong API Gateway integration with Auth0.

## Prerequisites

- Kong Konnect setup complete (see KONG-SETUP.md)
- Application running locally or on ngrok
- User logged in with Auth0
- Kong Gateway URL configured in `.env.local`

## Testing Methods

### 1. Browser-Based Testing (Easiest)

**Access the API Gateway Demo Page:**

1. Log in to your application
2. Navigate to **API Gateway** in the sidebar (http://localhost:4020/api-gateway)
3. Use the test buttons to verify each endpoint

**What to Look For:**
- ✅ Green "Success" badges on responses
- ✅ User information populated correctly
- ✅ Response data displayed in JSON format
- ❌ Error messages if Kong is not configured

### 2. cURL Testing (Command Line)

#### Step 1: Get Your Access Token

```bash
# Method A: From browser console
# Open DevTools > Console and run:
fetch('/api/auth/token').then(r => r.json()).then(d => console.log(d.accessToken))

# Method B: Using the API directly (must be logged in)
curl http://localhost:4020/api/auth/token \
  -H "Cookie: appSession=YOUR_SESSION_COOKIE"
```

Copy the access token (starts with `eyJ...`)

#### Step 2: Test Analytics Endpoint

```bash
export ACCESS_TOKEN="eyJ..."  # Your token from step 1
export KONG_URL="https://your-gateway.konghq.com"  # Your Kong gateway URL

# GET Analytics
curl -X GET \
  "${KONG_URL}/api/kong-protected/analytics" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalRequests": 15234,
      "successRate": 98.5,
      "avgResponseTime": 145,
      "activeUsers": 342
    },
    "userInfo": {
      "userId": "auth0|...",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "gateway": {
      "protected": true,
      "gateway": "Kong"
    }
  }
}
```

#### Step 3: Test Reports Endpoint

```bash
# GET Reports
curl -X GET \
  "${KONG_URL}/api/kong-protected/reports" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

# GET Reports with filter
curl -X GET \
  "${KONG_URL}/api/kong-protected/reports?status=Approved" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

# POST Create Report
curl -X POST \
  "${KONG_URL}/api/kong-protected/reports" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Report via cURL",
    "amount": 499.99,
    "description": "Testing Kong Gateway integration"
  }'
```

**Expected Response (POST):**
```json
{
  "success": true,
  "data": {
    "id": "RPT-004",
    "title": "Test Report via cURL",
    "status": "Pending",
    "amount": 499.99,
    "createdBy": {
      "userId": "auth0|...",
      "email": "user@example.com"
    }
  }
}
```

#### Step 4: Test Documents Endpoint

```bash
# GET Documents
curl -X GET \
  "${KONG_URL}/api/kong-protected/documents" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

# POST Create Document
curl -X POST \
  "${KONG_URL}/api/kong-protected/documents" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test-Document.pdf",
    "type": "PDF",
    "size": "1.5 MB"
  }'

# DELETE Document
curl -X DELETE \
  "${KONG_URL}/api/kong-protected/documents?id=DOC-001" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

### 3. Postman Testing

#### Import Collection

Create a Postman collection with these settings:

**Collection Variables:**
```
kong_url: https://your-gateway.konghq.com
access_token: {{YOUR_TOKEN}}
```

**Authorization (Collection Level):**
```
Type: Bearer Token
Token: {{access_token}}
```

#### Requests

**1. Analytics - GET**
```
GET {{kong_url}}/api/kong-protected/analytics
```

**2. Reports - GET**
```
GET {{kong_url}}/api/kong-protected/reports
```

**3. Reports - POST**
```
POST {{kong_url}}/api/kong-protected/reports
Content-Type: application/json

{
  "title": "Postman Test Report",
  "amount": 299.99
}
```

**4. Documents - GET**
```
GET {{kong_url}}/api/kong-protected/documents
```

## Test Scenarios

### Scenario 1: Valid Request (Success Path)

**Test:** Send authenticated request through Kong

```bash
curl -X GET \
  "${KONG_URL}/api/kong-protected/analytics" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

**Expected:**
- ✅ Status: 200 OK
- ✅ Response contains user information
- ✅ Response includes `"gateway": {"protected": true}`
- ✅ Kong adds header `X-Kong-Protected: true`

### Scenario 2: Missing Authorization Header

**Test:** Send request without token

```bash
curl -X GET \
  "${KONG_URL}/api/kong-protected/analytics"
```

**Expected:**
- ❌ Status: 401 Unauthorized
- ❌ Kong blocks request before reaching your API
- Response: `{"message": "Unauthorized"}`

### Scenario 3: Invalid/Expired Token

**Test:** Send request with invalid token

```bash
curl -X GET \
  "${KONG_URL}/api/kong-protected/analytics" \
  -H "Authorization: Bearer invalid_token_12345"
```

**Expected:**
- ❌ Status: 401 Unauthorized
- ❌ Kong rejects token validation
- Response: `{"message": "Invalid token"}`

### Scenario 4: Rate Limiting

**Test:** Exceed rate limit (100 requests/minute)

```bash
# Send 101 requests rapidly
for i in {1..101}; do
  curl -X GET \
    "${KONG_URL}/api/kong-protected/analytics" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -w "\n%{http_code}\n"
done
```

**Expected:**
- ✅ First 100 requests: 200 OK
- ❌ Request 101: 429 Too Many Requests
- Response header: `X-RateLimit-Remaining: 0`

### Scenario 5: CORS Pre-flight

**Test:** Browser sends OPTIONS request

```bash
curl -X OPTIONS \
  "${KONG_URL}/api/kong-protected/analytics" \
  -H "Origin: http://localhost:4020" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization"
```

**Expected:**
- ✅ Status: 200 OK
- ✅ Header: `Access-Control-Allow-Origin: http://localhost:4020`
- ✅ Header: `Access-Control-Allow-Credentials: true`

### Scenario 6: Direct API Access (Bypassing Kong)

**Test:** Call Next.js API directly without going through Kong

```bash
curl -X GET \
  "http://localhost:4020/api/kong-protected/analytics" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

**Expected:**
- ❌ Status: 401 Unauthorized
- ❌ Response: `{"error": "This endpoint must be accessed through Kong Gateway"}`
- This confirms Kong-only enforcement is working

### Scenario 7: User Context Headers

**Test:** Verify Kong adds user information headers

```bash
# In your API endpoint, log all headers
curl -X GET \
  "${KONG_URL}/api/kong-protected/analytics" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -v 2>&1 | grep "X-User"
```

**Expected Headers:**
- ✅ `X-User-Id: auth0|123456`
- ✅ `X-User-Email: user@example.com`
- ✅ `X-User-Name: John Doe`
- ✅ `X-Kong-Protected: true`

## Validation Checklist

Use this checklist to verify your Kong integration:

### Authentication & Authorization
- [ ] Requests with valid Auth0 JWT tokens are accepted
- [ ] Requests without Authorization header are rejected (401)
- [ ] Requests with invalid tokens are rejected (401)
- [ ] Requests with expired tokens are rejected (401)

### Rate Limiting
- [ ] Rate limiting enforces 100 requests/minute
- [ ] Rate limit headers are present in responses
- [ ] 429 status returned when limit exceeded

### CORS
- [ ] OPTIONS preflight requests are handled correctly
- [ ] CORS headers allow configured origins
- [ ] Credentials (cookies) are allowed
- [ ] Browser can make cross-origin requests

### Header Transformation
- [ ] Kong adds X-Kong-Protected header
- [ ] Kong adds X-User-Id header with user sub claim
- [ ] Kong adds X-User-Email header
- [ ] Kong adds X-User-Name header

### Security
- [ ] Direct API access (bypassing Kong) is blocked
- [ ] Only Kong-forwarded requests are processed
- [ ] User information comes from Kong headers, not client

### Performance
- [ ] Response times are acceptable (< 500ms)
- [ ] Kong doesn't add significant latency
- [ ] Gateway remains responsive under load

## Monitoring Kong Gateway

### Kong Konnect Dashboard

1. Log in to https://cloud.konghq.com
2. Navigate to **Vitals** or **Analytics**

**Metrics to Monitor:**
- Request count per endpoint
- Average response time
- Error rate (4xx, 5xx responses)
- Rate limit hits
- Top consumers (by user/IP)

### Request Logs

View real-time request logs:

```bash
# If you enabled file-log plugin
tail -f /tmp/kong-requests.log
```

**Log Format:**
```json
{
  "request": {
    "method": "GET",
    "uri": "/api/kong-protected/analytics",
    "headers": {...}
  },
  "response": {
    "status": 200,
    "latency": 145
  },
  "user_id": "auth0|123456"
}
```

## Troubleshooting Common Issues

### Issue: Cannot reach Kong Gateway

**Symptoms:**
- `curl: (6) Could not resolve host`
- Connection timeout

**Debug Steps:**
```bash
# 1. Verify Kong Gateway URL
echo $KONG_URL

# 2. Test connectivity
curl -I $KONG_URL

# 3. Check Kong Konnect status
# Visit: https://status.konghq.com
```

### Issue: Token validation fails

**Symptoms:**
- 401 Unauthorized despite valid token
- "Invalid signature" error

**Debug Steps:**
```bash
# 1. Decode JWT to inspect claims
# Use: https://jwt.io or
echo $ACCESS_TOKEN | cut -d. -f2 | base64 -d | jq

# 2. Verify issuer matches
# Should be: https://archfaktor.us.auth0.com/

# 3. Check audience claim
# Should include: https://b2b-saas-api.example.com

# 4. Verify Auth0 JWKS is accessible
curl https://archfaktor.us.auth0.com/.well-known/jwks.json
```

### Issue: CORS errors in browser

**Symptoms:**
- "Access to fetch blocked by CORS policy"
- Preflight request fails

**Debug Steps:**
```bash
# 1. Test OPTIONS request
curl -X OPTIONS \
  -H "Origin: http://localhost:4020" \
  -H "Access-Control-Request-Method: GET" \
  -v "${KONG_URL}/api/kong-protected/analytics" 2>&1 | grep "Access-Control"

# 2. Verify CORS plugin configuration in Kong dashboard
# - Origins should include your frontend URL
# - credentials: true must be set
```

### Issue: Rate limit too restrictive

**Symptoms:**
- Frequent 429 errors during development
- Can't complete testing

**Solution:**
```yaml
# Temporarily increase limits in Kong dashboard
rate-limiting plugin:
  minute: 1000  # Increased from 100
  hour: 10000   # Increased from 1000
```

## Performance Testing

### Load Testing with Apache Bench

```bash
# Test 1000 requests with 10 concurrent connections
ab -n 1000 -c 10 \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  "${KONG_URL}/api/kong-protected/analytics"
```

**Metrics to Watch:**
- Requests per second
- Mean response time
- 95th percentile latency
- Failed requests (should be 0)

### Load Testing with Artillery

```yaml
# kong-load-test.yml
config:
  target: https://your-gateway.konghq.com
  phases:
    - duration: 60
      arrivalRate: 10
  defaults:
    headers:
      Authorization: "Bearer YOUR_TOKEN"

scenarios:
  - name: "Test API Gateway"
    flow:
      - get:
          url: "/api/kong-protected/analytics"
      - get:
          url: "/api/kong-protected/reports"
      - get:
          url: "/api/kong-protected/documents"
```

```bash
artillery run kong-load-test.yml
```

## Next Steps

- Set up production Kong gateway
- Configure monitoring and alerting
- Implement circuit breakers for resilience
- Add more sophisticated rate limiting (per-user)
- Explore additional Kong plugins (GraphQL, gRPC, etc.)

## Resources

- **Kong Konnect Dashboard**: https://cloud.konghq.com
- **Kong Documentation**: https://developer.konghq.com
- **API Testing Tools**:
  - Postman: https://postman.com
  - Insomnia: https://insomnia.rest
  - HTTPie: https://httpie.io

## Support

For issues specific to this application:
- See README.md for general setup
- See CLAUDE.md for architecture details
- See KONG-SETUP.md for initial configuration

For Kong-specific issues:
- Community Forum: https://discuss.konghq.com
- Documentation: https://developer.konghq.com
- Status Page: https://status.konghq.com
