# API Migration Guide - Pages Router to App Router

## Overview

This guide outlines the migration from Next.js Pages Router API routes (`src/pages/api`) to App Router API routes (`src/app/api`). The migration includes improved error handling, input validation with Zod, and better TypeScript support.

## Changes Made

### 1. New Directory Structure

```
src/app/api/
├── auth/
│   └── session/
│       ├── list/route.ts
│       └── validate/route.ts
├── organization/
│   └── members/
│       ├── route.ts
│       └── [memberId]/
│           ├── route.ts
│           └── roles/route.ts
└── request-access/
    └── route.ts
```

### 2. New Components and Utilities

- **Error Boundary**: `src/components/error-boundary.tsx`
- **Loading Components**: `src/components/loading.tsx`
- **UI Skeleton**: `src/components/ui/skeleton.tsx`
- **Validation Schemas**: `src/lib/validations.ts`
- **API Client**: `src/lib/api-client.ts`

### 3. Key Migration Changes

#### API Route Structure
- **Before**: `export default function handler(req, res) {}`
- **After**: `export async function GET(request) {}`, `export async function POST(request) {}`

#### Request/Response Handling
- **Before**: `req.body`, `res.json()`
- **After**: `await request.json()`, `Response.json()`

#### Input Validation
- **Before**: Manual validation or none
- **After**: Zod schema validation with detailed error messages

#### Error Handling
- **Before**: Basic error responses
- **After**: Structured error responses with validation details

## Migration Steps

### Step 1: Update Frontend Code

Components should now use the new API client:

```typescript
// Old way
const response = await fetch('/api/organization/members');

// New way
import { apiClient } from '@/lib/api-client';
const members = await apiClient.getOrganizationMembers();
```

### Step 2: Remove Old API Routes

Once you've verified the new routes work correctly:

```bash
rm -rf src/pages/api/organization/
rm -rf src/pages/api/auth/session/
rm src/pages/api/request-access.ts
```

### Step 3: Update Components with Error Boundaries

Wrap sensitive components:

```tsx
import { ErrorBoundary } from '@/components/error-boundary';

function MyComponent() {
  return (
    <ErrorBoundary>
      <SensitiveComponent />
    </ErrorBoundary>
  );
}
```

### Step 4: Add Loading States

Use the new loading components:

```tsx
import { LoadingSpinner, TableSkeleton } from '@/components/loading';

function MyComponent({ loading }) {
  if (loading) {
    return <TableSkeleton />;
  }
  
  return <DataTable />;
}
```

## API Endpoints Mapping

### Organization Members

| Old Route | New Route | Method |
|-----------|-----------|---------|
| `/api/organization/members` | `/api/organization/members` | GET, POST |
| `/api/organization/members/[memberId]` | `/api/organization/members/[memberId]` | DELETE |
| `/api/organization/members/[memberId]/roles` | `/api/organization/members/[memberId]/roles` | POST |

### Session Management

| Old Route | New Route | Method |
|-----------|-----------|---------|
| `/api/auth/session/list` | `/api/auth/session/list` | GET |
| `/api/auth/session/validate` | `/api/auth/session/validate` | GET |

### Access Requests

| Old Route | New Route | Method |
|-----------|-----------|---------|
| `/api/request-access` | `/api/request-access` | POST |

## Validation Schemas

All API endpoints now use Zod for input validation:

```typescript
import { memberIdSchema, inviteMemberSchema } from '@/lib/validations';

// Validate input
const validationResult = inviteMemberSchema.safeParse(body);
if (!validationResult.success) {
  return Response.json(
    { 
      error: 'Invalid input',
      details: validationResult.error.issues
    },
    { status: 400 }
  );
}
```

## Error Handling

The new API routes provide consistent error responses:

```json
{
  "error": "Invalid input",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["email"],
      "message": "Required"
    }
  ]
}
```

## Benefits of Migration

1. **Type Safety**: Better TypeScript support with App Router
2. **Input Validation**: Automatic validation with detailed error messages
3. **Error Boundaries**: Graceful error handling in the UI
4. **Loading States**: Better UX with skeleton components
5. **Code Organization**: Cleaner separation of concerns
6. **Performance**: App Router optimizations
7. **Future-Proof**: Following Next.js recommended patterns

## Testing the Migration

1. Start the development server: `npm run dev`
2. Test each API endpoint using the browser dev tools
3. Verify error handling by sending invalid data
4. Check loading states by simulating slow network
5. Test error boundaries by throwing errors in components

## Rollback Plan

If issues arise, the old API routes are still present and can be used by updating the frontend to use direct fetch calls instead of the API client.