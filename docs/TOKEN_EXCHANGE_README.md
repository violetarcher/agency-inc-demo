# Token Exchange Profile Documentation

Complete research and implementation guide for Auth0 Custom Token Exchange (CTE) with My Account API.

## Quick Links

- **[TOKEN_EXCHANGE_QUICK_REFERENCE.md](./TOKEN_EXCHANGE_QUICK_REFERENCE.md)** - 2-minute overview (START HERE)
- **[TOKEN_EXCHANGE_SETUP_GUIDE.md](./TOKEN_EXCHANGE_SETUP_GUIDE.md)** - Step-by-step setup and troubleshooting
- **[TOKEN_EXCHANGE_DECISIONS.md](./TOKEN_EXCHANGE_DECISIONS.md)** - Answer to your 4 key questions
- **[TOKEN_EXCHANGE_PROFILE_RESEARCH.md](./TOKEN_EXCHANGE_PROFILE_RESEARCH.md)** - Deep technical research

## The Error You're Seeing

```
"custom_authentication" Token Exchange Profile is not allowed for the client.
Client ID: [YOUR_CLIENT_ID]
```

### What This Means

The Token Exchange Profile exists, the CTE Action is deployed, but your **client is not authorized to use the profile**. You need to add your client to the profile's allowed applications list in Auth0 Dashboard.

### 60-Second Fix

1. Go to: **Auth0 Dashboard → Actions → Token Exchange Profiles**
2. Select: **"My Account API Token Exchange"**
3. Click: **"Applications"** tab
4. Click: **"Add Application"**
5. Choose: **"Agency Inc Dashboard"** (or your main app)
6. Click: **"Add"**
7. Done! Restart your dev server

---

## Your 4 Questions Answered

### Q1: Should we use the main application's client_id/secret or a separate M2M client?

**Answer: Use the main application** (recommended)

**Why:**
- Simpler configuration
- No extra client to manage
- Standard OAuth2 practice
- Fewer environment variables

**Alternative:** Create M2M client if your organization requires strict separation of concerns.

See: **[TOKEN_EXCHANGE_DECISIONS.md → Question 1](./TOKEN_EXCHANGE_DECISIONS.md#question-1-should-the-token-exchange-request-use-the-main-applications-client_idsecret-or-a-separate-m2m-client)**

---

### Q2: What applications need to be linked to a Token Exchange Profile?

**Answer: Only the application that will perform token exchange**

If using main app:
```
Token Exchange Profile.allowed_clients = [
  "AUTH0_CLIENT_ID"  ← Only this
]
```

If using M2M:
```
Token Exchange Profile.allowed_clients = [
  "CTE_CLIENT_ID"    ← Only this, not the main app
]
```

**Why:** Principle of least privilege. Don't grant permissions you're not using.

See: **[TOKEN_EXCHANGE_DECISIONS.md → Question 2](./TOKEN_EXCHANGE_DECISIONS.md#question-2-what-applications-need-to-be-linked-to-a-token-exchange-profile)**

---

### Q3: What is the "custom_authentication" profile type vs "custom"?

**Answer: "custom_authentication" is the ONLY available type**

```typescript
// From Auth0 SDK - only type available:
export declare const PostTokenExchangeProfilesRequestTypeEnum: {
    readonly custom_authentication: "custom_authentication";
};
```

There is NO "custom" type. The error message mentions "custom_authentication" because that's what your profile is using (correctly).

**Key Point:** The problem is NOT the type, but your client not being in the allowed list.

See: **[TOKEN_EXCHANGE_DECISIONS.md → Question 3](./TOKEN_EXCHANGE_DECISIONS.md#question-3-what-is-custom_authentication-profile-type-vs-custom)**

---

### Q4: How did the passkey demo repo configure the Token Exchange Profile?

**Answer:** They used the same pattern, but didn't fully document it

The `a0-passkeyforms-demo` repo uses:
1. Custom Token Exchange Action
2. Token Exchange Profile (type: "custom_authentication")
3. Token exchange request with subject_token_type

**Their gap:** They don't explicitly show adding applications to the profile in Dashboard, which is why the error occurs.

**Solution:** Add your application to the profile's Applications tab (see 60-second fix above).

See: **[TOKEN_EXCHANGE_DECISIONS.md → Question 4](./TOKEN_EXCHANGE_DECISIONS.md#question-4-how-did-the-passkey-demo-repo-configure-the-token-exchange-profile)**

---

## Implementation Approaches

### Approach 1: Main Application (RECOMMENDED)

```
Setup Time: ~5 minutes
Complexity: Low
Maintenance: Easy
```

**Dashboard Steps:**
1. Add AUTH0_CLIENT_ID to Token Exchange Profile's Applications

**Code:**
```typescript
client_id: process.env.AUTH0_CLIENT_ID,
client_secret: process.env.AUTH0_CLIENT_SECRET,
```

**Env:**
```bash
# No changes needed
```

---

### Approach 2: M2M Client (Current Implementation)

```
Setup Time: ~15 minutes
Complexity: Medium
Maintenance: Medium
```

**Dashboard Steps:**
1. Create M2M Application
2. Add M2M Client ID to Token Exchange Profile's Applications

**Code:**
```typescript
client_id: process.env.CTE_CLIENT_ID,
client_secret: process.env.CTE_CLIENT_SECRET,
```

**Env:**
```bash
CTE_CLIENT_ID='...'
CTE_CLIENT_SECRET='...'
```

---

## Documentation Structure

### For Different Needs

| Document | Length | Use When |
|----------|--------|----------|
| [QUICK_REFERENCE.md](./TOKEN_EXCHANGE_QUICK_REFERENCE.md) | 2 min | Need immediate fix |
| [DECISIONS.md](./TOKEN_EXCHANGE_DECISIONS.md) | 5 min | Want to understand options |
| [SETUP_GUIDE.md](./TOKEN_EXCHANGE_SETUP_GUIDE.md) | 15 min | Detailed implementation needed |
| [RESEARCH.md](./TOKEN_EXCHANGE_PROFILE_RESEARCH.md) | 20 min | Deep technical analysis |

### Document Contents

**QUICK_REFERENCE.md**
- Error explanation
- Two-step fix
- Checklist
- Verification steps
- Troubleshooting matrix

**DECISIONS.md**
- Detailed answer to Q1-Q4
- Complete decision tree
- Configuration checklists
- Comparison tables
- References to SDK types

**SETUP_GUIDE.md**
- Dashboard step-by-step
- Code updates for both approaches
- Environment configuration
- Comprehensive troubleshooting
- Testing procedures

**RESEARCH.md**
- SDK analysis
- Profile structure
- Type definitions
- Implementation findings
- Investigation notes

---

## Common Errors & Fixes

| Error | Dashboard Fix | Code Fix |
|-------|---------------|----------|
| "not allowed for the client" | Add client to profile's Applications tab | Restart server |
| "subject_token_type_not_supported" | Check CTE Action deployed | Verify subject_token_type matches |
| "invalid_grant" | N/A | Log out/in again |
| "Client not found" | Verify client exists | Check credentials in .env |

---

## Checklist: Get It Working

- [ ] **Dashboard:** Navigate to Actions → Token Exchange Profiles
- [ ] **Dashboard:** Select "My Account API Token Exchange"
- [ ] **Dashboard:** Click "Applications" tab
- [ ] **Dashboard:** Click "Add Application"
- [ ] **Dashboard:** Select your main app or M2M client
- [ ] **Dashboard:** Click "Add"
- [ ] **Code:** Update `/src/app/api/mfa/auth/get-token/route.ts` (if using main app)
- [ ] **Env:** Add CTE credentials if using M2M approach
- [ ] **Terminal:** Restart server with `npm run dev`
- [ ] **Browser:** Visit Profile → Security tab
- [ ] **Browser:** Click "Get Token"
- [ ] **Console:** Verify "✅ Token exchange successful"

---

## Key Files

### Implementation
- **Token Exchange Route:** `/src/app/api/mfa/auth/get-token/route.ts`
- **CTE Action:** `/auth0-actions/custom-token-exchange-basic.js`
- **Configuration:** `/.env.local`

### Documentation
- **This File:** `/docs/TOKEN_EXCHANGE_README.md`
- **Quick Fix:** `/docs/TOKEN_EXCHANGE_QUICK_REFERENCE.md`
- **Full Setup:** `/docs/TOKEN_EXCHANGE_SETUP_GUIDE.md`
- **Decisions:** `/docs/TOKEN_EXCHANGE_DECISIONS.md`
- **Research:** `/docs/TOKEN_EXCHANGE_PROFILE_RESEARCH.md`

### Related Docs
- `/docs/MY_ACCOUNT_TOKEN_EXCHANGE_SETUP.md` - Original setup guide
- `/docs/MY_ACCOUNT_TOKEN_EXCHANGE_SUMMARY.md` - Implementation summary
- `/docs/MY_ACCOUNT_ON_DEMAND_AUTH.md` - On-demand auth patterns

---

## SDK Reference

### Token Exchange Profile Types (Auth0 SDK)

From: `/node_modules/auth0/dist/esm/management/__generated/models/index.d.ts`

**Available Types:**
```typescript
PostTokenExchangeProfilesRequestTypeEnum: "custom_authentication"
```

**Profile Structure (Creation):**
```typescript
interface PostTokenExchangeProfilesRequest {
  name: string;
  subject_token_type: string;
  action_id: string;
  type: "custom_authentication";
}
```

**Profile Structure (Response):**
```typescript
interface GetTokenExchangeProfilesById200Response {
  id: string;
  name: string;
  subject_token_type: string;
  action_id: string;
  type: "custom_authentication";
  created_at: string;
  updated_at: string;
}
```

**Note:** No `allowed_clients` field in SDK types, but it exists in Management API and Dashboard UI.

---

## Next Steps

1. **Start Here:** Read [TOKEN_EXCHANGE_QUICK_REFERENCE.md](./TOKEN_EXCHANGE_QUICK_REFERENCE.md)
2. **Choose Approach:** Review [TOKEN_EXCHANGE_DECISIONS.md](./TOKEN_EXCHANGE_DECISIONS.md)
3. **Implement:** Follow [TOKEN_EXCHANGE_SETUP_GUIDE.md](./TOKEN_EXCHANGE_SETUP_GUIDE.md)
4. **Test:** Run verification steps in SETUP_GUIDE
5. **Troubleshoot:** Use troubleshooting matrix if needed

---

## Support Resources

### Auth0 Official
- [Token Exchange Docs](https://auth0.com/docs/get-started/authentication-and-authorization-flow/token-exchange)
- [My Account API](https://auth0.com/docs/manage-users/my-account-api)
- [Custom Token Exchange Actions](https://auth0.com/docs/actions/triggers/custom-token-exchange)

### Reference Implementation
- [Passkey Forms Demo](https://github.com/awhitmana0/a0-passkeyforms-demo)
- [FGA MCP Skills](https://github.com/violetarcher/fga-mcp-skills-quickstart)

### This Project
- **CLAUDE.md** - Project overview and patterns
- **README.md** - General setup instructions

---

## Questions?

**Quick issue?**
→ See [TOKEN_EXCHANGE_QUICK_REFERENCE.md](./TOKEN_EXCHANGE_QUICK_REFERENCE.md)

**Want to understand the options?**
→ See [TOKEN_EXCHANGE_DECISIONS.md](./TOKEN_EXCHANGE_DECISIONS.md)

**Need detailed setup?**
→ See [TOKEN_EXCHANGE_SETUP_GUIDE.md](./TOKEN_EXCHANGE_SETUP_GUIDE.md)

**Want technical deep-dive?**
→ See [TOKEN_EXCHANGE_PROFILE_RESEARCH.md](./TOKEN_EXCHANGE_PROFILE_RESEARCH.md)

---

**Created:** April 2026
**Last Updated:** April 2026
**Status:** Complete - Ready for implementation
**Covers:** Auth0 CTE with My Account API for MFA management
