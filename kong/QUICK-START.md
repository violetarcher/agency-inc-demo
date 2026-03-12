# Kong Konnect Quick Start Guide

Get Kong set up in 10 minutes with these simplified instructions.

## ⚡ Quick Setup

### 1. Sign Up (2 minutes)
Visit: https://konghq.com/products/kong-konnect/register
Choose: **Kong Konnect Plus** (Free - 10M requests/month)

### 2. Create Your First API Route (5 minutes)

Click **Gateway Manager** → **Configure New API**

**For Analytics Endpoint:**
```
Service Name: analytics-route
Service URL: http://localhost:4020
  (or https://your-ngrok-url.ngrok-free.app)

Route Name: analytics-route
Route Path: /api/kong-protected/analytics
```

**🚨 Common Mistake:**
- ❌ Service URL: `/api/kong-protected/analytics` (Wrong - this is a path, not URL)
- ✅ Service URL: `http://localhost:4020` (Correct - full upstream URL)

Repeat for Reports and Documents routes (see table below).

### 3. Add Auth0 OIDC Plugin (2 minutes)

In your service:
1. Click **Plugins** → **Add Plugin**
2. Search for **OpenID Connect**
3. Configure:

```yaml
# Authentication section
issuer: https://archfaktor.us.auth0.com/
client_id: U8QtmFYd45QbH1nFwiIzpf0do8xmpmlg
client_secret: O33opbuZzr6ZdD0ug7bTgwKRonYn_HnmERnMY2FueOsZKwVRqDrqaWWEMQKyidX6

auth_methods:
  - bearer

# Authorization section (⚠️ Use audience_required, NOT audience_claim)
audience_required:
  - https://b2b-saas-api.example.com

# Note: User headers configuration may vary by Kong version
# If you see "downstream_headers_names", use:
#   downstream_headers_names:
#     - X-User-Id:sub
#     - X-User-Email:email
#     - X-User-Name:name
#
# If you DON'T see this field, that's OK!
# Your API can still extract user info from the JWT token itself
```

### 4. Configure Your App (1 minute)

Add to `.env.local`:
```bash
NEXT_PUBLIC_KONG_GATEWAY_URL=https://your-gateway.konghq.com
```

Get your gateway URL from: Kong Dashboard → Gateway Manager → Overview

Restart app:
```bash
npm run dev
```

### 5. Test It! (1 minute)

1. Log in to your app
2. Navigate to **API Gateway** in sidebar
3. Click test buttons

## 📋 All Three Routes

Create these three routes in Kong Konnect:

| Service Name | Service URL | Route Path |
|--------------|-------------|------------|
| analytics-route | `http://localhost:4020` | `/api/kong-protected/analytics` |
| reports-route | `http://localhost:4020` | `/api/kong-protected/reports` |
| documents-route | `http://localhost:4020` | `/api/kong-protected/documents` |

**For ngrok testing:** Replace `http://localhost:4020` with your ngrok URL (e.g., `https://fresh-bedbug-prepared.ngrok-free.app`)

## 🎯 Key Concepts

### Service URL vs Route Path

Think of it this way:
- **Service URL** = Where is your server? (e.g., `http://localhost:4020`)
- **Route Path** = What endpoint on that server? (e.g., `/api/kong-protected/analytics`)

Kong combines them:
```
Request to Kong: https://your-gateway.konghq.com/api/kong-protected/analytics
                                              ↓
Kong forwards to: http://localhost:4020/api/kong-protected/analytics
                  ←─── Service URL ─────→←───── Route Path ───────→
```

## ✅ Verification Checklist

After setup, verify:

- [ ] Can access `/api-gateway` page in your app
- [ ] "Test Analytics" button returns data (not error)
- [ ] User info appears in response (userId, email)
- [ ] Kong dashboard shows request in Analytics
- [ ] Rate limiting works (try 101 rapid requests)

## 🐛 Common Issues

### "Invalid URL" error
- **Problem:** You put the path in Service URL
- **Fix:** Service URL must start with `http://` or `https://`

### Audience configuration confusion
- **Problem:** Not sure if audience goes in `audience_claim` or `audience_required`
- **Fix:**
  - Use **`audience_required`** with the actual audience value: `https://b2b-saas-api.example.com`
  - `audience_claim` is the JWT field name (defaults to `"aud"` - don't change this)

**Think of it this way:**
```yaml
audience_claim: "aud"           # Where to look in the JWT (field name)
audience_required: ["https://..."]  # What value must be there (the actual audience)
```

### "Unauthorized" error
- **Problem:** OIDC plugin not configured correctly
- **Fix:** Double-check Auth0 issuer and client credentials match your `.env.local`

### "Cannot reach Kong Gateway"
- **Problem:** Wrong gateway URL in `.env.local`
- **Fix:** Copy exact URL from Kong Dashboard → Gateway Manager → Overview

### Test buttons don't work
- **Problem:** `NEXT_PUBLIC_KONG_GATEWAY_URL` not set or app not restarted
- **Fix:** Add env var and run `npm run dev` again

## 📚 Need More Help?

- **Detailed Setup:** See `KONG-SETUP.md`
- **Testing Guide:** See `KONG-TESTING.md`
- **Full Docs:** See `README.md`

## 🎬 Ready to Demo?

Once everything works:
1. Show Kong Dashboard with Analytics
2. Use API Gateway page to test endpoints
3. Show rate limiting (spam click test button)
4. Show Kong blocking direct API access
5. Explain how Kong validates Auth0 tokens

That's it! You're ready to demo Kong + Auth0 integration. 🚀
