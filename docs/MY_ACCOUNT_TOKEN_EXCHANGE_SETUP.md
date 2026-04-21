# My Account API Token Exchange Setup

This guide walks you through setting up **on-demand token exchange** for Auth0 My Account API integration.

## Overview

Your application needs a token with `audience: "https://login.authskye.org/me/"` to call My Account API endpoints. This guide implements the pattern from [a0-passkeyforms-demo](https://github.com/awhitmana0/a0-passkeyforms-demo) with **on-demand** token exchange (only when user visits Security tab).

## Architecture

```
User visits Security tab
         ↓
Frontend calls: POST /api/mfa/auth/get-token
         ↓
Backend performs token exchange with Auth0
         ↓
Gets token with correct audience
         ↓
Returns token to frontend
         ↓
Frontend uses token for My Account API calls
```

## Prerequisites

- Auth0 tenant with custom domain configured
- Application with My Account API scopes requested
- Access to Auth0 Dashboard (Actions section)

## Step 1: Create CTE Application (M2M Client)

This is a Machine-to-Machine application used exclusively for token exchange.

1. Go to **Auth0 Dashboard → Applications → Applications**
2. Click **Create Application**
3. Name: `My Account API Token Exchange (CTE)`
4. Type: **Machine to Machine Applications**
5. Click **Create**
6. On the Settings tab:
   - Copy **Client ID** → Save as `CTE_CLIENT_ID`
   - Copy **Client Secret** → Save as `CTE_CLIENT_SECRET`
7. **DO NOT** authorize this application to any APIs
8. Click **Save Changes**

## Step 2: Deploy CTE Action

This 3-line Action validates token exchange requests.

1. Go to **Auth0 Dashboard → Actions → Library**
2. Click **Create Action → Build from Scratch**
3. Name: `Custom Token Exchange - Basic`
4. Trigger: **Custom Token Exchange**
5. Click **Create**
6. Replace code with contents of `auth0-actions/custom-token-exchange-basic.js`:

```javascript
exports.onExecuteCustomTokenExchange = async (event, api) => {
  if (event.transaction.protocol_params.subject_token_type !== "urn:cteforms") {
    api.access.deny('subject_token_type_not_supported');
  }
};
```

7. Click **Deploy**

## Step 3: Create Token Exchange Profile

This profile links the CTE Action to your application.

1. Go to **Auth0 Dashboard → Actions → Token Exchange Profiles**
2. Click **Create Profile**
3. Name: `My Account API Token Exchange`
4. Description: `On-demand token exchange for My Account API`
5. **Action**: Select `Custom Token Exchange - Basic`
6. Click **Create**
7. On the profile page, go to **Applications** tab
8. Click **Add Application**
9. Select your main application (e.g., `Agency Inc Dashboard`)
10. Click **Add**

## Step 4: Add Environment Variables

Add these to your `.env.local`:

```bash
# Custom Token Exchange (CTE) credentials
CTE_CLIENT_ID='abc123...'           # From Step 1
CTE_CLIENT_SECRET='xyz789...'       # From Step 1
```

## Step 5: Test Token Exchange

1. Restart your dev server: `npm run dev`
2. Navigate to **Profile → Security** tab
3. Click the **Refresh** button next to "Access Token"
4. Check browser console for logs:
   - `🔄 Requesting My Account API token via token exchange...`
   - `✅ My Account API token received:`
5. You should see a toast notification: "My Account API token ready"

If successful, the token field will populate with a JWT token.

## Step 6: Test My Account API

With the token now loaded, test the API:

1. In the **My Account API Tester** section
2. Select endpoint: `/me/authentication-methods`
3. Method: `GET`
4. Click **Test My Account API**
5. You should see:
   - Status: `200 OK`
   - Response body with your enrolled MFA methods

## Troubleshooting

### Error: "Token exchange not configured"
- Check that `CTE_CLIENT_ID` and `CTE_CLIENT_SECRET` are in `.env.local`
- Restart dev server after adding variables

### Error: "Token exchange failed"
- **Check CTE Action**: Ensure it's deployed (Auth0 Dashboard → Actions → Library)
- **Check Token Exchange Profile**: Ensure it exists and has your application linked
- **Check credentials**: Verify Client ID and Secret match the CTE application

### Error: "subject_token_type_not_supported"
- The CTE Action is working but rejecting the request
- Check that the action code matches exactly (case-sensitive)

### Token received but API calls fail with 403/404
- Decode the token (use jwt.io) and check `aud` claim
- Should be: `https://login.authskye.org/me/`
- If different, check `AUTH0_ISSUER_BASE_URL` environment variable

### Token received but API calls fail with "insufficient_scope"
- Token doesn't have required scopes
- Check `AUTH0_SCOPE` in `.env.local` includes My Account API scopes:
  ```
  read:me:authentication_methods create:me:authentication_methods update:me:authentication_methods delete:me:authentication_methods
  ```

## Verifying Token

To verify your token has the correct audience:

1. Copy the access token from the UI
2. Go to https://jwt.io/
3. Paste token in "Encoded" section
4. Check the payload:
   - `aud`: Should be `https://login.authskye.org/me/`
   - `scope`: Should include My Account API scopes

## Security Notes

- Token exchange happens **only when needed** (Security tab visits)
- Token is **not stored in session** (exists only in component state)
- Token expires in 1 hour (standard Auth0 access token TTL)
- User must re-visit Security tab to get a fresh token after expiry

## Next Steps

Once token exchange is working:
1. Test MFA enrollment workflows
2. Add passkey support (similar pattern)
3. Implement token refresh logic if needed

## Reference

- **Repository**: https://github.com/awhitmana0/a0-passkeyforms-demo
- **Auth0 Docs**: https://auth0.com/docs/get-started/authentication-and-authorization-flow/token-exchange
- **My Account API**: https://auth0.com/docs/manage-users/my-account-api
