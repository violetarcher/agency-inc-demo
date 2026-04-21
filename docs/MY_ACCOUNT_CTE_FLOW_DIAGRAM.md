# My Account API Token Exchange Flow Diagram

## Complete Flow (Your Implementation)

```
┌──────────────────────────────────────────────────────────────────────┐
│                          USER JOURNEY                                 │
└──────────────────────────────────────────────────────────────────────┘

1. User logs in normally
   │
   ├─ Auth0 Universal Login
   ├─ Returns access token (standard audience)
   └─ User session established

2. User navigates to Profile → Security tab
   │
   └─ Component renders: "Get My Account API Token" button

3. User clicks "Get Token" button
   │
   └─ Frontend: POST /api/mfa/auth/get-token

┌──────────────────────────────────────────────────────────────────────┐
│                     TOKEN EXCHANGE FLOW                               │
└──────────────────────────────────────────────────────────────────────┘

4. Backend receives request
   │
   ├─ Validates user session
   ├─ Extracts user.sub (e.g., "auth0|user-id")
   └─ Constructs token exchange request

5. Backend calls Auth0 token endpoint
   │
   POST https://login.authskye.org/oauth/token
   │
   ├─ grant_type: "urn:ietf:params:oauth:grant-type:token-exchange"
   ├─ client_id: CTE_CLIENT_ID (67Oqf...)
   ├─ client_secret: CTE_CLIENT_SECRET
   ├─ audience: "https://login.authskye.org/me/"
   ├─ scope: "read:me:authentication_methods create:me:..."
   ├─ subject_token: "auth0|user-id"
   └─ subject_token_type: "urn:myaccount:cte"

6. Auth0 routes to Token Exchange Profile
   │
   ├─ Finds: "My Account API Token Exchange" profile
   ├─ Checks: Application authorized?
   │   ├─ Frontend app (U8Qt...) ✓
   │   └─ CTE M2M app (67Oqf...) ✓
   └─ Routes to CTE Action

7. CTE Action executes
   │
   custom-token-exchange-basic.js
   │
   ├─ Validates subject_token_type === "urn:myaccount:cte"
   │   ├─ If match: Continue
   │   └─ If no match: api.access.deny()
   │
   ├─ Reads secret: CUSTOM_DOMAIN = "login.authskye.org"
   ├─ Constructs audience: "https://login.authskye.org/me/"
   └─ Sets token claim: api.accessToken.setCustomClaim('aud', audience)

8. Auth0 issues token
   │
   ├─ Token payload:
   │   {
   │     "iss": "https://login.authskye.org/",
   │     "sub": "auth0|user-id",
   │     "aud": [
   │       "https://login.authskye.org/me/",
   │       "https://login.authskye.org/userinfo"
   │     ],
   │     "scope": "read:me:authentication_methods create:me:...",
   │     "exp": 1776259609
   │   }
   │
   └─ Returns to backend

9. Backend returns token to frontend
   │
   Response:
   {
     "success": true,
     "accessToken": "eyJ...",
     "audience": "https://login.authskye.org/me/",
     "expiresIn": 600
   }

10. Frontend stores token
    │
    ├─ setAccessToken("eyJ...")
    ├─ setMyAccountDomain("https://login.authskye.org")
    └─ UI shows: "Token ready ✓"

┌──────────────────────────────────────────────────────────────────────┐
│                     MY ACCOUNT API CALLS                              │
└──────────────────────────────────────────────────────────────────────┘

11. User clicks "Test API" or enrolls MFA factor
    │
    └─ Frontend makes API call

12. Frontend calls backend endpoint
    │
    Example: POST /api/mfa/methods
    │
    Headers:
    └─ Authorization: Bearer eyJ... (My Account token)

13. Backend proxies to My Account API
    │
    POST https://login.authskye.org/me/v1/authentication-methods
    │
    Headers:
    └─ Authorization: Bearer eyJ...

14. My Account API validates token
    │
    ├─ Checks issuer: "https://login.authskye.org/" ✓
    ├─ Checks audience: "https://login.authskye.org/me/" ✓
    ├─ Checks signature: Valid JWT signature ✓
    ├─ Checks expiry: Not expired ✓
    └─ Checks scopes: Has required scope ✓

15. My Account API returns response
    │
    ├─ 200 OK: MFA method enrolled
    ├─ 404 Not Found: My Account API not activated
    └─ 401 Unauthorized: Invalid token

16. Backend returns response to frontend
    │
    └─ Frontend shows result to user

```

---

## Auth0 Configuration Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                    REQUIRED SETUP                            │
└─────────────────────────────────────────────────────────────┘

1. CTE M2M Application
   │
   Client ID: 67OqfItt4P43bxdbUg9NTVyPz28sJj3W
   │
   ├─ Application Type: Machine to Machine
   ├─ Grant Types:
   │   ├─ ☑️ Client Credentials
   │   └─ ☑️ Token Exchange ← CRITICAL!
   └─ Used for: Token exchange authentication

2. Token Exchange Profile
   │
   Name: "My Account API Token Exchange"
   │
   ├─ Linked Action: custom-token-exchange-basic
   ├─ Applications:
   │   ├─ Agency Inc Dashboard (U8QtmFYd...)
   │   └─ My Account CTE M2M (67OqfItt...)
   └─ Purpose: Links action to authorized apps

3. CTE Action
   │
   Name: custom-token-exchange-basic
   │
   ├─ Trigger: Custom Token Exchange
   ├─ Status: Deployed ✓
   ├─ Secret: CUSTOM_DOMAIN = login.authskye.org
   └─ Purpose: Validates requests and sets audience

4. Custom Domain
   │
   Domain: login.authskye.org
   │
   ├─ Status: Verified ✓
   ├─ DNS: CNAME configured
   └─ Purpose: Token issuer and audience domain

```

---

## Error Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ERROR SCENARIOS                           │
└─────────────────────────────────────────────────────────────┘

Token Exchange Request
   │
   ├─ Missing CTE_CLIENT_ID/SECRET
   │  └─→ Response: "Token exchange not configured"
   │     └─→ Fix: Add to .env.local
   │
   ├─ Token Exchange grant not enabled
   │  └─→ Response: "unauthorized_client"
   │     └─→ Fix: Enable grant in M2M app settings
   │
   ├─ Token Exchange Profile not created
   │  └─→ Response: "access_denied: No token exchange profile found"
   │     └─→ Fix: Create profile in Auth0 Dashboard
   │
   ├─ CTE Action not deployed
   │  └─→ Response: "access_denied" (generic)
   │     └─→ Fix: Deploy CTE Action
   │
   ├─ Wrong subject_token_type
   │  └─→ Response: "subject_token_type_not_supported"
   │     └─→ Fix: Check action code matches API code
   │
   └─ Token Exchange successful ✓
      │
      My Account API Call
      │
      ├─ Token audience doesn't match API domain
      │  └─→ Response: 401 Unauthorized
      │     └─→ Fix: Ensure both use same domain
      │
      ├─ Token expired
      │  └─→ Response: 401 Unauthorized
      │     └─→ Fix: Get new token
      │
      ├─ My Account API not activated
      │  └─→ Response: 404 Not Found
      │     └─→ Fix: Contact Auth0 Support
      │
      └─ API call successful ✓

```

---

## Comparison: Your Implementation vs Passkey Demo

```
┌─────────────────────────────────────────────────────────────┐
│                PASSKEY DEMO (Reference)                      │
└─────────────────────────────────────────────────────────────┘

Login
  │
  └─→ Post-Login Action
        │
        ├─ Performs token exchange immediately
        ├─ Gets My Account API token
        └─ Injects token into Universal Login form
              │
              api.prompt.render(FORM_ID, {
                vars: { api_token: token }
              })
              │
              └─→ Form uses {{vars.api_token}} in requests


┌─────────────────────────────────────────────────────────────┐
│               YOUR IMPLEMENTATION (Improved)                 │
└─────────────────────────────────────────────────────────────┘

Login
  │
  └─→ Normal login flow (no token exchange)
        │
        Navigate to Security tab
        │
        Click "Get Token" button
        │
        └─→ On-demand token exchange
              │
              POST /api/mfa/auth/get-token
              │
              └─→ Token stored in React state
                    │
                    Use in API calls: Authorization: Bearer {token}


Advantages of Your Approach:
✅ No token generated on every login
✅ Token only requested when needed
✅ Easier to refresh (just click button again)
✅ No forced logout if token exchange fails
✅ Better error messages
✅ More flexible (can use token anywhere in app)

```

---

## Token Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    TOKEN LIFECYCLE                           │
└─────────────────────────────────────────────────────────────┘

0 min    User clicks "Get Token"
         │
         Token Exchange request
         │
         Token issued (exp: 600 seconds = 10 minutes)
         │
5 min    Token still valid
         │
         User can make My Account API calls
         │
10 min   Token expires (exp reached)
         │
         Next API call fails with 401
         │
         User clicks "Get Token" again
         │
         New token issued
         │
         Continue using My Account API

```

---

## Decision Tree: Testing Your Setup

```
Start Test
   │
   ├─ Can get token?
   │  │
   │  ├─ No → Check error code
   │  │  │
   │  │  ├─ "unauthorized_client"
   │  │  │  └─→ Enable Token Exchange grant
   │  │  │
   │  │  ├─ "access_denied: No profile"
   │  │  │  └─→ Create Token Exchange Profile
   │  │  │
   │  │  └─ "Token exchange not configured"
   │  │     └─→ Add CTE credentials to .env.local
   │  │
   │  └─ Yes → Decode token
   │     │
   │     ├─ Audience correct?
   │     │  │
   │     │  ├─ No (canonical domain)
   │     │  │  └─→ Fix CTE Action to use custom domain
   │     │  │
   │     │  └─ Yes → Test API call
   │     │     │
   │     │     ├─ 200 OK
   │     │     │  └─→ ✅ SUCCESS! My Account API activated
   │     │     │
   │     │     ├─ 404 Not Found
   │     │     │  └─→ ⚠️ My Account API not activated
   │     │     │     └─→ Contact Auth0 Support
   │     │     │
   │     │     └─ 401 Unauthorized
   │     │        └─→ Token/API domain mismatch
   │     │
   │     └─ Scopes correct?
   │        │
   │        ├─ No
   │        │  └─→ Check token exchange scope parameter
   │        │
   │        └─ Yes
   │           └─→ Check API call implementation

```

---

## Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│                                                                    │
│  FRONTEND (Next.js React)                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Profile → Security Tab                                       │ │
│  │                                                               │ │
│  │ ┌─────────────────────────────────────────┐                 │ │
│  │ │ "Get My Account API Token" button       │                 │ │
│  │ └─────────────────────────────────────────┘                 │ │
│  │              │                                                │ │
│  │              │ onClick                                        │ │
│  │              ▼                                                │ │
│  │ ┌─────────────────────────────────────────┐                 │ │
│  │ │ POST /api/mfa/auth/get-token            │                 │ │
│  │ └─────────────────────────────────────────┘                 │ │
│  └───────────────────────│───────────────────────────────────┘ │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           │ HTTP Request
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                                                                    │
│  BACKEND (Next.js API Route)                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ src/app/api/mfa/auth/get-token/route.ts                     │ │
│  │                                                               │ │
│  │ 1. Get user.sub from session                                 │ │
│  │ 2. Construct OAuth2 Token Exchange request                   │ │
│  │ 3. Call Auth0 token endpoint                                 │ │
│  └───────────────────────┬───────────────────────────────────┘ │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           │ POST /oauth/token
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                                                                    │
│  AUTH0 (Token Exchange)                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 1. Validates CTE credentials                                 │ │
│  │ 2. Routes to Token Exchange Profile                          │ │
│  │ 3. Executes CTE Action                                       │ │
│  │    ├─ Validates subject_token_type                           │ │
│  │    └─ Sets audience claim                                    │ │
│  │ 4. Issues JWT with My Account API audience                   │ │
│  └───────────────────────┬───────────────────────────────────┘ │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           │ Returns token
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                                                                    │
│  BACKEND (Token Response)                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Returns:                                                      │ │
│  │ {                                                             │ │
│  │   accessToken: "eyJ...",                                      │ │
│  │   audience: "https://login.authskye.org/me/",                │ │
│  │   expiresIn: 600                                              │ │
│  │ }                                                             │ │
│  └───────────────────────┬───────────────────────────────────┘ │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           │ HTTP Response
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                                                                    │
│  FRONTEND (Token Storage)                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ setAccessToken(token)                                         │ │
│  │ setMyAccountDomain("https://login.authskye.org")             │ │
│  │                                                               │ │
│  │ Now ready to make My Account API calls!                      │ │
│  └───────────────────────┬───────────────────────────────────┘ │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           │ User clicks "Enroll MFA"
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                                                                    │
│  FRONTEND (MFA API Call)                                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ POST /api/mfa/methods                                         │ │
│  │ Authorization: Bearer {accessToken}                           │ │
│  └───────────────────────┬───────────────────────────────────┘ │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           │ Proxy request
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                                                                    │
│  MY ACCOUNT API (Auth0)                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ POST /me/v1/authentication-methods                            │ │
│  │                                                               │ │
│  │ 1. Validates JWT signature                                    │ │
│  │ 2. Checks audience matches                                    │ │
│  │ 3. Verifies scopes                                            │ │
│  │ 4. Enrolls MFA factor                                         │ │
│  │ 5. Returns enrolled method                                    │ │
│  └───────────────────────┬───────────────────────────────────┘ │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           │ Returns response
                           │
                           ▼
                      User sees result

```

---

## Summary

**Your implementation follows the exact same pattern as the passkey demo**, with architectural improvements for better UX and developer experience.

**What's complete:**
- ✅ Token exchange endpoint
- ✅ CTE Action code
- ✅ Frontend integration
- ✅ Environment configuration

**What's needed:**
- ⚠️ Auth0 Dashboard configuration (15 minutes)
- ⚠️ My Account API activation (Auth0 Support)

**Next step:** Follow `docs/MY_ACCOUNT_AUTH0_SETUP_CHECKLIST.md` to complete Auth0 configuration.

---

**Reference:** https://github.com/awhitmana0/a0-passkeyforms-demo
