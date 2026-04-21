# My Account API for MFA Management

## Overview

This application implements **Auth0 My Account API** for user self-service MFA management using the **Custom Token Exchange (CTE)** pattern from the [Auth0 passkey forms demo](https://github.com/awhitmana0/a0-passkeyforms-demo).

**Status:** ✅ Implementation complete - Awaiting Auth0 configuration and API activation

---

## 📚 Documentation Index

### Start Here

| Document | Description | Use When |
|----------|-------------|----------|
| **[Quick Test Guide](MY_ACCOUNT_QUICK_TEST.md)** | 5-minute test to verify setup | Testing for the first time |
| **[Auth0 Setup Checklist](MY_ACCOUNT_AUTH0_SETUP_CHECKLIST.md)** | Step-by-step Auth0 configuration | Setting up Auth0 Dashboard |
| **[Implementation Summary](MY_ACCOUNT_IMPLEMENTATION_SUMMARY.md)** | What's complete, what's needed | Understanding current state |

### Troubleshooting

| Document | Description | Use When |
|----------|-------------|----------|
| **[Diagnostic Guide](MY_ACCOUNT_CTE_DIAGNOSTIC.md)** | Detailed troubleshooting | Token exchange fails |
| **[Flow Diagram](MY_ACCOUNT_CTE_FLOW_DIAGRAM.md)** | Visual flow and error paths | Understanding how it works |
| **[Passkey Comparison](MY_ACCOUNT_PASSKEY_COMPARISON.md)** | Reference implementation comparison | Comparing with working demo |

### Legacy Documentation

| Document | Description | Status |
|----------|-------------|--------|
| [Token Exchange Summary](MY_ACCOUNT_TOKEN_EXCHANGE_SUMMARY.md) | Original implementation notes | ⚠️ Contains outdated info |
| [Token Exchange Setup](MY_ACCOUNT_TOKEN_EXCHANGE_SETUP.md) | Initial setup guide | ⚠️ Use new checklist instead |
| [On-Demand Auth](MY_ACCOUNT_ON_DEMAND_AUTH.md) | On-demand pattern notes | Reference only |

---

## 🚀 Quick Start (New Setup)

### 1. Verify Code is Ready
```bash
# Check environment variables
grep -E "CTE_CLIENT_ID|CTE_CLIENT_SECRET|AUTH0_ISSUER_BASE_URL" .env.local

# Should see:
# CTE_CLIENT_ID=67OqfItt4P43bxdbUg9NTVyPz28sJj3W
# CTE_CLIENT_SECRET=...
# AUTH0_ISSUER_BASE_URL=https://login.authskye.org
```

✅ If all present: Code is ready!

### 2. Configure Auth0 (15 minutes)
Follow: **[Auth0 Setup Checklist](MY_ACCOUNT_AUTH0_SETUP_CHECKLIST.md)**

Required steps:
1. Enable Token Exchange grant on M2M app
2. Create Token Exchange Profile
3. Deploy CTE Action with secret
4. Link applications to profile

### 3. Test Implementation (5 minutes)
Follow: **[Quick Test Guide](MY_ACCOUNT_QUICK_TEST.md)**

Expected results:
- ✅ Token exchange succeeds (200 OK)
- ✅ Token has correct audience
- ✅ API test returns 200 or 404

### 4. Outcome

**If API test returns 200 OK:**
🎉 **Success!** My Account API is activated. You can now use MFA management features.

**If API test returns 404:**
⚠️ My Account API not activated in tenant. Contact Auth0 Support to request activation.

---

## 🔍 Troubleshooting (Common Issues)

### Issue: "Token exchange not configured"

**Symptom:**
```json
{
  "error": "Token exchange not configured",
  "message": "Custom Token Exchange (CTE) client credentials are missing..."
}
```

**Fix:** Add CTE credentials to `.env.local`
```env
CTE_CLIENT_ID=67OqfItt4P43bxdbUg9NTVyPz28sJj3W
CTE_CLIENT_SECRET=your-secret-here
```

**Docs:** [Implementation Summary](MY_ACCOUNT_IMPLEMENTATION_SUMMARY.md) → Environment Variables

---

### Issue: "unauthorized_client"

**Symptom:**
```json
{
  "error": "unauthorized_client",
  "error_description": "Grant type 'urn:ietf:params:oauth:grant-type:token-exchange' not allowed..."
}
```

**Fix:** Enable Token Exchange grant type in M2M application
- Auth0 Dashboard → Applications → {CTE_APP}
- Settings → Advanced Settings → Grant Types
- Check: ☑️ Token Exchange
- Save

**Docs:** [Auth0 Setup Checklist](MY_ACCOUNT_AUTH0_SETUP_CHECKLIST.md) → Step 1

---

### Issue: "access_denied: No token exchange profile found"

**Symptom:**
```json
{
  "error": "access_denied",
  "error_description": "No token exchange profile found"
}
```

**Fix:** Create Token Exchange Profile
- Auth0 Dashboard → Auth Pipeline → Token Exchange Profiles
- Create profile, link CTE Action, add both applications

**Docs:** [Auth0 Setup Checklist](MY_ACCOUNT_AUTH0_SETUP_CHECKLIST.md) → Step 2

---

### Issue: Token exchange works but API returns 404

**Symptom:**
- ✅ Token exchange succeeds (200 OK)
- ✅ Token has correct audience
- ❌ API test returns 404 "Not Found"

**Cause:** My Account API not activated (Limited Early Access feature)

**Options:**
1. **Request activation:** Contact Auth0 Support
2. **Use legacy MFA system:** Revert to Management API approach (see CLAUDE.md)

**Docs:** [Diagnostic Guide](MY_ACCOUNT_CTE_DIAGNOSTIC.md) → Common Errors

---

### Issue: Token has wrong audience

**Symptom:**
Token payload shows:
```json
{
  "aud": ["https://archfaktor.us.auth0.com/me/"]  // ❌ Wrong (canonical)
}
```

**Expected:**
```json
{
  "aud": ["https://login.authskye.org/me/"]  // ✅ Correct (custom domain)
}
```

**Fix:** CTE Action using wrong domain
- Check action secret: `CUSTOM_DOMAIN = login.authskye.org`
- Verify action code sets custom domain audience
- Redeploy action

**Docs:** [Diagnostic Guide](MY_ACCOUNT_CTE_DIAGNOSTIC.md) → Token Structure

---

## 📋 Configuration Checklist

Quick reference for what needs to be configured:

### Auth0 Dashboard
- [ ] M2M Application exists (`67OqfItt4P43bxdbUg9NTVyPz28sJj3W`)
- [ ] M2M has "Token Exchange" grant enabled
- [ ] Token Exchange Profile created
- [ ] Profile links CTE Action: `custom-token-exchange-basic`
- [ ] Profile includes both applications
- [ ] CTE Action deployed with status "Deployed ✓"
- [ ] CTE Action has secret: `CUSTOM_DOMAIN = login.authskye.org`
- [ ] Custom domain verified: `login.authskye.org`

### Environment Variables
- [ ] `CTE_CLIENT_ID` in `.env.local`
- [ ] `CTE_CLIENT_SECRET` in `.env.local`
- [ ] `AUTH0_ISSUER_BASE_URL=https://login.authskye.org`

### Test Results
- [ ] "Get Token" shows success
- [ ] Token has correct audience
- [ ] "Test API" returns 200 or 404 (not 401/403)

**Full checklist:** [Auth0 Setup Checklist](MY_ACCOUNT_AUTH0_SETUP_CHECKLIST.md)

---

## 🏗️ Architecture Overview

```
User visits Security tab
  ↓
Clicks "Get Token"
  ↓
Frontend: POST /api/mfa/auth/get-token
  ↓
Backend: OAuth2 Token Exchange with Auth0
  ↓
CTE Action validates and sets audience
  ↓
Token returned (audience: custom domain /me/)
  ↓
Frontend stores token
  ↓
All MFA API calls include: Authorization: Bearer {token}
  ↓
My Account API validates and responds
```

**Full diagram:** [Flow Diagram](MY_ACCOUNT_CTE_FLOW_DIAGRAM.md)

---

## 🔑 Key Files

### Application Code
- `src/app/api/mfa/auth/get-token/route.ts` - Token exchange endpoint
- `src/components/profile/mfa-enrollment.tsx` - Frontend UI
- `auth0-actions/custom-token-exchange-basic.js` - CTE Action validator

### Environment
- `.env.local` - CTE credentials and configuration

### Documentation
- `docs/MY_ACCOUNT_*.md` - All My Account API documentation

---

## 💡 Key Concepts

### Custom Token Exchange (CTE)

OAuth2 Token Exchange allows exchanging one token for another with different audience/scopes.

**Your flow:**
```
Standard access token → CTE → My Account API token
```

**Why needed:** My Account API requires specific audience (`/me/`) not in standard login token.

### On-Demand Acquisition

**Passkey demo:** Token generated on every login (wasteful)
**Your implementation:** Token generated only when needed (efficient)

### Custom Domain Strategy

**Both token audience AND API calls use custom domain:**
- Token audience: `https://login.authskye.org/me/`
- API endpoint: `https://login.authskye.org/me/authentication-methods`

**Why:** Token validation requires exact audience match.

---

## 📊 Comparison with Passkey Demo

| Aspect | Passkey Demo | Your Implementation | Better? |
|--------|--------------|---------------------|---------|
| Token timing | On every login | On-demand | ✅ Yours |
| Token storage | Template injection | React state | ✅ Yours |
| Token refresh | Requires re-login | Click button again | ✅ Yours |
| Error handling | Generic errors | Detailed troubleshooting | ✅ Yours |
| Core pattern | CTE | CTE | ✅ Same |
| Domain strategy | Custom domain | Custom domain | ✅ Same |

**Full comparison:** [Passkey Comparison](MY_ACCOUNT_PASSKEY_COMPARISON.md)

---

## 🎯 Success Indicators

### Token Exchange Working
```javascript
// Browser console
✅ My Account API token received: {
  audience: "https://login.authskye.org/me/",
  expiresIn: 600,
  scope: "read:me:authentication_methods ..."
}
```

### Token Structure Correct
```json
{
  "aud": ["https://login.authskye.org/me/"],
  "scope": "read:me:authentication_methods create:me:..."
}
```

### My Account API Activated
```json
{
  "success": true,
  "status": 200,
  "data": []
}
```

---

## 🔗 External Resources

- **Reference Implementation:** https://github.com/awhitmana0/a0-passkeyforms-demo
- **Token Exchange RFC:** https://datatracker.ietf.org/doc/html/rfc8693
- **Auth0 Token Exchange:** https://auth0.com/docs/get-started/authentication-and-authorization-flow/token-exchange
- **My Account API Docs:** https://auth0.com/docs/manage-users/my-account-api
- **My Account API Reference:** https://auth0.com/docs/api/myaccount

---

## 🆘 Getting Help

### Quick Issues
- Check: [Quick Test Guide](MY_ACCOUNT_QUICK_TEST.md) for 5-minute diagnosis
- Review: [Diagnostic Guide](MY_ACCOUNT_CTE_DIAGNOSTIC.md) for detailed troubleshooting

### Configuration Help
- Follow: [Auth0 Setup Checklist](MY_ACCOUNT_AUTH0_SETUP_CHECKLIST.md) step by step
- Verify: All checkboxes checked before testing

### Understanding Implementation
- Read: [Implementation Summary](MY_ACCOUNT_IMPLEMENTATION_SUMMARY.md)
- View: [Flow Diagram](MY_ACCOUNT_CTE_FLOW_DIAGRAM.md)
- Compare: [Passkey Comparison](MY_ACCOUNT_PASSKEY_COMPARISON.md)

### Still Stuck?
1. Check server console logs (look for 🔄, ✅, ❌ emojis)
2. Check browser console for token details
3. Decode token to verify audience and scopes
4. Test with curl to isolate frontend vs backend issues

---

## 📝 Quick Reference

### Test Commands
```bash
# Start dev server
npm run dev

# Test custom domain
curl https://login.authskye.org/.well-known/openid-configuration

# Check environment variables
grep CTE .env.local
```

### Browser Console
```javascript
// Decode token
const token = "eyJ...";
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);

// Check for correct audience
console.log(payload.aud);  // Should include "https://login.authskye.org/me/"
```

### Expected Values
```
Token audience: https://login.authskye.org/me/
API endpoint: https://login.authskye.org/me/authentication-methods
CTE Client ID: 67OqfItt4P43bxdbUg9NTVyPz28sJj3W
Custom domain: login.authskye.org
```

---

**Last Updated:** April 2026
**Status:** Documentation complete
**Next Steps:** Follow [Auth0 Setup Checklist](MY_ACCOUNT_AUTH0_SETUP_CHECKLIST.md)
