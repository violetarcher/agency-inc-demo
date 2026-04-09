# Fix: Next.js Route 404 Error

## The Error

```
POST https://fresh-bedbug-prepared.ngrok-free.app/api/mfa/methods 404 (Not Found)
```

This is a **Next.js routing issue**, not an Auth0 API issue. Next.js can't find your API route.

---

## Quick Fix (2 minutes)

### Step 1: Clear Next.js Cache

```bash
# Stop your dev server first (Ctrl+C)

# Clear Next.js build cache
rm -rf .next

# Also clear node_modules/.cache if it exists
rm -rf node_modules/.cache
```

### Step 2: Restart Dev Server

```bash
npm run dev
```

### Step 3: Hard Refresh Browser

1. Open browser DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

Or just open an incognito/private window.

### Step 4: Test Again

1. Navigate to Profile → Security
2. Try enrolling an MFA factor
3. Check if the 404 is gone

---

## Why This Happens

Next.js caches route information in the `.next` directory. When you add new API routes while the dev server is running, sometimes Next.js doesn't pick them up until you:

1. Clear the cache
2. Restart the server
3. Refresh the browser

---

## Verify Routes Exist

You can verify the API route files are in the correct location:

```bash
# Should show route.ts
ls src/app/api/mfa/methods/

# Should show route.ts and [methodId] directory
ls -la src/app/api/mfa/methods/
```

**Expected output:**
```
total 16
drwxr-xr-x  4 violet.archer  staff   128 Apr  7 16:40 .
drwxr-xr-x  4 violet.archer  staff   128 Apr  7 16:40 ..
drwxr-xr-x  3 violet.archer  staff    96 Apr  7 16:40 [methodId]
-rw-r--r--  1 violet.archer  staff  6675 Apr  7 16:40 route.ts
```

---

## Check Server Console

After restarting, check your server console for any errors:

**Good (no errors):**
```
✓ Ready in 2.5s
○ Local:        http://localhost:4020
```

**Bad (compilation errors):**
```
./src/app/api/mfa/methods/route.ts
Module not found: Can't resolve '@/lib/my-account-api'
```

If you see "Module not found" errors, the lib files might be missing.

---

## Verify Lib Files Exist

The route files depend on these lib files:

```bash
ls -la src/lib/ | grep -E "(my-account-api|step-up-auth|validations)"
```

**Expected:**
```
-rw-r--r--  1 violet.archer  staff  10122 Apr  7 16:38 my-account-api.ts
-rw-r--r--  1 violet.archer  staff   7007 Apr  7 16:39 step-up-auth.ts
-rw-r--r--  1 violet.archer  staff   4615 Apr  7 16:37 validations.ts
```

All three should exist. If any are missing, that's the problem.

---

## Test the Route Directly

Once the server is running, test the route with curl:

```bash
curl -X GET http://localhost:4020/api/mfa/methods \
  -H "Cookie: appSession=YOUR_SESSION_COOKIE"
```

**Expected:**
- ✅ 200 OK or 401 Unauthorized (route exists)
- ❌ 404 Not Found (route still not loading)

If you get 404 with curl too, the route isn't loading. Check for compilation errors in the server console.

---

## If Still Getting 404

### Option 1: Check tsconfig.json

Verify your `tsconfig.json` has the path alias configured:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Option 2: Try Absolute Imports

Temporarily change the imports in `route.ts` to absolute paths:

```typescript
// Instead of:
import { listAuthenticationMethods } from '@/lib/my-account-api';

// Try:
import { listAuthenticationMethods } from '../../../lib/my-account-api';
```

If this works, your path alias configuration is the issue.

### Option 3: Check File Extensions

Ensure all files have `.ts` extension (not `.tsx`):

```bash
ls src/app/api/mfa/methods/*.ts*
```

Should show `route.ts`, not `route.tsx`.

### Option 4: Rebuild from Scratch

```bash
# Stop server
# Delete everything
rm -rf .next node_modules/.cache

# Reinstall (if needed)
npm install

# Restart
npm run dev
```

---

## Alternative: Rollback to Legacy System

If you can't get the routes working, you can rollback to the legacy MFA system:

```bash
# Swap components
mv src/components/profile/mfa-enrollment.tsx src/components/profile/mfa-enrollment-myaccount.tsx
mv src/components/profile/mfa-enrollment-old.tsx.backup src/components/profile/mfa-enrollment.tsx

# Restart
npm run dev
```

**Full rollback guide:** [MFA_ROLLBACK.md](./MFA_ROLLBACK.md)

---

## Summary

**Most common fix:**
1. Stop server
2. `rm -rf .next`
3. `npm run dev`
4. Hard refresh browser

**If that doesn't work:**
- Check server console for errors
- Verify lib files exist
- Check tsconfig.json path aliases
- Try absolute imports instead of `@/` aliases

---

**Last Updated:** December 2024
**Issue:** Next.js route 404
**Fix Time:** ~2 minutes
