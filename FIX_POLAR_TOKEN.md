# ❌ WRONG TOKEN TYPE - How to Fix

## The Problem

Your current token: `polar_oat_IZj1lmHckWAAvFUU8KfCY2yR4y8VniNdEsq1q1qm22E`

This is an **OAuth Token** (`polar_oat_`) which is for user authentication, NOT for creating checkouts.

**Error you're seeing:**
```
401 Unauthorized: "The access token provided is expired, revoked, malformed, or invalid"
```

---

## ✅ What You Need

You need a **Personal Access Token** (PAT) that starts with `polar_at_`

This token allows your application to create checkouts on behalf of your organization.

---

## 🔑 How to Get the Correct Token

### Step 1: Go to Polar Settings

1. Log in to https://polar.sh
2. Make sure you're in **Sandbox mode** (toggle at top-left)
3. Click your profile picture (top-right)
4. Select **Settings**

### Step 2: Navigate to Personal Access Tokens

1. In Settings, look for **"Personal Access Tokens"** or **"API"** section
   (It might be under "Developer" or "API Keys")

### Step 3: Create New Personal Access Token

1. Click **"Create Personal Access Token"** or **"New Token"**
2. Give it a name: `QuikThread Sandbox`
3. **Select Scopes** (permissions):
   - ✅ `checkouts:write` (to create checkouts)
   - ✅ `products:read` (to read product info)
   - ✅ You might need to select "All scopes" for testing
4. Make sure **Sandbox** is selected (not Production)
5. Click **"Create"** or **"Generate Token"**

### Step 4: Copy the Token

You'll see a token that starts with `polar_at_...`

**IMPORTANT:** 
- Copy it immediately - you can only see it ONCE!
- It should look like: `polar_at_xxxxxxxxxxxxxxxxxxxxxxxx`
- NOT like: `polar_oat_...` (OAuth token - wrong!)
- NOT like: `polar_sk_...` (Secret key - for backend only!)

---

## 📝 Update Your .env File

Once you have the correct token:

```bash
cd frontend
```

Edit `frontend/.env` and replace the token:

```bash
# OLD (WRONG - OAuth token)
VITE_POLAR_ACCESS_TOKEN=polar_oat_IZj1lmHckWAAvFUU8KfCY2yR4y8VniNdEsq1q1qm22E

# NEW (CORRECT - Personal Access Token)
VITE_POLAR_ACCESS_TOKEN=polar_at_YOUR_NEW_TOKEN_HERE
```

---

## 🔄 Restart Frontend

After updating the token:

```bash
# Stop current dev server (Ctrl+C)
cd frontend
npm run dev
```

---

## 🧪 Test Again

1. Go to http://localhost:5173
2. Sign up / Log in
3. Go through onboarding
4. Select Pro or Business plan
5. Should now successfully redirect to Polar checkout! ✅

---

## 🔍 How to Verify Token is Working

The token is correct when you see in browser console:

```
Creating checkout with params: {...}
Checkout created: { url: "https://sandbox.polar.sh/..." }
```

Instead of:
```
❌ 401 Unauthorized
```

---

## 📋 Token Type Reference

| Token Type | Prefix | Use Case | Where to Use |
|------------|--------|----------|--------------|
| **Personal Access Token** | `polar_at_` | Create checkouts, manage resources | ✅ Frontend SDK |
| **OAuth Token** | `polar_oat_` | User authentication flows | ❌ Not for checkouts |
| **Secret Key** | `polar_sk_` | Webhook signature verification | Backend only |
| **Webhook Secret** | `whsec_` | Verify webhook signatures | Backend only |

---

## ⚠️ Common Mistakes

### Mistake 1: Using OAuth Token
```bash
❌ VITE_POLAR_ACCESS_TOKEN=polar_oat_...
✅ VITE_POLAR_ACCESS_TOKEN=polar_at_...
```

### Mistake 2: Using Production Token in Sandbox
- Make sure when creating the token, **Sandbox** is selected
- Sandbox tokens work with `server: 'sandbox'` in SDK config

### Mistake 3: Not Restarting Frontend
- Environment variables are loaded at build time
- Must restart `npm run dev` after changing `.env`

---

## 🆘 Still Having Issues?

### Check Token in Polar Dashboard

1. Go to Polar → Settings → Personal Access Tokens
2. Your token should be listed there
3. Make sure it's:
   - ✅ Active (not expired/revoked)
   - ✅ Sandbox mode
   - ✅ Has correct permissions (checkouts:write)

### Check Environment Variable is Loaded

In browser console, temporarily add this to `polarService.ts`:
```typescript
console.log('Token starts with:', import.meta.env.VITE_POLAR_ACCESS_TOKEN?.substring(0, 10));
```

Should show: `polar_at_x` (not `polar_oat_`)

---

**Once you have the correct `polar_at_` token, everything will work!** 🚀
