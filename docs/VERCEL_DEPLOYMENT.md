# Vercel Deployment Guide

## Why Deploy to Vercel?

Passkey enrollment via My Account API requires the app domain to be compatible with Auth0's custom domain (`login.authskye.org`). Vercel provides:
- ✅ Free HTTPS hosting
- ✅ Easy environment variable management
- ✅ Custom domain support (optional)
- ✅ Automatic deployments from Git

## Quick Deployment

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Deploy

```bash
# From project root
vercel

# Follow prompts:
# - Link to existing project or create new
# - Select project settings
# - Deploy
```

### 3. Add Environment Variables

In Vercel Dashboard (https://vercel.com/dashboard):

1. Go to your project → Settings → Environment Variables
2. Add all variables from `.env.local`:

```env
AUTH0_SECRET=636faf585c9cc5c74d11bb2559bb68532caaadd2c9781cb7b3ceaefdc8767458
AUTH0_BASE_URL=https://your-app.vercel.app
AUTH0_ISSUER_BASE_URL=https://login.authskye.org
AUTH0_CLIENT_ID=U8QtmFYd45QbH1nFwiIzpf0do8xmpmlg
AUTH0_CLIENT_SECRET=O33opbuZzr6ZdD0ug7bTgwKRonYn_HnmERnMY2FueOsZKwVRqDrqaWWEMQKyidX6
AUTH0_CONNECTION_ID=Username-Password-Authentication
AUTH0_AUDIENCE=https://b2b-saas-api.example.com
AUTH0_SCOPE=openid profile email offline_access
NEXT_PUBLIC_MY_ACCOUNT_AUDIENCE=https://login.authskye.org/me/
AUTH0_MGMT_DOMAIN=archfaktor.us.auth0.com
AUTH0_MGMT_CLIENT_ID=1jKieKpWHNbI6JsBSahJLRjktWRhcIvL
AUTH0_MGMT_CLIENT_SECRET=jIAo4kEZdSzBHgUwMG5JFWwW2DWoOjmO7quJNsZ9xE-FnTriVfR3ZBkhf-R11MQ6
FIREBASE_SERVICE_ACCOUNT_BASE64=ewogICJ0eXBlIjo...
FGA_API_URL=https://api.us1.fga.dev
FGA_STORE_ID=01KA9FBDM2VPHMKJRQ4YTT5Y83
FGA_MODEL_ID=01KA9GN3M5SW5RMJRHR6BFP1TF
FGA_CLIENT_ID=Pyf3HXLtKTMu5zDDmNVyvb5yJfobNova
FGA_CLIENT_SECRET=9DNFZvL0CRNgk16hTb71gY_6aX69Hn74ohj8niEiHIs_eos6u-VS5PsTr0HrEwiQ
FGA_API_TOKEN_ISSUER=fga.us.auth0.com
FGA_API_AUDIENCE=https://api.us1.fga.dev/
NEXT_PUBLIC_KONG_GATEWAY_URL=https://kong-019c989905usehqbh.kongcloud.dev
CTE_CLIENT_ID=67OqfItt4P43bxdbUg9NTVyPz28sJj3W
CTE_CLIENT_SECRET=0iUsz1gH0md-VQo4SP2rolNbYhQJ4zjjErOXpseQQgic16XPKVA0J9qDjHSsl8Mb
NEXT_PUBLIC_ENABLED_MFA_FACTORS=sms,totp,email,passkey
```

**Important:** Update `AUTH0_BASE_URL` to your actual Vercel deployment URL (e.g., `https://agency-inc-dashboard.vercel.app`)

### 4. Update Auth0 Application Settings

Go to Auth0 Dashboard → Applications → Applications → Your App

Add your Vercel URL to:

**Allowed Callback URLs:**
```
https://login.authskye.org/api/auth/callback,
https://fresh-bedbug-prepared.ngrok-free.app/api/auth/callback,
https://your-app.vercel.app/api/auth/callback
```

**Allowed Logout URLs:**
```
https://login.authskye.org,
https://fresh-bedbug-prepared.ngrok-free.app,
https://your-app.vercel.app
```

**Allowed Web Origins:**
```
https://login.authskye.org,
https://fresh-bedbug-prepared.ngrok-free.app,
https://your-app.vercel.app
```

**Allowed Origins (CORS):**
```
https://login.authskye.org,
https://fresh-bedbug-prepared.ngrok-free.app,
https://your-app.vercel.app
```

**Enable Cross-Origin Authentication:**
- Toggle ON

**Save Changes**

### 5. Redeploy

```bash
vercel --prod
```

### 6. Test Passkeys

1. Navigate to: `https://your-app.vercel.app`
2. Login
3. Go to Profile → Security tab
4. Click "Get My Account API Token"
5. Click "Passkey" card
6. Complete biometric enrollment

## Custom Domain (Optional)

To eliminate cross-origin issues entirely, configure a custom domain under `authskye.org`:

### 1. Add Custom Domain in Vercel

1. Go to Project → Settings → Domains
2. Add domain: `app.authskye.org`
3. Vercel provides DNS records to configure

### 2. Configure DNS

Add the following records to your DNS provider:

```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

### 3. Update Auth0

No Auth0 changes needed! Since `app.authskye.org` is under the same root domain as `login.authskye.org`, passkeys will work seamlessly.

### 4. Update Environment Variable

```env
AUTH0_BASE_URL=https://app.authskye.org
```

## Automatic Deployments

### Link to GitHub

1. Go to Vercel Dashboard → Import Project
2. Connect GitHub repository
3. Select branch (usually `main`)
4. Configure build settings (auto-detected for Next.js)
5. Add environment variables
6. Deploy

### Automatic Previews

Vercel automatically creates preview deployments for:
- ✅ Pull requests
- ✅ Branch pushes

Each preview has a unique URL for testing.

## Production Deployment

```bash
# Deploy to production
vercel --prod

# Or use Git integration (recommended)
git push origin main
```

## Monitoring

### View Logs

```bash
vercel logs your-app.vercel.app
```

### View Deployments

```bash
vercel ls
```

### Redeploy

```bash
vercel --prod --force
```

## Troubleshooting

### Issue: Environment variables not updating

**Solution:** After adding/changing env vars in Vercel dashboard, redeploy:
```bash
vercel --prod --force
```

### Issue: Auth0 callback fails

**Solution:** Verify `AUTH0_BASE_URL` matches your Vercel URL exactly (no trailing slash)

### Issue: Passkeys still fail

**Checklist:**
- [ ] `AUTH0_BASE_URL` is set to Vercel URL in environment variables
- [ ] Vercel URL is in Auth0 Allowed Callback URLs
- [ ] Vercel URL is in Auth0 Allowed Origins (CORS)
- [ ] "Allow Cross-Origin Authentication" is enabled in Auth0
- [ ] Redeployed after changing environment variables

### Issue: Build fails

**Common causes:**
- Missing environment variables
- TypeScript errors
- ESLint errors

**Solution:** Fix locally first, then redeploy:
```bash
npm run build  # Test build locally
npm run lint   # Check for lint errors
vercel --prod  # Deploy
```

## Cost

Vercel Free Tier includes:
- ✅ Unlimited deployments
- ✅ HTTPS
- ✅ Preview deployments
- ✅ Custom domains (up to 50)
- ✅ 100GB bandwidth/month
- ✅ Serverless function executions

This is sufficient for testing and small production deployments.

## Summary

✅ **Deploy to Vercel to test passkeys**
✅ **Takes ~5 minutes to deploy**
✅ **Free tier is sufficient for testing**
✅ **Optional: Use custom domain for seamless passkey enrollment**
