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

## Project Structure

```
src/
├── app/
│   ├── api/                    # API Routes (Next.js App Router)
│   │   ├── auth/              # Auth0 handlers, session management
│   │   │   ├── [...auth0]/    # Main Auth0 handler with step-up MFA
│   │   │   ├── backchannel-logout/  # Back-channel logout webhook
│   │   │   └── session/       # Session validation/enforcement endpoints
│   │   ├── organization/      # Member and role management
│   │   ├── documents/         # Document CRUD (FGA-protected)
│   │   ├── folders/           # Folder CRUD (FGA-protected)
│   │   ├── groups/            # Group management
│   │   └── user/              # User preferences/metadata
│   ├── admin/                 # Admin dashboard pages
│   ├── documents/             # Document management UI
│   ├── analytics/             # Analytics with access request workflow
│   └── reports/               # Reporting interface
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── admin/                 # Admin-specific components
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
└── auth0-actions/             # Auth0 Actions for deployment
    ├── mfa-challenge-second-login.js
    ├── progressive-profiling-amerigas.js
    └── README.md              # Deployment instructions
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
- `revoked-sessions.json` - Session blacklist (project root)
- `.env.local` - Environment configuration

## Additional Resources

- **README.md** - Complete setup instructions and Auth0 Actions
- **auth0-actions/** - Auth0 Action code for deployment
- [Auth0 Organizations Docs](https://auth0.com/docs/manage-users/organizations)
- [Auth0 FGA Docs](https://auth0.com/docs/fine-grained-authorization)
- [OpenFGA Docs](https://openfga.dev/docs)
