# Passkey Origin Mismatch Fix

## Problem

Passkey enrollment fails with error:
```
Error: Unexpected registration response origin.
```

## Root Cause

WebAuthn credentials are **origin-bound**. When you create a credential:
1. Browser creates credential with origin: `https://fresh-bedbug-prepared.ngrok-free.app`
2. Credential's `clientDataJSON` includes this origin
3. Browser sends credential to Auth0 via our API
4. Auth0 validates credential origin matches expected origin: `https://login.authskye.org`
5. **Origins don't match** → 400 error

## Solution Options

### Option 1: Add ngrok Domain to Auth0 Application (Recommended for Dev)

1. **Go to Auth0 Dashboard**
   - Navigate to: Applications → Applications
   - Select your application: "agency-inc-dashboard" (or your app name)

2. **Update Application URIs**
   - Add ngrok URL to:
     - **Allowed Callback URLs**: `https://fresh-bedbug-prepared.ngrok-free.app/api/auth/callback`
     - **Allowed Logout URLs**: `https://fresh-bedbug-prepared.ngrok-free.app`
     - **Allowed Web Origins**: `https://fresh-bedbug-prepared.ngrok-free.app`
     - **Allowed Origins (CORS)**: `https://fresh-bedbug-prepared.ngrok-free.app`

3. **Enable WebAuthn for Development**
   - Navigate to: Authentication → Passkeys
   - Ensure passkeys are enabled
   - Check if there's an "Allowed Origins" field
   - If yes, add: `https://fresh-bedbug-prepared.ngrok-free.app`

4. **Test Again**
   - Refresh browser
   - Try passkey enrollment again
   - Should now work with ngrok domain

### Option 2: Test on Production Domain (Best for Final Testing)

If you have access to a production or staging environment where the app domain matches the custom domain:

1. Deploy app to production
2. Access via: `https://login.authskye.org` (or production URL)
3. WebAuthn origin will match Auth0 expected origin
4. Passkey enrollment will work

### Option 3: Local HTTPS with Custom Domain (Advanced)

Use a local HTTPS setup that matches the custom domain:

1. Set up local DNS resolution (`/etc/hosts`):
   ```
   127.0.0.1 login.authskye.org
   ```

2. Generate SSL certificate for `login.authskye.org`

3. Configure Next.js to use HTTPS locally

4. Access app at `https://login.authskye.org:4020`

This is complex and not recommended for development.

## Code Changes Already Made

The code now automatically detects ngrok/localhost and uses the current hostname as RP ID:

```typescript
// src/components/profile/mfa-enrollment.tsx
const currentOrigin = window.location.origin;
const isLocalDev = currentOrigin.includes('ngrok') || currentOrigin.includes('localhost');
const rpId = isLocalDev ? window.location.hostname : authn_params_public_key.rp.id;
```

**This ensures the credential is created with the correct RP ID**, but Auth0 still needs to accept credentials from that origin.

## Verification Steps

After configuring Auth0:

1. **Open Browser Console**
2. **Navigate to Profile → Security Tab**
3. **Click "Passkey" card**
4. **Watch console logs:**
   ```
   🔐 WebAuthn RP ID: {
     auth0Provided: "login.authskye.org",
     currentOrigin: "https://fresh-bedbug-prepared.ngrok-free.app",
     isLocalDev: true,
     usingRpId: "fresh-bedbug-prepared.ngrok-free.app"
   }
   ```

5. **Complete biometric prompt**
6. **Expected result:**
   - ✅ Credential created successfully
   - ✅ Verification succeeds (200 OK)
   - ✅ Toast: "Passkey Enrolled!"
   - ✅ Passkey appears in enrolled methods

## Alternative: Test with Localhost

If ngrok is causing issues, test with `localhost:4020` (over HTTP):

1. Update `.env.local`:
   ```env
   AUTH0_BASE_URL='http://localhost:4020'
   ```

2. Update Auth0 Application URLs (add localhost)

3. Restart dev server: `npm run dev`

4. Access: `http://localhost:4020`

**Note:** Some browsers (Safari) require HTTPS for WebAuthn, so this may not work on all browsers.

## Expected Auth0 Configuration

Your Auth0 application should have these URLs configured:

**Allowed Callback URLs:**
```
https://login.authskye.org/api/auth/callback,
https://fresh-bedbug-prepared.ngrok-free.app/api/auth/callback
```

**Allowed Logout URLs:**
```
https://login.authskye.org,
https://fresh-bedbug-prepared.ngrok-free.app
```

**Allowed Web Origins:**
```
https://login.authskye.org,
https://fresh-bedbug-prepared.ngrok-free.app
```

**Allowed Origins (CORS):**
```
https://login.authskye.org,
https://fresh-bedbug-prepared.ngrok-free.app
```

## Still Not Working?

If you've added ngrok to Auth0 settings and it still fails:

1. **Check Auth0 Logs** (Dashboard → Monitoring → Logs)
   - Look for `Failed WebAuthn Credential Registration` events
   - Check error details

2. **Verify Custom Domain** is fully configured:
   ```bash
   curl https://login.authskye.org/.well-known/openid-configuration
   ```

3. **Test without My Account API** using Auth0 Universal Login:
   - Does passkey enrollment work in Universal Login page?
   - If yes → My Account API configuration issue
   - If no → Tenant-level passkey configuration issue

4. **Contact Auth0 Support** if issue persists:
   - Provide tenant name
   - Provide application client ID
   - Mention "My Account API passkey enrollment with custom domain"

## Why This Happens

WebAuthn security model:
- Credentials are **origin-bound** (防止钓鱼攻击)
- Browser includes origin in `clientDataJSON`
- Server validates origin matches expected value
- Cannot use credential on different origin

This is **intentional security** - prevents credential theft across domains.

## Summary

✅ **Short-term fix**: Add ngrok domain to Auth0 application settings
✅ **Long-term fix**: Test on production where origin matches custom domain
✅ **Code is ready**: Automatically handles local dev vs production RP IDs
