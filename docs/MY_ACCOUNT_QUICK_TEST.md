# My Account API Quick Test Guide
## 5-Minute Test to Verify Your Setup

Based on the passkey demo reference implementation.

---

## Prerequisites

- ✅ Dev server running (`npm run dev`)
- ✅ Logged into application
- ✅ Browser DevTools open (F12)

---

## Test 1: Get Token (2 minutes)

### Step 1: Navigate
```
Click: Profile (top-right)
Click: Security tab
```

### Step 2: Get Token
```
Click: "Get My Account API Token" button
```

### Step 3: Check Response

**✅ SUCCESS looks like:**

Browser console:
```javascript
✅ My Account API token received: {
  audience: "https://login.authskye.org/me/",
  expiresIn: 600,
  scope: "read:me:authentication_methods create:me:authentication_methods update:me:authentication_methods delete:me:authentication_methods"
}
```

Server console:
```
🔄 Performing on-demand token exchange for My Account API...
✅ Token exchange successful:
   hasAccessToken: true
   expiresIn: 600
```

**✅ If you see this: Token exchange is working! Proceed to Test 2.**

---

**❌ FAILURE looks like:**

```json
{
  "error": "Token exchange not configured",
  "message": "Custom Token Exchange (CTE) client credentials are missing..."
}
```

**→ Fix:** Check `.env.local` has `CTE_CLIENT_ID` and `CTE_CLIENT_SECRET`

---

```json
{
  "error": "unauthorized_client",
  "error_description": "Grant type 'urn:ietf:params:oauth:grant-type:token-exchange' not allowed..."
}
```

**→ Fix:** Enable Token Exchange grant in CTE M2M application
- Auth0 Dashboard → Applications → {CTE_APP}
- Settings → Advanced Settings → Grant Types
- Check: ☑️ Token Exchange
- Save

---

```json
{
  "error": "access_denied",
  "error_description": "No token exchange profile found"
}
```

**→ Fix:** Create Token Exchange Profile
- See: `docs/MY_ACCOUNT_AUTH0_SETUP_CHECKLIST.md` Step 2

---

## Test 2: Decode Token (1 minute)

### Step 1: Copy Token

**Option A: From Network Tab**
```
DevTools → Network tab
Find request: /api/mfa/auth/get-token
Response → Copy accessToken value
```

**Option B: From Console**
```javascript
// If token is logged to console, copy it from there
```

### Step 2: Decode Token

Paste in browser console:
```javascript
const token = "eyJ..."; // Paste your token here
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(JSON.stringify(payload, null, 2));
```

### Step 3: Verify Token

**✅ SUCCESS looks like:**

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

**Check these fields:**
- ✅ `aud` includes: `https://login.authskye.org/me/`
- ✅ `scope` includes: `read:me:authentication_methods`, `create:me:authentication_methods`
- ✅ `iss` is: `https://login.authskye.org/`

**✅ If all checks pass: Token structure is correct! Proceed to Test 3.**

---

**❌ If `aud` is wrong:**

```json
{
  "aud": ["https://archfaktor.us.auth0.com/me/"]  // ❌ Wrong (canonical domain)
}
```

**→ Fix:** CTE Action is using wrong domain
- Check action secret: `CUSTOM_DOMAIN = login.authskye.org`
- Verify action code uses custom domain
- Redeploy action

---

**❌ If scopes are missing:**

```json
{
  "scope": "openid profile email"  // ❌ Missing My Account scopes
}
```

**→ Fix:** Token exchange request isn't including correct scopes
- Check `get-token/route.ts` line 60
- Should request: `read:me:authentication_methods create:me:authentication_methods ...`

---

## Test 3: Call My Account API (2 minutes)

### Step 1: Test API
```
Click: "Test API" button
```

### Step 2: Check Response

**✅ SUCCESS (API Activated):**

```json
{
  "success": true,
  "status": 200,
  "data": []
}
```

**🎉 My Account API is activated! You can now use MFA management.**

Proceed to Test 4 (MFA Enrollment)

---

**⚠️ API Not Activated:**

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

**This means:**
- ✅ Token exchange works
- ✅ Token structure correct
- ❌ My Account API not activated in tenant

**→ Action:** Contact Auth0 Support to request My Account API activation

---

**❌ Authentication Error:**

```json
{
  "success": false,
  "status": 401,
  "error": "Unauthorized"
}
```

**→ Fix:** Token audience doesn't match API domain
- Token `aud` should be: `https://login.authskye.org/me/`
- API call should use: `https://login.authskye.org/me/authentication-methods`
- Both must match exactly

---

## Test 4: Enroll MFA Factor (Optional, if API is activated)

### Step 1: Select Factor
```
Click: "SMS" card
```

### Step 2: Enter Phone
```
Phone Number: +1234567890
Click: "Enroll"
```

### Step 3: Check Response

**✅ SUCCESS:**

```
Toast: "MFA factor enrolled successfully"
Server log: ✨ Enrolling MFA factor via My Account API: sms for user: auth0|...
```

**🎉 MFA enrollment works! Your implementation is fully functional.**

---

**❌ FAILURE:**

Common errors and fixes:

**1. 400 Validation Error**
```json
{
  "error": "Validation error",
  "message": "Phone number required..."
}
```
→ Enter valid phone number with country code

**2. 403 Forbidden**
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```
→ Token missing required scopes, check token exchange request

**3. 404 Not Found**
→ My Account API not activated

---

## Quick Decision Tree

```
Get Token
    ↓
    ├─ Success? → Decode Token
    │                 ↓
    │                 ├─ Audience correct? → Test API
    │                 │                        ↓
    │                 │                        ├─ 200 OK? → Enroll MFA ✅
    │                 │                        │
    │                 │                        └─ 404? → Contact Auth0 Support
    │                 │
    │                 └─ Wrong audience? → Fix CTE Action
    │
    └─ Fail? → Check error code
              ↓
              ├─ "unauthorized_client" → Enable Token Exchange grant
              ├─ "access_denied" → Create Token Exchange Profile
              └─ "not configured" → Add CTE credentials to .env.local
```

---

## Expected Timeline

| Step | Expected Time | On Failure |
|------|---------------|------------|
| Get Token | 10 seconds | 5 min to fix config |
| Decode Token | 1 minute | Check CTE Action |
| Test API | 10 seconds | Contact Auth0 if 404 |
| Enroll MFA | 30 seconds | Check token scopes |
| **Total** | **2-3 minutes** | **1-2 hours** (if config needed) |

---

## Success Checklist

- [ ] Token exchange returns 200 OK
- [ ] Token has correct audience (`login.authskye.org/me/`)
- [ ] Token has My Account API scopes
- [ ] Test API returns 200 or 404 (not 401/403)
- [ ] If 200: MFA enrollment works
- [ ] If 404: Know to contact Auth0 Support

---

## Next Steps

### If All Tests Pass (200 OK)

**You're ready to use MFA management!**

Try these features:
1. ✅ Enroll SMS MFA
2. ✅ Enroll TOTP (Authenticator App)
3. ✅ List enrolled methods
4. ✅ Remove specific method
5. ✅ Reset all MFA

### If Test 3 Returns 404

**My Account API not activated**

**Option A: Wait for activation**
1. Contact Auth0 Support
2. Request My Account API activation
3. Wait for confirmation
4. Re-run tests

**Option B: Use legacy MFA system**
1. See `CLAUDE.md` section 9 for rollback instructions
2. Revert to old `mfa-enrollment.tsx` component
3. Use Management API instead

---

## Troubleshooting Resources

**Quick fixes:**
- `docs/MY_ACCOUNT_AUTH0_SETUP_CHECKLIST.md` - Configuration steps
- `docs/MY_ACCOUNT_CTE_DIAGNOSTIC.md` - Detailed diagnostics
- `docs/MY_ACCOUNT_PASSKEY_COMPARISON.md` - Reference implementation

**Auth0 Configuration:**
1. Token Exchange Profile (must exist)
2. CTE Action (must be deployed)
3. Token Exchange grant (must be enabled)
4. Applications (must be linked to profile)

---

## Reference

**Passkey Demo:** https://github.com/awhitmana0/a0-passkeyforms-demo

Your implementation follows the same pattern as the passkey demo, with improvements:
- ✅ On-demand token acquisition
- ✅ Better error handling
- ✅ Flexible token refresh

---

**Last Updated:** April 2026
**Status:** Quick test guide complete
