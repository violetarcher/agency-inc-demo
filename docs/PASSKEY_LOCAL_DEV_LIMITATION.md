# Passkey Local Development Limitation

## Issue

Passkey enrollment via My Account API **cannot work in local development** with ngrok or localhost when using a custom domain.

## Why It Doesn't Work

### WebAuthn Security Model

WebAuthn has a strict security requirement:
- **RP ID must be a registrable domain suffix of the current domain**
- Example valid combinations:
  - Current domain: `app.example.com`, RP ID: `example.com` ✅
  - Current domain: `login.example.com`, RP ID: `example.com` ✅
  - Current domain: `example.com`, RP ID: `example.com` ✅

### Your Current Setup

- **App runs on**: `https://fresh-bedbug-prepared.ngrok-free.app`
- **Auth0 custom domain**: `https://login.authskye.org`
- **Auth0 returns RP ID**: `login.authskye.org`
- **Problem**: `login.authskye.org` is NOT a suffix of `fresh-bedbug-prepared.ngrok-free.app` ❌

### My Account API Constraint

The My Account API **does not allow overriding the RP ID**:
- RP ID is determined by Auth0 based on your tenant configuration
- No request parameter to specify custom RP ID
- Returns the custom domain as RP ID
- Reference: https://auth0.com/docs/api/myaccount/authentication-methods/start-the-enrollment-of-a-supported-authentication-method

### Browser Error

When you try to create a credential with mismatched RP ID:

```
SecurityError: The relying party ID is not a registrable domain suffix of,
nor equal to the current domain. Subsequently, an attempt to fetch the
.well-known/webauthn resource of the claimed RP ID failed.
```

This is **intentional browser security** - not a bug.

## Difference from Primary Passkeys

**This limitation is specific to My Account API passkeys (MFA)**:

| Aspect | Primary Passkeys (Auth0 Docs) | My Account API Passkeys (What we're implementing) |
|--------|-------------------------------|---------------------------------------------------|
| **Purpose** | Password replacement | Secondary MFA factor |
| **Configuration** | Dashboard → Authentication → Passkeys | My Account API |
| **RP ID Config** | ✅ Can configure via tenant settings | ❌ No configuration - uses custom domain |
| **Local Dev** | May work with proper config | ❌ Doesn't work with ngrok/localhost |
| **Documentation** | https://auth0.com/docs/authenticate/database-connections/passkeys | https://auth0.com/docs/api/myaccount |

## Solutions

### Solution 1: Deploy to Vercel (Recommended)

**Quick Steps:**

1. **Deploy to Vercel:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel
   ```

2. **Configure Environment Variables:**
   - Add all `.env.local` variables to Vercel project settings
   - Update `AUTH0_BASE_URL` to your Vercel deployment URL

3. **Update Auth0 Application Settings:**
   - Add Vercel URL to Allowed Callback URLs: `https://your-app.vercel.app/api/auth/callback`
   - Add to Allowed Logout URLs: `https://your-app.vercel.app`
   - Add to Allowed Web Origins: `https://your-app.vercel.app`
   - Add to Allowed Origins (CORS): `https://your-app.vercel.app`
   - Enable "Allow Cross-Origin Authentication" toggle

4. **Test Passkeys:**
   - Navigate to deployed URL
   - Go to Profile → Security tab
   - Click "Get My Account API Token"
   - Click "Passkey" card
   - Complete biometric enrollment

**For Local Development:**
- ✅ Test SMS, TOTP, Email MFA (these work fine locally)
- ⚠️ Passkey card will appear but will fail due to domain mismatch

**Alternative: Custom Domain on Vercel**
- Configure a custom domain under `authskye.org` (e.g., `app.authskye.org`)
- This eliminates the cross-origin issue entirely

### Solution 2: Use Auth0's Canonical Domain (If Possible)

If you don't require custom domain for local dev:

1. Update `.env.local`:
   ```env
   AUTH0_ISSUER_BASE_URL='https://archfaktor.us.auth0.com'
   NEXT_PUBLIC_MY_ACCOUNT_AUDIENCE='https://archfaktor.us.auth0.com/me/'
   ```

2. Update CTE token exchange to use canonical domain

3. Test if Auth0 returns a different RP ID that might work

**Note**: This may have other side effects with your custom domain configuration.

## Recommended Approach

**For this project:**

1. ✅ **Keep passkey code as-is** - it's correctly implemented
2. ✅ **Test other MFA methods locally** (SMS, TOTP, Email)
3. ✅ **Document this limitation** (this file)
4. ✅ **Deploy to Vercel to test passkeys**
5. ✅ **Passkey card remains visible** - users will see helpful error messages if attempting to enroll locally

## Verification Checklist

Before testing passkeys in production:

- [ ] Custom domain is fully configured and verified
- [ ] Application Allowed Origins includes production domain
- [ ] Allow Cross-Origin Authentication is enabled (if using subdomain)
- [ ] My Account API is activated in tenant
- [ ] Client grant includes passkey scopes
- [ ] NEXT_PUBLIC_ENABLED_MFA_FACTORS includes 'passkey'
- [ ] Application deployed to domain matching or under custom domain

## Summary

✅ **Passkey implementation is correct**
❌ **Local testing is not possible** due to WebAuthn domain restrictions
✅ **Test other MFA methods locally**
✅ **Deploy to test passkeys**

This is a **platform limitation**, not a code issue.
