# 🎯 WEBHOOK URL SETUP - Visual Guide

## ❌ WRONG URL (Don't use this!)

```
https://localhost:5173/api/webhooks/polar  ← This is your FRONTEND (wrong!)
```

## ✅ CORRECT URL (Use this!)

```
https://YOUR-NGROK-URL.ngrok-free.app/api/webhooks/polar  ← This is your BACKEND (correct!)
```

---

## 📸 Step-by-Step Visual Guide

### Step 1: Get Your Ngrok URL

**Open a new terminal and run:**
```bash
ngrok http 8000
```

**You'll see output like this:**
```
ngrok                                                                                               

Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:8000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Copy this URL:** `https://abc123def456.ngrok-free.app`

⚠️ **Your URL will be different!** It changes every time you restart ngrok.

---

### Step 2: Build Your Webhook URL

Take your ngrok URL and add `/api/webhooks/polar` to the end:

**Ngrok URL**: `https://abc123def456.ngrok-free.app`  
**Add**: `/api/webhooks/polar`  
**Final Webhook URL**: `https://abc123def456.ngrok-free.app/api/webhooks/polar`

---

### Step 3: Configure in Polar Dashboard

1. **Go to Polar.sh and log in**
   - URL: https://polar.sh
   - Make sure the toggle says **"Sandbox"** (top-left corner)

2. **Navigate to Settings**
   ```
   [Dashboard] → [Settings] (bottom of left sidebar) → [Webhooks] tab
   ```

3. **Add or Edit Webhook**
   - If no webhook exists: Click **"Add Webhook"**
   - If webhook exists: Click **"Edit"** button

4. **Enter Webhook URL**
   
   **In the "URL" field, paste:**
   ```
   https://abc123def456.ngrok-free.app/api/webhooks/polar
   ```
   (Use YOUR actual ngrok URL, not this example!)

5. **Select Events**
   
   Check these boxes:
   - ☑️ `checkout.created`
   - ☑️ `checkout.updated`
   - ☑️ `subscription.created`
   - ☑️ `subscription.updated`
   - ☑️ `subscription.cancelled`

6. **Save**
   - Click **"Create Webhook"** or **"Save Changes"**
   - You should see the webhook listed with status "Active"

---

## 🔍 How to Verify It's Working

### Method 1: Check Ngrok Dashboard

1. Open http://localhost:4040 in your browser
2. This shows all HTTP requests going through ngrok
3. After a payment, you should see a POST request to `/api/webhooks/polar`

### Method 2: Check Backend Logs

In your backend terminal, after a successful payment, you should see:
```
INFO:     POST /api/webhooks/polar HTTP/1.1
INFO:     Received Polar webhook: checkout.created
INFO:     Webhook signature verified successfully
INFO:     Processing checkout.created event
INFO:     Upgrading user test@example.com to pro tier
INFO:     Successfully upgraded user to pro tier
```

### Method 3: Check Polar Dashboard

1. Go to Polar → Settings → Webhooks
2. Click on your webhook
3. You should see "Recent Deliveries" showing successful deliveries
4. Status should show "200 OK"

---

## 🔄 When to Update Webhook URL

**You need to update the webhook URL in Polar when:**

1. ✅ You restart ngrok (URL changes on free plan)
2. ✅ You switch computers
3. ✅ Ngrok session expires

**You DON'T need to update when:**
- ❌ You restart your backend (URL stays same)
- ❌ You restart your frontend (URL stays same)
- ❌ You update code (URL stays same)

---

## 💡 Pro Tips

### Keep Ngrok Running
Once you start ngrok, **keep that terminal open**. If you close it, the URL stops working.

### Get a Static URL (Optional)
Free ngrok accounts can get ONE static domain:
```bash
ngrok http 8000 --domain=yourname.ngrok-free.app
```
Then you never need to update the webhook URL!

### Monitor Webhook Activity
Keep ngrok dashboard open: http://localhost:4040
You can see real-time webhook requests and responses.

---

## 📋 Quick Checklist

Before testing payments:

- [ ] Backend running on port 8000
- [ ] Ngrok running and showing HTTPS URL
- [ ] Copied ngrok HTTPS URL (not HTTP)
- [ ] Built complete webhook URL: `https://YOUR-URL/api/webhooks/polar`
- [ ] Updated Polar webhook URL in dashboard
- [ ] Events enabled in Polar webhook settings
- [ ] Webhook shows "Active" status in Polar

---

## 🚨 Common Mistakes

### Mistake 1: Using localhost
```
❌ https://localhost:8000/api/webhooks/polar
✅ https://abc123.ngrok-free.app/api/webhooks/polar
```

### Mistake 2: Using frontend port
```
❌ https://abc123.ngrok-free.app:5173/api/webhooks/polar
✅ https://abc123.ngrok-free.app/api/webhooks/polar
```

### Mistake 3: Using HTTP instead of HTTPS
```
❌ http://abc123.ngrok-free.app/api/webhooks/polar
✅ https://abc123.ngrok-free.app/api/webhooks/polar
```

### Mistake 4: Wrong path
```
❌ https://abc123.ngrok-free.app/webhooks/polar
❌ https://abc123.ngrok-free.app/polar
✅ https://abc123.ngrok-free.app/api/webhooks/polar
```

---

## ✅ You're All Set!

**Configuration Status:**
- ✅ Product IDs configured in frontend `.env`
- ✅ Access token configured in frontend `.env`
- ✅ Webhook secret configured in backend `.env`
- ⏳ Webhook URL needs to be set in Polar (do this now!)

**Next:** Follow the steps above to set your webhook URL, then test a payment!

---

**Need help?** Open `YOUR_POLAR_SETUP.md` for the complete testing guide.
