# My Account API Token Exchange Diagnostic Guide

## Reference Implementation
Based on: https://github.com/awhitmana0/a0-passkeyforms-demo

## Your Current Implementation Status

### ✅ What You Have Implemented

1. **Token Exchange Endpoint** (`src/app/api/mfa/auth/get-token/route.ts`)
   - Uses `grant_type: urn:ietf:params:oauth:grant-type:token-exchange`
   - Audience: `${AUTH0_ISSUER_BASE_URL}/me/` (custom domain)
   - Subject token type: `urn:myaccount:cte`
   - Client credentials: `CTE_CLIENT_ID`, `CTE_CLIENT_SECRET`

2. **CTE Action** (`auth0-actions/custom-token-exchange-basic.js`)
   - Validates subject token type: `urn:myaccount:cte`
   - Sets audience to custom domain: `https://login.authskye.org/me/`
   - Uses secret: `CUSTOM_DOMAIN`

3. **Frontend Component** (`src/components/profile/mfa-enrollment.tsx`)
   - Calls `/api/mfa/auth/get-token` on demand
   - Stores token in state (`accessToken`)
   - Sets domain to: `https://login.authskye.org` (custom domain)

4. **Environment Variables** (`.env.local`)
   - `CTE_CLIENT_ID`: `67OqfItt4P43bxdbUg9NTVyPz28sJj3W`
   - `CTE_CLIENT_SECRET`: (configured)
   - `AUTH0_ISSUER_BASE_URL`: `https://login.authskye.org`

### 🔍 Configuration Checklist

Use this checklist to verify your Auth0 configuration matches the passkey demo pattern.

## Step 1: Verify CTE Application

The CTE credentials in `.env.local` represent a **Machine-to-Machine (M2M) Application** in Auth0.

**Check in Auth0 Dashboard:**

1. Navigate to **Applications → Applications**
2. Find application with Client ID: `67OqfItt4P43bxdbUg9NTVyPz28sJj3W`

**Required Settings:**
- ✅ Application Type: `Machine to Machine`
- ✅ Token Endpoint Authentication Method: `Client Secret (Post)` or `Client Secret (Basic)`
- ✅ Grant Types: Must include `Token Exchange` (urn:ietf:params:oauth:grant-type:token-exchange)

**🚨 CRITICAL:** If "Token Exchange" grant type is NOT enabled, enable it:
- Application Settings → Advanced Settings → Grant Types
- Check: ☑️ `Token Exchange`
- Save changes

## Step 2: Verify Token Exchange Profile

Auth0 requires a **Token Exchange Profile** to link your CTE Action to specific applications.

**Check in Auth0 Dashboard:**

1. Navigate to **Auth Pipeline → Token Exchange Profiles** (or **Applications → Token Exchange**)
2. Look for a profile (e.g., "My Account API Token Exchange")

**Required Configuration:**
- ✅ Profile Name: (any descriptive name, e.g., "My Account CTE")
- ✅ Token Exchange Action: Must be linked to `custom-token-exchange-basic` action
- ✅ Applications: Must include:
  - Your frontend app (`U8QtmFYd45QbH1nFwiIzpf0do8xmpmlg`)
  - Your CTE M2M app (`67OqfItt4P43bxdbUg9NTVyPz28sJj3W`)

**🚨 If profile doesn't exist:**
1. Click **Create Profile**
2. Name: `My Account API Token Exchange`
3. Select your CTE Action: `custom-token-exchange-basic`
4. Add both applications (frontend + CTE M2M)
5. Save

## Step 3: Verify CTE Action Deployment

**Check in Auth0 Dashboard:**

1. Navigate to **Auth Pipeline → Actions → Custom**
2. Find action: `custom-token-exchange-basic`
3. Verify:
   - ✅ Status: `Deployed` (green checkmark)
   - ✅ Trigger: `Custom Token Exchange`
   - ✅ Secret configured: `CUSTOM_DOMAIN = login.authskye.org`

**If action needs deployment:**
1. Click on action
2. Add secret: `CUSTOM_DOMAIN` = `login.authskye.org`
3. Click **Deploy**

## Step 4: Verify Custom Domain Configuration

Your tokens use **custom domain audience**, so the domain must be active.

**Check in Auth0 Dashboard:**

1. Navigate to **Branding → Custom Domains**
2. Verify: `login.authskye.org` has status **Verified** (green checkmark)

**Test endpoints:**
```bash
# OpenID Configuration (should return 200)
curl https://login.authskye.org/.well-known/openid-configuration

# JWKS endpoint (should return public keys)
curl https://login.authskye.org/.well-known/jwks.json
```

## Step 5: Test Token Exchange Flow

### Test 1: Get Token via API

```bash
# Start dev server
npm run dev

# Login to app
# Navigate to Profile → Security tab
# Click "Get My Account API Token" button
```

**Expected Console Output:**

```
🔄 Performing on-demand token exchange for My Account API...
   userId: auth0|67a1183f438f78a33863e422
   audience: https://login.authskye.org/me/

✅ Token exchange successful:
   hasAccessToken: true
   expiresIn: 600
   scope: read:me:authentication_methods create:me:authentication_methods ...
```

**Browser Console:**

```javascript
✅ My Account API token received: {
  audience: "https://login.authskye.org/me/",
  expiresIn: 600,
  scope: "read:me:authentication_methods ..."
}
```

### Test 2: Decode Token

After getting token, decode it in browser console:

```javascript
// Copy token from network tab or state
const token = "eyJ..."; // Your actual token
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);
```

**Expected Token Payload:**

```json
{
  "iss": "https://login.authskye.org/",
  "sub": "auth0|67a1183f438f78a33863e422",
  "aud": [
    "https://login.authskye.org/me/",
    "https://login.authskye.org/userinfo"
  ],
  "iat": 1776259009,
  "exp": 1776259609,
  "scope": "openid profile email read:me:authentication_methods create:me:authentication_methods update:me:authentication_methods delete:me:authentication_methods",
  "azp": "U8QtmFYd45QbH1nFwiIzpf0do8xmpmlg"
}
```

**🚨 CRITICAL Checks:**
- ✅ `aud` includes: `https://login.authskye.org/me/` (MUST match your custom domain)
- ✅ `iss` is: `https://login.authskye.org/` (custom domain with trailing slash)
- ✅ `scope` includes: `read:me:authentication_methods`, `create:me:authentication_methods`, etc.

### Test 3: Call My Account API

After getting token, click **"Test API"** button in Security tab.

**Expected Response (if My Account API is activated):**

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

## Common Errors & Solutions

### Error: "Token exchange not configured"

**Symptom:**
```json
{
  "error": "Token exchange not configured",
  "message": "Custom Token Exchange (CTE) client credentials are missing..."
}
```

**Cause:** Missing `CTE_CLIENT_ID` or `CTE_CLIENT_SECRET` in `.env.local`

**Fix:**
1. Check `.env.local` lines 42-43
2. Verify values are present and not empty
3. Restart dev server: `npm run dev`

### Error: "unauthorized_client"

**Symptom:**
```json
{
  "error": "unauthorized_client",
  "error_description": "Grant type 'urn:ietf:params:oauth:grant-type:token-exchange' not allowed for the client."
}
```

**Cause:** CTE application doesn't have Token Exchange grant type enabled

**Fix:**
1. Go to Auth0 Dashboard → Applications
2. Find CTE app (`67OqfItt4P43bxdbUg9NTVyPz28sJj3W`)
3. Settings → Advanced Settings → Grant Types
4. Check: ☑️ `Token Exchange`
5. Save

### Error: "access_denied"

**Symptom:**
```json
{
  "error": "access_denied",
  "error_description": "No token exchange profile found"
}
```

**Cause:** Token Exchange Profile not created or not linked to applications

**Fix:**
1. Follow **Step 2** above to create Token Exchange Profile
2. Link both your frontend app and CTE M2M app
3. Ensure profile uses your CTE Action

### Error: "subject_token_type_not_supported"

**Symptom:**
```json
{
  "error": "access_denied",
  "error_description": "subject_token_type_not_supported"
}
```

**Cause:** CTE Action is rejecting the token type

**Fix:**
1. Check CTE Action line 25: `subject_token_type !== "urn:myaccount:cte"`
2. Check token exchange request line 62: `subject_token_type: 'urn:myaccount:cte'`
3. Ensure both match exactly

### Error: 404 "resource not found" (after successful token exchange)

**Symptom:**
- Token exchange succeeds (200 OK)
- Token has correct audience
- But API call returns 404

**Cause:** My Account API not activated in tenant

**Check:**
1. Auth0 Dashboard → Applications → APIs
2. Look for "MyAccount API" or activation banner
3. If not visible, My Account API is not available (Limited Early Access feature)

**Status Check:**
- If you see the API management dashboard in Auth0, My Account API is available
- If you DON'T see it, contact Auth0 Support to request access

### Error: Domain mismatch

**Symptom:**
- Token has audience: `https://login.authskye.org/me/`
- But API calls fail with 401 or 404

**Cause:** API endpoint URL doesn't match token audience

**Fix:**
Ensure frontend uses **custom domain** for API calls:

```typescript
// ✅ CORRECT (matches token audience)
const myAccountUrl = `https://login.authskye.org/me/authentication-methods`;

// ❌ WRONG (doesn't match token audience)
const myAccountUrl = `https://archfaktor.us.auth0.com/me/authentication-methods`;
```

## Success Criteria

You've successfully configured My Account API when:

1. ✅ Token exchange returns 200 OK with `access_token`
2. ✅ Decoded token has:
   - Audience: `https://login.authskye.org/me/`
   - Scopes: `read:me:authentication_methods`, etc.
3. ✅ API test call returns:
   - **200 OK**: My Account API is activated → proceed with MFA management
   - **404 Not Found**: My Account API not activated → contact Auth0 Support

## Next Steps

### If 200 OK (My Account API Available)

You're ready to use MFA management! Try:

1. **Enroll SMS MFA:**
   - Select "SMS" factor
   - Enter phone number
   - Submit enrollment

2. **Enroll TOTP MFA:**
   - Select "Authenticator App" factor
   - Scan QR code
   - Enter verification code

3. **List enrolled methods:**
   - Should see your newly enrolled factors

### If 404 (My Account API Not Available)

My Account API is in **Limited Early Access**. You have two options:

**Option A: Request Access**
1. Contact Auth0 Support
2. Request My Account API activation for your tenant
3. Wait for confirmation (may take several days)

**Option B: Use Legacy MFA System**
Revert to the previous implementation:

```bash
# Restore old MFA component
mv src/components/profile/mfa-enrollment.tsx src/components/profile/mfa-enrollment-myaccount.tsx
mv src/components/profile/mfa-enrollment-old.tsx.backup src/components/profile/mfa-enrollment.tsx

# Restart server
npm run dev
```

See `CLAUDE.md` section 9 (My Account API for MFA Management) for rollback details.

## Key Differences: Your Implementation vs Passkey Demo

| Aspect | Passkey Demo | Your Implementation | Status |
|--------|--------------|---------------------|--------|
| Token Exchange Method | Custom Token Exchange (CTE) | Custom Token Exchange (CTE) | ✅ Same |
| Grant Type | `urn:ietf:params:oauth:grant-type:token-exchange` | `urn:ietf:params:oauth:grant-type:token-exchange` | ✅ Same |
| Subject Token Type | Custom URN | `urn:myaccount:cte` | ✅ Similar |
| Audience Domain | Custom domain | Custom domain (`login.authskye.org/me/`) | ✅ Correct |
| API Call Domain | Custom domain | Custom domain | ✅ Correct |
| Token Storage | Post-Login Action passes to form | On-demand endpoint, stored in state | ⚠️ Different but valid |
| CTE Action | Validates + sets audience | Validates + sets audience | ✅ Same pattern |

**Your implementation is architecturally sound!** The main difference is you use on-demand token acquisition (better UX) instead of Post-Login Action injection.

## Additional Resources

- **Passkey Demo Reference:** https://github.com/awhitmana0/a0-passkeyforms-demo
- **Auth0 Token Exchange Docs:** https://auth0.com/docs/get-started/authentication-and-authorization-flow/token-exchange
- **My Account API Docs:** https://auth0.com/docs/manage-users/my-account-api
- **Your Setup Docs:** `docs/MY_ACCOUNT_TOKEN_EXCHANGE_SETUP.md`

---

**Last Updated:** April 2026
**Status:** Diagnostic guide complete - ready for testing
