# Nuclear Option: Clear All Browser Caches

## The Problem

- ✅ Curl shows route works: `HTTP/2 401`
- ❌ Browser shows 404

This is **aggressive browser caching** of the 404 response from earlier.

---

## Nuclear Option (Do ALL of These)

### 1. Close Browser Completely

```bash
# On Mac, force quit:
killall "Google Chrome"
killall "Safari"
killall "Firefox"

# Wait 5 seconds
sleep 5
```

### 2. Clear DNS Cache (Mac)

```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

### 3. Clear Chrome Cache (If Using Chrome)

```bash
# Remove Chrome cache completely
rm -rf ~/Library/Caches/Google/Chrome/
rm -rf ~/Library/Application\ Support/Google/Chrome/Default/Cache/
rm -rf ~/Library/Application\ Support/Google/Chrome/Default/Code\ Cache/
```

### 4. Use a Different Browser

Try **Safari** or **Firefox** if you were using Chrome, or vice versa. Completely different cache.

### 5. Try Curl in Browser DevTools

Open DevTools Console and paste this:

```javascript
fetch('/api/mfa/methods', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'sms', phoneNumber: '+15551234567' })
})
.then(r => console.log('Status:', r.status, r.statusText))
.catch(e => console.error('Error:', e))
```

This bypasses any potential fetch cache.

---

## Alternative: Rollback to Legacy System

If nothing works, rollback to the working legacy MFA system:

```bash
# Swap components
mv src/components/profile/mfa-enrollment.tsx src/components/profile/mfa-enrollment-myaccount.tsx
mv src/components/profile/mfa-enrollment-old.tsx.backup src/components/profile/mfa-enrollment.tsx

# Remove My Account API scopes from .env.local
# Edit AUTH0_SCOPE and remove:
# read:me:authentication_methods create:me:authentication_methods update:me:authentication_methods delete:me:authentication_methods read:me:factors

# Restart
npm run dev
```

Then you have a working system while we debug the caching issue.

---

**Last Updated:** December 2024
