# Polar.sh Payment Flow - Complete Visual Guide

## 🔄 Payment Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                                 │
└─────────────────────────────────────────────────────────────────────┘

1. USER SIGNUP
   ┌──────────────┐
   │   Browser    │  User visits http://localhost:5173
   │ QuikThread   │  → Clicks "Sign Up"
   └──────┬───────┘  → Creates account
          │
          ▼
   ┌──────────────┐
   │ Onboarding   │  Step 1: Select Creator Type
   │    Flow      │  Step 2: Select Plan (Free/Pro/Business)
   └──────┬───────┘
          │
          ▼
          
2. PLAN SELECTION (If user selects Pro or Business)
   ┌─────────────────┐
   │ PlanSelection   │  User clicks on Pro ($20) or Business ($49)
   │   Component     │  → handlePlanSelection() called
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ polarService.ts │  polarService.createCheckout({
   │  (Frontend)     │    productId: "prod_xxxxx",
   │                 │    successUrl: "/checkout-success",
   └────────┬────────┘    customerEmail: user.email
            │           })
            │
            ▼
   ┌─────────────────┐
   │  Polar.sh API   │  POST /v1/checkouts
   │   (Sandbox)     │  Authorization: Bearer polar_at_xxxxx
   └────────┬────────┘
            │
            │ Returns checkout URL
            ▼
   ┌─────────────────┐
   │   REDIRECT!     │  window.location.href = checkoutUrl
   │ Browser → Polar │  https://sandbox.polar.sh/checkout/xxx
   └─────────────────┘

3. PAYMENT ON POLAR
   ┌─────────────────────┐
   │  Polar Checkout     │  User sees professional checkout page
   │   (Hosted Page)     │  → Enters card: 4242 4242 4242 4242
   └──────────┬──────────┘  → Completes payment
              │
              ▼
   ┌─────────────────────┐
   │ Payment Processing  │  Polar processes payment
   │   (Polar Backend)   │  → Creates subscription
   └──────────┬──────────┘  → Generates invoice
              │
              │
              ▼

4. WEBHOOK TRIGGER (This is where the magic happens!)
   ┌─────────────────────┐
   │   Polar Servers     │  Polar detects successful payment
   │                     │  → Prepares webhook payload
   └──────────┬──────────┘  → Signs with HMAC-SHA256
              │
              │ POST /api/webhooks/polar
              │ Header: webhook-signature: xxxxx
              │ Body: { type: "checkout.created", ... }
              ▼
   ┌─────────────────────┐
   │    Ngrok Tunnel     │  https://abc123.ngrok.io
   │   (Local Testing)   │  → Forwards to localhost:8000
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────────────────────────────┐
   │  QuikThread Backend                         │
   │  POST /api/webhooks/polar                   │
   │                                             │
   │  1. Receive webhook                         │
   │  2. Verify signature (HMAC-SHA256)          │
   │  3. Parse event data                        │
   │  4. Extract customer email                  │
   │  5. Find user in Firestore                  │
   │  6. Update user tier (free → pro/business)  │
   │  7. Update maxCredits                       │
   │  8. Enable features.postToX                 │
   │  9. Log event to webhook-logs collection    │
   │  10. Return 200 OK                          │
   └──────────┬──────────────────────────────────┘
              │
              ▼
   ┌─────────────────────┐
   │    Firestore DB     │  users/[uid]
   │                     │  {
   └──────────┬──────────┘    tier: "pro",
              │                maxCredits: 30,
              │                currentCredits: 30,
              │                features: { postToX: true }
              ▼              }
   ┌─────────────────────┐
   │  webhook-logs       │  New document with event details
   │   Collection        │  { eventType, status, timestamp, ... }
   └─────────────────────┘

5. USER REDIRECT BACK
   ┌─────────────────────┐
   │  Polar Checkout     │  After payment success
   │                     │  → Redirects to successUrl
   └──────────┬──────────┘
              │
              │ Redirect to:
              │ http://localhost:5173/#/checkout-success
              ▼
   ┌─────────────────────┐
   │ CheckoutSuccess.tsx │  Shows success message
   │   (Frontend)        │  "Welcome to Pro!"
   └──────────┬──────────┘  → Fetches updated user profile
              │              → Shows new tier & credits
              ▼
   ┌─────────────────────┐
   │   Dashboard         │  User continues to use app
   │                     │  → Can now post to X
   └─────────────────────┘  → Has 30 credits (Pro)


══════════════════════════════════════════════════════════════════

                      SYSTEM ARCHITECTURE

┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  http://localhost:5173                                          │
│                                                                 │
│  Components:                                                    │
│  ├── PlanSelectionStep.tsx  (Onboarding)                       │
│  ├── Billing.tsx            (Subscription Management)           │
│  ├── CheckoutSuccess.tsx    (Post-payment)                      │
│  └── polarService.ts        (Polar SDK wrapper)                 │
│                                                                 │
│  Environment:                                                   │
│  ├── VITE_POLAR_ACCESS_TOKEN=polar_at_xxxxx                    │
│  ├── VITE_POLAR_PRODUCT_ID_PRO=prod_xxxxx                      │
│  └── VITE_POLAR_PRODUCT_ID_BUSINESS=prod_xxxxx                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ API Calls (HTTPS)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     POLAR.SH (SANDBOX)                          │
│  https://sandbox.polar.sh                                       │
│                                                                 │
│  Products:                                                      │
│  ├── Pro Plan        ($20/month)  → prod_xxxxx                 │
│  └── Business Plan   ($49/month)  → prod_xxxxx                 │
│                                                                 │
│  Webhooks:                                                      │
│  └── https://abc123.ngrok.io/api/webhooks/polar                │
│       Events: checkout.created, subscription.updated, etc.     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ Webhook (HTTPS POST)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NGROK TUNNEL                                 │
│  https://abc123.ngrok.io → http://localhost:8000               │
│                                                                 │
│  Purpose: Expose local backend to internet for webhooks        │
│  Dashboard: http://localhost:4040                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI)                             │
│  http://localhost:8000                                          │
│                                                                 │
│  Endpoints:                                                     │
│  └── POST /api/webhooks/polar                                  │
│       ├── Verify HMAC signature                                │
│       ├── Process event                                        │
│       ├── Update user tier                                     │
│       └── Log to Firestore                                     │
│                                                                 │
│  Environment:                                                   │
│  └── POLAR_WEBHOOK_SECRET=whsec_xxxxx                          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ Firebase Admin SDK
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FIRESTORE DATABASE                          │
│                                                                 │
│  Collections:                                                   │
│  ├── users/                                                     │
│  │   └── [uid]/                                                │
│  │       ├── email: "user@example.com"                         │
│  │       ├── tier: "pro"                                       │
│  │       ├── maxCredits: 30                                    │
│  │       ├── currentCredits: 30                                │
│  │       └── features: { postToX: true }                       │
│  │                                                              │
│  └── webhook-logs/                                             │
│      └── [auto-id]/                                            │
│          ├── eventType: "checkout.created"                     │
│          ├── status: "success"                                 │
│          ├── timestamp: [ISO 8601]                             │
│          └── eventData: { ... }                                │
└─────────────────────────────────────────────────────────────────┘


══════════════════════════════════════════════════════════════════

                    ENVIRONMENT VARIABLES MAP

┌─────────────────────────────────────────────────────────────────┐
│  WHERE TO GET EACH VALUE                                        │
└─────────────────────────────────────────────────────────────────┘

1. VITE_POLAR_ACCESS_TOKEN (Frontend .env)
   ┌────────────────────────────────────────────┐
   │ Polar Dashboard → Settings → API Tokens   │
   │ → Create Token (Sandbox mode ON)          │
   │ → Copy: polar_at_xxxxxxxxxxxxx            │
   └────────────────────────────────────────────┘
   Usage: Authenticate API calls to create checkouts

2. VITE_POLAR_PRODUCT_ID_PRO (Frontend .env)
   ┌────────────────────────────────────────────┐
   │ Polar Dashboard → Products                 │
   │ → Create "Pro Plan" ($20/month)            │
   │ → Copy Product ID: prod_xxxxxxxxxx         │
   └────────────────────────────────────────────┘
   Usage: Identifies which product to sell

3. VITE_POLAR_PRODUCT_ID_BUSINESS (Frontend .env)
   ┌────────────────────────────────────────────┐
   │ Polar Dashboard → Products                 │
   │ → Create "Business Plan" ($49/month)       │
   │ → Copy Product ID: prod_xxxxxxxxxx         │
   └────────────────────────────────────────────┘
   Usage: Identifies which product to sell

4. POLAR_WEBHOOK_SECRET (Backend .env)
   ┌────────────────────────────────────────────┐
   │ Polar Dashboard → Settings → Webhooks     │
   │ → Add Webhook                              │
   │ → URL: https://your-ngrok.io/api/...      │
   │ → Copy Secret: whsec_xxxxxxxxxx            │
   └────────────────────────────────────────────┘
   Usage: Verify webhook signatures (security)


══════════════════════════════════════════════════════════════════

                      DATA FLOW EXAMPLE

User: test@example.com selects Pro Plan ($20/month)

1. Frontend creates checkout:
   {
     "product_id": "prod_123abc",
     "customer_email": "test@example.com",
     "success_url": "http://localhost:5173/#/checkout-success"
   }

2. Polar returns:
   {
     "url": "https://sandbox.polar.sh/checkout/ch_xyz789"
   }

3. User completes payment on Polar page

4. Polar sends webhook to backend:
   {
     "type": "checkout.created",
     "data": {
       "customer_email": "test@example.com",
       "product": {
         "id": "prod_123abc",
         "name": "Pro Plan"
       },
       "amount": 2000,  // $20.00
       "currency": "USD"
     }
   }

5. Backend updates Firestore:
   users/[uid] = {
     "tier": "pro",
     "maxCredits": 30,
     "currentCredits": 30,
     "features": {
       "postToX": true
     }
   }

6. User sees: "Welcome to Pro!" 🎉
```

## 📝 Quick Reference

### Test Card Numbers
- ✅ Success: `4242 4242 4242 4242`
- ❌ Decline: `4000 0000 0000 0002`
- Use any future date, any CVC, any ZIP

### Important URLs
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Ngrok Web: `http://localhost:4040`
- Polar Sandbox: `https://sandbox.polar.sh`

### Key Files
- Frontend service: `frontend/src/lib/polarService.ts`
- Onboarding: `frontend/src/components/onboarding/PlanSelectionStep.tsx`
- Billing page: `frontend/src/pages/Billing.tsx`
- Success page: `frontend/src/pages/CheckoutSuccess.tsx`
- Backend webhook: `quikthread-backend/routes/webhooks.py`

---

**Now you understand the complete flow!** 🚀 Follow the test checklist to see it in action.
