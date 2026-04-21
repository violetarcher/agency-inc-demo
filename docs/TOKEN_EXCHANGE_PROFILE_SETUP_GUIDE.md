# Token Exchange Profile Setup & Troubleshooting Guide

## Error Resolution: "custom_authentication" Token Exchange Profile is not allowed for the client

### The Problem

When attempting token exchange, you receive:
```
Error: "custom_authentication" Token Exchange Profile is not allowed for the client.
Client ID: [YOUR_M2M_CLIENT_ID]
```

This means the Token Exchange Profile exists but doesn't permit your client to use it.

---

## Root Cause

Token Exchange Profiles have **client restrictions** configured in Auth0 Dashboard. The profile only allows specific applications/clients to initiate token exchange requests. Your current client is not in that allowlist.

---

## Solution: Add Clients to Token Exchange Profile

### Step-by-Step Dashboard Configuration

#### 1. Navigate to Token Exchange Profiles
```
Auth0 Dashboard
  → Actions (left sidebar)
  → Token Exchange Profiles
```

#### 2. Select Your Profile
Click on: **"My Account API Token Exchange"** (or your profile name)

#### 3. Go to Applications Tab
In the profile details, click the **"Applications"** tab (not "Settings" or "CTE Action")

#### 4. Add Your Main Application
- Click **"Add Application"**
- Search for: **"Agency Inc Dashboard"** (your main application name)
- Select it from the list
- Click **"Add"** or **"Confirm"**

Expected result: Your main application appears in the Applications list

#### 5. (Optional) Add CTE M2M Client
If using the M2M-based approach:
- Click **"Add Application"** again
- Search for: **"My Account API Token Exchange (CTE)"** or your M2M client name
- Select it
- Click **"Add"**

#### 6. Verify Configuration
You should now see in the Applications section:
```
✓ Agency Inc Dashboard
✓ My Account API Token Exchange (CTE)  [if using M2M approach]
```

---

## Code Configuration

### Recommended: Use Main Application Client

Update `src/app/api/mfa/auth/get-token/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

export const POST = withApiAuthRequired(async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user?.sub) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const myAccountAudience = `${process.env.AUTH0_MGMT_DOMAIN}/me/`;

    console.log('🔄 Performing token exchange...', {
      userId: user.sub,
      audience: myAccountAudience,
      clientId: process.env.AUTH0_CLIENT_ID,
    });

    // Token exchange using MAIN application client
    const tokenExchangePayload = {
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      client_id: process.env.AUTH0_CLIENT_ID,           // ← Main app
      client_secret: process.env.AUTH0_CLIENT_SECRET,   // ← Main app secret
      audience: myAccountAudience,
      scope: 'read:me:authentication_methods create:me:authentication_methods update:me:authentication_methods delete:me:authentication_methods',
      subject_token: user.sub,
      subject_token_type: 'https://myaccountcte/me/',   // Must match CTE Action
    };

    const tokenResponse = await fetch(
      `${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(tokenExchangePayload).toString(),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('❌ Token exchange failed:', {
        status: tokenResponse.status,
        error: errorData.error,
        description: errorData.error_description,
      });

      // Helpful troubleshooting message
      if (errorData.error_description?.includes('not allowed')) {
        return NextResponse.json(
          {
            error: 'Token exchange not authorized',
            message: 'Your application is not authorized to use this Token Exchange Profile.',
            troubleshooting: 'Add your application to the profile in Auth0 Dashboard → Actions → Token Exchange Profiles → Applications tab',
            details: errorData,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          error: 'Token exchange failed',
          message: errorData.error_description || errorData.error,
          details: errorData,
        },
        { status: tokenResponse.status }
      );
    }

    const tokenData = await tokenResponse.json();

    console.log('✅ Token exchange successful:', {
      hasAccessToken: !!tokenData.access_token,
      expiresIn: tokenData.expires_in,
    });

    return NextResponse.json({
      success: true,
      accessToken: tokenData.access_token,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope,
      audience: myAccountAudience,
      exchangedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Token exchange error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
  }
});
```

### Update .env.local

Remove CTE client credentials (no longer needed):

```bash
# Remove these lines:
# CTE_CLIENT_ID=...
# CTE_CLIENT_SECRET=...

# Keep these (already present):
AUTH0_CLIENT_ID='your_main_app_client_id'
AUTH0_CLIENT_SECRET='your_main_app_client_secret'
AUTH0_MGMT_DOMAIN='archfaktor.us.auth0.com'
AUTH0_ISSUER_BASE_URL='https://login.authskye.org'
```

### Restart Server

```bash
# Stop current dev server (Ctrl+C)
# Restart
npm run dev
```

---

## Alternative: Keep M2M Approach

If you prefer to keep the M2M client separation:

### Dashboard Configuration (M2M-based)

In **Auth0 Dashboard → Actions → Token Exchange Profiles → Applications tab**, ensure **ONLY** the M2M client is listed:

```
✓ My Account API Token Exchange (CTE)
```

Do NOT add the main application if using pure M2M approach.

### Code Configuration (M2M-based)

Keep the original implementation using `CTE_CLIENT_ID` and `CTE_CLIENT_SECRET`:

```typescript
const tokenExchangePayload = {
  grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
  client_id: process.env.CTE_CLIENT_ID,           // ← M2M client
  client_secret: process.env.CTE_CLIENT_SECRET,   // ← M2M secret
  // ... rest same
};
```

### Requirements for M2M Approach

1. **M2M client created:** Auth0 Dashboard → Applications → Create Application → Machine to Machine
2. **M2M client NOT authorized to any APIs** (leave as is)
3. **M2M client MUST be in profile's Applications list**
4. **CTE_CLIENT_ID and CTE_CLIENT_SECRET in .env.local**

---

## Verification: Testing Token Exchange

### 1. Start Dev Server
```bash
npm run dev
```

### 2. Login to Application
Navigate to app and log in (ensure you have a session with refresh token)

### 3. Visit Security Tab
```
Profile → Security tab
```

### 4. Click "Get Token" Button
Browser console should show:
```
🔄 Performing token exchange...
  userId: auth0|...
  audience: https://archfaktor.us.auth0.com/me/
  clientId: U8QtmFYd45QbH1nFwiIzpf0do8xmpmlg
```

### 5. Check for Success
Expected response:
```json
{
  "success": true,
  "accessToken": "eyJhbGc...",
  "expiresIn": 3600,
  "scope": "read:me:authentication_methods create:me:authentication_methods ...",
  "audience": "https://archfaktor.us.auth0.com/me/"
}
```

### 6. Error Diagnosis

**If you get "not allowed for the client":**
- Main app is NOT in profile's Applications tab (if using main app approach)
- OR M2M client is NOT in profile's Applications tab (if using M2M approach)

**If you get "subject_token_type_not_supported":**
- CTE Action is rejecting the request
- Check that `subject_token_type` matches exactly
- See CTE Action validation code

**If you get "invalid_grant":**
- No refresh token in session
- Log out completely and log back in
- Ensure you have `offline_access` scope

---

## Configuration Comparison

### Main Application Approach (RECOMMENDED)

| Aspect | Details |
|--------|---------|
| **Clients** | Uses existing AUTH0_CLIENT_ID/SECRET |
| **Dashboard Config** | Add main app to profile's Applications |
| **Env Variables** | No changes needed |
| **Code** | Use AUTH0_CLIENT_ID in token exchange |
| **Complexity** | Lower - one client to manage |
| **Security** | Standard - same as existing auth |
| **When to Use** | Most deployments |

### M2M Approach

| Aspect | Details |
|--------|---------|
| **Clients** | Create separate M2M client (CTE) |
| **Dashboard Config** | Add M2M client to profile's Applications |
| **Env Variables** | Add CTE_CLIENT_ID and CTE_CLIENT_SECRET |
| **Code** | Use CTE_CLIENT_ID in token exchange |
| **Complexity** | Higher - two clients to manage |
| **Security** | Separation of concerns, clearer audit trail |
| **When to Use** | Large orgs with strict client isolation |

---

## Common Issues & Fixes

### Issue: "custom_authentication" Token Exchange Profile is not allowed for the client

**Symptoms:**
- Token exchange request fails immediately
- Error includes client ID

**Cause:**
- Client not added to profile's Applications list in Dashboard

**Fix:**
1. Go to Auth0 Dashboard → Actions → Token Exchange Profiles
2. Select your profile
3. Click **Applications** tab
4. Click **"Add Application"**
5. Add your application (main app or M2M client depending on approach)
6. Restart server

---

### Issue: "subject_token_type_not_supported"

**Symptoms:**
- Token exchange request fails
- Error suggests CTE Action is rejecting it

**Cause:**
- subject_token_type in request doesn't match CTE Action validation

**Fix:**
Verify CTE Action code:
```javascript
exports.onExecuteCustomTokenExchange = async (event, api) => {
  if (event.transaction.protocol_params.subject_token_type !== "urn:cteforms") {
    api.access.deny('subject_token_type_not_supported');
  }
};
```

Ensure request matches (this is the default):
```typescript
subject_token_type: 'https://myaccountcte/me/',  // ← Update if using different type
```

Or update CTE Action to accept your type.

---

### Issue: "access_denied"

**Symptoms:**
- Token exchange returns 403
- Generic "access_denied" error

**Cause:**
- Client not authorized for requested scopes
- OR client not linked to profile

**Fix:**
1. Verify client is in profile's Applications tab
2. Verify application has My Account API scopes requested:
   - Go to Auth0 Dashboard → Applications → Your App → API
   - Ensure My Account API scopes are requested

---

### Issue: "invalid_grant"

**Symptoms:**
- Token exchange fails
- Error indicates grant validation failed

**Causes (in order of likelihood):**
1. No refresh token in session
2. Refresh token expired
3. Client credentials are incorrect

**Fix:**
1. Log out completely
2. Clear browser cache/cookies
3. Log back in (creates new session with refresh token)
4. Try token exchange again

---

## Debugging Steps

### 1. Check Profile Exists
```bash
curl https://archfaktor.us.auth0.com/api/v2/token-exchange-profiles \
  -H "Authorization: Bearer {MGMT_TOKEN}" \
  | jq '.token_exchange_profiles[] | select(.name | contains("My Account"))'
```

Should show your profile with id starting with `tep_`

### 2. Check CTE Action Deployed
```bash
curl https://archfaktor.us.auth0.com/api/v2/actions/actions \
  -H "Authorization: Bearer {MGMT_TOKEN}" \
  | jq '.actions[] | select(.trigger_id == "custom-token-exchange")'
```

Should show your CTE Action deployed

### 3. Verify Application Configuration
In browser console after successful token exchange:
```javascript
// Paste the access token here
const token = 'eyJhbGc...';
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);
```

Should show:
```json
{
  "iss": "https://login.authskye.org/",
  "aud": ["https://archfaktor.us.auth0.com/me/", ...],
  "scope": "read:me:authentication_methods create:me:authentication_methods ...",
  "azp": "YOUR_CLIENT_ID"
}
```

Key checks:
- ✅ `aud` includes `https://archfaktor.us.auth0.com/me/`
- ✅ `scope` includes My Account API scopes
- ✅ `azp` (authorized party) matches your client ID

---

## Next Steps After Setup

Once token exchange is working:

1. **Test MFA Enrollment:** Profile → Security → Try enrolling SMS/TOTP
2. **Test MFA Removal:** Try removing an enrolled method
3. **Check Token Refresh:** Visit Security tab multiple times (token should refresh)
4. **Monitor Logs:** Watch server console for token exchange logs
5. **Test in Staging:** Before deploying to production

---

## References

- **SDK Types:** `/node_modules/auth0/dist/esm/management/__generated/models/index.d.ts`
- **Implementation:** `/src/app/api/mfa/auth/get-token/route.ts`
- **Docs:** `/docs/MY_ACCOUNT_TOKEN_EXCHANGE_SETUP.md`
- **Auth0 Docs:** https://auth0.com/docs/get-started/authentication-and-authorization-flow/token-exchange

---

**Last Updated:** April 2026
**Status:** Complete troubleshooting guide with both approaches
