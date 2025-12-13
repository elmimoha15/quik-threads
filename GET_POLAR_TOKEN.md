# 🔑 Get Your Polar Personal Access Token

## Quick Steps (5 minutes)

### 1. Login to Polar
- Go to: https://polar.sh
- Login with your account
- **Toggle to SANDBOX mode** (top-left corner - should show yellow banner)

### 2. Navigate to Settings
Click on your **profile picture** (top-right) → **Settings**

Or go directly to: https://sandbox.polar.sh/settings

### 3. Find Personal Access Tokens Section

Look for one of these sections in the left sidebar:
- **"Personal Access Tokens"**
- **"API"**
- **"Developers"**
- **"API Keys"**

### 4. Create New Token

1. Click **"Create Token"** or **"New Personal Access Token"**

2. **Name**: `QuikThread Checkout`

3. **Scopes** (check these):
   - ✅ `checkouts:write`
   - ✅ `products:read`
   - Or select **"All scopes"** for easier testing

4. **Environment**: Make sure **SANDBOX** is selected!

5. Click **"Create"** or **"Generate"**

### 5. Copy Your Token

You'll see a token like:
```
polar_at_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ CRITICAL:**
- Copy it NOW - you can only see it ONCE!
- Should start with `polar_at_` (NOT `polar_oat_`)
- Save it somewhere safe temporarily

---

## 📝 Update Your Environment

### Open your .env file:
```bash
cd /home/elmi/Documents/Projects/quik-threads/frontend
nano .env
```

### Replace this line:
```bash
# OLD (OAuth token - WRONG)
VITE_POLAR_ACCESS_TOKEN=polar_oat_IZj1lmHckWAAvFUU8KfCY2yR4y8VniNdEsq1q1qm22E

# NEW (Personal Access Token - CORRECT)
VITE_POLAR_ACCESS_TOKEN=polar_at_YOUR_TOKEN_HERE
```

Save the file (Ctrl+O, Enter, Ctrl+X)

---

## 🔄 Restart Everything

```bash
# Terminal 1 - Restart Frontend
cd frontend
# Stop with Ctrl+C, then:
npm run dev

# Terminal 2 - Backend (keep running)
cd quikthread-backend
source venv/bin/activate
python3 main.py

# Terminal 3 - Ngrok (keep running)
ngrok http 8000
```

---

## ✅ Verify It Works

1. Open browser console (F12)
2. Go to http://localhost:5173
3. Try selecting a plan in onboarding
4. You should see in console:
   ```
   Creating checkout with params: {...}
   Using access token: polar_at_xxxxx...
   Checkout created successfully: { url: "https://sandbox.polar.sh/..." }
   ```

5. Browser redirects to Polar checkout page ✅

---

## 🔍 Troubleshooting

### Still getting 401 Unauthorized?

**Check token prefix:**
```bash
cd frontend
cat .env | grep VITE_POLAR_ACCESS_TOKEN
```

Should show: `polar_at_...` (NOT `polar_oat_...`)

**Check token is active in Polar:**
1. Go to Polar → Settings → Personal Access Tokens
2. Your token should be listed
3. Check it's not expired or revoked

**Check environment is loaded:**
- After changing `.env`, MUST restart frontend dev server
- Environment variables only load at startup

---

## 📞 Need More Help?

If you can't find "Personal Access Tokens" section:

1. Try: https://sandbox.polar.sh/settings
2. Look for **"API"**, **"Developers"**, or **"Integrations"**
3. Check Polar documentation: https://polar.sh/docs
4. Or create a support ticket at Polar

---

**Once you get the `polar_at_` token, you're 99% done!** 🎉
