# ✅ YOUR POLAR CONFIGURATION IS READY!

## 🎉 Product IDs Configured

I've updated your `.env` files with the correct Product IDs:

**Pro Plan**: `3a2469dd-6384-4945-b158-deac976dc461`  
**Business Plan**: `f3f7363c-2073-4935-a201-e0d29a756ba0`

---

## 🔧 Next Step: Set Up Webhook URL

### ⚠️ IMPORTANT: Webhook URL Confusion Cleared Up

**WRONG** ❌: `https://localhost:5173/api/webhooks/polar` (This is your frontend!)  
**CORRECT** ✅: `https://YOUR-NGROK-URL.ngrok.io/api/webhooks/polar` (This is your backend!)

### Why?
- `localhost:5173` = Frontend (React/Vite) - Shows the UI
- `localhost:8000` = Backend (FastAPI) - Processes webhooks
- Polar needs to send webhooks to your **BACKEND** on port 8000

---

## 📋 Step-by-Step: Set Up Webhook (Do This Now!)

### 1. Start Your Backend
```bash
cd quikthread-backend
source venv/bin/activate
python3 main.py
```

Wait until you see:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 2. Start Ngrok (In a NEW Terminal)
```bash
ngrok http 8000
```

You'll see something like:
```
Forwarding  https://abc123def456.ngrok-free.app -> http://localhost:8000
```

### 3. Copy Your Ngrok HTTPS URL
**Example**: `https://abc123def456.ngrok-free.app`

⚠️ **IMPORTANT**: 
- Use the **HTTPS** URL (not HTTP)
- Your URL will be different each time ngrok restarts
- Keep ngrok running while testing!

### 4. Configure Polar Webhook

1. Go to https://polar.sh (make sure you're in **Sandbox mode**)
2. Click **Settings** (bottom left)
3. Click **Webhooks** tab
4. Click **"Add Webhook"** or **"Edit"** if one exists

**Enter these settings:**

**Webhook URL**:
```
https://YOUR-NGROK-URL.ngrok-free.app/api/webhooks/polar
```
(Replace `YOUR-NGROK-URL.ngrok-free.app` with your actual ngrok URL)

**Example**:
```
https://abc123def456.ngrok-free.app/api/webhooks/polar
```

**Events to Enable** (check these boxes):
- ✅ `checkout.created`
- ✅ `checkout.updated`
- ✅ `subscription.created`
- ✅ `subscription.updated`
- ✅ `subscription.cancelled`

5. Click **"Save"** or **"Create Webhook"**

---

## ✅ Configuration Summary

**Frontend `.env`** (Already Updated ✅):
```bash
VITE_POLAR_ACCESS_TOKEN=polar_oat_IZj1lmHckWAAvFUU8KfCY2yR4y8VniNdEsq1q1qm22E
VITE_POLAR_PRODUCT_ID_PRO=3a2469dd-6384-4945-b158-deac976dc461
VITE_POLAR_PRODUCT_ID_BUSINESS=f3f7363c-2073-4935-a201-e0d29a756ba0
```

**Backend `.env`** (Already Updated ✅):
```bash
POLAR_WEBHOOK_SECRET=polar_whs_5ZrQ1kxewzcaL8tUpP3U3eSW0Z2WaEMLMOMEQ4e7Dj1
```

**Polar Webhook** (You need to set this):
```
https://YOUR-NGROK-URL/api/webhooks/polar
```

---

## 🧪 Ready to Test!

### Start All Services (3 Terminals)

**Terminal 1 - Backend:**
```bash
cd quikthread-backend
source venv/bin/activate
python3 main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Ngrok:**
```bash
ngrok http 8000
```

### Test the Payment Flow

1. Open browser: http://localhost:5173
2. Sign up with a new account
3. Complete onboarding
4. Select **Pro Plan** or **Business Plan**
5. You'll be redirected to Polar checkout
6. Use test card: `4242 4242 4242 4242`
7. Complete payment
8. Watch your backend terminal - you should see:
   ```
   INFO: Received Polar webhook: checkout.created
   INFO: Webhook signature verified successfully
   INFO: Upgrading user to pro tier
   ```

---

## 🔍 Verify It's Working

### Check Backend Logs
After payment, you should see in your backend terminal:
```
INFO: Received Polar webhook: checkout.created
INFO: Webhook signature verified successfully
INFO: Processing checkout.created event
INFO: Upgrading user test@example.com to pro tier
INFO: Successfully upgraded user to pro tier
```

### Check Firestore
1. Open Firebase Console
2. Go to Firestore Database
3. Check `users` collection - user should have:
   - `tier: "pro"` or `"business"`
   - `maxCredits: 30` or `100`
   - `features.postToX: true`
4. Check `webhook-logs` collection - should have new entry with:
   - `eventType: "checkout.created"`
   - `status: "success"`

---

## ⚠️ Troubleshooting

### "Webhook not receiving events"
1. ✅ Make sure ngrok is running
2. ✅ Copy the HTTPS URL from ngrok (not HTTP)
3. ✅ Update Polar webhook URL with your ngrok URL
4. ✅ Check backend is running on port 8000
5. ✅ View ngrok dashboard: http://localhost:4040

### "Payment completes but tier doesn't update"
1. ✅ Check backend terminal for error messages
2. ✅ Verify webhook secret matches in backend `.env`
3. ✅ Check Firestore `webhook-logs` for errors
4. ✅ Make sure customer email in Polar matches user email in Firestore

### "Frontend can't create checkout"
1. ✅ Restart frontend dev server after updating `.env`
2. ✅ Check browser console for errors (F12)
3. ✅ Verify access token and product IDs are correct
4. ✅ Make sure you're in Polar Sandbox mode

---

## 📞 Need Help?

- View ngrok requests: http://localhost:4040
- Check backend logs in terminal
- View Firestore webhook-logs collection
- Read `README_POLAR.md` for detailed guide

**Everything is configured! Just set up the webhook URL and start testing!** 🚀
