# Token Exchange Profile: Decision Guide

## Question 1: Should the token exchange request use the main application's client_id/secret or a separate M2M client?

### Answer: Use the Main Application Client (Recommended)

**Reasoning:**
- **Standard Practice:** OAuth2 grants use the actual client making the request
- **Simpler Setup:** No separate M2M client to create and manage
- **Fewer Credentials:** No CTE_CLIENT_ID/CTE_CLIENT_SECRET needed
- **Existing Pattern:** Already have AUTH0_CLIENT_ID/AUTH0_CLIENT_SECRET in .env.local
- **Single Client:** One fewer thing to authorize in the Token Exchange Profile

**When to use M2M instead:**
- Your organization requires strict separation of concerns
- You want a specific audit trail showing M2M clients only perform token exchange
- You need to revoke token exchange capability independent of app authentication

### Code Implementation

**Current (M2M-based):**
```typescript
const tokenExchangePayload = {
  grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
  client_id: process.env.CTE_CLIENT_ID,        // M2M client
  client_secret: process.env.CTE_CLIENT_SECRET,
  // ...
};
```

**Recommended (Main app-based):**
```typescript
const tokenExchangePayload = {
  grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
  client_id: process.env.AUTH0_CLIENT_ID,        // Main app
  client_secret: process.env.AUTH0_CLIENT_SECRET,
  // ...
};
```

---

## Question 2: What applications need to be linked to a Token Exchange Profile?

### Answer: Only the application that will perform token exchange

**Single Client Approach:**

If using **main application only**:
```
Token Exchange Profile
└── allowed_clients:
    └── AUTH0_CLIENT_ID (your main app)
```

**M2M Separation Approach:**

If using **M2M client only**:
```
Token Exchange Profile
└── allowed_clients:
    └── CTE_CLIENT_ID (M2M client)
```

**Do NOT add both unless:**
- Your main app AND an M2M client both need to perform token exchange
- This is rare and increases complexity

### Why NOT add the unused client?

1. **Security:** Principle of least privilege - only grant what's needed
2. **Clarity:** Easy to see which client(s) use this profile
3. **Maintenance:** Fewer clients to manage
4. **Audit:** Clear what's authorized where

### Implementation in Dashboard

**Steps:**
1. Auth0 Dashboard → Actions → Token Exchange Profiles
2. Select "My Account API Token Exchange"
3. Click **"Applications"** tab
4. Click **"Add Application"**
5. Choose **ONE**:
   - "Agency Inc Dashboard" (main app), OR
   - "My Account API Token Exchange (CTE)" (M2M)
6. Click **"Add"**
7. Verify only ONE application is listed
8. If you see both, click the remove (trash) icon on the one you're not using

---

## Question 3: What is "custom_authentication" profile type vs "custom"?

### Answer: "custom_authentication" is the ONLY available type

**Finding from Auth0 SDK:**
```typescript
export declare const PostTokenExchangeProfilesRequestTypeEnum: {
    readonly custom_authentication: "custom_authentication";
};

export declare const GetTokenExchangeProfilesById200ResponseTypeEnum: {
    readonly custom_authentication: "custom_authentication";
};
```

**Important:** There is NO "custom" type - only "custom_authentication".

### What This Means

When creating a Token Exchange Profile:
- You must use type: `"custom_authentication"`
- This is not a choice - it's the only option available
- Your error message specifically mentions "custom_authentication" which means it's identifying the profile type correctly
- The problem is NOT the type, but rather that your client isn't allowed to use that type's profile

### Why Auth0 Has Types

Future versions of Auth0 may add other types like:
- `"oauth_callback"` - For callback-based token exchange
- `"device_flow"` - For device authorization flows
- etc.

For now, stick with `"custom_authentication"` for CTE-based flows.

---

## Question 4: How did the passkey demo repo configure the Token Exchange Profile?

### The a0-passkeyforms-demo Approach

**Reference Repository:** https://github.com/awhitmana0/a0-passkeyforms-demo

**Their Implementation:**

1. **CTE Action:**
   ```javascript
   exports.onExecuteCustomTokenExchange = async (event, api) => {
     if (event.transaction.protocol_params.subject_token_type !== "urn:cteforms") {
       api.access.deny('subject_token_type_not_supported');
     }
   };
   ```

2. **Token Exchange Request:**
   ```typescript
   const tokenExchangePayload = {
     grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
     subject_token_type: 'urn:cteforms',  // Matches CTE Action validation
     // ... other fields
   };
   ```

3. **Profile Configuration:**
   - They reference using a "Postman collection" for setup
   - The exact Dashboard steps are NOT documented in their README
   - They show profile creation via API but don't detail the allowed_clients setup

### What They DON'T Explicitly Show

Their documentation is silent on:
- **Which client to use** in the token exchange request (main app vs M2M)
- **How to add applications** to the profile in Dashboard
- **Whether to use one client or both**

### What We Can Infer

From the repo structure:
- They use a separate CTE M2M client
- They perform token exchange from a backend route (Next.js API)
- They receive My Account API tokens for passkey management
- The pattern is identical to what we're implementing

### Key Difference from Passkey Demo

**Their Use Case:** Passkey enrollment/management
```typescript
subject_token_type: 'urn:cteforms'
audience: 'https://yourdomain.auth0.com/me/'
scope: passkey-related scopes
```

**Our Use Case:** MFA method management
```typescript
subject_token_type: 'https://myaccountcte/me/'
audience: 'https://archfaktor.us.auth0.com/me/'
scope: read/create/update/delete:me:authentication_methods
```

Both use the same Token Exchange Profile flow, just with different subject_token_types.

---

## Complete Configuration Decision Tree

```
START
  │
  ├─ Q1: Which client to use?
  │  ├─ "I want simple setup" → Use Main App ✅ RECOMMENDED
  │  └─ "I want strict separation" → Use M2M
  │
  ├─ Q2: Which to add to profile's allowed_clients?
  │  ├─ If Main App → Add AUTH0_CLIENT_ID
  │  └─ If M2M → Add CTE_CLIENT_ID (not main app)
  │
  ├─ Q3: What type?
  │  └─ Always "custom_authentication" ✅
  │
  └─ Q4: Update code?
     ├─ If Main App → Change to AUTH0_CLIENT_ID
     └─ If M2M → Keep CTE_CLIENT_ID
```

---

## Configuration Checklist by Approach

### Recommended: Main Application Approach

**In Auth0 Dashboard:**
- [ ] Go to Actions → Token Exchange Profiles
- [ ] Select "My Account API Token Exchange"
- [ ] Click "Applications" tab
- [ ] Click "Add Application"
- [ ] Search for "Agency Inc Dashboard"
- [ ] Click to select
- [ ] Click "Add" or "Confirm"
- [ ] Verify it appears in the list

**In Code (`src/app/api/mfa/auth/get-token/route.ts`):**
```typescript
const cteClientId = process.env.AUTH0_CLIENT_ID;
const cteClientSecret = process.env.AUTH0_CLIENT_SECRET;
```

**In .env.local:**
```bash
# No changes needed - AUTH0_CLIENT_ID already present
```

**Restart:**
```bash
npm run dev
```

---

### Alternative: M2M Approach

**In Auth0 Dashboard:**
- [ ] Create M2M Application if not exists
  - [ ] Name: "My Account API Token Exchange (CTE)"
  - [ ] Type: "Machine to Machine Applications"
  - [ ] Note: DO NOT authorize to any APIs
- [ ] Go to Actions → Token Exchange Profiles
- [ ] Select "My Account API Token Exchange"
- [ ] Click "Applications" tab
- [ ] Click "Add Application"
- [ ] Search for "My Account API Token Exchange (CTE)"
- [ ] Click to select
- [ ] Click "Add" or "Confirm"
- [ ] Verify M2M app appears (only app in list)
- [ ] If main app is listed, remove it

**Get M2M Credentials:**
- [ ] Go to Applications → "My Account API Token Exchange (CTE)"
- [ ] Copy "Client ID" → save as CTE_CLIENT_ID
- [ ] Copy "Client Secret" → save as CTE_CLIENT_SECRET

**In Code (`src/app/api/mfa/auth/get-token/route.ts`):**
```typescript
const cteClientId = process.env.CTE_CLIENT_ID;
const cteClientSecret = process.env.CTE_CLIENT_SECRET;
```

**In .env.local:**
```bash
CTE_CLIENT_ID='...'
CTE_CLIENT_SECRET='...'
```

**Restart:**
```bash
npm run dev
```

---

## Error Resolution Reference

| Error | Root Cause | Solution | Affected Approach |
|-------|-----------|----------|------------------|
| "not allowed for the client" | Client not in profile's Applications list | Add client via Dashboard | Both |
| "Profile type is invalid" | Attempted to use "custom" instead of "custom_authentication" | Use only "custom_authentication" | Both |
| "subject_token_type_not_supported" | CTE Action is rejecting request | Verify subject_token_type matches CTE Action code | Both |
| "Client not found" | Client ID is incorrect or misspelled | Verify client ID from Dashboard | Both |
| Wrong client in profile | Added main app instead of M2M (or vice versa) | Remove wrong client, add correct one | Both |

---

## Decision Summary

### For Most Deployments (Recommended)

✅ **Use Main Application Client**

**Setup Time:** ~5 minutes
```
1. Dashboard: Add main app to profile's Applications
2. Code: Already using AUTH0_CLIENT_ID
3. Restart: npm run dev
Done!
```

### For Enterprise/Large Organizations

✅ **Use M2M Client (Current Implementation)**

**Setup Time:** ~15 minutes
```
1. Dashboard: Create M2M app
2. Dashboard: Add M2M app to profile's Applications
3. Code: Already using CTE_CLIENT_ID
4. .env: Add CTE credentials
5. Restart: npm run dev
```

---

## References

### SDK Type Definitions
- **Location:** `/node_modules/auth0/dist/esm/management/__generated/models/index.d.ts`
- **PostTokenExchangeProfilesRequestTypeEnum:** Lines 14904-14906
- **GetTokenExchangeProfilesById200ResponseTypeEnum:** Lines 9047-9050
- **Key Finding:** Only `"custom_authentication"` type available

### Implementation Files
- **Token Exchange Route:** `/src/app/api/mfa/auth/get-token/route.ts`
- **CTE Action:** `/auth0-actions/custom-token-exchange-basic.js`
- **Environment:** `/.env.local`

### Documentation
- **Setup Guide:** `/docs/TOKEN_EXCHANGE_PROFILE_SETUP_GUIDE.md`
- **Quick Reference:** `/docs/TOKEN_EXCHANGE_QUICK_REFERENCE.md`
- **Research Notes:** `/docs/TOKEN_EXCHANGE_PROFILE_RESEARCH.md`

### External References
- **Passkey Demo:** https://github.com/awhitmana0/a0-passkeyforms-demo
- **Auth0 Docs:** https://auth0.com/docs/get-started/authentication-and-authorization-flow/token-exchange
- **My Account API:** https://auth0.com/docs/manage-users/my-account-api

---

**Last Updated:** April 2026
**Recommendation:** Implement Main Application approach for faster setup
**Status:** Ready for implementation
