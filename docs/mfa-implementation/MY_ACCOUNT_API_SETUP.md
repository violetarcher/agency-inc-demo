# My Account API Setup Guide

This guide walks you through configuring Auth0 My Account API for MFA self-service management in the Agency Inc Dashboard application.

## Overview

The My Account API enables users to self-manage their authentication methods (MFA factors) without requiring admin intervention. This provides a secure, user-friendly experience for enrolling, viewing, and removing MFA methods.

**Status:** Limited Early Access (requires activation through Auth0 Dashboard or support)

## Prerequisites

- Auth0 tenant with access to My Account API (Early Access program)
- Application already configured with Auth0
- Admin access to Auth0 Dashboard
- Environment variables properly configured (`.env.local`)

## Step 1: Activate My Account API

1. Log in to your [Auth0 Dashboard](https://manage.auth0.com/)
2. Navigate to **Applications** → **APIs**
3. Look for the **"MyAccount API"** activation banner
4. Click **"Activate"** to enable My Account API for your tenant

**Note:** If you don't see the activation banner, you may need to request access through your Auth0 account manager or [Auth0 Support](https://support.auth0.com).

**Verification:**
After activation, you should see a new API with:
- **Name:** MyAccount API
- **Identifier:** `https://{your-domain}/me/`
- **Status:** Active

## Step 2: Configure Application Scopes

Update your application to request My Account API scopes during login.

### 2.1 Update Environment Variables

Add the My Account API scopes to your `.env.local` file:

```env
AUTH0_SCOPE='openid profile email offline_access read:me:authentication_methods create:me:authentication_methods update:me:authentication_methods delete:me:authentication_methods'
```

**Scope Breakdown:**
- `openid` - Required for OpenID Connect
- `profile` - User profile information
- `email` - User email address
- `offline_access` - Refresh tokens (for org switching)
- `read:me:authentication_methods` - View enrolled MFA methods
- `create:me:authentication_methods` - Enroll new MFA factors
- `update:me:authentication_methods` - Modify MFA method settings
- `delete:me:authentication_methods` - Remove MFA methods

### 2.2 Verify Scope Configuration

Restart your dev server after updating environment variables:

```bash
npm run dev
```

## Step 3: Create Client Grant

Grant your application permission to use My Account API on behalf of users.

### 3.1 Via Auth0 Dashboard (Recommended)

1. Go to **Applications** → **APIs**
2. Find the **MyAccount API** in the list
3. Click on it to view details
4. Navigate to the **"Machine to Machine Applications"** tab
5. Find your application (e.g., "Agency Inc Dashboard")
6. Toggle it **ON** to authorize
7. Click the dropdown arrow to expand available permissions
8. Select the following scopes:
   - ✅ `create:me:authentication_methods`
   - ✅ `read:me:authentication_methods`
   - ✅ `update:me:authentication_methods`
   - ✅ `delete:me:authentication_methods`
8. Click **"Update"**

### 3.2 Via Management API (Alternative)

You can also create the client grant programmatically:

```bash
curl --request POST \
  --url https://YOUR_DOMAIN.auth0.com/api/v2/client-grants \
  --header 'authorization: Bearer YOUR_MGMT_API_TOKEN' \
  --header 'content-type: application/json' \
  --data '{
    "client_id": "YOUR_APPLICATION_CLIENT_ID",
    "audience": "https://YOUR_DOMAIN.auth0.com/me/",
    "scope": [
      "read:me:authentication_methods",
      "create:me:authentication_methods",
      "update:me:authentication_methods",
      "delete:me:authentication_methods"
    ]
  }'
```

**Verification:**
After creating the grant, your application will be able to obtain access tokens with My Account API audience and scopes.

## Step 4: Configure Access Policies

Set up access policies to control who can use My Account API features.

### 4.1 Default Access Policy

By default, My Account API has:
- **User flows:** `require_client_grant` (enabled for authorized applications)
- **Client flows:** `deny_all` (M2M access disabled)

This is the recommended configuration.

### 4.2 Adjust Policies (Optional)

If you need to customize access policies:

1. Go to **Applications** → **APIs** → **MyAccount API**
2. Navigate to the **"Access Policies"** tab
3. Review and adjust policies as needed:
   - **User flows:** Control user-initiated requests
   - **Client flows:** Control M2M requests (should remain `deny_all`)

**Warning:** Do NOT enable client credentials flow for My Account API, as it's designed for user self-service only.

## Step 5: Test MFA Enrollment Flow

### 5.1 Start Dev Server

Ensure your application is running:

```bash
# Start dev server
npm run dev

# Start ngrok tunnel (required for Auth0 callbacks)
ngrok http 4020 --domain your-static-domain.ngrok-free.app
```

### 5.2 Test Enrollment

1. Navigate to your application: `http://localhost:4020`
2. Log in with a test user
3. Go to **Profile** → **Security** tab
4. Click **"Add New Method"** on an MFA factor
5. Complete the enrollment flow

**Expected Behavior:**
- If MFA is not active in session, you'll be redirected for step-up authentication
- After MFA verification, you'll be returned to the security page
- The new MFA method should appear in the "Enrolled Methods" section

### 5.3 Verify API Calls

Check the browser console and network tab:

**Successful enrollment:**
```
✅ Listed authentication methods: 1
✅ Created authentication method: totp abc123...
```

**Step-up required:**
```
🔐 MFA Check: { hasMFA: false, hasACR: false, result: false }
→ Redirecting to /api/auth/login?stepup=true&returnTo=/profile?tab=security
```

## Step 6: Monitor and Troubleshoot

### 6.1 Check Logs

Monitor Auth0 logs for My Account API activity:

1. Go to **Monitoring** → **Logs** in Auth0 Dashboard
2. Filter by:
   - **Event Type:** "Success API Operation" or "Failed API Operation"
   - **Description:** Contains "my-account"

### 6.2 Common Issues

**Issue: "No access token available"**
- **Cause:** Application doesn't have My Account API scopes in `AUTH0_SCOPE`
- **Fix:** Update `.env.local` and restart server

**Issue: "Unauthorized to access My Account API" (401)**
- **Cause:** Client grant not created or missing scopes
- **Fix:** Follow Step 3 to create/update client grant

**Issue: "Rate limit exceeded" (429)**
- **Cause:** Exceeded 25 requests/second limit
- **Fix:** Implement client-side rate limiting or reduce request frequency

**Issue: "Step-up authentication required" (403)**
- **Cause:** User's session doesn't include MFA verification
- **Expected:** This is correct behavior for sensitive operations
- **Action:** User will be redirected to complete MFA

### 6.3 Debug Mode

Enable detailed logging in your application:

```typescript
// In src/lib/my-account-api.ts
console.log('🔍 My Account API Request:', {
  url,
  method: options.method,
  hasToken: !!accessToken,
});
```

## Security Considerations

1. **Step-Up Authentication:** Always enforce step-up auth for enrollment/removal operations
2. **Rate Limiting:** Respect the 25 req/sec tenant limit
3. **Token Management:** Never expose access tokens to client-side JavaScript
4. **Scope Minimization:** Only request necessary scopes
5. **Error Handling:** Don't leak sensitive error details to frontend
6. **Audit Logging:** Monitor My Account API usage in Auth0 logs

## Production Checklist

Before deploying to production:

- [ ] My Account API activated in Auth0 tenant
- [ ] Client grant created with correct scopes
- [ ] `AUTH0_SCOPE` updated in production environment variables
- [ ] Step-up authentication tested and working
- [ ] Rate limiting implemented (if needed)
- [ ] Error handling tested (401, 403, 429, 500)
- [ ] Auth0 logs monitored for My Account API errors
- [ ] User documentation updated with MFA enrollment instructions
- [ ] Support team trained on My Account API troubleshooting

## Additional Resources

- [Auth0 My Account API Documentation](https://auth0.com/docs/manage-users/my-account-api)
- [Auth0 My Account API Reference](https://auth0.com/docs/api/myaccount)
- [Step-Up Authentication Guide](https://auth0.com/docs/secure/multi-factor-authentication/step-up-authentication)
- [Multi-Factor Authentication Overview](https://auth0.com/docs/secure/multi-factor-authentication)

## Support

If you encounter issues not covered in this guide:

1. Check [Auth0 Community Forums](https://community.auth0.com/)
2. Contact [Auth0 Support](https://support.auth0.com/)
3. Review application logs and Auth0 tenant logs
4. Consult the CLAUDE.md file for implementation details
