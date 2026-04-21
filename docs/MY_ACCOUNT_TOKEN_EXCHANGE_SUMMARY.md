# My Account API Token Exchange Implementation

## Summary

Implemented on-demand My Account API token acquisition using OAuth2 refresh token exchange. This avoids Auth0 SDK URL building issues and provides a clean UX.

## Key Changes

### 1. Token Exchange Endpoint
**File:** `src/app/api/mfa/auth/get-token/route.ts`

- Uses refresh token to get new access token
- Requests canonical domain audience: `https://archfaktor.us.auth0.com/me/`
- Returns token to frontend for storage

### 2. Token Storage in Frontend
**File:** `src/components/profile/mfa-enrollment.tsx`

- Added `myAccountToken` state
- "Get Token" button calls `/api/mfa/auth/get-token`
- Stores token in component state
- Passes token in `Authorization` header with all MFA requests

### 3. API Endpoints Updated
All endpoints now:
- Accept token via `Authorization: Bearer {token}` header
- Use **canonical domain** for My Account API calls: `https://archfaktor.us.auth0.com/me/`

**Updated files:**
- `src/app/api/mfa/methods/route.ts` (GET, POST, DELETE)
- `src/app/api/mfa/methods/[methodId]/route.ts` (DELETE - new file)
- `src/app/api/mfa/auth/test-myaccount/route.ts`
- `src/lib/my-account-api.ts`

## Critical Configuration

### Audience Must Be Canonical Domain

❌ **Wrong** (custom domain):
```typescript
const audience = 'https://login.authskye.org/me/';
```

✅ **Correct** (canonical domain):
```typescript
const audience = 'https://archfaktor.us.auth0.com/me/';
```

### API Calls Must Use Canonical Domain

❌ **Wrong**:
```
https://login.authskye.org/me/authentication-methods
```

✅ **Correct**:
```
https://archfaktor.us.auth0.com/me/authentication-methods
```

### Token Endpoint Can Use Custom Domain

✅ **Correct**:
```
https://login.authskye.org/oauth/token
```

This works because token endpoint accepts either domain, but the **audience** in the request must be canonical.

## How It Works

### Flow

```
1. User logs in normally
   ↓
2. User goes to Security tab
   ↓
3. Component shows "Get Token" button
   ↓
4. User clicks "Get Token"
   ↓
5. Frontend calls POST /api/mfa/auth/get-token
   ↓
6. Backend uses refresh token to get My Account API token
   Request:
   - Token endpoint: https://login.authskye.org/oauth/token
   - Grant type: refresh_token
   - Audience: https://archfaktor.us.auth0.com/me/
   - Scopes: read:me:authentication_methods, create:me:authentication_methods, etc.
   ↓
7. Auth0 returns token with canonical audience
   ↓
8. Frontend stores token in state
   ↓
9. Frontend can now make MFA management requests
   All requests include: Authorization: Bearer {myAccountToken}
   ↓
10. Backend receives token, calls My Account API
    URL: https://archfaktor.us.auth0.com/me/authentication-methods
    Headers: Authorization: Bearer {myAccountToken}
```

### Example Token

After successful token exchange:

```json
{
  "iss": "https://login.authskye.org/",
  "sub": "auth0|67a1183f438f78a33863e422",
  "aud": [
    "https://archfaktor.us.auth0.com/me/",
    "https://archfaktor.us.auth0.com/userinfo"
  ],
  "iat": 1776259009,
  "exp": 1776259609,
  "scope": "openid profile email read:me:authentication_methods delete:me:authentication_methods update:me:authentication_methods create:me:authentication_methods offline_access",
  "azp": "U8QtmFYd45QbH1nFwiIzpf0do8xmpmlg"
}
```

**Key points:**
- **Issuer** (`iss`): Custom domain (login.authskye.org)
- **Audience** (`aud`): Canonical domain (archfaktor.us.auth0.com/me/)
- **Scopes**: My Account API scopes

## Testing Steps

### 1. Start Server

```bash
npm run dev
```

### 2. Login

Log out and log back in to ensure you have a fresh session with `offline_access` scope (refresh token).

### 3. Go to Security Tab

Navigate to **Profile → Security**

You should see:
- Orange banner: "Authentication Required"
- "Get Token" button

### 4. Get Token

Click **"Get Token"** button

**Expected:**
- Server console shows:
  ```
  🔄 Requesting My Account API token via refresh token...
     Token endpoint: https://login.authskye.org/oauth/token
     Audience (canonical): https://archfaktor.us.auth0.com/me/
     Client ID: U8QtmFYd45QbH1nFwiIzpf0do8xmpmlg
     Response status: 200
  ✅ Successfully obtained My Account API token
     Token audience: [ 'https://archfaktor.us.auth0.com/me/', ... ]
     Token scopes: openid profile email read:me:authentication_methods ...
  ```

- Frontend shows success toast: "Token Obtained!"
- Orange banner disappears
- MFA enrollment options appear

### 5. Test API Call

Click **"Test API"** button

**If My Account API is activated:**
```json
{
  "success": true,
  "status": 200,
  "data": []
}
```

**If My Account API is NOT activated:**
```json
{
  "success": false,
  "status": 404,
  "error": {
    "title": "Not Found",
    "detail": "The requested resource GET /me/authentication-methods was not found."
  }
}
```

### 6. Try Enrollment

If 200 OK in step 5, try enrolling an MFA factor (e.g., SMS).

**Expected:**
- Frontend sends request with `Authorization: Bearer {token}` header
- Backend calls `https://archfaktor.us.auth0.com/me/authentication-methods`
- Enrollment succeeds

## Troubleshooting

### Issue: "No refresh token available"

**Cause:** User session doesn't have `offline_access` scope

**Fix:**
1. Log out completely
2. Log back in
3. New session will have `offline_access` and refresh token

### Issue: 404 "resource not found"

**Cause:** My Account API not activated in tenant

**Fix:**
- Check Auth0 Dashboard → Applications → APIs
- Look for "MyAccount API" or activation banner
- If not available, contact Auth0 Support

### Issue: 401 "invalid_token"

**Cause:** Token has wrong audience

**Fix:**
- Check token audience in browser console after "Get Token"
- Should be: `https://archfaktor.us.auth0.com/me/`
- NOT: `https://login.authskye.org/me/`

### Issue: Token exchange returns error

**Possible errors:**

1. **"invalid_grant"** - Refresh token expired or invalid
   - Solution: Log out and log back in

2. **"access_denied"** - Client not authorized for audience
   - Solution: Verify application configuration in Auth0

3. **"invalid_scope"** - Requested scopes not available
   - Solution: Check if My Account API is activated

## Environment Variables

No changes needed to `.env.local`:

```env
# Custom domain for auth (token endpoint)
AUTH0_ISSUER_BASE_URL='https://login.authskye.org'

# Canonical domain (used for My Account API audience and calls)
AUTH0_MGMT_DOMAIN='archfaktor.us.auth0.com'

# Basic scopes (refresh token included)
AUTH0_SCOPE='openid profile email offline_access'
```

## Key Takeaways

✅ **What Works:**
- Token exchange via refresh token
- On-demand token acquisition
- Clean UX (no redirects)
- Token stored in frontend state
- Passed with Authorization header

✅ **Critical Requirements:**
- Refresh token required (`offline_access` scope)
- Audience MUST be canonical domain
- API calls MUST use canonical domain
- Token endpoint can use custom domain

✅ **Next Step:**
Check if My Account API is activated in your Auth0 tenant. If you get 200 OK from the test endpoint, you're good to go!

---

**Last Updated:** April 2026
**Status:** Token exchange implementation complete
