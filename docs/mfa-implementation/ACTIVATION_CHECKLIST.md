# My Account API Activation Checklist

✅ **Auth0 Permissions Available** - You can now activate the My Account API MFA system!

Follow this checklist to configure and activate the new MFA management system.

---

## Prerequisites

- [x] My Account API permissions available in Auth0 tenant
- [ ] Access to Auth0 Dashboard
- [ ] Access to update `.env.local` file
- [ ] Ability to restart dev server

---

## Step 1: Activate My Account API in Auth0 Dashboard

### 1.1 Check if MyAccount API is Already Active

1. Log in to [Auth0 Dashboard](https://manage.auth0.com/)
2. Navigate to **Applications → APIs**
3. Look for **"MyAccount API"** in the list

**Three possible states:**

#### State A: MyAccount API is Visible and Active ✅
- You see "MyAccount API" with identifier: `https://{your-domain}/me/`
- Status shows as "Active"
- **Action:** Continue to Step 2

#### State B: Activation Banner Visible 🎯
- You see a banner: "Try the MyAccount API" or "Activate MyAccount API"
- **Action:** Click "Activate" button
- Wait for activation to complete (should be instant)
- Refresh the page and verify "MyAccount API" now appears in the list
- **Then:** Continue to Step 2

#### State C: No API and No Banner ⚠️
- You don't see "MyAccount API" in the list
- You don't see an activation banner
- **Action:** The My Account API feature is not yet available in your tenant
- **You must:** Contact Auth0 Support or your account manager to enable access
- **Current Status:** Even though you have the permissions/scopes, the API endpoints themselves are not active
- **Recommendation:** Use the legacy MFA system until API is activated (see MFA_ROLLBACK.md)

### 1.2 Verify API is Truly Active

After activation, verify the API is working:

1. In Auth0 Dashboard, click on **"MyAccount API"**
2. Note the **Identifier:** `https://login.authskye.org/me/` (or your domain)
3. Check the **Settings** tab
4. Verify **Status** is "Active" or "Enabled"

✅ **Verification:** MyAccount API exists and is active in your tenant

⚠️ **CRITICAL:** If you don't see the MyAccount API or can't activate it, you'll get 404 errors when trying to enroll MFA. In this case, follow the rollback instructions in `MFA_ROLLBACK.md` until Auth0 activates the feature.

---

## Step 2: Update Environment Variables

### 2.1 Add My Account API Scopes

Edit your `.env.local` file and update the `AUTH0_SCOPE` variable:

**Current (legacy):**
```env
AUTH0_SCOPE='openid profile email offline_access read:reports create:reports edit:reports delete:reports read:analytics'
```

**New (with My Account API):**
```env
AUTH0_SCOPE='openid profile email offline_access read:me:authentication_methods create:me:authentication_methods update:me:authentication_methods delete:me:authentication_methods read:me:factors read:reports create:reports edit:reports delete:reports read:analytics'
```

**Added scopes:**
- `read:me:authentication_methods` - View enrolled MFA methods
- `create:me:authentication_methods` - Enroll new MFA factors
- `update:me:authentication_methods` - Modify MFA method settings
- `delete:me:authentication_methods` - Remove MFA methods
- `read:me:factors` - List available MFA factor types

✅ **Verification:** `.env.local` file updated with My Account API scopes

---

## Step 3: Create Client Grant

### 3.1 Grant Application Access to MyAccount API

1. In Auth0 Dashboard, go to **Applications → APIs**
2. Click on **"MyAccount API"**
3. Navigate to the **"Machine to Machine Applications"** tab
4. Find your application (e.g., "Agency Inc Dashboard")
5. Toggle it **ON** to authorize
6. Click the dropdown arrow to expand permissions
7. Select these scopes:
   - ✅ `create:me:authentication_methods`
   - ✅ `read:me:authentication_methods`
   - ✅ `update:me:authentication_methods`
   - ✅ `delete:me:authentication_methods`
   - ✅ `read:me:factors`
8. Click **"Update"**

✅ **Verification:** Client grant created with all 5 required scopes

---

## Step 4: Verify Access Policies (Optional)

### 4.1 Check Default Access Policy

1. In **MyAccount API** settings, go to **"Access Policies"** tab
2. Verify settings:
   - **User flows:** `require_client_grant` (should be enabled)
   - **Client flows:** `deny_all` (should remain disabled)

**Note:** Default settings should be correct; only adjust if issues arise.

✅ **Verification:** Access policies reviewed

---

## Step 5: Restart Dev Server

### 5.1 Restart to Load New Environment Variables

```bash
# Stop current server (Ctrl+C)
# Start dev server
npm run dev
```

### 5.2 Verify Server Started Successfully

Check console output for:
- No errors related to Auth0
- Server running on port 4020
- No environment variable warnings

✅ **Verification:** Dev server restarted successfully

---

## Step 6: Test MFA Enrollment Flow

### 6.1 Navigate to Security Tab

1. Open browser: `http://localhost:4020` (or your ngrok URL)
2. Log in with a test user
3. Navigate to **Profile → Security** tab

### 6.2 Verify UI Displays Correctly

Check that you see:
- ✅ Email verification section at top
- ✅ "Multi-Factor Authentication" section
- ✅ "Available Authentication Methods" grid with 5 factor types:
  - SMS
  - Authenticator App (TOTP)
  - Security Key (WebAuthn-Roaming)
  - Biometric (WebAuthn-Platform)
  - Email

✅ **Verification:** New MFA UI displays correctly

### 6.3 Test Fetching Available Factors

1. Open browser console (F12)
2. Look for console log: `✅ Loaded available factors: 5`
3. Check Network tab for successful API call: `GET /api/mfa/factors` → 200 OK

✅ **Verification:** Available factors API call succeeds

---

## Step 7: Test SMS Enrollment (with Step-Up)

### 7.1 Initiate SMS Enrollment

1. Click on **"SMS"** factor card
2. Dialog opens
3. Enter phone number: `+15551234567` (or real number for testing)
4. (Optional) Enter display name: "Personal Phone"
5. Click **"Enroll Method"**

### 7.2 Complete Step-Up Authentication

**Expected behavior:**
1. Toast notification: "Additional Verification Required"
2. Redirect to login page with MFA challenge
3. Complete MFA (SMS, TOTP, or other enrolled factor)
4. Redirect back to Profile → Security tab

### 7.3 Verify Enrollment Success

After returning to Security tab:
- ✅ New SMS method appears in "Enrolled Methods" section
- ✅ Method shows "Active" badge
- ✅ Phone number displayed correctly
- ✅ Console log: `✅ Created authentication method: sms sms|abc123...`

✅ **Verification:** SMS enrollment completed successfully

---

## Step 8: Test Listing Enrolled Methods

### 8.1 Check API Call

1. Refresh the Profile → Security page
2. Check console for: `✅ Loaded enrolled methods: 1` (or number of methods)
3. Check Network tab: `GET /api/mfa/methods` → 200 OK

### 8.2 Verify Display

- ✅ All enrolled methods visible in list
- ✅ Each method shows icon, name, enrollment date
- ✅ "Active" badge present
- ✅ Remove button (trash icon) visible

✅ **Verification:** Enrolled methods display correctly

---

## Step 9: Test Removing MFA Method (Optional)

### 9.1 Remove SMS Method

1. Click trash icon on the SMS method
2. Confirmation dialog appears
3. Review method details in dialog
4. Click **"Remove Method"**
5. Complete step-up authentication if prompted
6. Return to Security tab

### 9.2 Verify Removal

- ✅ Method no longer in "Enrolled Methods"
- ✅ Toast notification: "MFA Method Removed"
- ✅ Console log: `✅ Deleted authentication method: sms|abc123...`

✅ **Verification:** Method removal works correctly

---

## Step 10: Test Additional Factor Types (Optional)

Repeat enrollment test for other factor types:

- [ ] **TOTP** (Authenticator App) - Should support authenticator apps like Google Authenticator
- [ ] **Email** - Should send verification codes via email
- [ ] **WebAuthn-Roaming** - Should prompt for security key (YubiKey, etc.)
- [ ] **WebAuthn-Platform** - Should prompt for biometrics (Face ID, Touch ID, Windows Hello)

✅ **Verification:** Multiple factor types work as expected

---

## Step 11: Verify Email Verification (Unchanged)

### 11.1 Test Email Verification Section

1. Log in with user who has unverified email
2. Navigate to Profile → Security
3. Email verification section should appear at top
4. Click "Send Verification Email"
5. Check that email is sent

✅ **Verification:** Email verification still works (unchanged from legacy system)

---

## Step 12: Monitor Auth0 Logs

### 12.1 Check for My Account API Activity

1. In Auth0 Dashboard, go to **Monitoring → Logs**
2. Filter by:
   - Event Type: "Success API Operation" or "Failed API Operation"
   - Description: Contains "my-account" or "authentication-methods"
3. Look for successful API calls

✅ **Verification:** My Account API calls logged successfully in Auth0

---

## Troubleshooting

### Issue: "No access token available" (401)

**Cause:** Application doesn't have My Account API scopes

**Fix:**
1. Verify `AUTH0_SCOPE` includes My Account API scopes in `.env.local`
2. Restart dev server
3. Clear browser cache and re-login

---

### Issue: "Unauthorized to access My Account API" (401)

**Cause:** Client grant not created or missing scopes

**Fix:**
1. Go to Auth0 Dashboard → Applications → APIs → MyAccount API
2. Check Machine to Machine Applications tab
3. Ensure your application is authorized with all 5 scopes
4. Click "Update" to save

---

### Issue: "Rate limit exceeded" (429)

**Cause:** Exceeded 25 requests/second tenant limit

**Fix:**
1. This is expected for rapid testing
2. Wait 1-2 seconds between API calls
3. Consider implementing client-side rate limiting in production

---

### Issue: API calls return 404

**Cause:** My Account API endpoints don't exist

**Fix:**
1. Verify files exist:
   - `src/app/api/mfa/factors/route.ts`
   - `src/app/api/mfa/methods/route.ts`
   - `src/app/api/mfa/methods/[methodId]/route.ts`
2. Restart dev server
3. Check for TypeScript compilation errors

---

### Issue: Step-up redirect loops forever

**Cause:** Step-up authentication not completing properly

**Fix:**
1. Check Auth0 Action for step-up MFA enforcement
2. Verify ACR values in login handler: `src/app/api/auth/[...auth0]/route.ts`
3. Check console logs for MFA verification status

---

## Completion Checklist

Mark each item as complete:

- [ ] Auth0 MyAccount API verified in dashboard
- [ ] `.env.local` updated with My Account API scopes
- [ ] Client grant created with all required scopes
- [ ] Dev server restarted
- [ ] New MFA UI displays correctly
- [ ] Available factors API call succeeds
- [ ] SMS enrollment with step-up works
- [ ] Enrolled methods display correctly
- [ ] Method removal works (optional)
- [ ] Email verification still works
- [ ] Auth0 logs show My Account API activity
- [ ] No console errors or warnings

---

## Next Steps After Activation

1. **Run Full Test Suite**
   - Follow `MFA_TESTING_GUIDE.md` for comprehensive testing
   - Test all factor types
   - Test error scenarios
   - Test on multiple browsers

2. **Deploy to Staging**
   - Update staging environment variables
   - Create client grant in staging Auth0 tenant
   - Run smoke tests

3. **User Acceptance Testing**
   - Have stakeholders test enrollment flow
   - Gather feedback on UI/UX
   - Document any issues

4. **Production Deployment**
   - Update production environment variables
   - Create client grant in production Auth0 tenant
   - Monitor logs closely after deployment
   - Have rollback plan ready

5. **Monitor & Iterate**
   - Monitor Auth0 logs for errors
   - Track MFA enrollment rates
   - Gather user feedback
   - Plan future enhancements

---

## Rollback Plan

If issues arise, you can rollback to the legacy system:

See `MFA_ROLLBACK.md` for complete instructions.

**Quick rollback:**
```bash
# Swap components
mv src/components/profile/mfa-enrollment.tsx src/components/profile/mfa-enrollment-myaccount.tsx
mv src/components/profile/mfa-enrollment-old.tsx.backup src/components/profile/mfa-enrollment.tsx

# Revert .env.local (remove My Account API scopes)
# Restart server
npm run dev
```

---

## Success! 🎉

Once all checklist items are complete, your My Account API MFA system is fully activated and ready for production use!

**Documentation:**
- Setup guide: `MY_ACCOUNT_API_SETUP.md`
- Testing guide: `MFA_TESTING_GUIDE.md`
- Implementation details: `MFA_IMPLEMENTATION_SUMMARY.md`
- Rollback guide: `MFA_ROLLBACK.md`

---

**Last Updated:** December 2024
**Status:** Ready for activation
