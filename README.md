# Agency Inc. - B2B RBAC Dashboard

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Auth0](https://img.shields.io/badge/Auth0-EB5424?style=for-the-badge&logo=auth0&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

This project is a comprehensive demonstration of a modern B2B Software-as-a-Service (SaaS) application built with Next.js 14 App Router. It showcases enterprise-grade identity and authorization patterns using **Auth0** for a fictional company, "Agency Inc."

The application serves as a robust template for building multi-tenant, secure, and feature-rich enterprise applications with comprehensive session management, step-up MFA, access request workflows, and modern development practices.

## 🚀 Architecture & Tech Stack

### Frontend
- **Next.js 14** with App Router (React 18+)
- **TypeScript** for type safety
- **Tailwind CSS** + **shadcn/ui** for modern UI components
- **Radix UI** primitives for accessibility
- **next-themes** for dark mode support

### Backend & APIs
- **Next.js API Routes** (both App Router and Pages Router)
- **Zod** for runtime input validation and type safety
- **Auth0 Management API** integration
- **Firebase Admin SDK** for Firestore operations
- **Slack Webhooks** for notifications

### Authentication & Authorization
- **Auth0** with Organizations for multi-tenancy
- **Role-Based Access Control (RBAC)** with custom permissions
- **Session Management** with back-channel logout support
- **Multi-Factor Authentication (MFA)** for step-up authentication
- **Access Request Workflows** with admin approval

## ✨ Key Features

### 🔐 Authentication & Identity
- **Multi-Tenant Logins**: Organization-specific authentication flows
- **Custom Login Experience**: In-app organization selection
- **Invitation-Based Sign-up**: Secure admin-managed onboarding with role assignment
- **Single Session Enforcement**: Automatic termination of concurrent sessions
- **Real-Time Session Validation**: Continuous session monitoring every 5 seconds
- **Back-Channel Logout**: Reliable session revocation with proper parsing
- **Session Monitoring**: Active session tracking and management

### 🛡️ Authorization & Security
- **Role-Based Access Control**: Multi-role system (Admin, Editor, Viewer, Data Analyst)
- **Permission-Based API Security**: Granular permission checks
- **Step-Up MFA**: Sensitive operations require fresh MFA authentication
- **Input Validation**: Comprehensive Zod schema validation
- **Server-Side Authorization**: All security enforced server-side
- **Session Revocation**: Persistent session blacklisting
- **Error Boundaries**: Graceful error handling and recovery

### 👥 Admin Dashboard
- **Protected Admin Routes**: Role-based route protection
- **Member Management**: Complete user lifecycle management
- **Role Assignment**: Dynamic role and permission management during invitation
- **Session Administration**: View and terminate user sessions
- **Organization Management**: Multi-tenant administration

### 📊 Advanced Features
- **Analytics Dashboard**: Role-gated reporting interface
- **In-App Access Requests**: Silent re-authentication workflow for role elevation
- **Real-Time Notifications**: Slack integration for admin alerts
- **Step-Up Authentication**: MFA-protected sensitive operations (report deletion)
- **Loading States**: Skeleton loaders and optimistic UI
- **Error Handling**: Comprehensive error boundaries

### 🎨 UI/UX & Development
- **Modern Design System**: Consistent component library
- **Dark Mode**: System-aware theme switching
- **Responsive Design**: Mobile-first approach
- **Loading States**: Skeleton components and loading indicators
- **Type Safety**: End-to-end TypeScript coverage
- **Developer Tools**: Built-in token inspector and debugging utilities

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # Modern API routes (route.ts)
│   │   ├── auth/          # Authentication endpoints
│   │   │   ├── [...auth0]/route.ts    # Auth0 handler with step-up MFA
│   │   │   ├── backchannel-logout/route.ts # Back-channel logout
│   │   │   └── session/   # Session management
│   │   ├── organization/  # Member & role management
│   │   │   └── members/   # CRUD operations with role assignment
│   │   ├── request-access/ # Access request workflow
│   │   └── reports/       # Report management with step-up MFA
│   ├── admin/             # Admin dashboard pages
│   ├── analytics/         # Analytics dashboard with access requests
│   └── reports/           # Reporting interface with step-up MFA
├── components/            # Reusable React components
│   ├── ui/               # shadcn/ui components
│   ├── admin/            # Admin-specific components
│   │   ├── member-manager.tsx   # Role selection during invites
│   │   └── session-management.tsx # Session admin interface
│   ├── report-dashboard.tsx     # Step-up MFA implementation
│   ├── session-validator.tsx    # Real-time session validation
│   ├── session-enforcer.tsx     # Single session enforcement
│   └── loading.tsx       # Loading state components
├── lib/                  # Utilities and configurations
│   ├── validations.ts    # Zod validation schemas
│   ├── session-revocation.ts # File-based session revocation
│   ├── auth0-session-manager.ts # Auth0 session enforcement
│   ├── api-client.ts     # Type-safe API client
│   └── auth0-*.ts        # Auth0 integrations
└── pages/                # Legacy Pages Router (Auth0 handlers)
    └── api/              # Legacy API routes (being phased out)
```

## 🔧 Auth0 Actions Required

**CRITICAL**: The following Auth0 Actions must be deployed for the demo to work properly:

### 1. Access Request Action

**Trigger**: `post-login`
**Name**: `Access Request Handler`

```javascript
const { IncomingWebhook } = require("@slack/webhook");

/**
* @param {Event} event - Details about the user and the context in which they are logging in.
* @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login flow.
*/
exports.onExecutePostLogin = async (event, api) => {
  const webhook = new IncomingWebhook(event.secrets.SLACK_WEBHOOK_URL);
  const namespace = 'https://agency-inc-demo.com';

  // Add roles to the ID Token and permissions to the Access Token
  if (event.authorization) {
    if (event.authorization.roles) {
      api.idToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
    }
    if (event.authorization.permissions) {
      api.accessToken.setCustomClaim(`${namespace}/permissions`, event.authorization.permissions);
    }
  }

  // Use a try/catch block so a failed Slack message doesn't break the login
  try {
    // Check if there is a pending access request from our application
    if (event.user.app_metadata && event.user.app_metadata.pending_access_request) {
      const accessRequest = event.user.app_metadata.pending_access_request;
      
      // Send the detailed Slack message for the access request
      const accessRequestText = `🔒 *Access Request - Analytics*
*User:* ${event.user.email}
*Requested Role:* ${accessRequest.role}
*Organization:* ${event.organization?.name || 'N/A'}`;

      await webhook.send({ 
        text: accessRequestText,
        username: "Auth0 Access Requests",
        icon_emoji: ":lock:"
      });

      // Clear the pending request from the user's profile
      api.user.setAppMetadata('pending_access_request', undefined);
    }
  } catch (error) {
    // Log the error but do not block the login
    console.log("Slack notification failed:", error.message);
  }
};
```

**Required Secrets**:
- `SLACK_WEBHOOK_URL`: Your Slack webhook URL for notifications

### 2. RBAC and Session Management Action

**Trigger**: `post-login`
**Name**: `RBAC and Single Session Enforcement`

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://agency-inc-demo.com';
  
  // Add roles to token
  if (event.authorization) {
    api.idToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
  }
  
  // Add organization info
  if (event.organization) {
    api.idToken.setCustomClaim('https://agency-inc-demo.com/org_logo', event.organization.metadata.url);
    api.idToken.setCustomClaim(`${namespace}/org_id`, event.organization.id);
    api.idToken.setCustomClaim(`${namespace}/org_name`, event.organization.name);
  }
  
  // Add session ID to token
  if (event.session) {
    api.idToken.setCustomClaim(`${namespace}/session_id`, event.session.id);
  }
  
  // SESSION MANAGEMENT
  const userId = event.user.user_id;
  const currentSessionId = event.session.id;
  
  try {
    // Get management API token
    const tokenResponse = await fetch(`https://${event.secrets.AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: event.secrets.AUTH0_MGMT_CLIENT_ID,
        client_secret: event.secrets.AUTH0_MGMT_CLIENT_SECRET,
        audience: `https://${event.secrets.AUTH0_DOMAIN}/api/v2/`,
        grant_type: 'client_credentials'
      })
    });
    
    if (!tokenResponse.ok) {
      console.log("Token error");
      return;
    }
    
    const tokenData = await tokenResponse.json();
    
    // Get user's sessions
    const sessionsResponse = await fetch(`https://${event.secrets.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(userId)}/sessions`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!sessionsResponse.ok) {
      console.log("Sessions fetch error");
      return;
    }
    
    const sessionsData = await sessionsResponse.json();
    const sessions = sessionsData.sessions || [];
    
    console.log(`Sessions: ${sessions.length}, Current: ${currentSessionId}`);
    
    // If more than 1 session, delete others
    if (sessions.length > 1) {
      const otherSessions = sessions.filter(s => s.id !== currentSessionId);
      console.log(`Deleting ${otherSessions.length} sessions`);
      
      for (const session of otherSessions) {
        await fetch(`https://${event.secrets.AUTH0_DOMAIN}/api/v2/sessions/${session.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      console.log(`Deleted sessions for ${userId}`);
    }
    
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
};
```

**Required Secrets**:
- `AUTH0_DOMAIN`: Your Auth0 domain (e.g., `your-tenant.auth0.com`)
- `AUTH0_MGMT_CLIENT_ID`: Your M2M app client ID
- `AUTH0_MGMT_CLIENT_SECRET`: Your M2M app client secret

### 3. Step-up MFA Action

**Trigger**: `post-login`
**Name**: `Step-up MFA Enforcement`

```javascript
/**
* @param {Event} event - Details about the user and the context in which they are logging in.
* @param {MfaApi} api - Interface whose methods can be used to change the behavior of the login flow.
*/
exports.onExecutePostLogin = async (event, api) => {
  // Check if the application is requesting MFA via the `acr_values` parameter.
  // This is the parameter our "Delete" button flow sends.
  if (event.client.client_id !== event.secrets.TARGET_CLIENT_ID) {
    console.log(`Skipping action for client ${event.client.client_id}`);
    return;
  }
  const isMfaRequested = event.transaction.acr_values.includes(
    'http://schemas.openid.net/pape/policies/2007/06/multi-factor'
  );

  if (isMfaRequested) {
    // If MFA is requested, enforce it for this login.
    api.multifactor.enable('any');
  }
};
```

**Required Secrets**:
- `TARGET_CLIENT_ID`: Your Next.js application's client ID

## 🚦 Getting Started

### Prerequisites

- **Node.js** (v18 or later)
- **Git**
- **Auth0 Account** (free tier available)
- **Firebase Account** (free tier available) 
- **ngrok Account** (free tier available)
- **Slack Workspace** (for notifications)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/violetarcher/agency-inc-demo.git
   cd agency-inc-demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env.local with your Auth0, Firebase, and other credentials
   # See Environment Variables section below for complete configuration
   ```

4. **Configure Auth0** (see detailed setup below)

5. **Deploy Auth0 Actions** (CRITICAL - see Actions section above)

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Set up ngrok tunnel** (for Auth0 callbacks)
   ```bash
   ngrok http 4020 --domain your-static-domain.ngrok-free.app
   ```

## ⚙️ Detailed Setup Instructions

### Auth0 Configuration

#### 1. Create Auth0 API
- Go to **Applications > APIs**
- Create API: `Agency Inc API` 
- Identifier: `https://b2b-saas-api.example.com`
- Add permissions: `read:reports`, `create:reports`, `edit:reports`, `delete:reports`, `read:analytics`
- Enable **RBAC** and **Add Permissions in Access Token**

#### 2. Create Next.js Application
- Go to **Applications > Applications**
- Create **Regular Web Application**: `Agency Inc Dashboard`
- Configure callback URLs:
  - Allowed Callback URLs: `https://your-domain.ngrok-free.app/api/auth/callback`
  - Allowed Logout URLs: `https://your-domain.ngrok-free.app`
  - Allowed Web Origins: `https://your-domain.ngrok-free.app`
- Under **Advanced Settings > Grant Types**, ensure `Authorization Code`, `Refresh Token`, and `Client Credentials` are enabled

#### 3. Set Up Roles
- Go to **User Management > Roles**
- Create roles with API permissions:
  - `Admin`: All permissions (`read:reports`, `create:reports`, `edit:reports`, `delete:reports`, `read:analytics`)
  - `Editor`: `read:reports`, `create:reports`, `edit:reports`
  - `Viewer`: `read:reports`
  - `Data Analyst`: `read:analytics`

#### 4. Create M2M Application
- Create **Machine to Machine** app: `Agency Inc Backend Manager`
- Authorize for **Auth0 Management API**
- Grant scopes: 
  - `read:users`
  - `update:users` 
  - `read:organization_members`
  - `create:organization_invitations`
  - `read:organization_member_roles`
  - `create:organization_member_roles`
  - `delete:organization_member_roles`
  - `delete:organization_members`
  - `read:roles`
  - `read:sessions`
  - `delete:sessions`

#### 5. Configure Organization
- Go to **Organizations**
- Create: `Agency Inc`
- Enable applications and connections
- Configure auto-membership settings
- Add enabled connections (Database, Social, etc.)

#### 6. Deploy Auth0 Actions (CRITICAL)
- Go to **Actions > Flows**
- Select **Login** flow
- Create and deploy all three Post-Login Actions (see Auth0 Actions section above)
- Add required secrets to each Action (refer to the "Required Secrets" section under each action)
- Test the flow

#### 7. Configure Back-Channel Logout
- In your Auth0 Application settings
- Set **Back-Channel Logout URI**: `https://your-domain.ngrok-free.app/api/auth/backchannel-logout`

### Environment Variables

Create `.env.local` with:

```env
# Auth0 Configuration
AUTH0_SECRET='use [openssl rand -hex 32] to generate a 32 bytes value'
AUTH0_BASE_URL='https://your-domain.ngrok-free.app'
AUTH0_ISSUER_BASE_URL='https://your-auth0-domain.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'
AUTH0_AUDIENCE='https://b2b-saas-api.example.com'

# Auth0 Management API (M2M Application)
AUTH0_MGMT_DOMAIN='your-auth0-domain.auth0.com'
AUTH0_MGMT_CLIENT_ID='your-m2m-client-id'
AUTH0_MGMT_CLIENT_SECRET='your-m2m-client-secret'

# Firebase (Base64 encoded service account JSON)
FIREBASE_SERVICE_ACCOUNT_BASE64='your-base64-encoded-service-account'
```

### Ngrok Setup (Required for Organization Invites)

**Why Ngrok is Required:**
- Auth0 Organization invitations require HTTPS URLs for callback handling
- Organization invite emails contain links that must redirect to your application
- Ngrok provides a secure HTTPS tunnel to your local development server

**Setup Steps:**
1. **Install Ngrok**
   ```bash
   # Install via npm
   npm install -g ngrok
   
   # Or download from https://ngrok.com/download
   ```

2. **Create Ngrok Account**
   - Sign up at [ngrok.com](https://ngrok.com) (free tier available)
   - Get your authtoken from the dashboard

3. **Configure Ngrok**
   ```bash
   # Set your authtoken
   ngrok config add-authtoken YOUR_AUTHTOKEN
   
   # Start tunnel on port 4020 (matches npm run dev port)
   ngrok http 4020 --domain your-static-domain.ngrok-free.app
   ```

4. **Use Static Domain (Recommended)**
   - Ngrok free tier provides static domains to avoid reconfiguring Auth0
   - Use the same domain in all Auth0 callback URLs
   - Example: `https://your-domain.ngrok-free.app`

**Alternative: Web Hosting**
- Instead of Ngrok, you can deploy to any web hosting service (Vercel, Netlify, etc.)
- This provides a permanent HTTPS URL for production use
- Update Auth0 callback URLs to your hosted domain

### Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create new project: `Agency Inc Demo`

2. **Generate Service Account**
   - Go to **Project Settings > Service accounts**
   - Generate new private key
   - Base64 encode the JSON file:
     ```bash
     base64 -i path/to/serviceAccountKey.json
     ```
   - Add to `FIREBASE_SERVICE_ACCOUNT_BASE64` in `.env.local`

3. **Initialize Firestore**
   - Go to **Firestore Database**
   - Create database in test mode
   - Create collections: `reports`, `analytics`

### Slack Setup (Optional)

1. **Create Slack App**
   - Go to [Slack API](https://api.slack.com/apps)
   - Create new app from scratch
   - Select your workspace

2. **Add Incoming Webhook**
   - Go to **Incoming Webhooks**
   - Activate incoming webhooks
   - Add new webhook to workspace
   - Copy webhook URL to `SLACK_WEBHOOK_LOGIN_URL`

## 📜 Available Scripts

```bash
npm run dev     # Start development server (port 4020)
npm run build   # Build for production
npm run start   # Start production server
npm run lint    # Run ESLint
```

## 🔒 Security Features

- **Server-side session management** with Auth0
- **Role-based access control** at API and UI levels
- **Step-up MFA** for sensitive operations
- **Input validation** with Zod schemas
- **SQL injection prevention** through parameterized queries
- **XSS protection** through React's built-in escaping
- **CSRF protection** through SameSite cookies
- **Session revocation** with persistent storage
- **Federated logout** coordination

## 📋 API Endpoints

### Authentication
- `GET /api/auth/[auth0]` - Auth0 authentication handler with step-up MFA
- `POST /api/auth/backchannel-logout` - Back-channel logout webhook
- `GET /api/auth/session/validate` - Real-time session validation
- `GET /api/auth/session/list` - Active sessions for admin
- `POST /api/auth/session/enforce-my-limit` - Single session enforcement
- `POST /api/auth/session/terminate` - Manual session termination

### Organization Management
- `GET|POST /api/organization/members` - Member CRUD with role assignment
- `POST /api/organization/members/[id]/roles` - Role management
- `DELETE /api/organization/members/[id]` - Member removal

### Reports & Analytics
- `GET|POST /api/reports` - Report management
- `DELETE /api/reports/[id]` - Report deletion (requires step-up MFA)
- `POST /api/request-access` - Role elevation requests

## 🎯 Demo Scenarios

### 1. Admin User Management
1. Login as Admin
2. Navigate to Admin Dashboard
3. Invite new users with role selection
4. Manage user roles and sessions

### 2. Access Request Workflow
1. Login as Viewer
2. Navigate to Analytics page
3. Click "Request Access"
4. Check Slack for admin notification
5. Admin approves via Auth0 dashboard
6. User gains access on next login

### 3. Step-Up MFA for Sensitive Operations
1. Login as Admin/Editor
2. Navigate to Reports
3. Try to delete a report
4. Complete step-up MFA challenge
5. Operation completes successfully

### 4. Session Management
1. Login from multiple browsers
2. Observe single session enforcement
3. Admin can view/terminate sessions
4. Real-time session validation

## 🎯 Core Concepts Demonstrated

1. **Multi-Tenant Architecture** - Organization-based user isolation
2. **Modern Next.js Patterns** - App Router, Server Components, API Routes
3. **Enterprise Authentication** - Auth0 Organizations, RBAC, MFA
4. **Session Management** - Active monitoring, revocation, back-channel logout
5. **Step-Up Authentication** - Context-aware security for sensitive operations
6. **Access Request Workflows** - Self-service role elevation with admin approval
7. **Type Safety** - End-to-end TypeScript with Zod validation
8. **Error Handling** - Graceful degradation and user feedback
9. **Security Best Practices** - Server-side validation, authorization

## 🚨 Troubleshooting

### Common Issues

1. **Access Request not working**
   - Ensure Auth0 Post-Login Action is deployed
   - Check Slack webhook URL in Action secrets
   - Verify `pending_access_request` metadata is being set

2. **Step-up MFA failing**
   - Check `acr_values` in auth route
   - Ensure MFA is enabled in Auth0 tenant
   - Verify `stepup=true` parameter in login URL

3. **Session enforcement issues**
   - Check session revocation file permissions
   - Verify back-channel logout webhook URL
   - Ensure M2M app has session scopes

4. **Role assignment during invite**
   - Verify roles exist in Auth0 tenant
   - Check M2M app has organization scopes
   - Ensure API permissions are assigned to roles

### Debugging

Enable detailed logging by adding to `.env.local`:
```env
DEBUG=1
AUTH0_DEBUG=1
```

## 📚 Additional Resources

- [Auth0 Organizations Documentation](https://auth0.com/docs/manage-users/organizations)
- [Auth0 Actions Documentation](https://auth0.com/docs/customize/actions)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Zod Validation Documentation](https://zod.dev/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper TypeScript types
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Check the [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for architectural decisions
- Review Auth0 documentation for authentication patterns
- Open an issue for bugs or feature requests

---

Built with Next.js, Auth0, and modern web technologies.