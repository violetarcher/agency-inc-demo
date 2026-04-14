# SecureHealth Portal - Healthcare Platform Rebrand

## Overview
The application has been rebranded to **SecureHealth Portal**, a healthcare management platform with Oscar Health branding for insurance provider demos.

## What Changed

### 1. Application Name & Branding
- **App Name**: SecurePay Portal (generic payment platform)
- **Theme**: Light blue/teal color scheme (financial/trust)
- **Focus**: Payment processing, balances, due dates, transactions

### 2. Color Scheme Updates
**File**: `src/app/globals.css`
- Updated to light blue/teal theme (HSL 195 75% 45%)
- Professional financial services look
- Maintains accessibility and readability

### 3. Dashboard Updates
**File**: `src/app/page.tsx`

**KPI Cards** (already payment-focused):
- Current Balance: $2,847.50
- Next Payment Due: Apr 15 (5 days)
- Payments This Month: 3 (+1)
- Payment Methods: 2 Active

**Recent Transactions** (renamed from "Recent Reports"):
- Transaction ID: PAY-1047, PAY-1046, etc.
- Payee names: Jennifer Martinez, Michael Johnson, etc.
- Amounts: $285.50, $425.00, $315.75, etc.
- Status: Completed, Pending, Failed

**Account Settings** (payment-oriented):
- Auto-Pay Enabled: "Automatically process scheduled payments"
- Email Notifications: "Receive payment alerts via email"
- SMS Notifications: "Receive payment reminders via text"
- Payment Alerts: "Receive due date and balance reminders"

**Dashboard Header**:
- Title: "Payment Dashboard"
- Subtitle: "Welcome back, {name}! Manage your payments and view your account activity."

### 4. Navigation Updates
**File**: `src/components/sidebar-nav.tsx`
- Changed "Reports" → "Transactions"
- Sidebar title shows: "SecurePay | {Organization Name}"

### 5. Login Screen Updates
**File**: `src/app/page.tsx`
- Title: "SecurePay Portal"
- Description: "Please log in to access your dashboard and manage your payments."
- Content: "...manage payment methods, and track transactions."

## What's Generic (No Child Support References)
✅ All payment data is generic financial transactions
✅ Payee names are common names (Jennifer Martinez, Michael Johnson, etc.)
✅ Transaction IDs use "PAY-" prefix (PAY-1047, PAY-1046, etc.)
✅ Status labels: Completed, Pending, Failed
✅ Settings focus on payment reminders and notifications
✅ No mention of specific payment types or purposes

## Demo Talking Points

### For Systems and Methods Inc.
"This is **SecurePay Portal**, a modern payment management platform that demonstrates enterprise-grade identity and authorization using Auth0."

**Key Features to Highlight**:
1. **Multi-Factor Authentication** - Secure payment processing with step-up MFA
2. **Multi-Tenant Architecture** - Each organization has isolated payment data
3. **Fine-Grained Authorization** - Role-based access control for payment operations
4. **Real-Time Session Management** - Automatic session validation every 5 seconds
5. **Payment Dashboard** - Balance tracking, due dates, transaction history
6. **Kong API Gateway Integration** - Secure API layer with JWT validation

### Dashboard Features
- **Balance Overview**: Current balance and payment history
- **Due Date Tracking**: Next payment due date with countdown
- **Transaction History**: Recent payment activity with status
- **Payment Settings**: Auto-pay, email/SMS notifications, payment alerts

### Navigation
- **Home**: Payment dashboard with KPIs
- **Transactions**: Payment history and transaction management
- **Inspector**: Token and session inspector (Auth0 debugging)
- **Analytics**: Payment analytics (with access request workflow)
- **Documents**: Secure document management (FGA-protected)
- **API Gateway**: Kong Gateway integration demo
- **Profile Management**: MFA enrollment and user preferences
- **Admin Dashboard**: Organization and member management

## Technical Architecture (For Technical Audience)
- **Auth0 Organizations**: Multi-tenant identity management
- **Auth0 FGA**: Fine-grained authorization for documents
- **Next.js 14 App Router**: Modern React framework
- **Kong Gateway**: API gateway with OIDC validation
- **Firebase Firestore**: Document storage with org isolation
- **Session Management**: Real-time validation with revocation tracking
- **Step-Up MFA**: Additional authentication for sensitive operations

## Development
```bash
# Start dev server
npm run dev

# Access at
http://localhost:4020

# For full functionality (invitations)
ngrok http 4020 --domain your-static-domain.ngrok-free.app
```

## Files Modified
1. `src/app/globals.css` - Color theme (light blue/teal)
2. `src/app/page.tsx` - Dashboard content and KPIs
3. `src/app/layout.tsx` - App title metadata
4. `src/components/sidebar.tsx` - Branding display
5. `src/components/sidebar-nav.tsx` - Navigation labels

## Notes
- Organization logo/name comes from Auth0 metadata (dynamic)
- All backend logic remains unchanged (Auth0, FGA, Firebase)
- README.md not updated (developer documentation)
- Environment variables unchanged
- Auth0 Actions unchanged
