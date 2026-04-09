# Quick Fix: Create Client Grant

## You're Getting 404 Errors Because...

**You forgot to create the client grant!**

The client grant authorizes your application to request My Account API scopes on behalf of users. Without it, your access tokens won't have the right audience/scopes.

---

## 5-Minute Fix

### Step 1: Create Client Grant (2 minutes)

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Navigate to **Applications → APIs**
3. Click on **"MyAccount API"**
4. Click **"Machine to Machine Applications"** tab
5. Find your application (e.g., "Agency Inc Dashboard")
6. Toggle it **ON**
7. Click the dropdown **▼** to expand scopes
8. Select these **5 scopes**:
   - ☑ `create:me:authentication_methods`
   - ☑ `read:me:authentication_methods`
   - ☑ `update:me:authentication_methods`
   - ☑ `delete:me:authentication_methods`
   - ☑ `read:me:factors`
9. Click **"Update"**

### Step 2: Restart Server (1 minute)

```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

### Step 3: Clear Cache & Re-login (1 minute)

1. Clear browser cache (or open incognito window)
2. Navigate to your app
3. Log in again (this gets a new access token with proper audience)

### Step 4: Test (1 minute)

1. Navigate to Profile → Security
2. Try enrolling an MFA factor (e.g., SMS)
3. Check browser console

**Expected:**
- ✅ No 404 errors
- ✅ Step-up authentication redirect works
- ✅ After completing MFA, enrollment succeeds

---

## Why This Works

### Before (404 Errors):
```
Login → Request token
  ↓
Auth0: "No grant for My Account API found"
  ↓
Token WITHOUT My Account API audience
  ↓
Call /me/authentication-methods
  ↓
404 Not Found ❌
```

### After (Success):
```
Login → Request token
  ↓
Auth0: "Client grant found! ✅"
  ↓
Token WITH My Account API audience
  ↓
Call /me/authentication-methods
  ↓
200 OK ✅
```

---

## Verify It Worked

### Quick Test: Check Access Token

1. Navigate to Profile → Tokens tab
2. Copy your **Access Token**
3. Paste it into [jwt.io](https://jwt.io)
4. Look at the `aud` (audience) claim

**You should see:**
```json
{
  "aud": [
    "https://login.authskye.org/me/",
    "https://b2b-saas-api.example.com"
  ],
  ...
}
```

The My Account API audience (`https://{your-domain}/me/`) should be in the array!

---

## Still Getting 404?

If you still get 404 errors after creating the grant:

1. **Hard refresh** - Clear browser cache completely
2. **Check grant** - Verify all 5 scopes are selected in Auth0 Dashboard
3. **Check token** - Decode at jwt.io and verify audience is correct
4. **Check API** - Verify MyAccount API exists in Applications → APIs
5. **Check logs** - Look at Auth0 logs for authorization errors

**Full troubleshooting:** [TROUBLESHOOTING_404.md](./TROUBLESHOOTING_404.md)

---

## Next Steps

Once the 404 errors are gone:

1. **Test thoroughly** - Follow [MFA_TESTING_GUIDE.md](./MFA_TESTING_GUIDE.md)
2. **Test all factors** - SMS, TOTP, Email, WebAuthn
3. **Test step-up auth** - Verify it triggers for enrollment/removal
4. **Test edge cases** - Multiple methods, removal, reset

---

## Understanding Client Grants

**Common confusion:**

| What | Purpose |
|------|---------|
| `AUTH0_SCOPE` in `.env.local` | What your app **requests** |
| Client Grant in Dashboard | What Auth0 **allows** |

Both are needed! Think of it like:
- `AUTH0_SCOPE` = Shopping list
- Client Grant = Permission to enter the store

---

## Detailed Guide

For more details on client grants:
**[CLIENT_GRANT_SETUP.md](./CLIENT_GRANT_SETUP.md)**

---

**Last Updated:** December 2024
**Issue:** Missing client grant
**Fix Time:** ~5 minutes
