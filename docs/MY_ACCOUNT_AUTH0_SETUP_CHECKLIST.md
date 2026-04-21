# Auth0 Dashboard Configuration Checklist
## My Account API Token Exchange Setup

This checklist walks through the **exact Auth0 Dashboard configuration** needed for My Account API to work with Custom Token Exchange.

---

## 🎯 Quick Reference

**What you need in Auth0:**
1. ✅ M2M Application (for token exchange)
2. ✅ Token Exchange Profile (links action to apps)
3. ✅ Custom Token Exchange Action (validates requests)
4. ✅ Grant Type enabled (Token Exchange)

---

## Step 1: Verify M2M Application for CTE

### Navigate
Auth0 Dashboard → **Applications → Applications**

### Find Your CTE Application
Look for Client ID: `67OqfItt4P43bxdbUg9NTVyPz28sJj3W`

### Check Settings Tab

**Application Type:**
```
Machine to Machine
```

**Token Endpoint Authentication Method:**
```
☑️ Client Secret (Post)  [or Client Secret (Basic)]
```

### Check Advanced Settings → Grant Types

**Must have these checked:**
```
☑️ Client Credentials
☑️ Token Exchange    ← CRITICAL!
```

**If "Token Exchange" is missing:**
1. Check the box: ☑️ `Token Exchange`
2. Scroll to bottom, click **Save Changes**
3. Wait for confirmation toast

---

## Step 2: Create/Verify Token Exchange Profile

### Navigate
Auth0 Dashboard → **Auth Pipeline → Token Exchange Profiles**

(Alternative path: **Applications → Token Exchange**)

### Check if Profile Exists

Look for a profile with name like:
- "My Account API Token Exchange"
- "My Account CTE"
- Any name referencing My Account

### If Profile Exists
Click on it and verify:

**Profile Settings:**
```
Name: My Account API Token Exchange
Description: Token exchange for My Account API authentication
```

**Token Exchange Action:**
```
☑️ custom-token-exchange-basic
```

**Applications:**
```
☑️ Agency Inc Dashboard (U8QtmFYd45QbH1nFwiIzpf0do8xmpmlg)
☑️ My Account CTE M2M (67OqfItt4P43bxdbUg9NTVyPz28sJj3W)
```

### If Profile DOESN'T Exist

Click **"Create Profile"** button

**Step 1: Profile Details**
```
Profile Name: My Account API Token Exchange
Description: Enables token exchange for My Account API scopes
```

**Step 2: Select Action**
```
Token Exchange Action: custom-token-exchange-basic
```
(If action doesn't exist, create it first - see Step 3)

**Step 3: Select Applications**

Add BOTH applications:
```
☑️ Agency Inc Dashboard (your frontend app)
☑️ My Account CTE M2M (your CTE credentials)
```

Click **Create Profile**

---

## Step 3: Verify Custom Token Exchange Action

### Navigate
Auth0 Dashboard → **Auth Pipeline → Actions → Custom**

### Find Action
Look for: `custom-token-exchange-basic`

### If Action Exists

**Check status:**
```
Status: Deployed ✓  (green checkmark)
```

**Check trigger:**
```
Trigger: Custom Token Exchange
```

Click on action to edit

**Check Secrets:**
```
CUSTOM_DOMAIN = login.authskye.org
```

**If secret is missing:**
1. Click **"Add Secret"**
2. Key: `CUSTOM_DOMAIN`
3. Value: `login.authskye.org`
4. Click **"Create"**

**Deploy if needed:**
1. If status shows "Draft" or "Modified"
2. Click **"Deploy"** button
3. Wait for "Deployed" status

### If Action DOESN'T Exist

Click **"Create Action"** → **"Build from scratch"**

**Action Details:**
```
Name: custom-token-exchange-basic
Trigger: Custom Token Exchange
Runtime: Node 18 (Recommended)
```

**Code:**

Paste contents from:
```
auth0-actions/custom-token-exchange-basic.js
```

Or copy directly:

```javascript
/**
 * Custom Token Exchange (CTE) Action for My Account API
 */
exports.onExecuteCustomTokenExchange = async (event, api) => {
  // Validate the token exchange request
  if (event.transaction.protocol_params.subject_token_type !== "urn:myaccount:cte") {
    api.access.deny('subject_token_type_not_supported');
    return;
  }

  // Use custom domain for My Account API audience
  const customDomain = event.secrets.CUSTOM_DOMAIN || 'login.authskye.org';
  const myAccountAudience = `https://${customDomain}/me/`;

  console.log('✅ Token exchange approved for My Account API', {
    audience: myAccountAudience,
    subject: event.transaction.protocol_params.subject_token
  });

  // Set the token audience to custom domain
  api.accessToken.setCustomClaim('aud', myAccountAudience);
};
```

**Add Secret:**
1. Click **"Secrets"** (left sidebar)
2. Click **"Add Secret"**
3. Key: `CUSTOM_DOMAIN`
4. Value: `login.authskye.org`
5. Click **"Create"**

**Deploy:**
1. Click **"Deploy"** button
2. Wait for "Deployed ✓" status

---

## Step 4: Link Profile to Applications (Verify)

This should already be done in Step 2, but verify:

### Navigate
Auth0 Dashboard → **Applications → Applications**

### Check Frontend App
Click: **Agency Inc Dashboard** (U8QtmFYd45QbH1nFwiIzpf0do8xmpmlg)

Go to **"Token Exchange"** tab

**Should show:**
```
Token Exchange Profile: My Account API Token Exchange
```

**If "None" or different profile:**
1. Click **"Edit"**
2. Select: `My Account API Token Exchange`
3. Save

### Check CTE M2M App
Click: **My Account CTE M2M** (67OqfItt4P43bxdbUg9NTVyPz28sJj3W)

Go to **"Token Exchange"** tab

**Should show:**
```
Token Exchange Profile: My Account API Token Exchange
```

---

## Step 5: Verify Custom Domain (Active)

### Navigate
Auth0 Dashboard → **Branding → Custom Domains**

### Check Domain Status
```
Domain: login.authskye.org
Status: Verified ✓  (green)
```

**If not verified:**
- Complete domain verification steps
- Update DNS records as shown
- Wait for verification (can take 24-48 hours)

---

## Step 6: Test Configuration

### Terminal Test
```bash
# Test OpenID configuration
curl https://login.authskye.org/.well-known/openid-configuration

# Should return JSON with:
# {
#   "issuer": "https://login.authskye.org",
#   "authorization_endpoint": "https://login.authskye.org/authorize",
#   ...
# }

# Test JWKS endpoint
curl https://login.authskye.org/.well-known/jwks.json

# Should return JSON with:
# {
#   "keys": [...]
# }
```

### Application Test

1. Start dev server:
```bash
npm run dev
```

2. Login to application

3. Navigate to **Profile → Security**

4. Click **"Get My Account API Token"** button

5. Check browser console for:
```javascript
✅ My Account API token received: {
  audience: "https://login.authskye.org/me/",
  expiresIn: 600,
  scope: "read:me:authentication_methods ..."
}
```

6. Click **"Test API"** button

**Expected results:**

**✅ Success (My Account API activated):**
```json
{
  "success": true,
  "status": 200,
  "data": []
}
```

**⚠️ API Not Activated:**
```json
{
  "success": false,
  "status": 404,
  "error": "Not Found"
}
```

---

## ✅ Verification Checklist

Use this to confirm everything is configured:

### Auth0 Configuration
- [ ] M2M Application exists (`67OqfItt4P43bxdbUg9NTVyPz28sJj3W`)
- [ ] M2M Application has "Token Exchange" grant type enabled
- [ ] Token Exchange Profile exists (e.g., "My Account API Token Exchange")
- [ ] Profile links to CTE Action: `custom-token-exchange-basic`
- [ ] Profile includes both applications (frontend + CTE M2M)
- [ ] CTE Action is deployed with status "Deployed ✓"
- [ ] CTE Action has secret: `CUSTOM_DOMAIN = login.authskye.org`
- [ ] Frontend app linked to Token Exchange Profile
- [ ] CTE M2M app linked to Token Exchange Profile
- [ ] Custom domain verified: `login.authskye.org`

### Environment Variables
- [ ] `.env.local` has `CTE_CLIENT_ID=67OqfItt4P43bxdbUg9NTVyPz28sJj3W`
- [ ] `.env.local` has `CTE_CLIENT_SECRET` (value present)
- [ ] `.env.local` has `AUTH0_ISSUER_BASE_URL=https://login.authskye.org`
- [ ] `.env.local` has `AUTH0_MGMT_DOMAIN=archfaktor.us.auth0.com`

### Application Test
- [ ] Dev server starts without errors
- [ ] Can login successfully
- [ ] "Get My Account API Token" button appears
- [ ] Clicking button shows success toast
- [ ] Token appears in browser console with correct audience
- [ ] "Test API" button shows 200 or 404 response (not 401/403)

---

## 🚨 Common Issues

### Issue: "unauthorized_client"

**Missing:** Token Exchange grant type

**Fix:** Step 1 → Advanced Settings → Grant Types → Check "Token Exchange"

---

### Issue: "access_denied: No token exchange profile found"

**Missing:** Token Exchange Profile not created or not linked

**Fix:** Complete Step 2 and Step 4

---

### Issue: "subject_token_type_not_supported"

**Missing:** CTE Action not deployed or wrong token type

**Fix:**
1. Complete Step 3 (deploy action)
2. Verify action code line 25: `"urn:myaccount:cte"`
3. Verify API code line 62: `'urn:myaccount:cte'`
4. Strings must match exactly

---

### Issue: 404 after successful token exchange

**Cause:** My Account API not activated (Limited Early Access)

**Options:**
1. Contact Auth0 Support to request activation
2. Use legacy MFA system (see `CLAUDE.md` for rollback)

---

## 📚 References

- **Passkey Demo (reference):** https://github.com/awhitmana0/a0-passkeyforms-demo
- **Auth0 Token Exchange:** https://auth0.com/docs/get-started/authentication-and-authorization-flow/token-exchange
- **My Account API:** https://auth0.com/docs/manage-users/my-account-api
- **Your detailed diagnostic:** `docs/MY_ACCOUNT_CTE_DIAGNOSTIC.md`

---

**Last Updated:** April 2026
**Status:** Configuration checklist complete
