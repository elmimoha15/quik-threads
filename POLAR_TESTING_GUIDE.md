# Polar.sh Sandbox Integration - Testing Guide

## Overview
This guide provides step-by-step instructions for testing the complete Polar.sh Sandbox integration in your QuikThread application.

## What Was Integrated

### 1. Frontend Components

#### A. Polar Service (`lib/polarService.ts`)
- Polar SDK initialization in sandbox mode
- Checkout creation and redirect
- Subscription management
- Invoice fetching
- Customer portal sessions

#### B. Onboarding Flow (`components/onboarding/PlanSelectionStep.tsx`)
- Plan selection with visual feedback
- Automatic checkout redirect for Pro/Business plans
- Free plan selection (no checkout required)
- Loading states during checkout redirect
- Error handling with user-friendly messages

#### C. Billing Page (`pages/Billing.tsx`)
- Real-time subscription status display
- Current usage tracking (credits/generations)
- Upgrade buttons for all plans
- Payment method status indicator
- Manage subscription button (opens Polar customer portal)
- Real invoice history from Polar
- Invoice download links
- Success notifications after upgrade

#### D. Checkout Success Page (`pages/CheckoutSuccess.tsx`)
- Post-payment confirmation screen
- Automatic profile refresh to get updated tier
- Display of new plan benefits
- Error handling for failed webhook processing

### 2. Backend Components (Already Implemented)

- Webhook endpoint: `POST /api/webhooks/polar`
- Signature verification (HMAC-SHA256)
- Event handling (checkout success, subscription cancellation)
- User tier upgrades/downgrades
- Firestore logging

## Testing Checklist

### Pre-Testing Setup

- [ ] **Polar.sh Account**: Created and verified
- [ ] **Sandbox Mode**: Enabled in Polar dashboard
- [ ] **Products Created**:
  - [ ] Pro Plan ($20/month) with ID: `prod_pro`
  - [ ] Business Plan ($49/month) with ID: `prod_business`
- [ ] **Access Token**: Copied from Polar dashboard
- [ ] **Webhook Configured**:
  - [ ] URL: `https://your-domain.com/api/webhooks/polar`
  - [ ] Events: checkout.created, checkout.updated, subscription.cancelled
  - [ ] Secret copied
- [ ] **Environment Variables Set**:
  - [ ] Frontend `.env`: VITE_POLAR_ACCESS_TOKEN
  - [ ] Backend `.env`: POLAR_WEBHOOK_SECRET
- [ ] **Services Running**:
  - [ ] Backend: `python3 main.py` (port 8000)
  - [ ] Frontend: `npm run dev` (port 5173)

### Test 1: Onboarding - Free Plan Selection

**Goal**: Verify free plan can be selected without payment

**Steps**:
1. Sign up as a new user
2. Complete onboarding steps until plan selection
3. Click on "Free Tier" plan
4. Click "Continue" button
5. Complete remaining onboarding steps

**Expected Results**:
- [x] Free plan can be selected
- [x] No checkout redirect occurs
- [x] Onboarding completes successfully
- [x] User lands on dashboard
- [x] User tier in Firestore is "free"
- [x] maxCredits is 2

### Test 2: Onboarding - Pro Plan Checkout

**Goal**: Test full checkout flow from onboarding

**Steps**:
1. Sign up as a new user
2. Complete onboarding until plan selection
3. Click on "Pro Plan" card
4. Button should show "Continue to Checkout"
5. Click the button

**Expected Results**:
- [x] Loading message appears: "Redirecting to secure checkout..."
- [x] Browser redirects to Polar.sh hosted checkout page
- [x] Checkout page shows:
  - Product: Pro Plan
  - Price: $20/month
  - Email pre-filled with user's email

**Checkout Flow**:
6. Fill in test card details:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
7. Click "Subscribe" or "Pay"

**Expected Results After Payment**:
- [x] Redirected back to your app
- [x] Success toast notification appears
- [x] Onboarding completes automatically
- [x] User lands on dashboard
- [x] Webhook received by backend (check logs)
- [x] User tier updated to "pro" in Firestore
- [x] maxCredits updated to 30
- [x] features.postToX set to true

### Test 3: Onboarding - Business Plan Checkout

**Goal**: Test Business plan upgrade flow

**Steps**:
Same as Test 2, but select "Creator Plus" (Business) plan

**Expected Results**:
- [x] Checkout shows $49/month (or $64 based on your pricing)
- [x] After payment, tier updated to "business"
- [x] maxCredits updated to 100
- [x] features.postToX set to true
- [x] features.analytics set to true

### Test 4: Billing Page - View Current Plan

**Goal**: Verify billing page shows correct subscription info

**Steps**:
1. Log in as user with active subscription (from Test 2 or 3)
2. Navigate to Billing page

**Expected Results**:
- [x] Current plan badge shows correct tier name
- [x] Usage bar shows correct credits (e.g., "30 / 30 generations remaining")
- [x] "Active Subscription" section appears
- [x] Renewal date is displayed
- [x] "Manage Subscription" button is visible
- [x] Current plan card has "Current Plan" badge
- [x] Other plans show "Upgrade Now" button

### Test 5: Billing Page - Upgrade Plan

**Goal**: Test upgrading from Pro to Business

**Steps**:
1. Log in as user with Pro plan
2. Go to Billing page
3. Click "Upgrade Now" on Business plan
4. Complete checkout with test card
5. Return to app

**Expected Results**:
- [x] Checkout redirect works
- [x] Payment processes successfully
- [x] Redirected back to billing page
- [x] Success toast appears
- [x] Page refreshes to show Business plan as current
- [x] Credits updated to 100
- [x] Analytics feature enabled

### Test 6: Billing Page - Manage Subscription

**Goal**: Test opening Polar customer portal

**Steps**:
1. Log in as user with active subscription
2. Go to Billing page
3. Click "Manage Subscription" button

**Expected Results**:
- [x] New tab/window opens with Polar customer portal
- [x] Portal shows current subscription details
- [x] User can update payment method
- [x] User can view billing history
- [x] User can cancel subscription

### Test 7: Subscription Cancellation

**Goal**: Test subscription cancellation flow

**Steps**:
1. In Polar customer portal (from Test 6)
2. Click "Cancel Subscription"
3. Confirm cancellation
4. Return to your app
5. Refresh billing page

**Expected Results**:
- [x] Cancellation webhook received by backend
- [x] User tier downgraded to "free" in Firestore
- [x] maxCredits reset to 2
- [x] features reset to defaults
- [x] Billing page shows "Free Tier" as current plan
- [x] Subscription shows "Cancels on [date]"

### Test 8: Invoice Display

**Goal**: Verify invoices appear correctly

**Steps**:
1. Log in as user with payment history
2. Go to Billing page
3. Scroll to "Billing History" section

**Expected Results**:
- [x] Past invoices are listed
- [x] Each invoice shows:
  - Invoice ID
  - Date
  - Amount
  - Status (Paid/Open)
- [x] Download button appears for paid invoices
- [x] Clicking download opens PDF invoice

### Test 9: Payment Method Indicator

**Goal**: Test payment method status display

**Steps**:
1. Log in as free user (no subscription)
2. Go to Billing page
3. Check "Payment Method" section

**Expected Results**:
- [x] Shows "No payment method on file"
- [x] "Add Card" button appears
- [x] Clicking "Add Card" starts Pro upgrade flow

**With Subscription**:
4. Log in as user with active subscription
5. Go to Billing page

**Expected Results**:
- [x] Shows "Payment method on file"
- [x] Shows "Managed through Polar.sh"
- [x] "Manage Payment" button appears
- [x] Clicking button opens customer portal

### Test 10: Error Handling

**Goal**: Test error scenarios

#### A. Invalid Access Token
1. Set wrong `VITE_POLAR_ACCESS_TOKEN` in frontend .env
2. Try to upgrade plan

**Expected Results**:
- [x] Error toast appears
- [x] User not redirected
- [x] Error logged to console

#### B. Invalid Product ID
1. Set wrong product ID in .env
2. Try to select paid plan in onboarding

**Expected Results**:
- [x] Error toast appears
- [x] User stays on plan selection

#### C. Webhook Signature Mismatch
1. Set wrong `POLAR_WEBHOOK_SECRET` in backend .env
2. Complete checkout

**Expected Results**:
- [x] Payment succeeds in Polar
- [x] Webhook returns 401
- [x] User tier NOT updated
- [x] Event logged as failed in webhook-logs

### Test 11: Free Plan User Experience

**Goal**: Ensure free users have proper experience

**Steps**:
1. Log in as free tier user
2. Navigate through app

**Expected Results**:
- [x] Billing page shows "Upgrade Your Plan" header
- [x] All upgrade buttons work
- [x] No "Manage Subscription" button
- [x] No active subscription section
- [x] Payment method shows "No payment method on file"

### Test 12: Loading States

**Goal**: Verify all loading states work correctly

**Steps**:
1. Go to Billing page
2. Observe initial load

**Expected Results**:
- [x] Loading spinner appears
- [x] "Loading billing information..." message
- [x] Content appears after data loads

**During Upgrade**:
3. Click "Upgrade Now"

**Expected Results**:
- [x] Processing message appears
- [x] "Redirecting to secure checkout..." shown
- [x] Other buttons disabled

## Monitoring & Validation

### Firestore Collections to Check

#### users collection
After successful checkout, verify:
```json
{
  "tier": "pro", // or "business"
  "maxCredits": 30, // or 100
  "currentCredits": 30,
  "features": {
    "postToX": true,
    "analytics": false // true for business
  },
  "updatedAt": "2024-12-07T..."
}
```

#### webhook-logs collection
After each webhook event:
```json
{
  "eventType": "checkout.created",
  "status": "success",
  "timestamp": "2024-12-07T...",
  "eventData": {
    "customer_email": "user@example.com",
    "product_id": "prod_pro"
  }
}
```

### Backend Logs to Monitor

Look for these log messages:
- `Received Polar webhook: checkout.created`
- `Upgrading user [id] to [tier] tier`
- `Successfully upgraded user [id]`
- `Webhook event logged successfully`

### Polar Dashboard to Monitor

Check these sections:
- **Customers**: New customer created after first purchase
- **Subscriptions**: Active subscription appears
- **Webhooks**: All webhook deliveries show 200 status
- **Invoices**: Invoice generated after payment

## Common Issues & Solutions

### Issue: Checkout redirect fails
**Solution**: 
- Verify `VITE_POLAR_ACCESS_TOKEN` is set correctly
- Check product IDs match
- Ensure Polar SDK initialized in sandbox mode

### Issue: User tier not updating after payment
**Solution**:
- Check webhook-logs for errors
- Verify `POLAR_WEBHOOK_SECRET` matches
- Ensure backend is accessible from Polar
- Check customer email matches user email

### Issue: Invoices not appearing
**Solution**:
- Wait a few minutes (Polar generates invoices async)
- Refresh billing page
- Check browser console for API errors
- Verify Polar customer ID is correct

### Issue: "Manage Subscription" button doesn't work
**Solution**:
- Check customer exists in Polar
- Verify customer portal API is working
- Check browser popup blocker

### Issue: Webhook signature verification fails
**Solution**:
- Ensure webhook secret is NOT base64 encoded in .env
- Verify secret matches Polar dashboard
- Check header name is correct (webhook-signature)

## Test Data

### Test Cards (Sandbox)
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`

### Test User Emails
Use any email format for testing:
- `test+pro@example.com`
- `test+business@example.com`
- `test+free@example.com`

## Success Criteria

All tests pass when:
- [x] Free plan works without payment
- [x] Pro plan checkout completes successfully
- [x] Business plan checkout completes successfully
- [x] Webhooks process correctly
- [x] User tiers update in Firestore
- [x] Billing page shows correct data
- [x] Subscriptions can be managed
- [x] Cancellations work correctly
- [x] Invoices display properly
- [x] Error states handle gracefully
- [x] Loading states appear correctly
- [x] No console errors during normal flow

## Next Steps After Testing

1. **Review Test Results**: Document any issues found
2. **Fix Bugs**: Address any failing tests
3. **Production Preparation**:
   - Get production Polar access token
   - Update product IDs for production
   - Switch Polar mode from sandbox to production
   - Update webhook URL to production domain
   - Test with small real payment
4. **Deploy**: Push to production after all tests pass
5. **Monitor**: Watch webhook deliveries and user tier updates

## Support

If you encounter issues:
1. Check this testing guide for solutions
2. Review `POLAR_WEBHOOK_INTEGRATION.md`
3. Review `POLAR_SANDBOX_SETUP.md`
4. Check Polar.sh documentation
5. Inspect webhook-logs in Firestore
6. Check backend application logs
