# Auth0 Actions - MFA Challenge on Second Login

This directory contains Auth0 Actions for enforcing MFA on non-organization users.

## Actions Available

### 1. `mfa-challenge-second-login.js` (Basic Version)
Simple action that challenges non-org users with MFA on their 2nd login.

**Features:**
- Triggers on exactly the 2nd login (`login_count === 2`)
- Skips users logging in through an organization
- Enrolls users if they haven't set up MFA yet
- Challenges users who are already enrolled

### 2. `mfa-challenge-second-login-advanced.js` (Advanced Version)
Enhanced version with configurable options and additional logging.

**Features:**
- All features from basic version
- Configurable MFA provider (OTP, SMS, Email, etc.)
- Configurable login count trigger
- Option to allow/disallow "Remember Browser"
- Additional safety checks for organization membership
- Custom claims added to tokens for MFA tracking
- More detailed logging

## How to Deploy

### Option 1: Via Auth0 Dashboard (Recommended)

1. **Navigate to Auth0 Dashboard**
   - Go to [Auth0 Dashboard](https://manage.auth0.com/)
   - Click on "Actions" → "Library"

2. **Create a New Action**
   - Click "Build Custom"
   - Name: `MFA Challenge - Second Login (Non-Org Users)`
   - Trigger: **Post-Login**
   - Runtime: Node 18 (recommended)

3. **Copy the Code**
   - Copy the contents of `mfa-challenge-second-login.js` (or `-advanced.js`)
   - Paste into the code editor

4. **Add Secrets (For Advanced Version Only)**
   - Click on the "Secrets" icon (🔒) in the left sidebar
   - Add the following secrets:
     - `MFA_PROVIDER`: `any` (or specific: `google-authenticator`, `sms`, `email`)
     - `ALLOW_REMEMBER_BROWSER`: `false` (or `true`)
     - `LOGIN_COUNT_TRIGGER`: `2` (or any number)

5. **Deploy the Action**
   - Click "Deploy"

6. **Add to Login Flow**
   - Go to "Actions" → "Flows" → "Login"
   - Drag your action into the flow
   - Click "Apply"

### Option 2: Via Auth0 CLI

```bash
# Install Auth0 CLI if you haven't
npm install -g auth0-cli

# Login to Auth0
auth0 login

# Create the action
auth0 actions create \
  --name "MFA Challenge - Second Login" \
  --trigger post-login \
  --code mfa-challenge-second-login.js

# Deploy to the Login flow
auth0 actions deploy <action-id>
```

## Configuration Options (Advanced Version)

### MFA_PROVIDER
Specifies which MFA method to use:
- `any` - User can choose any available method (default)
- `google-authenticator` - Force Google Authenticator/TOTP
- `sms` - Force SMS verification
- `email` - Force Email verification
- `duo` - Force Duo Security
- `push-notification` - Force push notifications

### ALLOW_REMEMBER_BROWSER
- `true` - Users can check "Remember this browser" to skip MFA for 30 days
- `false` - Always challenge with MFA (default)

### LOGIN_COUNT_TRIGGER
- `2` - Trigger on 2nd login (default)
- `1` - Trigger on 1st login
- `3` - Trigger on 3rd login
- etc.

## Testing

### Test Scenario 1: First Login (Non-Org User)
1. Create a new user via Auth0 Dashboard
2. Log in → Should proceed without MFA (login_count = 1)

### Test Scenario 2: Second Login (Non-Org User)
1. Log out and log in again
2. Should be challenged with MFA enrollment/challenge (login_count = 2)

### Test Scenario 3: Organization User
1. Invite a user to an organization
2. Log in through organization login URL
3. Should skip MFA challenge (even on 2nd login)

### Test Scenario 4: Third Login
1. Complete MFA enrollment on 2nd login
2. Log in a third time
3. Should proceed without MFA challenge (login_count = 3)

## Monitoring & Logs

View logs in Auth0 Dashboard:
1. Go to "Monitoring" → "Logs"
2. Filter by "Actions"
3. Look for log entries with `[MFA Action]` prefix

Example logs:
```
[MFA Action] Skipping - User is logging into organization: Acme Corp
[MFA Action] Triggering MFA for user: user@example.com (2nd login, non-org user)
[MFA Action] User not enrolled in MFA - prompting enrollment
[MFA Action] ✓ MFA enrollment initiated
```

## How It Works

### Flow Diagram

```
User attempts login
       ↓
Is user in an organization?
       ↓ No
Is login_count === 2?
       ↓ Yes
Is user enrolled in MFA?
       ↓
   ┌───┴───┐
   No      Yes
   ↓       ↓
Enroll   Challenge
   ↓       ↓
   └───┬───┘
       ↓
   MFA Flow
       ↓
Login Complete
```

## Customization Ideas

### Challenge on Every Login
Change the condition from:
```javascript
if (event.stats.logins_count !== 2)
```
to:
```javascript
if (event.stats.logins_count < 2)
```

### Challenge Only Specific Email Domains
Add after organization check:
```javascript
const emailDomain = event.user.email.split('@')[1];
if (!['example.com', 'company.com'].includes(emailDomain)) {
  return;
}
```

### Send Notification After MFA Enrollment
Add in `onContinuePostLogin`:
```javascript
// Send email or Slack notification
await fetch('https://your-webhook.com/mfa-enrolled', {
  method: 'POST',
  body: JSON.stringify({
    user: event.user.email,
    enrolled_at: new Date().toISOString()
  })
});
```

## Troubleshooting

### MFA not triggering
- Check Action is deployed and in the Login flow
- Verify login count is exactly 2
- Confirm user is NOT in an organization
- Check Auth0 logs for `[MFA Action]` entries

### Users getting MFA on every login
- Check `LOGIN_COUNT_TRIGGER` value
- Verify the condition uses `!==` not `>=`

### Organization users getting challenged
- Verify the action checks `event.organization`
- Check if org metadata is properly set

## Security Considerations

1. **Remember Browser**: Disabled by default for maximum security
2. **Organization Bypass**: Organizations may have their own MFA policies
3. **Login Count**: Triggers on 2nd login to ensure user can access account at least once
4. **Error Handling**: Action doesn't block login if MFA fails (logs error instead)

## Related Documentation

- [Auth0 Actions](https://auth0.com/docs/customize/actions)
- [MFA API Reference](https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow/api-object#multifactor)
- [Auth0 Organizations](https://auth0.com/docs/manage-users/organizations)

## Support

For issues or questions:
- Check Auth0 Community: https://community.auth0.com/
- Auth0 Support: https://support.auth0.com/
