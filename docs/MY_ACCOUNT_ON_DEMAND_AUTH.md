# My Account API On-Demand Authentication

## Overview

My Account API authentication is now implemented as **on-demand user-delegated** authentication, not requested during initial login.

## Authentication Flow

### 1. Initial Login (Basic Scopes Only)
```
User logs in → Gets token with basic scopes
Scopes: openid, profile, email, offline_access
Audience: https://b2b-saas-api.example.com
```

No My Account API scopes requested. Token is lightweight.

### 2. User Navigates to Security Settings
```
User goes to Profile → Security tab
Component checks token for My Account API audience/scopes
Detects: Token doesn't have My Account API capabilities
Shows: Orange banner with "Re-authenticate" button
```

### 3. On-Demand Re-Authentication
```
User clicks "Re-authenticate"
↓
Redirect to: /api/auth/login?myaccount=true&returnTo=/profile?tab=security
↓
Auth Handler detects myaccount=true flag
↓
Requests token with:
  - Audience: https://login.authskye.org/me/ (custom domain)
  - Scopes: read:me:authentication_methods, create:me:authentication_methods, etc.
  - No prompt parameter (allows Auth0 to handle consent/silent auth)
↓
Auth0 issues new token (may show consent screen if first time)
↓
Redirects back to /profile?tab=security with new token
↓
Component detects token has My Account API capabilities
↓
User can now manage MFA settings
```

## Key Implementation Details

### Custom Domain vs Canonical Domain

**Using Custom Domain:** `https://login.authskye.org`

- ✅ Tokens are issued with custom domain as issuer
- ✅ My Account API audience: `https://login.authskye.org/me/`
- ✅ All API calls to: `https://login.authskye.org/me/authentication-methods`

**Not using Canonical Domain:** `https://archfaktor.us.auth0.com`

- ❌ Management API only (M2M operations)
- ❌ Not for user-delegated My Account API

### Why No "Client Grant"?

My Account API is **user-delegated** (on behalf of user), not M2M:

- ✅ User access token obtained during login
- ❌ No M2M client credentials
- ❌ No "Machine to Machine Applications" tab applies
- ❌ No client grant needed

### Auth Handler Logic (`src/app/api/auth/[...auth0]/route.ts`)

```typescript
const isMyAccount = url.searchParams.get('myaccount') === 'true';

if (isMyAccount) {
  // My Account API request
  const myAccountAudience = `${process.env.AUTH0_ISSUER_BASE_URL}/me/`;

  authorizationParams.audience = myAccountAudience;
  authorizationParams.scope = 'openid profile email offline_access read:me:authentication_methods create:me:authentication_methods update:me:authentication_methods delete:me:authentication_methods';

  // No prompt parameter - let Auth0 handle consent/silent auth
} else {
  // Regular login
  authorizationParams.audience = process.env.AUTH0_AUDIENCE;
  authorizationParams.scope = 'openid profile email offline_access read:reports ...';
  authorizationParams.prompt = 'login';
}
```

## Testing the Flow

### Step 1: Initial Login

1. Log out completely
2. Log back in
3. Check token (browser console):

```javascript
fetch('/api/auth/token')
  .then(r => r.json())
  .then(d => {
    const token = d.accessToken;
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    console.log('Initial Token Audience:', payload.aud);
    console.log('Initial Token Scopes:', payload.scope);
  });
```

**Expected:**
- Audience: `https://b2b-saas-api.example.com` (NOT My Account API)
- Scopes: Basic scopes only (NO My Account API scopes)

### Step 2: Navigate to Security Tab

1. Go to **Profile → Security**
2. Look for orange banner: "Authentication Required"
3. Check token status indicators:
   - Access Token: Present ✅
   - My Account API Audience: Missing ❌
   - My Account API Scopes: Missing ❌

### Step 3: Re-authenticate

1. Click **"Re-authenticate"** button
2. Watch console for: `🔄 Redirecting to My Account API auth: /api/auth/login?myaccount=true...`
3. Browser redirects to Auth0
4. Auth0 may show consent screen (first time)
5. Redirects back to /profile?tab=security

### Step 4: Verify New Token

1. Check token again (browser console):

```javascript
fetch('/api/mfa/auth/test-token')
  .then(r => r.json())
  .then(d => console.log('Token Test Results:', d));
```

**Expected:**
```json
{
  "success": true,
  "token": {
    "audience": "https://login.authskye.org/me/",
    "hasMyAccountAudience": true,
    "hasRequiredScopes": true,
    "scopes": [
      "openid",
      "profile",
      "email",
      "offline_access",
      "read:me:authentication_methods",
      "create:me:authentication_methods",
      "update:me:authentication_methods",
      "delete:me:authentication_methods"
    ]
  },
  "diagnosis": {
    "canCallMyAccountAPI": true,
    "issues": []
  }
}
```

### Step 5: Test My Account API

1. Click **"Test API"** button
2. Check console for API call results

**If 200 OK:** My Account API is working! ✅
```json
{
  "success": true,
  "status": 200,
  "data": []
}
```

**If 404 Not Found:** My Account API not activated in tenant ❌
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

## Troubleshooting

### Issue: Token still doesn't have My Account API audience after re-auth

**Possible causes:**
1. Didn't restart dev server after code changes
2. Old token still cached in session
3. My Account API not activated in tenant

**Fix:**
```bash
# 1. Restart dev server
npm run dev

# 2. Clear browser cache and re-login
# 3. Try re-authenticate flow again
```

### Issue: Getting 404 when calling My Account API

**Cause:** My Account API endpoints don't exist in your tenant yet

**Options:**
1. Check Auth0 Dashboard → Applications → APIs for "MyAccount API"
2. If not visible, contact Auth0 Support to activate
3. Or rollback to legacy MFA system (see MFA_ROLLBACK.md)

### Issue: Auth0 shows error "invalid_scope"

**Cause:** My Account API not available in your tenant

**Fix:** Contact Auth0 Support to enable My Account API feature flag

### Issue: Infinite redirect loop

**Cause:** My Account API authentication failing repeatedly

**Fix:**
1. Check browser console for error messages
2. Clear browser cache completely
3. Log out and try regular login first
4. Check Auth0 logs for authentication errors

## Server Logs to Watch

When re-authenticating, you should see:

```
🔐 My Account API authentication requested
   Audience: https://login.authskye.org/me/
   Using custom domain for My Account API
```

This confirms the auth handler is processing the myaccount=true request correctly.

## Environment Variables (No Changes Needed)

```env
# Custom domain used for My Account API
AUTH0_ISSUER_BASE_URL='https://login.authskye.org'

# Canonical domain (NOT used for My Account API)
AUTH0_MGMT_DOMAIN='archfaktor.us.auth0.com'

# Basic scopes for initial login (NO My Account API scopes)
AUTH0_SCOPE='openid profile email offline_access'

# My Account API audience for frontend reference
NEXT_PUBLIC_MY_ACCOUNT_AUDIENCE='https://login.authskye.org/me/'
```

## Summary

✅ **What Changed:**
- Auth handler now handles `myaccount=true` parameter
- Requests My Account API audience: `https://login.authskye.org/me/`
- Requests My Account API scopes on-demand
- Uses custom domain (not canonical)
- No prompt parameter for seamless re-auth

✅ **What Stays the Same:**
- Initial login flow unchanged
- Basic scopes on initial login
- Regular API access unaffected
- No M2M or client grant needed

✅ **Next Step:**
Test the flow using the steps above and check if My Account API endpoints return 200 or 404.

---

## CRITICAL FIX: Domain Mismatch Issue (April 15, 2026)

### Problem Discovered

Even with correct authentication flow, My Account API was returning **404 Not Found** errors when attempting MFA enrollment.

### Root Cause

**Backend code was calling the wrong domain for My Account API.**

The JWT token was correctly issued with custom domain audience:
```json
{
  "aud": ["https://login.authskye.org/me/", ...],
  "iss": "https://login.authskye.org/"
}
```

But the backend was calling the **canonical domain**:
```
❌ https://archfaktor.us.auth0.com/me/authentication-methods
```

Auth0 rejects this because **token audience must match the API domain being called**.

### Solution Applied

Updated all My Account API endpoints to use **custom domain** (`AUTH0_ISSUER_BASE_URL`):

**Files Fixed:**
1. `src/app/api/mfa/methods/route.ts` - Changed domain to custom domain (3 places)
2. `src/app/api/mfa/methods/[methodId]/route.ts` - Changed domain to custom domain
3. `src/lib/my-account-api.ts` - Updated configuration constants

**Before (WRONG):**
```typescript
const myAccountDomain = process.env.AUTH0_MGMT_DOMAIN!;  // archfaktor.us.auth0.com
const myAccountUrl = `https://${myAccountDomain}/me/authentication-methods`;
```

**After (CORRECT):**
```typescript
const myAccountBaseUrl = process.env.AUTH0_ISSUER_BASE_URL!;  // https://login.authskye.org
const myAccountUrl = `${myAccountBaseUrl}/me/authentication-methods`;
```

### Key Rule

**For My Account API:**
- ✅ Use `AUTH0_ISSUER_BASE_URL` (custom domain: `https://login.authskye.org`)
- ❌ DO NOT use `AUTH0_MGMT_DOMAIN` (canonical: `archfaktor.us.auth0.com`)

**For Management API (M2M):**
- ✅ Use `AUTH0_MGMT_DOMAIN` (canonical domain)
- ❌ DO NOT use `AUTH0_ISSUER_BASE_URL` for M2M operations

### Verification

After fixing, test with:

```bash
# Get token from session
curl http://localhost:4020/api/auth/token | jq '.accessToken' -r > token.txt

# Decode token to verify audience
cat token.txt | cut -d'.' -f2 | base64 -d | jq .aud

# Should show: ["https://login.authskye.org/me/", ...]

# Test enrollment (should now work!)
curl -X POST http://localhost:4020/api/mfa/methods \
  -H "Authorization: Bearer $(cat token.txt)" \
  -H "Content-Type: application/json" \
  -d '{"type":"totp"}'
```

**Expected Response (SUCCESS):**
```json
{
  "success": true,
  "message": "MFA factor enrolled successfully",
  "method": {
    "id": "auth_meth_...",
    "type": "totp",
    "totp_secret": "...",
    "confirmed": false
  }
}
```

### Cache Clearing

After the fix, clear Next.js cache:
```bash
rm -rf .next
npm run dev
```

---

**Last Updated:** April 15, 2026
**Status:** On-demand user-delegated authentication implemented + domain mismatch fixed
