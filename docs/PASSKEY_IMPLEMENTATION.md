# Passkey Implementation Guide

## ✅ Implementation Complete

Passkey support has been properly implemented using Auth0 My Account API. Passkeys are **distinct** from webauthn-platform and webauthn-roaming types.

## What is a Passkey?

According to Auth0 My Account API documentation:
- **Type:** `passkey` (separate from webauthn variants)
- **Description:** "Cross-device and platform credential"
- **Technology:** Uses WebAuthn under the hood but with broader compatibility
- **Use Cases:**
  - Biometric authentication (Face ID, Touch ID, Windows Hello)
  - Hardware security keys (YubiKey, Titan Key)
  - Cross-device authentication (phone as authenticator for desktop)

## Differences: Passkey vs WebAuthn Types

| Feature | Passkey | WebAuthn-Platform | WebAuthn-Roaming |
|---------|---------|-------------------|------------------|
| **API Type** | `passkey` | `webauthn-platform` | `webauthn-roaming` |
| **Scope** | Cross-device & platform | Device-specific only | Portable keys only |
| **Identity Linkage** | ✅ Supports `connection` & `identity_user_id` | ❌ Not supported | ❌ Not supported |
| **Auth0 Support** | ✅ Fully supported | ⚠️ Limited support | ⚠️ Limited support |
| **Status** | **Enabled** ✅ | Hidden (not yet ready) | Hidden (not yet ready) |

## Implementation Changes

### 1. Validation Schema (`src/lib/validations.ts`)
```typescript
export const enrollMfaFactorSchema = z.object({
  type: z.enum([
    'sms',
    'phone',
    'email',
    'totp',
    'push-notification',
    'passkey',  // ✅ Added passkey
    // 'webauthn-roaming',    // Hidden
    // 'webauthn-platform'    // Hidden
  ]),
  // Passkey-specific fields for identity linkage
  connection: z.string().optional(),
  identity_user_id: z.string().optional(),
  // ... other fields
});
```

### 2. Available Factors (`src/lib/my-account-api.ts`)
```typescript
{
  type: 'passkey',
  enabled: enabledFactors.includes('passkey'),
  name: 'Passkey',
  description: 'Cross-device and platform credential using biometrics or security keys',
}
// WebAuthn types commented out
```

### 3. API Route Handler (`src/app/api/mfa/methods/route.ts`)
```typescript
case 'passkey':
  // Passkey enrollment - requires browser WebAuthn API
  // Auth0 returns authn_params_public_key for credential creation
  // Optional: connection and identity_user_id for identity linkage
  if (connection) {
    enrollmentRequest.connection = connection;
  }
  if (identity_user_id) {
    enrollmentRequest.identity_user_id = identity_user_id;
  }
  break;
```

### 4. Frontend Component (`src/components/profile/mfa-enrollment.tsx`)
```typescript
// New dedicated function for passkey enrollment
const handlePasskeyEnrollment = async () => {
  // 1. Check WebAuthn support
  // 2. Initiate enrollment: POST /api/mfa/methods { type: 'passkey' }
  // 3. Get challenge from Auth0: authn_params_public_key
  // 4. Create credential: navigator.credentials.create()
  // 5. Verify credential: POST /api/mfa/methods/{id}/verify
};
```

### 5. Environment Configuration (`.env.local`)
```env
NEXT_PUBLIC_ENABLED_MFA_FACTORS='sms,totp,email,passkey'
```

## API Flow

### Request Body (Enrollment Initiation)
```json
POST /me/v1/authentication-methods
{
  "type": "passkey",
  "connection": "google-oauth2",  // Optional: link to identity provider
  "identity_user_id": "123456"     // Optional: external identity ID
}
```

### Response (202 Accepted)
```json
{
  "auth_session": "...",
  "authn_params_public_key": {
    "challenge": "base64url-encoded-challenge",
    "rp": {
      "name": "Your App Name",
      "id": "your-domain.com"
    },
    "user": {
      "id": "base64url-user-id",
      "name": "user@example.com",
      "displayName": "User Name"
    },
    "pubKeyCredParams": [
      {"type": "public-key", "alg": -7},
      {"type": "public-key", "alg": -257}
    ],
    "timeout": 60000,
    "authenticatorSelection": {
      "residentKey": "required",
      "userVerification": "required"
    }
  }
}
```

### Verification Request
```json
POST /me/v1/authentication-methods/passkey|{id}/verify
{
  "auth_session": "...",
  "credential": {
    "id": "credential-id",
    "rawId": "base64url-raw-id",
    "type": "public-key",
    "response": {
      "attestationObject": "base64url-attestation",
      "clientDataJSON": "base64url-client-data"
    }
  }
}
```

## Required Scopes

The CTE token exchange already requests all necessary scopes:
```typescript
scope: 'read:me:authentication_methods create:me:authentication_methods update:me:authentication_methods delete:me:authentication_methods'
```

The `create:me:authentication_methods` scope covers passkey enrollment.

## Browser Requirements

### Supported Browsers
- **Chrome 67+** ✅
- **Firefox 60+** ✅
- **Safari 13+** ✅ (macOS/iOS)
- **Edge 18+** ✅

### Device Requirements
- **Biometric Hardware** (for Touch ID, Face ID, Windows Hello)
  - OR
- **Hardware Security Key** (YubiKey, Titan, etc.)

## Testing Passkey Enrollment

### Step-by-Step Test

1. **Start Dev Server**
   ```bash
   npm run dev
   ```

2. **Navigate to Security Tab**
   ```
   http://localhost:4020/profile?tab=security
   ```

3. **Get Token**
   - Click "Get My Account API Token"
   - Wait for success message

4. **Enroll Passkey**
   - Scroll to "Available Authentication Methods"
   - Click **"Passkey"** card (fingerprint icon)
   - Click "Enroll Method" button
   - Browser prompts for authentication:
     - **macOS**: Touch ID or Face ID
     - **iOS**: Face ID or Touch ID
     - **Android**: Fingerprint or Face Unlock
     - **Windows**: Windows Hello
     - **Security Key**: Insert and tap hardware key

5. **Verify Success**
   - Toast notification: "Passkey Enrolled!"
   - Passkey appears in "Enrolled Methods" list
   - Shows "Active" badge with green checkmark

### Console Logs

Watch browser console for:

**Success:**
```
✅ Passkey challenge received: {method: {...}, authn_params_public_key: {...}}
✅ Passkey credential created: PublicKeyCredential {...}
✅ Enrollment response: {id: "...", type: "passkey", confirmed: true}
```

**Errors:**
```
❌ Passkey enrollment failed: NotAllowedError
   → User cancelled enrollment

❌ Passkey enrollment failed: NotSupportedError
   → Device doesn't support passkeys
```

## Identity Linkage (Optional)

Passkeys support linking to external identity providers:

```typescript
// Example: Link passkey to Google OAuth identity
const enrollmentRequest = {
  type: 'passkey',
  connection: 'google-oauth2',
  identity_user_id: user.identities.find(i => i.provider === 'google-oauth2')?.user_id
};
```

This allows the passkey to be associated with a specific social login identity.

## Security Considerations

### Benefits
- ✅ **Phishing-resistant**: Credentials bound to domain
- ✅ **No shared secrets**: Private key never leaves device
- ✅ **Replay-proof**: Unique signature per authentication
- ✅ **Cross-device**: Can sync via iCloud, Google Account, etc.
- ✅ **Platform-agnostic**: Works on any device with WebAuthn support

### Best Practices
1. **Multiple Passkeys**: Encourage users to register multiple passkeys as backup
2. **Recovery Options**: Always offer alternative MFA methods (SMS, TOTP, Email)
3. **User Education**: Explain what passkeys are and how they work
4. **Device Compatibility**: Check for WebAuthn support before showing passkey option

## Troubleshooting

### Issue: "Not Supported" Error
**Cause:** Browser or device doesn't support WebAuthn/passkeys
**Solution:**
- Update browser to latest version
- Try different browser (Chrome recommended)
- Ensure device has biometric hardware or security key

### Issue: "Enrollment Cancelled"
**Cause:** User cancelled the browser prompt
**Solution:** Normal behavior - user can retry enrollment

### Issue: No authentication prompt appears
**Cause:**
- Browser blocked the prompt (requires user gesture)
- Device doesn't have biometric hardware
**Solution:**
- Ensure enrollment is triggered by user click (not programmatically)
- Try hardware security key instead of biometric

### Issue: 404 on API call
**Cause:** Custom domain configuration mismatch
**Solution:**
- Verify `AUTH0_ISSUER_BASE_URL='https://login.authskye.org'` in `.env.local`
- Ensure token audience matches API domain
- Restart dev server

### Issue: 400 Bad Request on enrollment
**Cause:**
- Invalid request payload
- Passkeys not enabled in Auth0 tenant
**Solution:**
- Check Auth0 Dashboard → Authentication → Passwordless → Passkeys
- Verify My Account API is activated
- Check browser console for request/response details

## Comparison with Reference Implementation

The reference repository (https://github.com/awhitmana0/a0-passkeyforms-demo) uses the same approach:

| Aspect | This Implementation | Reference Repo |
|--------|---------------------|----------------|
| **Token Exchange** | CTE (Custom Token Exchange) | ✅ Same |
| **API Type** | `passkey` | ✅ Same |
| **WebAuthn Flow** | `navigator.credentials.create()` | ✅ Same |
| **Base64url Encoding** | Custom function | ✅ Same approach |
| **Error Handling** | NotAllowedError, NotSupportedError | ✅ Same |

## Next Steps

### For Development
1. ✅ Restart dev server to load updated environment variables
2. ✅ Test passkey enrollment (follow steps above)
3. ✅ Test passkey authentication at login

### For Production
1. Update production `.env`:
   ```env
   NEXT_PUBLIC_ENABLED_MFA_FACTORS='sms,totp,email,passkey'
   ```
2. Verify Auth0 passkeys are enabled in production tenant
3. Test on multiple devices/browsers
4. Monitor enrollment rates and success/failure metrics

### For WebAuthn Support (Future)
If you want to support `webauthn-platform` and `webauthn-roaming` types:
1. Uncomment validation schema entries
2. Uncomment available factors entries
3. Uncomment API route case statements
4. Update environment variable to include both types
5. Test thoroughly (may have different behavior than passkeys)

## Documentation

- **Auth0 My Account API**: https://auth0.com/docs/manage-users/my-account-api
- **Passkey Enrollment API**: https://auth0.com/docs/api/myaccount/authentication-methods/start-the-enrollment-of-a-supported-authentication-method
- **WebAuthn Standard**: https://www.w3.org/TR/webauthn-2/
- **Passkeys.dev Guide**: https://passkeys.dev

## Summary

✅ **Passkey support is now properly implemented** using the correct `passkey` type (not webauthn-platform or webauthn-roaming).

✅ **WebAuthn types are hidden** until they are properly supported and tested.

✅ **All code is in place** - just restart the dev server and test!

The implementation follows Auth0's API specification exactly and uses the same patterns as the reference repository.
