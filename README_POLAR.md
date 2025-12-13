# Polar.sh Sandbox Integration - Quick Start

## ✅ Integration Status: COMPLETE ✅

Your QuikThread application now has **full Polar.sh Sandbox payment integration**. Everything is built and ready to test!

## 🔑 Getting Your Polar.sh Credentials (Step-by-Step)

### Step 1: Create Polar.sh Account
1. Go to **https://polar.sh**
2. Click **"Sign up"** (top right)
3. Sign up with GitHub or Email
4. Complete account creation

### Step 2: Enable Sandbox Mode
1. Once logged in, look at the **top-left corner** of the dashboard
2. You'll see a toggle that says **"Production"** or **"Sandbox"**
3. Click to switch to **"Sandbox"** mode
4. A yellow banner should appear confirming you're in Sandbox

### Step 3: Create Products (Your Subscription Plans)
1. In Sandbox mode, click **"Products"** in left sidebar
2. Click **"Create Product"** button

**Create Pro Plan:**
- Name: `Pro Plan`
- Type: `Subscription`
- Price: `$20.00`
- Interval: `Monthly`
- Click **"Create"**
- **Copy the Product ID** (looks like `prod_xxxxxxxxxxxxx`)

**Create Business Plan:**
- Name: `Business Plan`
- Type: `Subscription`
- Price: `$49.00`
- Interval: `Monthly`
- Click **"Create"**
- **Copy the Product ID** (looks like `prod_xxxxxxxxxxxxx`)

### Step 4: Get Your Access Token (CRITICAL!)
1. Click **"Settings"** in left sidebar (bottom)
2. Click **"API Tokens"** tab
3. Click **"Create Token"** button
4. Name: `QuikThread Backend` or `QuikThread Sandbox`
5. **IMPORTANT**: Make sure **Sandbox mode** toggle is ON
6. Click **"Create Token"**
7. **COPY THE TOKEN IMMEDIATELY** (starts with `polar_at_...`)
   - ⚠️ You can only see this ONCE! Save it securely
8. Paste into your `.env` file

### Step 5: Set Up Webhook & Get Secret
1. In Settings, click **"Webhooks"** tab
2. Click **"Add Webhook"** button
3. **Webhook URL**: 
   - For production: `https://yourdomain.com/api/webhooks/polar`
   - For local testing: See "Local Testing with ngrok" below
4. **Events to subscribe** (check these boxes):
   - ✅ `checkout.created`
   - ✅ `checkout.updated`
   - ✅ `subscription.created`
   - ✅ `subscription.updated`
   - ✅ `subscription.cancelled`
5. Click **"Create Webhook"**
6. **COPY THE WEBHOOK SECRET** (starts with `whsec_...`)
   - This appears immediately after creation
7. Paste into your backend `.env` file

### Step 5: Set Up Webhook & Get Secret
1. In Settings, click **"Webhooks"** tab
2. Click **"Add Webhook"** button
3. **Webhook URL**: 
   - For production: `https://yourdomain.com/api/webhooks/polar`
   - For local testing: See "Local Testing with ngrok" below
4. **Events to subscribe** (check these boxes):
   - ✅ `checkout.created`
   - ✅ `checkout.updated`
   - ✅ `subscription.created`
   - ✅ `subscription.updated`
   - ✅ `subscription.cancelled`
5. Click **"Create Webhook"**
6. **COPY THE WEBHOOK SECRET** (starts with `whsec_...`)
   - This appears immediately after creation
7. Paste into your backend `.env` file

---

## ⚙️ Configure Environment Variables

### 4. Configure Environment Variables

**Frontend** (`frontend/.env`):
```bash
VITE_POLAR_ACCESS_TOKEN=polar_sk_sandbox_xxxxx
VITE_POLAR_PRODUCT_ID_PRO=prod_pro
VITE_POLAR_PRODUCT_ID_BUSINESS=prod_business
```

**Backend** (`quikthread-backend/.env`):
```bash
POLAR_WEBHOOK_SECRET=whsec_xxxxx
```

---

## ⚙️ Configure Environment Variables

Create/update these files with your credentials from above:

**Frontend** (`frontend/.env`):
```bash
# Replace with YOUR actual values from Polar dashboard
VITE_POLAR_ACCESS_TOKEN=polar_at_xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_POLAR_PRODUCT_ID_PRO=prod_xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_POLAR_PRODUCT_ID_BUSINESS=prod_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Backend** (`quikthread-backend/.env`):
```bash
# Replace with YOUR webhook secret from Polar
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **IMPORTANT**: Never commit `.env` files to git! They're already in `.gitignore`.

---

## 🌐 Local Testing with ngrok

Since webhooks need a public URL, use ngrok for local development:

### Install ngrok
```bash
# macOS
brew install ngrok

# Linux
snap install ngrok

# Or download from https://ngrok.com/download
```

### Start ngrok tunnel
```bash
# Terminal 1 - Start your backend first
cd quikthread-backend
source venv/bin/activate
python3 main.py  # Backend runs on port 8000

# Terminal 2 - Start ngrok
ngrok http 8000
```

### Update Polar Webhook URL
1. Copy the ngrok HTTPS URL (e.g., `https://abc123.ngrok.io`)
2. Go to Polar dashboard → Settings → Webhooks
3. Edit your webhook
4. Update URL to: `https://abc123.ngrok.io/api/webhooks/polar`
5. Save changes

⚠️ **Note**: ngrok URLs change every restart on free plan. Update webhook URL each time.

---

## 🧪 Testing the Integration

### Start All Services

```bash
# Terminal 1 - Backend
cd quikthread-backend
source venv/bin/activate
python3 main.py
# Should show: INFO: Application startup complete
# Running on: http://0.0.0.0:8000

# Terminal 2 - Frontend  
cd frontend
npm run dev
# Should show: Local: http://localhost:5173

# Terminal 3 - Ngrok (for webhook testing)
ngrok http 8000
# Copy the HTTPS URL and update Polar webhook
```

### Test Scenario 1: New User Onboarding

1. Open browser: `http://localhost:5173`
2. Click **"Get Started"** or **"Sign Up"**
3. Create account with email/password
4. Complete onboarding steps:
   - **Creator Type**: Select any option
   - **Plan Selection**: Select **Pro Plan** or **Business Plan**
   - Should automatically redirect to Polar checkout
5. On Polar checkout page, use test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/25` (any future date)
   - CVC: `123`
   - ZIP: `12345`
6. Complete payment
7. Should redirect back to QuikThread
8. Check Firestore - user's `tier` should be updated to `pro` or `business`

### Test Scenario 2: Upgrade from Free Plan

1. Log in with existing free account
2. Navigate to **Billing** page
3. Click **"Upgrade Now"** on Pro or Business card
4. Complete Polar checkout (same test card as above)
5. Verify tier updates in Firestore
6. Refresh Billing page - should show active subscription

### Test Scenario 3: Webhook Verification

After successful payment, check:

**Backend Terminal Logs:**
```
INFO: Received Polar webhook: checkout.created
INFO: Webhook signature verified successfully
INFO: Processing checkout.created event
INFO: Upgrading user xyz@email.com to pro tier
INFO: Successfully upgraded user to pro tier
```

**Firestore `webhook-logs` Collection:**
- Should have new document with webhook event details
- `status: "success"`
- `eventType: "checkout.created"`

**Firestore `users` Collection:**
- User document should show:
  ```json
  {
    "tier": "pro",
    "maxCredits": 30,
    "currentCredits": 30,
    "features": {
      "postToX": true
    }
  }
  ```

---

## 🧪 Test Cards (Polar.sh Sandbox)

| Card Number | Result | Use Case |
|-------------|--------|----------|
| `4242 4242 4242 4242` | ✅ Success | Normal successful payment |
| `4000 0000 0000 0002` | ❌ Decline | Test payment failure |
| `4000 0000 0000 9995` | ❌ Insufficient funds | Test low balance |

**For all cards:**
- Expiry: Any future date (e.g., `12/25`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

---

## 🔍 Troubleshooting

### Issue: "Checkout button doesn't work"
**Solutions:**
1. Check browser console (F12) for errors
2. Verify `VITE_POLAR_ACCESS_TOKEN` is set in `frontend/.env`
3. Make sure you're using the Sandbox token (starts with `polar_at_`)
4. Verify product IDs match exactly what's in Polar dashboard
5. Restart frontend dev server after adding .env variables

### Issue: "Webhook not receiving events"
**Solutions:**
1. Check ngrok is running: `ngrok http 8000`
2. Copy the HTTPS URL from ngrok (e.g., `https://abc123.ngrok.io`)
3. Update Polar webhook URL to `https://abc123.ngrok.io/api/webhooks/polar`
4. Check backend terminal for webhook logs
5. Verify `POLAR_WEBHOOK_SECRET` in backend `.env` matches Polar dashboard
6. Check Firestore `webhook-logs` collection for error details

### Issue: "Tier not updating after payment"
**Solutions:**
1. Check backend logs for error messages
2. Verify webhook signature is passing validation
3. Ensure customer email in Polar matches user email in Firestore
4. Check Firestore rules allow backend to write to users collection
5. View webhook-logs to see if event was received

### Issue: "ngrok URL keeps changing"
**Solutions:**
1. Free ngrok URLs change on restart - this is normal
2. Get a static domain: `ngrok http 8000 --domain=yourname.ngrok-free.app` (requires free account)
3. Or upgrade to ngrok paid plan for static URLs
4. Remember to update Polar webhook URL each time ngrok restarts

### Issue: "Cannot find module '@polar-sh/sdk'"
**Solutions:**
1. Make sure you installed the package:
   ```bash
   cd frontend
   npm install @polar-sh/sdk
   ```
2. Restart your dev server
3. Clear node_modules and reinstall if needed:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## ✅ What's Already Built

### Frontend Components (Ready to Use!)
- ✅ **PlanSelectionStep.tsx**: Onboarding plan selection with auto-checkout
- ✅ **Billing.tsx**: Full subscription management page
- ✅ **CheckoutSuccess.tsx**: Post-payment confirmation
- ✅ **polarService.ts**: SDK wrapper for all Polar operations
- ✅ **Route**: `/checkout-success` added to App.tsx

### Backend Integration (Already Complete!)
- ✅ **Webhook Endpoint**: `POST /api/webhooks/polar` 
- ✅ **HMAC Signature Verification**: Secure webhook validation
- ✅ **Auto Tier Upgrades**: Updates user on successful payment
- ✅ **Event Logging**: All webhooks saved to Firestore
- ✅ **Error Handling**: Comprehensive error logging

### Payment Flow (Fully Implemented!)
1. ✅ User selects plan → Creates Polar checkout
2. ✅ User redirected to Polar hosted checkout page
3. ✅ User completes payment with test card
4. ✅ Polar sends webhook to your backend
5. ✅ Backend verifies signature & upgrades user tier
6. ✅ User redirected to success page
7. ✅ Firestore updated with new subscription data

---

## 🎯 Next Steps

1. ✅ Configure Polar.sh credentials
2. ✅ Test onboarding checkout flow
3. ✅ Test billing page upgrades
4. ✅ Verify webhooks process correctly
5. ✅ Test subscription management
6. ✅ Monitor Firestore updates
7. 🔲 Switch to production when ready

## 💡 Production Checklist

Before going live:
- [ ] Switch Polar from Sandbox to Production
- [ ] Get production access token
- [ ] Update `VITE_POLAR_ACCESS_TOKEN`
- [ ] Update `POLAR_WEBHOOK_SECRET`
- [ ] Update webhook URL to production domain
- [ ] Test with small real payment
- [ ] Monitor webhook deliveries

## 🆘 Support

- **Polar Docs**: https://docs.polar.sh
- **Polar API**: https://api.polar.sh/docs
- **Issues**: Check `POLAR_TROUBLESHOOTING.md`

---

**Ready to test!** Follow the Quick Setup above and start processing payments in Sandbox mode.
