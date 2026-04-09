# Troubleshooting: 404 Error from My Account API

## The Error You're Seeing

```
MyAccountAPIError: My Account API request failed: Not Found
  statusCode: 404,
  details: {
    title: 'Not Found',
    type: 'https://auth0.com/api-errors/A0E-404-0001',
    detail: 'The requested resource POST /me/authentication-methods was not found.',
    status: 404
  }
```

---

## What This Means

**The My Account API is not activated in your Auth0 tenant.**

### Critical Distinction

Having the My Account API **permissions** is different from having the **API itself** activated:

| What You Have | What You Need |
|---------------|---------------|
| ✅ My Account API **permissions/scopes** | ❌ My Account API **endpoints active** |
| Your tenant can grant these scopes | The actual `/me/` API endpoints must be activated |
| Appears in tenant settings | Must appear in Applications → APIs |

**Think of it like this:**
- Permissions = Having keys to a building
- API Activation = The building actually being open

You have the keys, but the building (API endpoints) isn't open yet.

---

## How to Fix This

### Option 1: Activate the API (If Banner Available)

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Navigate to **Applications → APIs**
3. Look for one of these:
   - **MyAccount API** in the list of APIs
   - **Activation banner:** "Try the MyAccount API" or "Activate MyAccount API"

**If you see the banner:**
1. Click "Activate"
2. Wait for activation (usually instant)
3. Refresh the page
4. You should now see "MyAccount API" in your APIs list
5. Continue with `ACTIVATION_CHECKLIST.md`

**If you see MyAccount API already:**
1. Click on it
2. Verify it's Active/Enabled
3. Note the identifier: `https://{your-domain}/me/`
4. Continue with `ACTIVATION_CHECKLIST.md`

---

### Option 2: Rollback to Legacy System (Recommended Until API Active)

If you **don't see** the MyAccount API or activation banner, the feature isn't available yet. Rollback to the working legacy system:

#### Quick Rollback (2 minutes)

```bash
# 1. Swap components back
mv src/components/profile/mfa-enrollment.tsx src/components/profile/mfa-enrollment-myaccount.tsx
mv src/components/profile/mfa-enrollment-old.tsx.backup src/components/profile/mfa-enrollment.tsx

# 2. Update .env.local
# Remove: read:me:authentication_methods create:me:authentication_methods update:me:authentication_methods delete:me:authentication_methods read:me:factors
# Keep: openid profile email offline_access read:reports create:reports edit:reports delete:reports read:analytics

# 3. Restart server
npm run dev
```

**Full rollback instructions:** See `MFA_ROLLBACK.md`

---

### Option 3: Contact Auth0 Support

If you need the My Account API urgently and don't see an activation option:

1. Open a support ticket with Auth0
2. Reference your ESD ticket if you have one
3. Request: "Activate My Account API for tenant [your-tenant-name]"
4. Mention you already have the permissions but need the API endpoints enabled

**Support:** https://support.auth0.com/

---

## Verify API is Active

Once you think the API is activated, verify with this test:

### Test 1: Check Dashboard

1. Auth0 Dashboard → Applications → APIs
2. You should see **"MyAccount API"**
3. Identifier should be: `https://{your-domain}/me/`
4. Status should be "Active" or "Enabled"

### Test 2: Test API Call

Try this curl command (replace with your values):

```bash
curl -X GET "https://login.authskye.org/me/authentication-methods" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected:**
- ✅ 200 OK with array of authentication methods (or empty array)
- ❌ 404 Not Found = API still not active

### Test 3: Try Enrollment in App

1. Navigate to Profile → Security
2. Try to enroll an MFA factor
3. Check browser console and network tab

**Expected:**
- ✅ API calls to `/api/mfa/methods` succeed
- ✅ Console shows: `✅ Created authentication method: ...`
- ❌ 404 errors = API still not active

---

## Understanding the Error Flow

When you try to enroll an MFA factor:

1. **Frontend** → `POST /api/mfa/methods`
2. **Next.js API** → Validates request, gets access token
3. **My Account API Service** → Calls `POST https://login.authskye.org/me/authentication-methods`
4. **Auth0 My Account API** → **404 Not Found** ← **This is where it fails**

The error happens at step 4 because the My Account API endpoints don't exist in your tenant yet.

---

## What to Do Right Now

### Recommended Path

1. **Check Dashboard** (2 minutes)
   - Go to Applications → APIs
   - Look for MyAccount API or activation banner

2. **If API visible/activatable:**
   - Activate it
   - Follow `ACTIVATION_CHECKLIST.md`

3. **If API not available:**
   - Rollback to legacy system (see `MFA_ROLLBACK.md`)
   - Open support ticket with Auth0
   - Wait for Auth0 to enable the feature

4. **Verify After Activation:**
   - Test enrollment flow
   - Follow `MFA_TESTING_GUIDE.md`

---

## Common Questions

### Q: I have all the permissions, why doesn't it work?

**A:** Permissions are authorization to use the API. The API itself must be separately activated. It's like having permission to enter a building, but the building doesn't exist yet.

### Q: How long until Auth0 activates the API?

**A:** If there's an activation banner, it's instant. If you need to contact support, it depends on your support plan (usually 1-3 business days for Professional plans).

### Q: Will the legacy system work while I wait?

**A:** Yes! The legacy MFA system is fully functional and backed up. Follow `MFA_ROLLBACK.md` to restore it. It will work exactly as before.

### Q: Do I lose any data by rolling back?

**A:** No. The rollback only swaps UI components and environment variables. All existing MFA enrollments remain in Auth0.

### Q: Can I check if the API is active without deploying?

**A:** No easy way. The best test is checking if "MyAccount API" appears in Applications → APIs in your Auth0 Dashboard.

---

## After API is Activated

Once the MyAccount API is truly active:

1. **Swap back to new component:**
   ```bash
   mv src/components/profile/mfa-enrollment.tsx src/components/profile/mfa-enrollment-old.tsx.backup
   mv src/components/profile/mfa-enrollment-myaccount.tsx src/components/profile/mfa-enrollment.tsx
   ```

2. **Update .env.local** with My Account API scopes (see `ACTIVATION_CHECKLIST.md`)

3. **Create client grant** (see `ACTIVATION_CHECKLIST.md` Step 3)

4. **Restart and test** (see `ACTIVATION_CHECKLIST.md` Steps 6-8)

5. **Run full test suite** (see `MFA_TESTING_GUIDE.md`)

---

## Summary

**The Issue:** You have permissions but the API isn't active

**The Fix:**
- **Option A:** Activate the API in Auth0 Dashboard (if available)
- **Option B:** Rollback to legacy system until Auth0 activates it
- **Option C:** Contact Auth0 Support to enable the feature

**Next Step:** Check Auth0 Dashboard → Applications → APIs right now!

---

**Last Updated:** December 2024
**Status:** Troubleshooting 404 errors
