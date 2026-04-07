# MFA System Rollback Guide

## Quick Rollback Instructions

If you need to revert from the new My Account API implementation to the legacy MFA system:

### Step 1: Swap Component Files

```bash
# Save the new component
mv src/components/profile/mfa-enrollment.tsx src/components/profile/mfa-enrollment-myaccount.tsx

# Restore the old component
mv src/components/profile/mfa-enrollment-old.tsx.backup src/components/profile/mfa-enrollment.tsx
```

### Step 2: Update Environment Variables

Edit `.env.local` and update the `AUTH0_SCOPE` variable:

**Remove these scopes:**
```
read:me:authentication_methods
create:me:authentication_methods
update:me:authentication_methods
delete:me:authentication_methods
```

**Your AUTH0_SCOPE should look like:**
```env
AUTH0_SCOPE='openid profile email offline_access read:reports create:reports edit:reports delete:reports read:analytics'
```

### Step 3: Restart Dev Server

```bash
npm run dev
```

### Step 4: Verify Legacy System

1. Navigate to Profile → Security tab
2. You should see the old MFA interface with individual factor cards
3. Test SMS enrollment (should redirect to step-up challenge)
4. Test TOTP enrollment (should redirect to Guardian)

---

## What Gets Restored

**Legacy MFA System Features:**
- Individual factor cards (SMS, TOTP Guardian, TOTP-OTP, WebAuthn, Reset MFA)
- Guardian enrollment pages
- Step-up challenge flow for SMS
- Separate phone verification section
- Management API-based enrollments

**Legacy API Endpoints:**
- `/api/mfa` - GET, POST, DELETE
- `/api/mfa-reset` - POST
- `/api/step-up-challenge` - POST
- `/api/mfa-any-enrollment` - POST
- `/api/mfa-enrollment-complete` - POST
- `/api/email-verification` - POST

---

## Optional: Remove My Account API Files

These files are not used by the legacy system and can be removed (or kept for future use):

```bash
# Remove API endpoints (optional)
rm -rf src/app/api/mfa/

# Remove service layers (optional)
rm src/lib/my-account-api.ts
rm src/lib/step-up-auth.ts
```

**Note:** Validation schemas in `src/lib/validations.ts` can remain—they don't affect the legacy system.

---

## Rollback Checklist

Before committing the rollback:

- [ ] Component files swapped
- [ ] `.env.local` updated (AUTH0_SCOPE)
- [ ] Dev server restarted
- [ ] Profile → Security page loads
- [ ] Email verification works
- [ ] At least one MFA factor can be enrolled
- [ ] Phone verification works (if using SMS)
- [ ] No console errors related to My Account API

---

## Re-Enabling My Account API Later

Once Auth0 activates the feature flags in your tenant, reverse the rollback:

### Step 1: Swap Component Files Back

```bash
# Save the legacy component again
mv src/components/profile/mfa-enrollment.tsx src/components/profile/mfa-enrollment-old.tsx.backup

# Restore the My Account API component
mv src/components/profile/mfa-enrollment-myaccount.tsx src/components/profile/mfa-enrollment.tsx
```

### Step 2: Update Environment Variables

Add My Account API scopes to `.env.local`:

```env
AUTH0_SCOPE='openid profile email offline_access read:me:authentication_methods create:me:authentication_methods update:me:authentication_methods delete:me:authentication_methods read:reports create:reports edit:reports delete:reports read:analytics'
```

### Step 3: Configure Auth0

1. **Activate My Account API** (if not already active)
   - Auth0 Dashboard → Applications → APIs → "MyAccount API" → Activate

2. **Create Client Grant**
   - Applications → APIs → MyAccount API → Machine to Machine Applications
   - Enable your application
   - Grant all 4 scopes: `create:me:authentication_methods`, `read:me:authentication_methods`, `update:me:authentication_methods`, `delete:me:authentication_methods`

### Step 4: Restart and Test

```bash
npm run dev
```

Navigate to Profile → Security and test the new MFA enrollment flow.

---

## Support

- See `MY_ACCOUNT_API_SETUP.md` for complete My Account API setup
- See `MFA_TESTING_GUIDE.md` for testing scenarios
- See `CLAUDE.md` for architecture details

---

## Why Rollback Might Be Needed

- **Auth0 Feature Flags Pending:** My Account API requires specific feature flags in your Auth0 tenant
- **ESD Ticket Open:** Enterprise Support Desk ticket opened to enable My Account API
- **Testing Issues:** If new implementation has bugs or issues
- **Dependency Issues:** If Auth0 API changes or becomes unavailable

---

**Last Updated:** December 2024
**Status:** Rollback ready, My Account API implementation backed up
