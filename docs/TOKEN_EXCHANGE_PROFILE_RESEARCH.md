# Auth0 Token Exchange Profile Research

## Error Analysis

### The Error: "custom_authentication" Token Exchange Profile is not allowed for the client

**Error Message:**
```
"custom_authentication" Token Exchange Profile is not allowed for the client.
Client ID: [CTE_M2M_CLIENT_ID]
```

This error indicates that the **CTE M2M client being used in the token exchange request** has NOT been added to the Token Exchange Profile's `allowed_clients` list.

---

## Key Findings

### 1. **Token Exchange Profile Structure**

Based on Auth0 SDK analysis (`node_modules/auth0`), a Token Exchange Profile has these fields:

```typescript
interface PostTokenExchangeProfilesRequest {
  name: string;                              // Friendly name
  subject_token_type: string;                // URI identifier (e.g., "urn:cteforms")
  action_id: string;                         // ID of CTE Action to execute
  type: "custom_authentication";             // ONLY type currently available
}

interface GetTokenExchangeProfilesById200Response {
  id: string;
  name: string;
  subject_token_type: string;
  action_id: string;
  type: "custom_authentication";             // Returns same value
  created_at: string;
  updated_at: string;
  // NOTE: No 'allowed_clients' field in response type
}
```

**Critical Finding:** The type definition for Token Exchange Profile creation and retrieval shows **NO `allowed_clients` field**.

---

### 2. **Understanding the Error**

The error "custom_authentication" Token Exchange Profile is not allowed for the client" suggests:

1. **Profiles DO have client restrictions** (not visible in create/read models)
2. **The CTE M2M client needs to be authorized** to use the profile
3. **This is likely managed separately** from the profile creation (possibly via Dashboard UI or a different API endpoint)

---

### 3. **What Should Be Linked to Profile?**

Based on the current implementation and passkey-forms-demo reference:

#### Profile Creation Request (from CREATE_TOKEN_EXCHANGE_PROFILE.md)
```json
{
  "name": "My Account API Token Exchange",
  "description": "On-demand token exchange for My Account API",
  "action_id": "YOUR_CTE_ACTION_ID",
  "enabled": true,
  "allowed_clients": [
    "YOUR_APPLICATION_CLIENT_ID"
  ]
}
```

**The documentation shows `allowed_clients`** in the creation payload, but the SDK types don't include it. This suggests:
- The field exists at the **Management API level**
- But may not be in the current SDK TypeScript definitions
- Or it's managed through a **separate endpoint** (possibly under Applications/Linked Applications)

---

### 4. **Two Possible Configuration Approaches**

#### Approach A: Use MAIN Application Client in Token Exchange Request
```typescript
// src/app/api/mfa/auth/get-token/route.ts
const tokenExchangePayload = {
  grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
  client_id: process.env.AUTH0_CLIENT_ID,        // ← MAIN app client
  client_secret: process.env.AUTH0_CLIENT_SECRET,
  audience: myAccountAudience,
  scope: 'read:me:authentication_methods ...',
  subject_token: user.sub,
  subject_token_type: 'https://myaccountcte/me/',
};
```

**Reasoning:**
- The main application is the "real" user-facing client
- M2M clients are typically for backend service-to-service auth
- Token exchange flows use the **client making the request** as the target
- Only the **main application should be in allowed_clients**

#### Approach B: Use CTE M2M Client (Current Implementation)
```typescript
const tokenExchangePayload = {
  grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
  client_id: process.env.CTE_CLIENT_ID,        // ← M2M client
  client_secret: process.env.CTE_CLIENT_SECRET,
  // ... rest same
};
```

**Requirements:**
- The **M2M client MUST be in allowed_clients**
- May need BOTH clients (M2M for token exchange, main app for authorization)
- More complex but allows separation of concerns

---

### 5. **Passkey Demo Configuration** (Reference)

The `a0-passkeyforms-demo` repository uses the same pattern but doesn't show the Dashboard UI steps for adding clients to the profile. The README references "using the provided Postman collection" for setup.

**What we know from passkey-demo:**
- Creates a CTE Action with `subject_token_type: "urn:cteforms"`
- Performs token exchange with that exact subject_token_type
- Uses a Token Exchange Profile to link everything
- **The exact configuration of allowed_clients is not documented in the repo**

---

### 6. **Profile Type: "custom_authentication" vs "custom"**

From the SDK type definitions:
```typescript
export declare const PostTokenExchangeProfilesRequestTypeEnum: {
    readonly custom_authentication: "custom_authentication";
};
export type PostTokenExchangeProfilesRequestTypeEnum = (typeof PostTokenExchangeProfilesRequestTypeEnum)[keyof typeof PostTokenExchangeProfilesRequestTypeEnum];
```

**Finding:** Only `"custom_authentication"` is available. There is no `"custom"` type.

The error message "custom_authentication" Token Exchange Profile is not allowed for the client" is specifically about this **type**, not a profile type error, but rather an **authorization error for that profile type**.

---

## Recommended Solution

### Step 1: Verify Profile Creation
Check if the Token Exchange Profile actually has **both clients** listed:

```bash
# Get profile via API
curl https://archfaktor.us.auth0.com/api/v2/token-exchange-profiles/{PROFILE_ID} \
  -H "Authorization: Bearer {MGMT_TOKEN}"
```

Look for an `allowed_clients` field in the response.

### Step 2: Add Both Clients via Dashboard
1. **Auth0 Dashboard → Actions → Token Exchange Profiles**
2. Select your profile
3. Go to **Applications** tab
4. Add **BOTH**:
   - Your main application (e.g., "Agency Inc Dashboard")
   - Your CTE M2M client (e.g., "My Account API Token Exchange (CTE)")

### Step 3: Update Token Exchange Request
Recommend using the **MAIN application client** instead of M2M:

```typescript
// src/app/api/mfa/auth/get-token/route.ts
const cteClientId = process.env.AUTH0_CLIENT_ID;        // ← Main app
const cteClientSecret = process.env.AUTH0_CLIENT_SECRET;

// Remove CTE_CLIENT_ID and CTE_CLIENT_SECRET
// Keep .env.local clean

const tokenExchangePayload = {
  grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
  client_id: cteClientId,
  client_secret: cteClientSecret,
  audience: myAccountAudience,
  // ... rest
};
```

**Rationale:**
- Simpler configuration (no separate M2M client needed)
- The main application is already in the profile
- Aligns with OAuth2 best practices (use the actual client making the request)
- Reduces environment variable complexity

---

## Questions to Investigate

1. **Is `allowed_clients` managed through Management API or Dashboard-only?**
   - The field appears in documentation but not in SDK types
   - May need to use raw HTTP requests or Dashboard UI

2. **Can BOTH the main app and M2M client be in `allowed_clients`?**
   - Error suggests only one client can use the profile
   - Or the listed client must match the requesting client exactly

3. **Does subject_token_type affect client authorization?**
   - The error specifically mentions "custom_authentication" type
   - Not clear if different types allow different clients

---

## Implementation Path

### Option 1: Use Main Application Client (RECOMMENDED)
```
✅ Simpler configuration
✅ Fewer environment variables
✅ Standard OAuth2 pattern
❌ Main app client secret exposed to frontend (already the case)
```

### Option 2: Keep M2M Client (Current Path)
```
✅ Separation of concerns
✅ Clear audit trail (M2M client specifically for token exchange)
❌ Requires managing two clients
❌ M2M client secret in .env.local
❌ Profile must list M2M client (currently not listed?)
```

---

## Configuration Checklist

- [ ] Token Exchange Profile created (id: `tep_...`)
- [ ] CTE Action deployed (trigger: Custom Token Exchange)
- [ ] Profile linked to CTE Action
- [ ] **Main application added to profile's Applications tab** ← KEY STEP
- [ ] M2M client added to profile's Applications tab (if using Option 2)
- [ ] subject_token_type matches between profile and request
- [ ] Token endpoint uses `AUTH0_ISSUER_BASE_URL` (custom domain)
- [ ] Audience in request is canonical domain: `{AUTH0_MGMT_DOMAIN}/me/`

---

## References

- Auth0 SDK: `/node_modules/auth0/dist/esm/management/__generated/models/index.d.ts`
  - Lines 14904-14906: PostTokenExchangeProfilesRequestTypeEnum (only "custom_authentication")
  - Lines 9009-9050: Token Exchange Profile response structure
  - No `allowed_clients` in response structure

- Current Implementation: `src/app/api/mfa/auth/get-token/route.ts`
  - Currently uses CTE_CLIENT_ID and CTE_CLIENT_SECRET
  - Uses subject_token_type: 'https://myaccountcte/me/' (should match CTE Action)

- Documentation: `docs/MY_ACCOUNT_TOKEN_EXCHANGE_SETUP.md`
  - References `allowed_clients` in Postman examples but not in Dashboard steps

- Passkey Demo: `https://github.com/awhitmana0/a0-passkeyforms-demo`
  - Reference implementation but doesn't show allowed_clients Dashboard configuration

---

**Status:** Research complete. Implementation decision required on which client to use.
