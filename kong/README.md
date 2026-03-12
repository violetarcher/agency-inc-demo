# Kong API Gateway Integration

This directory contains all Kong Gateway configuration files and documentation for the Agency Inc Dashboard API Gateway demo.

## 📁 Directory Contents

```
kong/
├── README.md                 # This file - overview and navigation
├── QUICK-START.md           # ⚡ Start here! 10-minute setup guide
├── KONG-SETUP.md            # Complete detailed setup guide
├── KONG-TESTING.md          # Comprehensive testing guide
├── kong.yaml                # Declarative config using JWT plugin (manual)
├── kong-oidc.yaml           # Declarative config using OIDC plugin (recommended)
└── .env.kong                # Environment variables for Kong configuration
```

## 🎯 What This Demo Shows

This Kong integration demonstrates:

- **Auth0 JWT/OIDC Validation** - Automatic token verification at the gateway level
- **Rate Limiting** - Protect your APIs from abuse (100 req/min, 1000 req/hour)
- **CORS Handling** - Pre-configured cross-origin request support
- **Request Transformation** - Inject user context headers into requests
- **API Gateway Patterns** - Centralized security and traffic management

## 🚀 Quick Start

### 👉 Want to get started immediately?

**See `QUICK-START.md`** - Get Kong running in 10 minutes with simplified instructions.

### Detailed Setup Options

#### Option 1: Using the UI (Recommended)

1. **Sign up for Kong Konnect**
   - Visit: https://konghq.com/products/kong-konnect/register
   - Choose **Kong Konnect Plus** (Free Tier)

2. **Follow the Setup Guide**
   - See `KONG-SETUP.md` for complete step-by-step instructions
   - Or `QUICK-START.md` for simplified 10-minute setup

3. **Update Your Environment**
   ```bash
   # Add to .env.local
   NEXT_PUBLIC_KONG_GATEWAY_URL=https://your-gateway.konghq.com
   ```

4. **Test the Integration**
   - Restart your app: `npm run dev`
   - Navigate to **API Gateway** in the sidebar
   - Click test buttons to verify endpoints

#### Option 2: Declarative Configuration (Advanced)

For GitOps or version-controlled deployments:

1. **Import Configuration**
   ```bash
   # Use kong-oidc.yaml (recommended) or kong.yaml
   kong config db_import kong/kong-oidc.yaml
   ```

2. **Or manually configure via UI**
   - Use the YAML files as reference
   - Configure through Kong Konnect dashboard

### 🆘 Need Help?

**UI looks different?** Kong Konnect's interface gets updated regularly. The key concepts remain:
- **Service URL** = Your upstream server URL (`http://localhost:4020`)
- **Route Path** = The API endpoint path (`/api/kong-protected/analytics`)
- See `QUICK-START.md` for current UI screenshots and troubleshooting

## 📄 Configuration Files

### `kong-oidc.yaml` (Recommended)

Uses OpenID Connect plugin for seamless Auth0 integration.

**Pros:**
- ✅ Automatic JWT validation
- ✅ Built-in token introspection
- ✅ Automatic user header injection
- ✅ No manual key management

**Cons:**
- ⚠️ Requires Kong Enterprise/Konnect (available in free tier)

### `kong.yaml` (Alternative)

Uses JWT plugin with manual key configuration.

**Pros:**
- ✅ Works with Kong Gateway OSS
- ✅ More control over validation

**Cons:**
- ⚠️ Requires manual Auth0 public key setup
- ⚠️ Need to update keys on rotation

### `.env.kong`

Environment variables template for Kong configuration. Use these values when configuring through the Kong Konnect UI.

## 🛠️ Protected Endpoints

Kong protects these new API routes (separate from existing app APIs):

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/kong-protected/analytics` | GET, POST | Analytics data with user context |
| `/api/kong-protected/reports` | GET, POST | Reports management |
| `/api/kong-protected/documents` | GET, POST, DELETE | Document operations |

## 🔒 Security Architecture

```
┌─────────────────┐
│   Client/Browser│
│  (Auth0 Token)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│     Kong API Gateway        │
│  ┌────────────────────────┐ │
│  │  1. Validate JWT       │ │ ◄── Auth0 OIDC/JWT
│  │  2. Check Rate Limit   │ │
│  │  3. Apply CORS         │ │
│  │  4. Add User Headers   │ │
│  └────────────────────────┘ │
└────────┬────────────────────┘
         │ X-User-Id: auth0|123
         │ X-User-Email: user@example.com
         ▼
┌─────────────────┐
│  Your Next.js   │
│  API Routes     │
└─────────────────┘
```

## 🧪 Testing

See `KONG-TESTING.md` for comprehensive testing scenarios including:

- Browser-based testing (easiest)
- cURL commands for command-line testing
- Postman collection setup
- Rate limiting tests
- CORS validation
- Security verification

**Quick Test:**

```bash
# 1. Get your access token
curl http://localhost:4020/api/auth/token -H "Cookie: appSession=YOUR_SESSION"

# 2. Test Kong endpoint
curl https://your-gateway.konghq.com/api/kong-protected/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Kong Plugins Configured

| Plugin | Purpose | Configuration |
|--------|---------|---------------|
| **openid-connect** or **jwt** | Auth0 authentication | Validates tokens against Auth0 |
| **rate-limiting** | API protection | 100/min, 1000/hour limits |
| **cors** | Browser support | Allows configured origins |
| **request-transformer** | User context | Adds X-User-* headers |
| **file-log** (optional) | Debugging | Logs requests to file |

## 🔧 Configuration Notes

### Auth0 Settings (Already in `.env.local`)

```bash
AUTH0_ISSUER_BASE_URL=https://archfaktor.us.auth0.com
AUTH0_CLIENT_ID=U8QtmFYd45QbH1nFwiIzpf0do8xmpmlg
AUTH0_CLIENT_SECRET=O33opbuZzr6ZdD0ug7bTgwKRonYn_HnmERnMY2FueOsZKwVRqDrqaWWEMQKyidX6
AUTH0_AUDIENCE=https://b2b-saas-api.example.com
```

### Kong Gateway URL

After setting up Kong Konnect, add to `.env.local`:

```bash
NEXT_PUBLIC_KONG_GATEWAY_URL=https://your-gateway.konghq.com
```

## 🎨 UI Integration

A dedicated **API Gateway** page has been added to the application:

- **Location:** `/api-gateway`
- **Navigation:** Sidebar → "API Gateway" (Shield icon)
- **Features:**
  - Test each protected endpoint
  - View request/response data
  - See user context from Kong headers
  - Real-time success/error feedback

## 🌟 Free Tier Limits

Kong Konnect Plus (Free) includes:

- ✅ 10M requests/month
- ✅ All core plugins (OIDC, JWT, Rate Limiting, CORS)
- ✅ Basic analytics and monitoring
- ✅ Community support
- ✅ Unlimited services and routes

Perfect for demos, development, and small-scale production use.

## 📚 Documentation

- **Setup Guide:** `KONG-SETUP.md` - Step-by-step Kong Konnect configuration
- **Testing Guide:** `KONG-TESTING.md` - Comprehensive testing scenarios
- **Kong Docs:** https://developer.konghq.com
- **Kong Dashboard:** https://cloud.konghq.com

## 🔄 Removing Kong Integration

This integration is completely non-destructive. To remove:

```bash
# 1. Delete Kong directory
rm -rf kong/

# 2. Remove Kong API routes
rm -rf src/app/api/kong-protected/

# 3. Remove API Gateway page
rm src/app/api-gateway/page.tsx

# 4. Remove navigation link from sidebar-nav.tsx
# (Delete the "API Gateway" button section)

# 5. Remove token endpoint (if not used elsewhere)
rm src/app/api/auth/token/route.ts

# 6. Remove environment variable from .env.local
# Delete: NEXT_PUBLIC_KONG_GATEWAY_URL=...
```

Your existing application remains completely unchanged!

## 🤝 Support

**Kong Issues:**
- Community: https://discuss.konghq.com
- Documentation: https://developer.konghq.com
- Status: https://status.konghq.com

**Application Issues:**
- See main `README.md` for application setup
- See `CLAUDE.md` for architecture details

**Auth0 Issues:**
- Community: https://community.auth0.com
- Documentation: https://auth0.com/docs

## 🎯 Next Steps

1. **Complete Setup**
   - Follow `KONG-SETUP.md` to configure Kong Konnect
   - Test using the API Gateway page

2. **Explore Features**
   - Try rate limiting (send 101 requests)
   - Test CORS from different origins
   - View user context headers

3. **Production Planning**
   - Set up monitoring and alerts
   - Configure custom domain
   - Implement circuit breakers

4. **Advanced Configuration**
   - Explore additional plugins (GraphQL, gRPC)
   - Set up service mesh features
   - Implement A/B testing routes

## 📝 Notes

- Kong configuration is isolated from your existing APIs
- All existing routes continue to work without Kong
- Kong-protected routes are explicitly separate (`/api/kong-protected/*`)
- This is a demonstration - you can integrate Kong with existing routes later

## 🏆 Best Practices

1. **Start with OIDC plugin** - Easier Auth0 integration
2. **Monitor rate limits** - Adjust based on actual usage
3. **Use declarative config** - Version control your gateway configuration
4. **Test thoroughly** - Use the provided testing guide
5. **Secure secrets** - Never commit `.env.kong` with real secrets

---

**Ready to get started?** Open `KONG-SETUP.md` and follow the step-by-step guide!
