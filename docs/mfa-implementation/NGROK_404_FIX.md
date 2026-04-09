# Fix: Ngrok 404 Error (Route Works Locally)

## The Issue

```
POST https://fresh-bedbug-prepared.ngrok-free.app/api/mfa/methods 404 (Not Found)
```

**But the route works locally!** This means ngrok is caching old routes or not forwarding properly.

---

## Quick Fix (1 minute)

### Step 1: Restart Ngrok Tunnel

```bash
# Stop ngrok (Ctrl+C in the ngrok terminal)

# Start it again with your static domain
ngrok http 4020 --domain fresh-bedbug-prepared.ngrok-free.app
```

### Step 2: Hard Refresh Browser

- **Chrome/Edge:** Ctrl+Shift+R (or Cmd+Shift+R on Mac)
- **Or:** Close and reopen incognito window

### Step 3: Test Again

1. Navigate to your ngrok URL
2. Go to Profile → Security
3. Try MFA enrollment
4. Should work now! ✅

---

## Why This Happens

Ngrok can cache routing information, especially when:
- New API routes are added while ngrok is running
- Next.js is restarted but ngrok isn't
- Ngrok tunnel has been running for a long time

**The fix:** Restart both Next.js AND ngrok together.

---

## Verify Route Works Locally

Before restarting ngrok, verify the route works locally:

```bash
curl -I http://localhost:4020/api/mfa/methods
```

**Expected output:**
```
HTTP/1.1 401 Unauthorized
```

This confirms the route exists (401 is expected without authentication).

**If you get 404 locally:**
Then it's a Next.js routing issue, not ngrok. See [ROUTE_404_FIX.md](./ROUTE_404_FIX.md).

---

## Best Practice: Restart Both

Whenever you add new API routes or clear Next.js cache:

```bash
# Terminal 1: Restart Next.js
npm run dev

# Terminal 2: Restart ngrok
ngrok http 4020 --domain fresh-bedbug-prepared.ngrok-free.app
```

This ensures both are in sync.

---

## Alternative: Use Localhost for Testing

If ngrok continues to have issues, test using localhost first:

1. Open browser
2. Navigate to `http://localhost:4020`
3. Test MFA enrollment
4. Once working locally, then test through ngrok

**Note:** Auth0 callbacks require HTTPS (ngrok), but you can test the API routes locally first to isolate the issue.

---

## Check Ngrok Status

After restarting ngrok, visit the ngrok web interface:

```
http://127.0.0.1:4040
```

This shows:
- Active tunnel URL
- Request/response logs
- Any errors from ngrok

Look for 404 responses in the logs to see if ngrok is receiving the requests.

---

## If Still Getting 404 Through Ngrok

### Issue 1: Ngrok Region Mismatch

If your Auth0 tenant and ngrok are in different regions, there might be latency or caching issues.

**Fix:** Use a ngrok edge closer to your Auth0 region.

### Issue 2: Ngrok Plan Limitations

Free ngrok accounts have limitations. Check if you're hitting:
- Request limits
- Bandwidth limits
- Connection timeouts

**Fix:** Upgrade ngrok plan or use a different tunnel service.

### Issue 3: Browser Cached Ngrok DNS

Your browser might have cached the old ngrok IP.

**Fix:**
```bash
# Flush DNS (Mac)
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Flush DNS (Windows)
ipconfig /flushdns

# Flush DNS (Linux)
sudo systemd-resolve --flush-caches
```

Then restart browser.

---

## Test Flow

### Test 1: Localhost Works
```bash
curl http://localhost:4020/api/mfa/methods
# Should get: 401 Unauthorized (route exists)
```

### Test 2: Ngrok Works
```bash
curl https://fresh-bedbug-prepared.ngrok-free.app/api/mfa/methods
# Should get: 401 Unauthorized (route exists)
```

### Test 3: Browser Works
1. Open browser
2. Navigate to ngrok URL
3. Try MFA enrollment
4. Should work!

---

## Common Ngrok Issues

### Issue: "Tunnel not found"
**Fix:** Your static domain expired or was revoked. Get a new one:
```bash
ngrok http 4020
```
(Will give you a random URL)

### Issue: "ngrok: command not found"
**Fix:** Install ngrok:
```bash
# Mac
brew install ngrok

# Or download from https://ngrok.com/download
```

### Issue: "Too many connections"
**Fix:** You have multiple ngrok tunnels running. Kill them:
```bash
# Find ngrok processes
ps aux | grep ngrok

# Kill them
killall ngrok

# Start fresh
ngrok http 4020 --domain fresh-bedbug-prepared.ngrok-free.app
```

---

## Debugging Checklist

When you get 404 through ngrok:

- [ ] Route works locally (curl localhost:4020/api/mfa/methods returns 401)
- [ ] Next.js dev server is running without errors
- [ ] Ngrok tunnel is running
- [ ] Ngrok is pointing to correct port (4020)
- [ ] Browser cache cleared
- [ ] Tried in incognito window
- [ ] Restarted ngrok tunnel
- [ ] Checked ngrok web interface (http://127.0.0.1:4040)

---

## Summary

**Your issue:** Route works locally but 404 through ngrok

**The fix:**
1. Restart ngrok tunnel
2. Hard refresh browser
3. Test again

**Root cause:** Ngrok caching old routing information

**Prevention:** Restart both Next.js and ngrok whenever you add new routes

---

**Last Updated:** December 2024
**Issue:** Ngrok route caching
**Fix Time:** ~1 minute
