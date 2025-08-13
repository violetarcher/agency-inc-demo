# Agency Inc. - B2B RBAC Dashboard

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Auth0](https://img.shields.io/badge/Auth0-EB5424?style=for-the-badge&logo=auth0&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

This project is a demonstration of a modern B2B Software-as-a-Service (SaaS) application built with Next.js 13+ App Router. It showcases enterprise-grade identity and authorization patterns using **Auth0** for a fictional company, "Agency Inc."

The application serves as a robust template for building multi-tenant, secure, and feature-rich enterprise applications with comprehensive session management and modern development practices.

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

## ✨ Key Features

### 🔐 Authentication & Identity
- **Multi-Tenant Logins**: Organization-specific authentication flows
- **Custom Login Experience**: In-app organization selection
- **Invitation-Based Sign-up**: Secure admin-managed onboarding
- **Federated Session Management**: Coordinated logout across services
- **Back-Channel Logout**: Real-time session revocation
- **Session Monitoring**: Active session tracking and management

### 🛡️ Authorization & Security
- **Role-Based Access Control**: Multi-role system (Admin, Editor, Viewer, Data Analyst)
- **Permission-Based API Security**: Granular permission checks
- **Input Validation**: Comprehensive Zod schema validation
- **Server-Side Authorization**: All security enforced server-side
- **Session Revocation**: Persistent session blacklisting
- **Error Boundaries**: Graceful error handling and recovery

### 👥 Admin Dashboard
- **Protected Admin Routes**: Role-based route protection
- **Member Management**: Complete user lifecycle management
- **Role Assignment**: Dynamic role and permission management
- **Session Administration**: View and terminate user sessions
- **Organization Management**: Multi-tenant administration

### 📊 Advanced Features
- **Analytics Dashboard**: Role-gated reporting interface
- **In-App Access Requests**: Workflow for role elevation
- **Real-Time Notifications**: Slack integration for admin alerts
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
│   │   ├── organization/  # Member & role management
│   │   └── request-access/ # Access request workflow
│   ├── admin/             # Admin dashboard pages
│   ├── analytics/         # Analytics dashboard
│   └── reports/           # Reporting interface
├── components/            # Reusable React components
│   ├── ui/               # shadcn/ui components
│   ├── admin/            # Admin-specific components
│   └── loading.tsx       # Loading state components
├── lib/                  # Utilities and configurations
│   ├── validations.ts    # Zod validation schemas
│   ├── session-revocation.ts # Session management
│   ├── api-client.ts     # Type-safe API client
│   └── auth0-*.ts        # Auth0 integrations
└── pages/                # Legacy Pages Router (Auth0 handlers)
    └── api/              # Legacy API routes (being phased out)
```

## 🔧 Recent Improvements

### API Migration to App Router
- Migrated core API routes from Pages Router to App Router
- Implemented comprehensive Zod validation schemas
- Added proper TypeScript types throughout
- Improved error handling and response consistency

### Enhanced Session Management
- Implemented file-based persistent session storage
- Fixed back-channel logout functionality
- Added real-time session monitoring
- Created admin session management interface

### Developer Experience
- Added error boundaries for graceful error handling
- Implemented loading states and skeleton components
- Created comprehensive validation schemas
- Improved type safety across the application

### Security Enhancements
- Server-side input validation with Zod
- Persistent session revocation system
- Enhanced error handling without information leakage
- Comprehensive authorization checks

## 🚦 Getting Started

### Prerequisites

- **Node.js** (v18 or later)
- **Git**
- **Auth0 Account** (free tier available)
- **Firebase Account** (free tier available)
- **ngrok Account** (free tier available)

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
   cp .env.example .env.local
   # Edit .env.local with your Auth0, Firebase, and other credentials
   ```

4. **Configure Auth0** (see detailed setup below)

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Set up ngrok tunnel** (for Auth0 callbacks)
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
- Configure callback URLs with your ngrok domain

#### 3. Set Up Roles
- Go to **User Management > Roles**
- Create roles: `Admin`, `Editor`, `Viewer`, `Data Analyst`
- Assign appropriate API permissions to each role

#### 4. Create M2M Application
- Create **Machine to Machine** app: `Agency Inc Backend Manager`
- Authorize for **Auth0 Management API**
- Grant scopes: `read:organization_members`, `create:organization_invitations`, etc.

#### 5. Configure Organization
- Go to **Organizations**
- Create: `Agency Inc`
- Enable applications and connections
- Configure auto-membership settings

### Environment Variables

Create `.env.local` with:

```env
# Auth0 Configuration
AUTH0_SECRET='your-long-secure-secret'
AUTH0_BASE_URL='https://your-domain.ngrok-free.app'
AUTH0_ISSUER_BASE_URL='https://your-auth0-domain.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'
AUTH0_AUDIENCE='https://b2b-saas-api.example.com'

# Auth0 Management API
AUTH0_MGMT_DOMAIN='your-auth0-domain.auth0.com'
AUTH0_MGMT_CLIENT_ID='your-m2m-client-id'
AUTH0_MGMT_CLIENT_SECRET='your-m2m-client-secret'

# Firebase
FIREBASE_SERVICE_ACCOUNT_BASE64='your-base64-encoded-service-account'

# Slack (Optional)
SLACK_WEBHOOK_LOGIN_URL='your-slack-webhook-url'
```

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
- **Input validation** with Zod schemas
- **SQL injection prevention** through parameterized queries
- **XSS protection** through React's built-in escaping
- **CSRF protection** through SameSite cookies
- **Session revocation** with persistent storage
- **Federated logout** coordination

## 📋 API Endpoints

### Authentication
- `GET /api/auth/[auth0]` - Auth0 authentication handler
- `POST /api/auth/backchannel-logout` - Back-channel logout webhook
- `GET /api/auth/session/validate` - Session validation
- `GET /api/auth/session/list` - Active sessions list

### Organization Management
- `GET|POST /api/organization/members` - Member CRUD operations
- `POST /api/organization/members/[id]/roles` - Role assignment
- `DELETE /api/organization/members/[id]` - Member removal

### Access Management
- `POST /api/request-access` - Role elevation requests

## 🎯 Core Concepts Demonstrated

1. **Multi-Tenant Architecture** - Organization-based user isolation
2. **Modern Next.js Patterns** - App Router, Server Components, API Routes
3. **Enterprise Authentication** - Auth0 Organizations, RBAC, MFA
4. **Session Management** - Active monitoring, revocation, back-channel logout
5. **Type Safety** - End-to-end TypeScript with Zod validation
6. **Error Handling** - Graceful degradation and user feedback
7. **Security Best Practices** - Server-side validation, authorization

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

Built with ❤️ using Next.js, Auth0, and modern web technologies.