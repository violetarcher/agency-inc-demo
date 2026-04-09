# Client Grant Setup for My Account API

## What is a Client Grant?

A **client grant** authorizes your application to request specific API scopes on behalf of users. Even if you add scopes to `AUTH0_SCOPE` in your environment variables, your app needs explicit permission to request those scopes from the API.

**Think of it like:**
- `AUTH0_SCOPE` = What your app **wants** to request
- Client Grant = What your app **is allowed** to request

Without the client grant, your app can't get access tokens with My Account API audience and scopes.

---

## Why You Got 404 Errors

Without the client grant:
1. Your app tries to get an access token with My Account API audience
2. Auth0 either:
   - Returns a token without the My Account API audience (wrong API)
   - Rejects the request entirely
3. When you try to call `/me/authentication-methods`, it fails with 404 because you're not authenticated to that API

**With the client grant:**
1. Your app requests access token with My Account API audience
2. Auth0 issues a token with audience `https://{your-domain}/me/`
3. The My Account API accepts the token and processes your request ✅

---

## How to Create Client Grant (Auth0 Dashboard)

### Step 1: Navigate to MyAccount API

1. Log in to [Auth0 Dashboard](https://manage.auth0.com/)
2. Go to **Applications → APIs**
3. Find and click on **"MyAccount API"**

### Step 2: Authorize Your Application

1. In the MyAccount API settings, click the **"Machine to Machine Applications"** tab
2. You'll see a list of all your applications
3. Find your application (e.g., "Agency Inc Dashboard")
4. Toggle the switch to **ON** (authorize)

### Step 3: Grant Required Scopes

1. After toggling ON, click the **dropdown arrow** (▼) next to your application
2. This expands the available permissions/scopes
3. Select these **5 scopes**:
   - ✅ `create:me:authentication_methods`
   - ✅ `read:me:authentication_methods`
   - ✅ `update:me:authentication_methods`
   - ✅ `delete:me:authentication_methods`
   - ✅ `read:me:factors`
4. Click **"Update"** button at the bottom

### Step 4: Verify Grant Was Created

1. The toggle should remain **ON**
2. You should see a count like "5 scopes" or "Authorized" next to your app
3. You can expand it again to verify all 5 scopes are checked

---

## Visual Guide

```
Auth0 Dashboard → Applications → APIs → MyAccount API

┌─────────────────────────────────────────────────────────┐
│ MyAccount API                                            │
├─────────────────────────────────────────────────────────┤
│ [Settings] [Machine to Machine Applications] [Endpoints]│
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Application Name                            Authorized   │
│ ─────────────────────────────────────────────────────   │
│                                                          │
│ Agency Inc Dashboard                    [ON] ▼ 5 scopes │
│   ├─ create:me:authentication_methods        ☑          │
│   ├─ read:me:authentication_methods          ☑          │
│   ├─ update:me:authentication_methods        ☑          │
│   ├─ delete:me:authentication_methods        ☑          │
│   └─ read:me:factors                         ☑          │
│                                                          │
│                                          [Update]        │
└─────────────────────────────────────────────────────────┘
```

---

## Alternative: Create Grant via Management API

You can also create the grant programmatically:

```bash
# Get your Management API token first
# Then create the grant:

curl --request POST \
  --url https://YOUR_DOMAIN.auth0.com/api/v2/client-grants \
  --header 'authorization: Bearer YOUR_MGMT_API_TOKEN' \
  --header 'content-type: application/json' \
  --data '{
    "client_id": "YOUR_APPLICATION_CLIENT_ID",
    "audience": "https://YOUR_DOMAIN.auth0.com/me/",
    "scope": [
      "create:me:authentication_methods",
      "read:me:authentication_methods",
      "update:me:authentication_methods",
      "delete:me:authentication_methods",
      "read:me:factors"
    ]
  }'
```

Replace:
- `YOUR_DOMAIN` - Your Auth0 domain (e.g., `login.authskye.org`)
- `YOUR_MGMT_API_TOKEN` - Management API access token
- `YOUR_APPLICATION_CLIENT_ID` - Your app's client ID (from `.env.local`)

---

## Verify It's Working

### Test 1: Check Token Audience

After creating the grant and restarting your server:

1. Navigate to Profile → Tokens tab
2. Copy your access token
3. Decode it at [jwt.io](https://jwt.io)
4. Check the `aud` (audience) claim

**Expected:**
```json
{
  "aud": [
    "https://login.authskye.org/me/",
    "https://b2b-saas-api.example.com"
  ],
  ...
}
```

The My Account API audience should be in the array.

### Test 2: Check Token Scopes

In the decoded token, check the `scope` claim:

**Expected:**
```json
{
  "scope": "openid profile email offline_access read:me:authentication_methods create:me:authentication_methods ..."
}
```

You should see the My Account API scopes in the string.

### Test 3: Try MFA Enrollment

1. Navigate to Profile → Security
2. Try enrolling an MFA factor (e.g., SMS)
3. Check browser console

**Expected:**
- ✅ No 404 errors
- ✅ Console log: "✨ Enrolling MFA factor: sms for user: ..."
- ✅ Step-up redirect works or enrollment succeeds

---

## Troubleshooting

### Issue: Toggle won't turn ON

**Possible causes:**
1. MyAccount API not activated - Check Applications → APIs for activation banner
2. Application doesn't exist or is disabled
3. Browser cache issue - Try hard refresh (Ctrl+Shift+R)

**Fix:** Ensure MyAccount API is activated first, then try again.

---

### Issue: Scopes don't appear when I expand

**Possible causes:**
1. MyAccount API doesn't have scopes configured
2. You're looking at wrong API
3. API not fully activated

**Fix:**
1. Verify you're on the MyAccount API (identifier: `https://{domain}/me/`)
2. Check if API is fully activated
3. Refresh page and try again

---

### Issue: Still getting 404 after creating grant

**Possible causes:**
1. Didn't restart server after creating grant
2. Token cache issue - old token still in session
3. Grant created but scopes not selected

**Fix:**
1. Restart dev server: `npm run dev`
2. Clear browser cache and re-login
3. Verify all 5 scopes are checked in the grant
4. Check access token audience (Test 1 above)

---

### Issue: Token doesn't have My Account API audience

**Possible causes:**
1. Grant not created correctly
2. Application using wrong client ID
3. Grant created for different application

**Fix:**
1. Double-check grant is for the correct application
2. Verify client ID in `.env.local` matches the one in the grant
3. Ensure all 5 scopes are selected
4. Restart server and re-login

---

## What Happens After Grant is Created

### Before Grant:
```
User Login
  ↓
Request token with Auth0_SCOPE (includes My Account API scopes)
  ↓
Auth0: "Your app isn't authorized for My Account API scopes"
  ↓
Returns token WITHOUT My Account API audience
  ↓
API call to /me/authentication-methods
  ↓
404 Not Found (or 401 Unauthorized)
```

### After Grant:
```
User Login
  ↓
Request token with AUTH0_SCOPE (includes My Account API scopes)
  ↓
Auth0: "Grant found! Your app is authorized"
  ↓
Returns token WITH My Account API audience and scopes
  ↓
API call to /me/authentication-methods
  ↓
200 OK - Success! ✅
```

---

## Complete Setup Checklist

After creating the client grant:

- [ ] Client grant created in Auth0 Dashboard
- [ ] All 5 scopes selected
- [ ] `.env.local` has My Account API scopes in AUTH0_SCOPE
- [ ] Dev server restarted
- [ ] Browser cache cleared
- [ ] Re-logged in to get new token
- [ ] Access token has My Account API audience (verified at jwt.io)
- [ ] Access token has My Account API scopes
- [ ] MFA enrollment works without 404 errors

---

## Next Steps

Once the client grant is created and verified:

1. **Continue Activation:** Follow [ACTIVATION_CHECKLIST.md](./ACTIVATION_CHECKLIST.md) starting from Step 4
2. **Test Thoroughly:** Use [MFA_TESTING_GUIDE.md](./MFA_TESTING_GUIDE.md) for comprehensive testing
3. **Monitor:** Watch Auth0 logs for any authorization errors

---

## Common Misconceptions

### ❌ Misconception 1: "Adding scopes to AUTH0_SCOPE is enough"
**Reality:** You also need the client grant. The scopes in AUTH0_SCOPE are what your app _requests_. The grant is what Auth0 _allows_.

### ❌ Misconception 2: "I have the permissions, so it should work"
**Reality:** Having the permissions in your tenant is different from granting them to your specific application.

### ❌ Misconception 3: "The grant applies to all my applications"
**Reality:** Each application needs its own grant. If you have multiple apps, each must be authorized separately.

---

**Last Updated:** December 2024
**Status:** Client grant setup required
