# Polar.sh Quick Test Checklist ✅

Use this checklist to quickly set up and test Polar payments in Sandbox mode.

## 📋 Pre-Test Setup (One-Time)

### 1. Get Polar Credentials

- [ ] Go to https://polar.sh and create account
- [ ] Switch to **Sandbox mode** (toggle at top-left)
- [ ] Create **Pro Plan** product ($20/month)
  - Copy Product ID: `prod_________________`
- [ ] Create **Business Plan** product ($49/month)
  - Copy Product ID: `prod_________________`
- [ ] Settings → API Tokens → Create Token
  - Copy Access Token: `polar_at_________________`
- [ ] Settings → Webhooks → Add Webhook
  - Copy Webhook Secret: `whsec_________________`

### 2. Configure Environment Files

**Frontend `.env`** (create if doesn't exist):
```bash
cd frontend
touch .env
```

Add these lines (replace with YOUR values):
```
VITE_POLAR_ACCESS_TOKEN=polar_at_YOUR_TOKEN_HERE
VITE_POLAR_PRODUCT_ID_PRO=prod_YOUR_PRO_ID_HERE
VITE_POLAR_PRODUCT_ID_BUSINESS=prod_YOUR_BUSINESS_ID_HERE
```

**Backend `.env`** (should already exist):
```bash
cd quikthread-backend
```

Add this line (replace with YOUR value):
```
POLAR_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```

### 3. Install Dependencies

- [ ] Frontend has @polar-sh/sdk installed
  ```bash
  cd frontend
  npm install @polar-sh/sdk
  ```

- [ ] Backend dependencies installed
  ```bash
  cd quikthread-backend
  source venv/bin/activate
  pip install -r requirements.txt
  ```

---

## 🚀 Test Day Checklist

### Terminal Setup (3 terminals needed)

**Terminal 1 - Backend:**
```bash
cd quikthread-backend
source venv/bin/activate
python3 main.py
```
- [ ] Backend started successfully
- [ ] Shows: "Application startup complete"

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
- [ ] Frontend started successfully
- [ ] Shows: "Local: http://localhost:5173"

**Terminal 3 - Ngrok:**
```bash
ngrok http 8000
```
- [ ] Ngrok tunnel created
- [ ] Copy HTTPS URL (e.g., `https://abc123.ngrok.io`)
- [ ] Update Polar webhook URL to: `https://abc123.ngrok.io/api/webhooks/polar`

---

## 🧪 Test Scenarios

### Scenario 1: New User Signup → Paid Plan

1. - [ ] Open http://localhost:5173
2. - [ ] Click "Get Started" or "Sign Up"
3. - [ ] Create account (email: `test@example.com`, password: `Test123!`)
4. - [ ] Select creator type (any option)
5. - [ ] Select **Pro Plan** or **Business Plan**
6. - [ ] Should redirect to Polar checkout automatically
7. - [ ] Enter test card details:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
   - ZIP: `12345`
8. - [ ] Complete payment
9. - [ ] Should redirect back to QuikThread
10. - [ ] Check backend terminal - should show webhook received
11. - [ ] Check Firestore users collection - tier should be updated

**Expected Results:**
- ✅ User tier: `pro` or `business`
- ✅ maxCredits: `30` or `100`
- ✅ features.postToX: `true`
- ✅ Webhook log in Firestore with status: `success`

---

### Scenario 2: Free User → Upgrade

1. - [ ] Log in with free account
2. - [ ] Navigate to "Billing" page
3. - [ ] Click "Upgrade Now" on a plan
4. - [ ] Complete Polar checkout (same test card)
5. - [ ] Verify tier upgraded in Firestore
6. - [ ] Refresh billing page
7. - [ ] Should show "Current Plan" updated

**Expected Results:**
- ✅ Plan badge shows "Pro" or "Business"
- ✅ Credits refreshed to new plan limit
- ✅ Twitter integration enabled

---

### Scenario 3: Webhook Verification

After completing a payment:

- [ ] **Backend Terminal Shows:**
  ```
  INFO: Received Polar webhook: checkout.created
  INFO: Webhook signature verified successfully
  INFO: Upgrading user test@example.com to pro tier
  INFO: Successfully upgraded user
  ```

- [ ] **Firestore `webhook-logs` Collection:**
  - New document created
  - `eventType: "checkout.created"`
  - `status: "success"`
  - `timestamp: [recent time]`

- [ ] **Firestore `users` Collection:**
  - User document updated
  - `tier` field changed to new plan
  - `maxCredits` updated
  - `features.postToX: true`

---

## 🐛 Quick Debug Commands

### Check if environment variables are loaded:
```bash
# Frontend
cd frontend
cat .env | grep POLAR

# Backend
cd quikthread-backend
cat .env | grep POLAR
```

### Check ngrok status:
```bash
curl http://localhost:4040/api/tunnels
# Or open http://localhost:4040 in browser
```

### Test backend webhook endpoint manually:
```bash
curl -X POST http://localhost:8000/api/webhooks/polar \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'
```

### View Firestore webhook logs:
1. Open Firebase Console
2. Go to Firestore Database
3. Open `webhook-logs` collection
4. Sort by timestamp (newest first)

---

## ✅ Success Criteria

You'll know everything works when:

1. ✅ Clicking plan in onboarding redirects to Polar checkout
2. ✅ Test card payment completes successfully
3. ✅ Backend receives and logs webhook event
4. ✅ User tier updates in Firestore
5. ✅ Billing page shows correct subscription
6. ✅ No errors in browser console
7. ✅ No errors in backend terminal

---

## 🎉 You're Done!

Once all checkboxes are complete, your Polar integration is working perfectly in Sandbox mode!

**To go to production:**
1. Switch Polar from Sandbox → Production
2. Create production products
3. Get production access token
4. Update all environment variables
5. Deploy with production webhook URL

---

## 📞 Need Help?

- Check `README_POLAR.md` for detailed instructions
- Check `POLAR_TROUBLESHOOTING.md` for common issues
- View backend logs for error details
- Check Firestore webhook-logs for event data
