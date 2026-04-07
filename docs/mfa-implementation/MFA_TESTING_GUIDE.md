# MFA Management Testing Guide

Comprehensive testing guide for the Auth0 My Account API integration and MFA management features.

## Test Environment Setup

### Prerequisites
- Dev server running: `npm run dev`
- Ngrok tunnel active: `ngrok http 4020 --domain your-static-domain.ngrok-free.app`
- Auth0 My Account API activated and configured
- Test user account with no existing MFA enrollments

### Test User Preparation

Create a test user with:
- Verified email address
- No MFA factors enrolled initially
- Admin and standard user accounts for role testing

## Test Scenarios

### 1. Email Verification (Unchanged Functionality)

**Purpose:** Verify that email verification section remains unchanged and functional.

**Test Steps:**
1. Log in with a user who has unverified email
2. Navigate to Profile → Security tab
3. Locate "Email Verification" section
4. Click "Send Verification Email"
5. Check email inbox for verification link
6. Click verification link
7. Return to application and refresh
8. Verify "Email Verified" badge appears

**Expected Results:**
- ✅ Email verification section displays prominently
- ✅ Button state changes during loading
- ✅ Success toast appears after sending
- ✅ Verification email received
- ✅ Badge updates after verification

**Status:** ⬜ Pass ⬜ Fail

---

### 2. List Enrolled Methods (Empty State)

**Purpose:** Verify UI displays correctly when no MFA methods are enrolled.

**Test Steps:**
1. Log in with user who has no MFA enrollments
2. Navigate to Profile → Security tab
3. Observe "Multi-Factor Authentication" section

**Expected Results:**
- ✅ Empty state message displays: "No MFA methods enrolled yet"
- ✅ Shield icon visible in empty state
- ✅ "Available Authentication Methods" section visible
- ✅ 5 factor types displayed (SMS, TOTP, WebAuthn-Roaming, WebAuthn-Platform, Email)
- ✅ Each factor shows icon, name, and description

**Status:** ⬜ Pass ⬜ Fail

---

### 3. List Available Factors

**Purpose:** Verify available MFA factors are fetched and displayed correctly.

**Test Steps:**
1. Navigate to Profile → Security tab
2. Scroll to "Available Authentication Methods" section
3. Verify all factor types are displayed
4. Check browser console for API calls

**Expected Results:**
- ✅ API call to `/api/mfa/factors` succeeds (200)
- ✅ Console log: "✅ Loaded available factors: 5"
- ✅ All factor types displayed in grid layout
- ✅ Each factor card clickable with hover effect

**Console Output:**
```
✅ Loaded available factors: 5
```

**Status:** ⬜ Pass ⬜ Fail

---

### 4. Enroll SMS MFA Factor

**Purpose:** Verify SMS enrollment flow with step-up authentication.

**Test Steps:**
1. Click on "SMS" factor card
2. Dialog opens with phone number input
3. Enter valid phone number (e.g., +1 555 123 4567)
4. (Optional) Enter display name
5. Click "Enroll Method"
6. **Step-Up Redirect:** Application redirects to login with MFA
7. Complete MFA challenge
8. Return to Profile → Security tab
9. Verify SMS method appears in "Enrolled Methods"

**Expected Results:**
- ✅ Dialog opens with phone number field
- ✅ Validation prevents submission without phone number
- ✅ API call to `/api/mfa/methods` initiated
- ✅ Step-up response received (403 with `requiresStepUp: true`)
- ✅ Toast notification: "Additional Verification Required"
- ✅ Redirect to `/api/auth/login?stepup=true&returnTo=/profile?tab=security`
- ✅ MFA challenge completed successfully
- ✅ User returned to security tab
- ✅ New SMS method visible in "Enrolled Methods"
- ✅ Method shows "Active" badge
- ✅ Phone number displayed in method details

**Console Output:**
```
✨ Enrolling MFA factor: sms for user: auth0|...
🔐 MFA Check: { hasMFA: false, hasACR: false, result: false }
→ Step-up required, redirecting...
[After redirect and return]
✅ Created authentication method: sms sms|abc123...
✅ Loaded enrolled methods: 1
```

**Status:** ⬜ Pass ⬜ Fail

---

### 5. Enroll TOTP Authenticator App

**Purpose:** Verify TOTP enrollment flow.

**Test Steps:**
1. Click on "Authenticator App" (TOTP) factor card
2. Dialog opens
3. (Optional) Enter display name
4. Click "Enroll Method"
5. Complete step-up authentication if prompted
6. Return to security tab
7. Verify TOTP method appears

**Expected Results:**
- ✅ Dialog opens
- ✅ Step-up authentication triggered (if session doesn't have MFA)
- ✅ TOTP method enrolled successfully
- ✅ Method appears with "Active" badge
- ✅ Toast: "MFA Factor Enrolled"

**Status:** ⬜ Pass ⬜ Fail

---

### 6. Enroll Email MFA Factor

**Purpose:** Verify email factor enrollment.

**Test Steps:**
1. Click on "Email" factor card
2. Dialog opens with email input
3. Enter valid email address
4. Click "Enroll Method"
5. Complete step-up if prompted
6. Verify email method enrolled

**Expected Results:**
- ✅ Email input field displayed
- ✅ Validation requires valid email format
- ✅ Enrollment successful
- ✅ Email address displayed in method details

**Status:** ⬜ Pass ⬜ Fail

---

### 7. Enroll WebAuthn Security Key

**Purpose:** Verify WebAuthn (roaming) enrollment.

**Test Steps:**
1. Click on "Security Key" (WebAuthn-Roaming) factor card
2. Dialog opens
3. Click "Enroll Method"
4. Browser prompts for security key interaction
5. Complete step-up if needed
6. Verify method enrolled

**Expected Results:**
- ✅ WebAuthn dialog appears
- ✅ Browser security key prompt displayed
- ✅ Enrollment successful
- ✅ Method shows in enrolled list

**Status:** ⬜ Pass ⬜ Fail

---

### 8. Enroll WebAuthn Platform Authenticator

**Purpose:** Verify WebAuthn (platform) enrollment.

**Test Steps:**
1. Click on "Biometric" (WebAuthn-Platform) factor card
2. Dialog opens
3. Click "Enroll Method"
4. Browser prompts for Face ID/Touch ID/Windows Hello
5. Complete biometric authentication
6. Verify method enrolled

**Expected Results:**
- ✅ Platform authenticator prompt displays
- ✅ Biometric authentication completes
- ✅ Method enrolled successfully
- ✅ "Active" badge displayed

**Status:** ⬜ Pass ⬜ Fail

---

### 9. View Enrolled Methods (Multiple Factors)

**Purpose:** Verify UI displays multiple enrolled methods correctly.

**Prerequisites:** At least 2 MFA methods enrolled

**Test Steps:**
1. Navigate to Profile → Security tab
2. Scroll to "Enrolled Methods" section
3. Verify all enrolled methods are listed

**Expected Results:**
- ✅ All enrolled methods visible in list
- ✅ Each method shows:
  - ✅ Correct icon for factor type
  - ✅ Method name (custom or default)
  - ✅ Enrollment date formatted correctly
  - ✅ Phone number or email (if applicable)
  - ✅ "Active" badge
  - ✅ Remove button (trash icon)
- ✅ Methods sorted by enrollment date

**API Call:**
```
GET /api/mfa/methods → 200 OK
{
  success: true,
  methods: [...],
  count: 2
}
```

**Status:** ⬜ Pass ⬜ Fail

---

### 10. Remove Specific MFA Method

**Purpose:** Verify individual method removal with step-up authentication.

**Prerequisites:** At least 1 MFA method enrolled

**Test Steps:**
1. In "Enrolled Methods", click trash icon on a method
2. Confirmation dialog appears
3. Verify method details shown in dialog
4. Click "Remove Method"
5. Complete step-up authentication
6. Return to security tab
7. Verify method removed from list

**Expected Results:**
- ✅ Confirmation dialog displays
- ✅ Method details visible in dialog
- ✅ "Cancel" button closes dialog without action
- ✅ "Remove Method" button triggers API call
- ✅ Step-up authentication required
- ✅ Toast: "MFA Method Removed"
- ✅ Method disappears from "Enrolled Methods"
- ✅ Count updates correctly

**Console Output:**
```
🗑️ Deleting MFA method: sms|abc123... for user: auth0|...
🔐 MFA Check: { hasMFA: true, hasACR: true, result: true }
✅ Deleted authentication method: sms|abc123...
```

**Status:** ⬜ Pass ⬜ Fail

---

### 11. Reset All MFA (Remove All Methods)

**Purpose:** Verify complete MFA reset with confirmation.

**Prerequisites:** At least 1 MFA method enrolled

**Test Steps:**
1. Click "Reset All MFA" button in header
2. Browser confirmation dialog appears
3. Click "OK" to confirm
4. Complete step-up authentication
5. Return to security tab
6. Verify all methods removed

**Expected Results:**
- ✅ Browser confirm() dialog displays warning message
- ✅ "Cancel" closes dialog without action
- ✅ "OK" triggers API call
- ✅ Step-up authentication required
- ✅ API call: `DELETE /api/mfa/methods` → 200
- ✅ Toast: "MFA Reset Complete"
- ✅ "Enrolled Methods" section disappears
- ✅ Empty state message returns
- ✅ Console log: "🗑️ Resetting all MFA factors"

**Status:** ⬜ Pass ⬜ Fail

---

### 12. Step-Up Authentication Already Satisfied

**Purpose:** Verify enrollment works without redirect if MFA recently completed.

**Test Steps:**
1. Complete MFA login
2. Immediately navigate to Profile → Security
3. Attempt to enroll a new MFA factor
4. Observe behavior

**Expected Results:**
- ✅ If MFA completed within session, no step-up redirect
- ✅ Enrollment proceeds directly
- ✅ Console log: `🔐 MFA Check: { hasMFA: true, hasACR: true, result: true }`
- ✅ API call succeeds immediately

**Status:** ⬜ Pass ⬜ Fail

---

### 13. Error Handling: Network Error

**Purpose:** Verify graceful error handling for network issues.

**Test Steps:**
1. Disconnect internet connection (or use browser dev tools to block requests)
2. Attempt to enroll MFA factor
3. Observe error handling

**Expected Results:**
- ✅ Toast notification: "Network Error"
- ✅ Description: "Failed to connect to server. Please try again."
- ✅ Loading state clears
- ✅ Dialog remains open for retry

**Status:** ⬜ Pass ⬜ Fail

---

### 14. Error Handling: Validation Error

**Purpose:** Verify validation errors are displayed correctly.

**Test Steps:**
1. Open SMS enrollment dialog
2. Click "Enroll Method" without entering phone number
3. Observe validation

**Expected Results:**
- ✅ Form validation prevents submission
- ✅ Toast: "Phone number required"
- ✅ Description explains requirement
- ✅ No API call made

**Status:** ⬜ Pass ⬜ Fail

---

### 15. Error Handling: Rate Limiting (429)

**Purpose:** Verify rate limit errors are handled.

**Note:** This test requires artificially triggering rate limits or using a rate-limited test account.

**Test Steps:**
1. Make rapid API calls to My Account API (>25 req/sec)
2. Observe error handling

**Expected Results:**
- ✅ API returns 429 status
- ✅ Toast: Error message about rate limiting
- ✅ User advised to try again later
- ✅ Loading state clears

**Status:** ⬜ Pass ⬜ Fail ⬜ Skip (unable to test)

---

### 16. Error Handling: Unauthorized (401)

**Purpose:** Verify authentication errors are handled.

**Test Steps:**
1. Manually invalidate session (clear cookies or tamper with token)
2. Attempt MFA operation
3. Observe error handling

**Expected Results:**
- ✅ API returns 401 status
- ✅ User redirected to login
- ✅ Or: Error toast with authentication failure message

**Status:** ⬜ Pass ⬜ Fail

---

### 17. Loading States

**Purpose:** Verify all loading states display correctly.

**Test Steps:**
1. Observe loading indicators during various operations:
   - Fetching enrolled methods
   - Fetching available factors
   - Enrolling factor
   - Removing factor
   - Resetting MFA
   - Sending email verification

**Expected Results:**
- ✅ Buttons show loading spinner when active
- ✅ Button text changes (e.g., "Enroll Method" → "Enrolling...")
- ✅ Buttons disabled during loading
- ✅ No UI flicker or layout shift

**Status:** ⬜ Pass ⬜ Fail

---

### 18. Responsive Design

**Purpose:** Verify UI works on different screen sizes.

**Test Steps:**
1. Test on desktop viewport (1920x1080)
2. Test on tablet viewport (768x1024)
3. Test on mobile viewport (375x667)
4. Verify factor grid layout adapts

**Expected Results:**
- ✅ Desktop: 2-column grid for factors
- ✅ Tablet: Responsive layout, readable
- ✅ Mobile: Single column, all content accessible
- ✅ Dialogs properly sized for each viewport
- ✅ No horizontal scrolling

**Status:** ⬜ Pass ⬜ Fail

---

### 19. Browser Compatibility

**Purpose:** Verify cross-browser compatibility.

**Test Steps:**
1. Test in Chrome/Edge (Chromium)
2. Test in Firefox
3. Test in Safari (if available)

**Expected Results:**
- ✅ All functionality works in Chrome/Edge
- ✅ All functionality works in Firefox
- ✅ All functionality works in Safari
- ✅ WebAuthn works where supported

**Status:** ⬜ Pass ⬜ Fail

---

### 20. Accessibility

**Purpose:** Verify accessibility compliance.

**Test Steps:**
1. Navigate UI using keyboard only (Tab, Enter, Escape)
2. Test with screen reader (if available)
3. Check color contrast
4. Verify focus indicators

**Expected Results:**
- ✅ All interactive elements keyboard accessible
- ✅ Dialogs can be closed with Escape key
- ✅ Focus trapped in dialog when open
- ✅ Focus indicators visible
- ✅ Screen reader announces content correctly
- ✅ ARIA labels present where needed

**Status:** ⬜ Pass ⬜ Fail

---

## Integration Tests

### API Endpoint Tests

Test each API endpoint independently:

#### GET /api/mfa/factors
```bash
curl -X GET http://localhost:4020/api/mfa/factors \
  -H "Cookie: appSession=..." \
  -H "Content-Type: application/json"
```

**Expected:** 200 OK with array of factors

---

#### GET /api/mfa/methods
```bash
curl -X GET http://localhost:4020/api/mfa/methods \
  -H "Cookie: appSession=..." \
  -H "Content-Type: application/json"
```

**Expected:** 200 OK with array of enrolled methods

---

#### POST /api/mfa/methods (SMS)
```bash
curl -X POST http://localhost:4020/api/mfa/methods \
  -H "Cookie: appSession=..." \
  -H "Content-Type: application/json" \
  -d '{
    "type": "sms",
    "phoneNumber": "+15551234567",
    "name": "Personal Phone"
  }'
```

**Expected:** 403 with step-up redirect OR 201 Created

---

#### DELETE /api/mfa/methods/[methodId]
```bash
curl -X DELETE http://localhost:4020/api/mfa/methods/sms|abc123 \
  -H "Cookie: appSession=..." \
  -H "Content-Type: application/json"
```

**Expected:** 403 with step-up redirect OR 200 OK

---

#### DELETE /api/mfa/methods
```bash
curl -X DELETE http://localhost:4020/api/mfa/methods \
  -H "Cookie: appSession=..." \
  -H "Content-Type: application/json"
```

**Expected:** 403 with step-up redirect OR 200 OK

---

## Performance Tests

### Load Time
- ✅ Profile page loads in <2 seconds
- ✅ MFA methods fetch in <500ms
- ✅ Factors list fetch in <300ms

### API Response Times
- ✅ GET /api/mfa/methods: <200ms
- ✅ GET /api/mfa/factors: <100ms
- ✅ POST /api/mfa/methods: <1000ms
- ✅ DELETE /api/mfa/methods/[id]: <500ms

---

## Security Tests

### Step-Up Authentication Enforcement
- ✅ Enrollment without MFA triggers step-up
- ✅ Removal without recent MFA triggers step-up
- ✅ Reset without recent MFA triggers step-up
- ✅ Step-up redirect includes returnTo parameter
- ✅ User returns to correct page after step-up

### Token Validation
- ✅ Expired tokens rejected (401)
- ✅ Invalid tokens rejected (401)
- ✅ Missing tokens rejected (401)
- ✅ Tokens from different tenant rejected

### Authorization
- ✅ Users can only manage their own MFA methods
- ✅ No access to other users' methods
- ✅ Organization filtering works correctly

---

## Regression Tests

### Existing Functionality
- ✅ Email verification still works
- ✅ Other profile tabs unaffected (Overview, Tokens, Sessions, Preferences)
- ✅ Session management unaffected
- ✅ Organization switching unaffected
- ✅ Document management unaffected
- ✅ Admin features unaffected

---

## Test Summary

**Total Tests:** 20 core scenarios + integration + performance + security + regression

**Passed:** _____ / _____

**Failed:** _____ / _____

**Skipped:** _____ / _____

**Critical Issues:** _____________

**Non-Critical Issues:** _____________

---

## Sign-Off

**Tester Name:** _________________

**Date:** _________________

**Environment:** Dev / Staging / Production

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________
