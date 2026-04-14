# Oscar Health Rebranding + CIBA Claims Flow - Setup Guide

## 🎨 What Was Changed

### 1. Branding Updates (Oscar Health Theme)
- ✅ Changed "Transactions" back to "Reports" in sidebar and page header
- ✅ Applied Oscar Health color scheme:
  - **Primary Color**: Purple/Indigo (#6366f1) - Buttons and interactive elements
  - **Foreground**: Deep Navy Blue (#1a237e) - Text and headings
  - **Secondary**: Light Purple background accents
  - **Clean, healthcare-focused design** matching Oscar's aesthetic

**Files Modified:**
- `src/components/sidebar-nav.tsx` - Changed "Transactions" to "Reports"
- `src/app/reports/page.tsx` - Changed page heading
- `src/app/globals.css` - Updated color scheme to Oscar Health branding

### 2. New "Claims" Section Added
- ✅ Added "Claims" navigation item in sidebar
- ✅ Created Claims page with two tabs:
  - **Submit a Claim** - File upload and CIBA flow
  - **My Claims** - Claims history list

**New Files Created:**
- `src/app/claims/page.tsx` - Main claims page
- `src/components/claims/claim-submission-form.tsx` - Claim submission form with CIBA
- `src/components/claims/claims-list.tsx` - Claims history component

### 3. CIBA (Client-Initiated Backchannel Authentication) Flow
Implemented complete CIBA flow for sensitive financial transactions:
- ✅ CIBA initiation endpoint (`/api/ciba/initiate`)
- ✅ CIBA polling endpoint (`/api/ciba/poll`)
- ✅ Push notification integration with Auth0 Guardian
- ✅ Claim submission with CIBA approval (`/api/claims/submit`)
- ✅ Claims list endpoint (`/api/claims/list`)

**New API Endpoints:**
- `src/app/api/ciba/initiate/route.ts`
- `src/app/api/ciba/poll/route.ts`
- `src/app/api/claims/submit/route.ts`
- `src/app/api/claims/list/route.ts`

---

## 🚀 How the Claims Flow Works

### User Journey
1. **User navigates to Claims > Submit a Claim**
2. **Fills out claim form:**
   - Service date, provider name, amount
   - Uploads superbill (PDF with medical info)
   - Enters bank account details (routing + account number)
3. **Clicks "Submit Claim"**
4. **CIBA Flow Triggered:**
   - App calls `/api/ciba/initiate`
   - Auth0 sends push notification to user's Guardian app
   - User sees binding message: "Approve claim for $500"
   - App polls `/api/ciba/poll` every 3 seconds
5. **User approves on mobile device**
6. **Claim is submitted** to `/api/claims/submit`
7. **Success confirmation** displayed

### Why CIBA?
- **Sensitive Data**: Combining medical records (superbill) + banking info (account numbers)
- **High-Assurance**: Requires active user approval on trusted device
- **Compliance**: Demonstrates strong authentication for financial transactions
- **Perfect Demo Scenario**: Shows collision of healthcare data + financial data

---

## 🔧 Auth0 CIBA Configuration Required

### Prerequisites

1. **Auth0 Guardian Must Be Enabled**
   - Navigate to: Auth0 Dashboard → Security → Multi-factor Auth
   - Enable "Push Notifications via Auth0 Guardian"
   - Deploy to users

2. **CIBA Feature Flag (May Require Auth0 Support)**
   - CIBA is currently an **Enterprise feature**
   - Check if available in your tenant: Dashboard → Settings → Advanced
   - If not available, contact Auth0 support to enable

3. **Application Must Support CIBA Grant Type**
   - Navigate to: Applications → Your Application → Settings
   - Scroll to "Advanced Settings" → "Grant Types"
   - ✅ Ensure `urn:openid:params:grant-type:ciba` is enabled
   - If not visible, CIBA may not be enabled for your tenant

### Configuration Steps

#### Step 1: Enable CIBA in Application
```bash
# Via Management API (if using cURL)
curl -X PATCH "https://YOUR_DOMAIN.auth0.com/api/v2/clients/YOUR_CLIENT_ID" \
  -H "Authorization: Bearer YOUR_MGMT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "grant_types": [
      "authorization_code",
      "refresh_token",
      "urn:openid:params:grant-type:ciba"
    ]
  }'
```

Or via Dashboard:
1. Applications → Your App → Settings
2. Advanced Settings → Grant Types
3. Check `urn:openid:params:grant-type:ciba`
4. Save Changes

#### Step 2: Ensure Auth0 Guardian Is Deployed
1. Security → Multi-factor Auth → Push Notifications
2. Customize Guardian app (optional):
   - App Name: "Oscar Health"
   - Logo: Upload Oscar logo
3. Test enrollment:
   - Log in as test user
   - Navigate to Profile → Security tab
   - Enroll Guardian push notifications

#### Step 3: Test CIBA Endpoint Availability
```bash
# Test backchannel authorization endpoint
curl -X POST "https://login.authskye.org/bc-authorize" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "scope=openid profile email" \
  -d "login_hint=USER_ID" \
  -d "binding_message=Test CIBA request"
```

Expected response:
```json
{
  "auth_req_id": "abc123...",
  "expires_in": 300,
  "interval": 5
}
```

If you get `404` or `feature_not_enabled`, CIBA is not activated for your tenant.

---

## 🧪 Testing the Claims Flow

### Demo Scenario Script

**Setup:**
1. Ensure user has Guardian app installed and enrolled
2. Navigate to Claims section in the app

**Demo Script:**
```
[Navigate to Claims → Submit a Claim]

"Let me show you how we handle highly sensitive transactions combining
medical records and financial data."

[Click "Fill Demo Data" button - instantly populates form]

"I'll use our autofill feature to quickly populate a realistic scenario:
- Dr. Sarah Chen, MD - Psychiatrist (out-of-network)
- $285 consultation fee
- Diagnosis code F41.1 (Generalized Anxiety Disorder)
- Superbill PDF uploaded (contains PHI + provider NPI)
- Bank account information for direct deposit"

[Scroll through filled form to show data]

"Notice we're collecting BOTH medical information - the diagnosis code,
provider details - AND financial data - routing and account numbers.
This is exactly the scenario that requires the highest level of authentication."

[Click Submit]

Notice the form asks for both your medical superbill AND your bank account
information. This is the perfect storm of sensitive data.

[CIBA notification appears]

'Instead of just clicking Submit, we require you to approve this transaction
on your mobile device using Auth0 Guardian.'

[Show Guardian app on phone]

'You receive a push notification with the exact transaction details:
'Approve claim for $250'

[Approve on Guardian]

'Once approved, the transaction completes. This is CIBA - Client-Initiated
Backchannel Authentication - providing high-assurance authentication for
sensitive operations.'

[Claim submits successfully]

'The claim is now submitted and you can track it in the My Claims tab.'"
```

### Testing Without Guardian (Development Mode)

If Guardian isn't set up yet, you can still test the UI flow:

1. **Modify CIBA Initiate Endpoint** (temporary for testing):
```typescript
// In src/app/api/ciba/initiate/route.ts
// Add this at the top for testing:

const DEVELOPMENT_MODE = process.env.NODE_ENV === 'development';

if (DEVELOPMENT_MODE) {
  console.log('⚠️ DEVELOPMENT MODE: Skipping real CIBA, returning mock response');
  return NextResponse.json({
    auth_req_id: 'mock_' + Math.random().toString(36).substring(7),
    expires_in: 300,
    interval: 3,
  });
}
```

2. **Modify CIBA Poll Endpoint**:
```typescript
// In src/app/api/ciba/poll/route.ts
// Add this at the top:

const DEVELOPMENT_MODE = process.env.NODE_ENV === 'development';

if (DEVELOPMENT_MODE && auth_req_id.startsWith('mock_')) {
  // Auto-approve after 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));
  return NextResponse.json({
    status: 'approved',
    access_token: 'mock_token',
    id_token: 'mock_id_token',
  });
}
```

---

## 📊 Firestore Index Required

The claims list endpoint queries Firestore with multiple filters. You'll need to create an index:

1. Try to load Claims → My Claims
2. Check server logs for index creation URL
3. Click the URL or manually create index:
   - Collection: `claims`
   - Fields to index:
     - `userId` (Ascending)
     - `organizationId` (Ascending)
     - `submittedAt` (Descending)

---

## 🎯 Demo Talking Points

### For Insurance Provider Audience

**Problem Statement:**
"In healthcare, we're dealing with the most sensitive combination of data: medical records AND financial information. When a member submits an out-of-network claim, they're uploading their superbill - which contains diagnosis codes, provider NPIs, and personal health information - alongside their bank account details for reimbursement."

**Solution with CIBA:**
"Instead of relying on a password alone, we use CIBA - Client-Initiated Backchannel Authentication. When the user attempts this sensitive transaction, we send a push notification to their authenticated mobile device. They must actively approve the exact transaction - '$250 claim' - on their phone before it goes through."

**Benefits:**
- **Phishing-Resistant**: Can't be phished because approval happens on trusted device
- **Out-of-Band**: Authentication happens on separate channel (mobile) from transaction (web)
- **Context-Aware**: User sees exact transaction details ("Approve $250 claim")
- **High Assurance**: Perfect for PCI-DSS, HIPAA, SOC 2 compliance requirements

**Technical Differentiation:**
- **Not SMS**: SMS can be intercepted; push notifications are encrypted end-to-end
- **Not Email Links**: Email can be phished; Guardian push requires device possession
- **Not TOTP**: TOTP codes are generic; CIBA shows transaction-specific context

---

## 🔒 Security Considerations

### In Production, You MUST:
1. **Encrypt Bank Account Data**
   - Never store full account numbers in plain text
   - Use field-level encryption or external vault (e.g., Stripe, Plaid)

2. **Secure Superbill Storage**
   - Upload to encrypted cloud storage (Firebase Storage with encryption at rest)
   - Use signed URLs with short expiration for access
   - Implement access controls (only claims processors can view)

3. **Audit Logging**
   - Log all claim submissions with CIBA auth_req_id
   - Track who accessed superbills and when
   - Maintain immutable audit trail

4. **Rate Limiting**
   - Limit CIBA requests per user (e.g., 5 per hour)
   - Prevent CIBA spam/denial-of-service

### Current Demo Implementation:
⚠️ **This is a demo** - bank account numbers are NOT encrypted and superbills are NOT stored securely. Do not use in production without implementing proper security measures.

---

## 🐛 Troubleshooting

### CIBA Not Working

**Symptom:** 404 error on `/bc-authorize` endpoint
**Solution:** CIBA not enabled. Contact Auth0 support to enable CIBA for your tenant.

**Symptom:** 403 error or "grant_type not supported"
**Solution:** Add CIBA grant type to application settings (see Step 1 above).

**Symptom:** User never receives Guardian push
**Solution:**
- Check Guardian is enrolled: Profile → Security tab
- Verify Guardian app is configured in Auth0 Dashboard
- Check user's mobile device has Guardian app installed

### Claims Not Appearing

**Symptom:** Empty claims list
**Solution:** Firestore index missing. Check server logs for index creation URL.

**Symptom:** 500 error on claim submission
**Solution:** Check Firebase permissions and that Firestore is initialized.

---

## 🎬 Demo-Ready Features

### Autofill Demo Data Button
At the top of the Claims submission form, you'll see a prominent **"Fill Demo Data"** button with a purple gradient background.

**What it does:**
- Instantly populates ALL form fields with realistic data
- Creates a mock PDF superbill file
- Shows today's date as service date
- Fills in: Provider (Dr. Sarah Chen, MD), Amount ($285), Diagnosis (F41.1), Bank info

**Demo values:**
- **Provider:** Dr. Sarah Chen, MD (Psychiatrist)
- **NPI:** 1234567890
- **Diagnosis:** F41.1 (Generalized Anxiety Disorder)
- **Amount:** $285.00
- **Description:** "Psychiatric consultation and therapy session - Out-of-network provider"
- **Routing Number:** 121000248 (Wells Fargo - demo only)
- **Account Number:** 9876543210
- **Superbill:** Auto-generated demo PDF with patient name and details

**For your demo:** Just click the button, scroll through the form to show the data types, then submit. No manual typing needed!

---

## 📝 Summary

You now have:
- ✅ Oscar Health rebranding applied
- ✅ "Reports" label restored
- ✅ Full "Claims" section with sensitive data handling
- ✅ CIBA flow implementation for high-assurance auth
- ✅ **Autofill demo data button for instant form population**
- ✅ Demo-ready scenario for insurance provider pitch

**Next Steps:**
1. Enable CIBA in Auth0 tenant (may require support ticket)
2. Ensure Guardian is deployed and users are enrolled
3. Create Firestore index for claims
4. Practice demo script above
5. Customize branding further if needed (logo, colors, etc.)

**Questions?** Check Auth0 CIBA docs: https://auth0.com/docs/get-started/authentication-and-authorization-flow/client-initiated-backchannel-authentication-flow
