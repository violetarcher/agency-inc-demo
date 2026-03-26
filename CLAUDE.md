# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a B2B SaaS application demonstrating enterprise-grade identity and authorization patterns using Auth0 Organizations, Auth0 FGA (Fine-Grained Authorization), and Next.js 14 App Router. The application showcases multi-tenant architecture, session management, step-up MFA, and document management with relationship-based access control.

## Development Commands

```bash
# Development
npm run dev     # Start dev server on port 4020

# Production
npm run build   # Build for production
npm run start   # Start production server

# Code Quality
npm run lint    # Run ESLint
```

## Local Development Requirements

**Required for full functionality:**
- ngrok tunnel: `ngrok http 4020 --domain your-static-domain.ngrok-free.app`
  - Auth0 organization invitations require HTTPS callbacks
  - Use a static domain to avoid reconfiguring Auth0 on every restart
- All environment variables in `.env.local` (see README.md for complete list)
- Auth0 Actions deployed (3 required - see README.md)

## Core Architecture Patterns

### 1. Authentication & Authorization Flow

All API routes follow this layered authorization pattern:

```typescript
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { checkPermission, formatUserId, formatDocId } from '@/lib/fga-service';

export const GET = withApiAuthRequired(async function GET(request) {
  // Layer 1: Authentication (handled by withApiAuthRequired)
  const session = await getSession();
  const user = session?.user;

  // Layer 2: User identity validation
  if (!user?.sub || !user?.org_id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Layer 3: Role-based authorization (if applicable)
  const roles = user['https://agency-inc-demo.com/roles'] || [];
  if (!roles.includes('Admin')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Layer 4: Resource-level authorization (FGA)
  const canRead = await checkPermission(
    formatUserId(user.sub),
    'can_read',
    formatDocId(resourceId)
  );
  if (!canRead) {
    return Response.json({ error: 'Permission denied' }, { status: 403 });
  }

  // Execute business logic
});
```

**Session Context Available:**
- `user.sub` - User ID (e.g., "auth0|123456")
- `user.org_id` - Organization ID
- `user['https://agency-inc-demo.com/roles']` - Array of roles
- `user['https://agency-inc-demo.com/session_id']` - Current session ID

### 2. Input Validation Pattern

**All API routes use Zod schemas from `src/lib/validations.ts`:**

```typescript
import { createDocumentSchema } from '@/lib/validations';

const body = await request.json();
const validation = createDocumentSchema.safeParse(body);

if (!validation.success) {
  return Response.json(
    { error: 'Validation error', details: validation.error.errors },
    { status: 400 }
  );
}

const { name, content, parentId } = validation.data; // Typed data
```

When adding new endpoints, always create/reuse schemas in `validations.ts`.

### 3. Auth0 FGA (Fine-Grained Authorization) Integration

**FGA Service Layer:** `src/lib/fga-service.ts`

**Object Model:**
```
user:{auth0_id}       - Users
group:{id}            - Groups
folder:{id}           - Folders
doc:{id}              - Documents

Relations:
- owner               - Full control
- viewer              - Read-only access
- member (groups)     - Group membership
- parent              - Folder containment
- can_read, can_write, can_share - Derived permissions
```

**Key Operations:**

```typescript
import {
  checkPermission,
  writeTuple,
  deleteTuple,
  formatUserId,
  formatDocId,
  formatFolderId,
  formatGroupMember
} from '@/lib/fga-service';

// Check permission
const canRead = await checkPermission(
  formatUserId(userId),
  'can_read',
  formatDocId(docId)
);

// Grant ownership
await writeTuple({
  user: formatUserId(userId),
  relation: 'owner',
  object: formatDocId(docId)
});

// Share with group
await writeTuple({
  user: formatGroupMember(groupId),  // "group:{id}#member"
  relation: 'viewer',
  object: formatFolderId(folderId)
});
```

**Always format IDs before calling FGA operations.**

### 4. Session Management

**Architecture:**

```
SessionValidator (client)    SessionEnforcer (client)
     ↓ polls every 5s             ↓ runs on mount
/api/auth/session/validate   /api/auth/session/enforce-my-limit
     ↓                             ↓
revoked-sessions.json        Auth0 Management API
```

**Key Components:**
- `src/lib/session-revocation.ts` - File-based revocation tracking
- `src/lib/auth0-session-manager.ts` - Auth0 session operations
- `src/components/session-validator.tsx` - Real-time monitoring
- `src/components/session-enforcer.tsx` - Single session enforcement

**Session Revocation:**
Sessions are tracked in `revoked-sessions.json` at project root. This file persists across restarts and ensures immediate revocation without waiting for token expiry.

### 5. Organization Multi-Tenancy

**All data operations MUST filter by organization:**

```typescript
// Firestore queries
const documents = await db.collection('documents')
  .where('organizationId', '==', user.org_id)
  .get();

// Creating resources
await db.collection('documents').add({
  name,
  content,
  organizationId: user.org_id,  // REQUIRED
  ownerId: user.sub,
  createdAt: new Date().toISOString()
});
```

**Organization Context:**
- User's org_id comes from session: `user.org_id`
- Organization metadata (name, logo) in custom claims: `user['https://agency-inc-demo.com/org_name']`

### 6. Step-Up MFA

Sensitive operations trigger step-up authentication:

```typescript
// In component, redirect to login with step-up flag
const handleDelete = () => {
  window.location.href = '/api/auth/login?stepup=true&returnTo=/reports';
};
```

**Auth0 Action** (deployed in tenant) reads `acr_values` parameter and enforces MFA:
```javascript
if (event.transaction.acr_values.includes('multi-factor')) {
  api.multifactor.enable('any');
}
```

### 7. Kong API Gateway Integration

**Kong Konnect** (`kong-019c989905usehqbh.kongcloud.dev`) sits as an API gateway layer between the frontend and backend APIs, providing JWT validation, rate limiting, CORS handling, and request transformation.

**Architecture Flow:**
```
Browser → Kong Gateway → Next.js API
         ↑            ↓
         Auth0 (JWT validation via JWKS)
```

**Key Components:**
- `src/app/api-gateway/page.tsx` - Kong demo page with Mermaid architecture diagram
- `src/app/api/kong-protected/*` - API routes protected by Kong Gateway
- `src/app/api/auth/token/route.ts` - Endpoint to retrieve Auth0 access token from session
- `src/components/mermaid-diagram.tsx` - Reusable Mermaid.js diagram component

**Kong Plugins Configured:**
1. **OpenID Connect** - Validates Auth0 JWT tokens using JWKS endpoint
2. **CORS** - Handles cross-origin requests from frontend
3. **Rate Limiting** - 100 req/min, 1000 req/hour per consumer
4. **Request Transformer** - Adds `X-Kong-Protected: true` header
5. **Pre-Function** - Lua script to handle OPTIONS preflight requests

**Kong-Protected API Route Pattern:**

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if request came through Kong
    const kongProtected = request.headers.get('X-Kong-Protected');
    if (!kongProtected) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'This endpoint must be accessed through Kong Gateway' },
        { status: 401 }
      );
    }

    // Extract user info from Kong headers (if configured)
    const userId = request.headers.get('X-User-Id');
    const userEmail = request.headers.get('X-User-Email');

    // Fallback: Decode JWT from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const base64Payload = token.split('.')[1];
      const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf-8'));
      // payload contains: { sub, email, org_id, ... }
    }

    // Business logic
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Request Flow Through Kong:**

1. **Frontend retrieves token** - GET `/api/auth/token` extracts JWT from session (no Auth0 call)
2. **Frontend calls Kong** - Request sent to Kong Gateway URL with `Authorization: Bearer <JWT>`
3. **Kong validates JWT** - Uses cached Auth0 JWKS public keys to verify signature, audience, issuer, expiry
4. **Kong adds headers** - `X-Kong-Protected: true`, `X-Gateway-Version: 1.0`
5. **Kong forwards to Next.js** - Request proxied to upstream Next.js API
6. **Next.js validates** - Checks for `X-Kong-Protected` header, decodes JWT if needed
7. **Response returns** - Kong adds CORS headers and returns response to browser

**Important Notes:**
- Kong validates JWT **locally** using Auth0's public keys (cached from JWKS endpoint)
- Auth0 is NOT called for every request - only to refresh public key cache
- Direct API calls without Kong are blocked by `X-Kong-Protected` header check
- VPN must be disabled for Kong Gateway testing (VPN can block Kong requests)

**Frontend Pattern for Kong Requests:**

```typescript
const fetchWithAuth = async (endpoint: string) => {
  // Get Auth0 access token from session
  const tokenResponse = await fetch('/api/auth/token');
  const { accessToken } = await tokenResponse.json();

  // Call through Kong Gateway
  const response = await fetch(`${KONG_GATEWAY_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  return response.json();
};
```

**Kong Configuration Files:**
- `kong/kong-oidc.yaml` - Declarative Kong configuration with OIDC plugin
- `kong/KONG-SETUP.md` - Complete setup guide for Kong Konnect
- `kong/KONG-TESTING.md` - Testing scenarios and troubleshooting

## Project Structure

```
src/
├── app/
│   ├── api/                    # API Routes (Next.js App Router)
│   │   ├── auth/              # Auth0 handlers, session management
│   │   │   ├── [...auth0]/    # Main Auth0 handler with step-up MFA
│   │   │   ├── backchannel-logout/  # Back-channel logout webhook
│   │   │   ├── token/         # Access token retrieval from session
│   │   │   └── session/       # Session validation/enforcement endpoints
│   │   ├── kong-protected/    # Kong Gateway-protected endpoints
│   │   │   └── analytics/     # Analytics API (requires X-Kong-Protected header)
│   │   ├── organization/      # Member and role management
│   │   ├── documents/         # Document CRUD (FGA-protected)
│   │   ├── folders/           # Folder CRUD (FGA-protected)
│   │   ├── groups/            # Group management
│   │   └── user/              # User preferences/metadata
│   ├── admin/                 # Admin dashboard pages
│   ├── api-gateway/           # Kong Gateway demo page with Mermaid diagram
│   ├── documents/             # Document management UI
│   ├── analytics/             # Analytics with access request workflow
│   └── reports/               # Reporting interface
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── admin/                 # Admin-specific components
│   ├── mermaid-diagram.tsx    # Mermaid.js diagram renderer
│   ├── session-validator.tsx # Real-time session monitoring
│   └── session-enforcer.tsx  # Single session enforcement
├── lib/
│   ├── validations.ts         # All Zod schemas (SINGLE SOURCE OF TRUTH)
│   ├── fga-service.ts         # Auth0 FGA operations
│   ├── fga-client.ts          # OpenFGA SDK singleton
│   ├── session-revocation.ts  # File-based session tracking
│   ├── auth0-session-manager.ts  # Auth0 session API client
│   ├── auth0-mgmt-client.ts   # Auth0 Management API client
│   ├── firebase-admin.ts      # Firebase Admin SDK initialization
│   └── utils.ts               # Shared utilities
├── auth0-actions/             # Auth0 Actions for deployment
│   ├── mfa-challenge-second-login.js
│   ├── progressive-profiling-amerigas.js
│   └── README.md              # Deployment instructions
└── kong/                      # Kong Gateway configuration
    ├── kong-oidc.yaml         # Declarative Kong config (OIDC)
    ├── KONG-SETUP.md          # Complete setup guide
    └── KONG-TESTING.md        # Testing scenarios
```

## When Adding New Features

### Adding a New API Route

1. **Create schema in `src/lib/validations.ts`:**
```typescript
export const createWidgetSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['typeA', 'typeB']),
});
```

2. **Create route with auth wrapper:**
```typescript
// src/app/api/widgets/route.ts
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { createWidgetSchema } from '@/lib/validations';

export const POST = withApiAuthRequired(async function POST(request) {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub || !user?.org_id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const validation = createWidgetSchema.safeParse(body);

  if (!validation.success) {
    return Response.json(
      { error: 'Validation error', details: validation.error.errors },
      { status: 400 }
    );
  }

  // Business logic
  const widget = {
    ...validation.data,
    organizationId: user.org_id,  // ALWAYS include org_id
    ownerId: user.sub,
    createdAt: new Date().toISOString()
  };

  return Response.json({ success: true, widget });
});
```

3. **If resource needs FGA protection, write ownership tuple:**
```typescript
import { writeTuple, formatUserId, formatDocId } from '@/lib/fga-service';

await writeTuple({
  user: formatUserId(user.sub),
  relation: 'owner',
  object: `widget:${widgetId}`
});
```

### Adding FGA-Protected Resources

1. **Define object type in FGA model** (if not already defined)
2. **Format IDs with proper prefix:** `widget:${id}`
3. **Write ownership tuple on creation**
4. **Check permission before operations:**
```typescript
const canRead = await checkPermission(
  formatUserId(user.sub),
  'can_read',
  `widget:${widgetId}`
);
```
5. **Return tuple info in responses for debugging:**
```typescript
return Response.json({
  widget,
  tupleInfo: [
    { operation: 'created', tuple: { user, relation: 'owner', object } }
  ]
});
```

### Adding User Preferences

User preferences are stored in Auth0 `user_metadata`:

```typescript
// API endpoint to update preferences
import { managementClient } from '@/lib/auth0-mgmt-client';

const userDetails = await managementClient.users.get({ id: user.sub });
const currentMetadata = userDetails.data.user_metadata || {};

const updatedMetadata = {
  ...currentMetadata,
  new_preference: value
};

await managementClient.users.update(
  { id: user.sub },
  { user_metadata: updatedMetadata }
);
```

**Access in components:**
```typescript
const userMetadata = user?.['https://agency-inc-demo.com/user_metadata'] || {};
const preference = userMetadata.new_preference;
```

## Common Patterns & Pitfalls

### ✅ Always Do

- Filter Firestore queries by `organizationId`
- Use Zod schemas from `src/lib/validations.ts`
- Format FGA IDs with proper prefixes before operations
- Wrap API routes with `withApiAuthRequired`
- Return consistent error responses with proper status codes
- Include `tupleInfo` in responses when modifying FGA state

### ❌ Never Do

- Skip organization filtering in database queries
- Use raw user input without Zod validation
- Forget to format FGA IDs (e.g., using `userId` instead of `user:${userId}`)
- Create resources without `organizationId`
- Block login on session management failures (always try/catch)
- Use template syntax like `{{fields.value}}` in JSON - build objects in code

### 🔧 Debugging

**Session issues:**
1. Check browser console for SessionValidator logs (🔍 prefix)
2. Check `revoked-sessions.json` in project root
3. Check network tab for `/api/auth/session/validate` calls

**FGA permission issues:**
1. Use FGA Dashboard to inspect tuples
2. Check that IDs are formatted correctly (`user:`, `doc:`, etc.)
3. Verify Authorization Model is deployed
4. Use `readTuples(object)` to see all relationships

**Organization isolation issues:**
1. Verify `user.org_id` is present in session
2. Check Firestore queries include `.where('organizationId', '==', user.org_id)`
3. Ensure new resources are created with `organizationId`

**Validation errors:**
1. Check `src/lib/validations.ts` for schema definition
2. Look at `validation.error.errors` for detailed issues
3. Ensure all required fields are provided

**Kong Gateway issues:**
1. Check Network tab for `X-Kong-Protected` and `X-Gateway-Version` headers in response
2. Verify VPN is disabled (VPN can block Kong requests)
3. Check Kong Konnect dashboard for request logs and plugin execution
4. Test direct API call to confirm `X-Kong-Protected` enforcement
5. Verify CORS plugin origins include your frontend URL (no leading/trailing spaces)

## Environment Variables

See `README.md` for complete list. Key variables:

```env
# Auth0 Core
AUTH0_SECRET=              # openssl rand -hex 32
AUTH0_BASE_URL=            # Your ngrok or production URL
AUTH0_ISSUER_BASE_URL=     # https://tenant.auth0.com
AUTH0_CLIENT_ID=           # Application client ID
AUTH0_CLIENT_SECRET=       # Application client secret
AUTH0_AUDIENCE=            # API identifier

# Auth0 Management API (M2M)
AUTH0_MGMT_DOMAIN=         # tenant.auth0.com
AUTH0_MGMT_CLIENT_ID=      # M2M client ID
AUTH0_MGMT_CLIENT_SECRET=  # M2M client secret

# Auth0 FGA
FGA_STORE_ID=              # FGA store ID
FGA_CLIENT_ID=             # FGA client ID
FGA_CLIENT_SECRET=         # FGA client secret
FGA_API_URL=               # https://api.us1.fga.dev

# Firebase
FIREBASE_SERVICE_ACCOUNT_BASE64=  # Base64-encoded service account JSON

# Kong Gateway
NEXT_PUBLIC_KONG_GATEWAY_URL=     # https://your-gateway.kongcloud.dev
```

## Testing Locally

1. Start dev server: `npm run dev`
2. Start ngrok tunnel: `ngrok http 4020 --domain your-domain.ngrok-free.app`
3. Ensure Auth0 callback URLs point to ngrok domain
4. Verify Auth0 Actions are deployed (see `auth0-actions/README.md`)

## Demo Branches

**`main`** - Original SaaS+ application
**`amerigas-demo`** - MyGasHub propane delivery demo
- Rebranded UI for propane industry
- User preferences stored in `user_metadata`
- Toggle switches for delivery preferences
- Propane-specific dashboard KPIs

When working on demo branches, remember that branding changes are cosmetic - the underlying Auth0/FGA architecture remains the same.

## Critical Files

- `src/lib/validations.ts` - All Zod schemas
- `src/lib/fga-service.ts` - FGA operations
- `src/lib/auth0-session-manager.ts` - Session management
- `src/lib/session-revocation.ts` - Revocation tracking
- `src/app/api/auth/[...auth0]/route.ts` - Auth0 handler with step-up MFA
- `src/app/api/auth/token/route.ts` - Access token retrieval for Kong requests
- `src/app/api/kong-protected/analytics/route.ts` - Kong-protected endpoint example
- `src/app/api-gateway/page.tsx` - Kong Gateway demo page
- `src/components/mermaid-diagram.tsx` - Mermaid diagram component
- `kong/kong-oidc.yaml` - Kong declarative configuration
- `kong/KONG-SETUP.md` - Kong setup guide
- `revoked-sessions.json` - Session blacklist (project root)
- `.env.local` - Environment configuration

## MCP Server Integration

**OpenFGA Modeling MCP Server** is configured for Claude Code to provide FGA modeling assistance.

### Setup

**Installation Location:**
```
/Users/violet.archer/Documents/FGA/openfga-modeling-mcp
```

**Claude Code Configuration:**
File: `~/.claude/settings.json`

```json
{
  "mcpServers": {
    "openfga": {
      "command": "node",
      "args": ["/Users/violet.archer/Documents/FGA/openfga-modeling-mcp/dist/index.js"]
    }
  }
}
```

**Note:** Configuration is global - applies to all Claude Code sessions on this machine.

### What It Provides

The MCP server offers tools for:
- **FGA DSL validation** - Check authorization model syntax
- **Modeling assistance** - Suggest relations and object types
- **Best practices** - OpenFGA modeling patterns
- **Model explanation** - Understand authorization logic

### Usage

When working on FGA-related tasks, Claude Code will automatically have access to OpenFGA modeling tools. No credentials are needed for modeling assistance (only required if querying live FGA API).

### Rebuilding

If the MCP server is updated:
```bash
cd /Users/violet.archer/Documents/FGA/openfga-modeling-mcp
npm install
npm run build
```

Then restart Claude Code session.

### Current FGA Model

This project uses the following FGA object types:
- `user:{auth0_id}` - Users
- `group:{id}` - Groups (with `member` relation)
- `folder:{id}` - Folders (with `parent` relation)
- `doc:{id}` - Documents

Key relations: `owner`, `viewer`, `can_read`, `can_write`, `can_share`

See `src/lib/fga-service.ts` for helper functions that format IDs properly.

## Additional Resources

- **README.md** - Complete setup instructions and Auth0 Actions
- **auth0-actions/** - Auth0 Action code for deployment
- **kong/** - Kong Gateway configuration and setup guides
- [Auth0 Organizations Docs](https://auth0.com/docs/manage-users/organizations)
- [Auth0 FGA Docs](https://auth0.com/docs/fine-grained-authorization)
- [OpenFGA Docs](https://openfga.dev/docs)
- [Kong Konnect Docs](https://developer.konghq.com)
- [Kong OIDC Plugin](https://developer.konghq.com/plugins/openid-connect/)
- [OpenFGA MCP Server](https://github.com/aaguiarz/openfga-modeling-mcp)
