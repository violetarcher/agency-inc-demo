# Create Token Exchange Profile via API

This document provides the API call to create a Token Exchange Profile programmatically.

## Prerequisites

1. **CTE Action deployed** with ID (get from: Auth0 Dashboard → Actions → Library → Your CTE Action → Copy Action ID)
2. **Management API Token** with scope: `create:token_exchange_profiles`

## Get Management API Token

```bash
curl --request POST \
  --url https://archfaktor.us.auth0.com/oauth/token \
  --header 'content-type: application/json' \
  --data '{
    "client_id": "YOUR_M2M_CLIENT_ID",
    "client_secret": "YOUR_M2M_CLIENT_SECRET",
    "audience": "https://archfaktor.us.auth0.com/api/v2/",
    "grant_type": "client_credentials"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 86400
}
```

## Create Token Exchange Profile

### cURL

```bash
curl --request POST \
  --url https://archfaktor.us.auth0.com/api/v2/token-exchange-profiles \
  --header 'authorization: Bearer YOUR_MANAGEMENT_API_TOKEN' \
  --header 'content-type: application/json' \
  --data '{
    "name": "My Account API Token Exchange",
    "description": "On-demand token exchange for My Account API",
    "action_id": "YOUR_CTE_ACTION_ID",
    "enabled": true,
    "allowed_clients": [
      "YOUR_APPLICATION_CLIENT_ID"
    ]
  }'
```

### Postman Format

**Method:** `POST`

**URL:** `https://archfaktor.us.auth0.com/api/v2/token-exchange-profiles`

**Headers:**
```
Authorization: Bearer YOUR_MANAGEMENT_API_TOKEN
Content-Type: application/json
```

**Body (raw JSON):**
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

### HTTPie

```bash
http POST https://archfaktor.us.auth0.com/api/v2/token-exchange-profiles \
  Authorization:"Bearer YOUR_MANAGEMENT_API_TOKEN" \
  Content-Type:application/json \
  name="My Account API Token Exchange" \
  description="On-demand token exchange for My Account API" \
  action_id="YOUR_CTE_ACTION_ID" \
  enabled:=true \
  allowed_clients:='["YOUR_APPLICATION_CLIENT_ID"]'
```

## Expected Response

**Status:** `201 Created`

```json
{
  "id": "tep_abc123...",
  "name": "My Account API Token Exchange",
  "description": "On-demand token exchange for My Account API",
  "action_id": "act_xyz789...",
  "enabled": true,
  "allowed_clients": [
    "YOUR_APPLICATION_CLIENT_ID"
  ],
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

## How to Get Required IDs

### 1. Get CTE Action ID

**Option A: From Dashboard**
1. Go to: Auth0 Dashboard → Actions → Library
2. Click on your CTE Action
3. URL will contain the ID: `.../actions/{action_id}`
4. Or check the action details page for the ID

**Option B: Via API**
```bash
curl --request GET \
  --url https://archfaktor.us.auth0.com/api/v2/actions/actions \
  --header 'authorization: Bearer YOUR_MANAGEMENT_API_TOKEN'
```

Look for action with `trigger_id: "custom-token-exchange"`

### 2. Get Application Client ID

From `.env.local`:
```bash
AUTH0_CLIENT_ID='your_application_client_id'
```

Or from: Auth0 Dashboard → Applications → Your App → Settings → Client ID

## Complete Script (Node.js)

Save as `create-token-exchange-profile.js`:

```javascript
const fetch = require('node-fetch');

const AUTH0_DOMAIN = 'archfaktor.us.auth0.com';
const MGMT_CLIENT_ID = process.env.AUTH0_MGMT_CLIENT_ID;
const MGMT_CLIENT_SECRET = process.env.AUTH0_MGMT_CLIENT_SECRET;
const CTE_ACTION_ID = process.env.CTE_ACTION_ID; // e.g., 'act_abc123...'
const APP_CLIENT_ID = process.env.AUTH0_CLIENT_ID;

async function getManagementToken() {
  const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: MGMT_CLIENT_ID,
      client_secret: MGMT_CLIENT_SECRET,
      audience: `https://${AUTH0_DOMAIN}/api/v2/`,
      grant_type: 'client_credentials',
    }),
  });

  const data = await response.json();
  return data.access_token;
}

async function createTokenExchangeProfile(token) {
  const response = await fetch(`https://${AUTH0_DOMAIN}/api/v2/token-exchange-profiles`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'My Account API Token Exchange',
      description: 'On-demand token exchange for My Account API',
      action_id: CTE_ACTION_ID,
      enabled: true,
      allowed_clients: [APP_CLIENT_ID],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create profile: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

async function main() {
  try {
    console.log('🔄 Getting Management API token...');
    const token = await getManagementToken();

    console.log('✅ Got token');
    console.log('🔄 Creating Token Exchange Profile...');

    const profile = await createTokenExchangeProfile(token);

    console.log('✅ Profile created successfully:');
    console.log(JSON.stringify(profile, null, 2));
    console.log('\n📝 Save this ID to your notes:', profile.id);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
```

**Run it:**
```bash
node create-token-exchange-profile.js
```

## Verify Profile Created

### Via Dashboard
1. Go to: Auth0 Dashboard → Actions → Token Exchange Profiles
2. Should see "My Account API Token Exchange"

### Via API
```bash
curl --request GET \
  --url https://archfaktor.us.auth0.com/api/v2/token-exchange-profiles \
  --header 'authorization: Bearer YOUR_MANAGEMENT_API_TOKEN'
```

## Troubleshooting

### Error: "action_id not found"
- Action ID is incorrect or action not deployed
- Get action ID from Dashboard or API

### Error: "Insufficient scope"
- Management API token needs scope: `create:token_exchange_profiles`
- Check your M2M application has this scope authorized

### Error: "Client not found"
- Application Client ID is incorrect
- Verify `AUTH0_CLIENT_ID` from `.env.local`

## Next Steps

After profile is created:
1. Add CTE credentials to `.env.local`
2. Restart dev server
3. Test token exchange: Profile → Security tab
4. Click refresh on token field
5. Should see: "My Account API token ready"
