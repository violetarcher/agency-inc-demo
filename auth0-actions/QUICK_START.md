# Quick Start - MFA Action Deployment

## 5-Minute Setup

### Step 1: Choose Your Version
- **Basic** (`mfa-challenge-second-login.js`) - Simple, ready to use
- **Advanced** (`mfa-challenge-second-login-advanced.js`) - Configurable options

### Step 2: Copy to Auth0
1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Navigate: **Actions** → **Library** → **Build Custom**
3. Set:
   - **Name**: `MFA Challenge - Second Login`
   - **Trigger**: `Login / Post Login`
4. Paste the code from your chosen file
5. Click **Deploy**

### Step 3: Add to Flow
1. Go to: **Actions** → **Flows** → **Login**
2. Drag your action between **Start** and **Complete**
3. Click **Apply**

### Step 4: Configure (Advanced Version Only)
In the action editor, add secrets:

| Secret Key | Value | Description |
|------------|-------|-------------|
| `MFA_PROVIDER` | `any` | Which MFA method to use |
| `ALLOW_REMEMBER_BROWSER` | `false` | Allow browser remembering |
| `LOGIN_COUNT_TRIGGER` | `2` | Which login triggers MFA |

### Step 5: Test
1. Create a test user (not in an organization)
2. Log in once → No MFA
3. Log out and log in again → MFA challenge! ✓

## What This Does

✅ **Enforces MFA** on the 2nd login for non-org users
✅ **Enrolls** users who don't have MFA set up
✅ **Skips** users logging in through organizations
✅ **Logs** everything for debugging

## Quick Checks

If MFA isn't working, verify:
- [ ] Action is **deployed**
- [ ] Action is in the **Login flow**
- [ ] User is **not in an organization**
- [ ] This is the user's **2nd login**
- [ ] Check **Auth0 logs** for `[MFA Action]` entries

## Common Customizations

### Challenge on First Login
```javascript
if (event.stats.logins_count !== 1) {  // Change 2 to 1
```

### Only for Specific Domains
```javascript
const domain = event.user.email.split('@')[1];
if (domain !== 'company.com') return;
```

### Force SMS Only
In secrets:
```
MFA_PROVIDER = sms
```

## Need Help?
See full documentation in `README.md`
