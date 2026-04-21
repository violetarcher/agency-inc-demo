# Token Exchange Profile - Quick Reference

## Error: "custom_authentication" Token Exchange Profile is not allowed for the client

```
Error Message: "custom_authentication" Token Exchange Profile is not allowed for the client
Client ID: [YOUR_CLIENT_ID]
```

### Quick Fix (2 Steps)

**Step 1: Dashboard**
1. Auth0 Dashboard → Actions → Token Exchange Profiles
2. Select "My Account API Token Exchange"
3. Click **Applications** tab
4. Click **"Add Application"**
5. Select **"Agency Inc Dashboard"** (your main app)
6. Click **"Add"**

**Step 2: Code Update** (Optional - Use main app client)

Change `/src/app/api/mfa/auth/get-token/route.ts`:
```typescript
// BEFORE (uses M2M client):
const cteClientId = process.env.CTE_CLIENT_ID;
const cteClientSecret = process.env.CTE_CLIENT_SECRET;

// AFTER (uses main app client):
const cteClientId = process.env.AUTH0_CLIENT_ID;        // ← Already in .env
const cteClientSecret = process.env.AUTH0_CLIENT_SECRET; // ← Already in .env
```

Then restart: `npm run dev`

---

## Understanding the Error

### What "not allowed for the client" Means

The Token Exchange Profile has an **allowlist of clients** that can use it. Your client is not in that list.

- **Profile exists** ✅
- **CTE Action deployed** ✅
- **Your client authorized to use profile** ❌

### Why Token Exchange Profiles Have Client Restrictions

- **Security:** Only approved clients can exchange tokens
- **Audit:** Track which applications perform token exchanges
- **Control:** Prevent unauthorized token generation

---

## Two Configuration Approaches

### Approach 1: Use Main Application (RECOMMENDED)

**Why?**
- Simpler setup
- No extra client to manage
- Standard OAuth2 pattern
- No new .env variables

**Configure:**
1. Add main app to profile's Applications
2. Use `AUTH0_CLIENT_ID` in token exchange
3. That's it!

**Code:**
```typescript
client_id: process.env.AUTH0_CLIENT_ID,
client_secret: process.env.AUTH0_CLIENT_SECRET,
```

---

### Approach 2: Use M2M Client (Current Implementation)

**Why?**
- Clear separation of concerns
- Audit trail shows M2M specifically used for token exchange
- More complex environments prefer this

**Configure:**
1. Create M2M Application: "My Account API Token Exchange (CTE)"
2. Add ONLY this M2M client to profile's Applications
3. Add credentials to .env.local

**Code:**
```typescript
client_id: process.env.CTE_CLIENT_ID,
client_secret: process.env.CTE_CLIENT_SECRET,
```

**Environment:**
```bash
CTE_CLIENT_ID='...'
CTE_CLIENT_SECRET='...'
```

---

## Profile Structure

```
Token Exchange Profile
├── name: "My Account API Token Exchange"
├── subject_token_type: "https://myaccountcte/me/"
├── action_id: "act_..."
├── type: "custom_authentication"  ← Only type available
└── allowed_clients: [
    "YOUR_MAIN_APP_CLIENT_ID"      ← Add your app here
    "OPTIONAL_M2M_CLIENT_ID"        ← Only if using M2M approach
]
```

---

## Verification Checklist

- [ ] Token Exchange Profile created (id starts with `tep_`)
- [ ] CTE Action deployed (trigger: "Custom Token Exchange")
- [ ] Profile linked to CTE Action
- [ ] **Application added to profile's Applications tab** ← KEY!
- [ ] subject_token_type matches (default: "https://myaccountcte/me/")
- [ ] Server restarted after changes
- [ ] Logged in with fresh session (has refresh token)

---

## Testing Token Exchange

```bash
# 1. Start server
npm run dev

# 2. Log in and go to Profile → Security

# 3. Click "Get Token"

# 4. Check browser console:
# Expected: 🔄 Performing token exchange...
# Then: ✅ Token exchange successful

# 5. If error: Check troubleshooting section below
```

---

## Troubleshooting Matrix

| Error | Cause | Fix |
|-------|-------|-----|
| "not allowed for the client" | Client not in profile's Applications | Add client to profile's Applications tab |
| "subject_token_type_not_supported" | subject_token_type mismatch | Verify CTE Action code and request match |
| "invalid_grant" | No refresh token or grant invalid | Log out/in again, clear cache |
| "Profile not found" | Profile doesn't exist | Create profile in Dashboard |
| "Access denied" | Client credentials wrong | Verify CTE_CLIENT_ID/SECRET or use main app client |

---

## Key Differences: Main App vs M2M Client

| Aspect | Main App | M2M Client |
|--------|----------|-----------|
| Setup complexity | Low | Medium |
| Client credentials | Already in .env | Need to add to .env |
| Dashboard config | Add main app | Add M2M app |
| Scope of use | All OAuth flows | Token exchange only |
| Recommended for | Most cases | Large organizations |

---

## One-Minute Explanation

**The Problem:**
You're trying to exchange a token for My Account API access, but Auth0 says your client isn't allowed to use this Token Exchange Profile.

**The Root Cause:**
Someone needs to tell Auth0 that your application is allowed to use the Token Exchange Profile. This is done in the Dashboard by adding your app to the profile's allowed applications.

**The Solution:**
1. Go to Auth0 Dashboard
2. Find your Token Exchange Profile
3. Add your application to the "Applications" list
4. (Optional) Update code to use main app client instead of M2M
5. Restart server

**Why This Matters:**
Token Exchange Profiles have security controls to prevent unauthorized token generation. You're configuring those controls to allow your specific application.

---

## Common Questions

**Q: Should I use the main application client or create an M2M client?**

A: Use the main application client. It's simpler and already configured. Only use M2M if your organization requires strict client isolation.

**Q: What's "custom_authentication" type?**

A: It's the profile type. Currently, that's the only type available. The error is about your client not being allowed, not about the type being wrong.

**Q: Do I need to add BOTH clients?**

A: Only add the client you're actually using. If using the main app, add only the main app. If using M2M, add only the M2M client.

**Q: Why does the error mention the M2M client ID?**

A: The error shows which client made the request. That client isn't in the profile's allowed list, so the request is rejected.

**Q: Can I test this without restarting the server?**

A: You need to restart if you change .env variables, but Dashboard changes (adding apps) are immediate. So: Update Dashboard → Try token exchange (no restart needed). Change .env → Restart server.

---

## Files to Know

| File | Purpose |
|------|---------|
| `/src/app/api/mfa/auth/get-token/route.ts` | Token exchange endpoint |
| `/auth0-actions/custom-token-exchange-basic.js` | CTE Action code |
| `/.env.local` | Configuration (CTE_CLIENT_ID, CTE_CLIENT_SECRET) |

---

## Related Documentation

- **Setup Guide:** `/docs/TOKEN_EXCHANGE_PROFILE_SETUP_GUIDE.md`
- **Research Notes:** `/docs/TOKEN_EXCHANGE_PROFILE_RESEARCH.md`
- **Original Setup:** `/docs/MY_ACCOUNT_TOKEN_EXCHANGE_SETUP.md`
- **On-Demand Auth:** `/docs/MY_ACCOUNT_ON_DEMAND_AUTH.md`

---

**Last Updated:** April 2026
**Status:** Ready for implementation
