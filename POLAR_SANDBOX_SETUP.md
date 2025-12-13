# Polar.sh Sandbox Integration Guide

This guide will help you set up Polar.sh Sandbox for testing the payment flow.

## Step 1: Create Polar.sh Account

1. Go to [Polar.sh](https://polar.sh)
2. Sign up for a free account
3. Navigate to **Dashboard**

## Step 2: Switch to Sandbox Mode

1. In the Polar.sh dashboard, toggle to **Sandbox** mode
2. Sandbox mode allows testing without real payments

## Step 3: Create Products

Create two products in Polar.sh:

### Pro Plan Product
- **Name**: Pro Plan
- **Price**: $20/month
- **Billing Interval**: Monthly
- **Product ID**: `prod_pro` (or note the auto-generated ID)

### Business Plan Product
- **Name**: Business Plan
- **Price**: $49/month (or $64 based on your pricing)
- **Billing Interval**: Monthly
- **Product ID**: `prod_business` (or note the auto-generated ID)

## Step 4: Get Organization Access Token (OAT)

1. In your Polar.sh Sandbox dashboard, go to **Settings** (gear icon in sidebar)
2. Click on **General** tab (should be selected by default)
3. Scroll down to find **Organization Access Tokens** section
4. Click **"Create Token"** button
5. Give it a name (e.g., "QuikThread Development")
6. Copy the token immediately (starts with `polar_oat_...`)
   - **Important**: This token will only be shown once!
   - Store it securely in your password manager

**Note**: Organization Access Tokens (OAT) are used for server-side operations like creating checkouts, managing products, and handling webhooks.

## Step 5: Configure Webhook

1. Go to **Settings** → **Webhooks**
2. Click **Add Webhook**
3. Enter your webhook URL: `https://your-backend-domain.com/api/webhooks/polar`
   - For local testing with ngrok: `https://abc123.ngrok.io/api/webhooks/polar`
4. Select events to subscribe to:
   - `checkout.created`
   - `checkout.updated`
   - `order.created`
   - `subscription.cancelled`
   - `subscription.canceled`
5. Copy the **Webhook Secret** (starts with `whsec_...`)

## Step 6: Update Environment Variables

### Frontend (.env)

```bash
# Polar.sh Configuration (Sandbox)
VITE_POLAR_ACCESS_TOKEN=polar_sk_sandbox_your_token_here
VITE_POLAR_PRODUCT_ID_PRO=prod_pro
VITE_POLAR_PRODUCT_ID_BUSINESS=prod_business
```

### Backend (.env)

```bash
# Polar.sh Webhook Secret
POLAR_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Step 7: Test the Integration

### Test Onboarding Flow

1. Start your frontend: `cd frontend && npm run dev`
2. Start your backend: `cd quikthread-backend && python3 main.py`
3. Sign up as a new user
4. Go through onboarding
5. Select **Pro Plan** or **Business Plan**
6. You'll be redirected to Polar.sh sandbox checkout
7. Use test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code

### Test Billing Page

1. Log in to your app
2. Navigate to **Billing** page
3. Click **Upgrade Now** on any paid plan
4. Complete sandbox checkout
5. Verify webhook receives the event
6. Check that user tier is updated in Firestore
7. Verify subscription appears on billing page

### Test Subscription Management

1. On the billing page, click **Manage Subscription**
2. You'll be redirected to Polar customer portal
3. Test canceling subscription
4. Verify webhook processes cancellation
5. Check user tier is downgraded to free

## Step 8: Monitor Webhooks

1. Go to Polar.sh Dashboard → **Webhooks**
2. View webhook delivery history
3. Check for successful deliveries (200 status)
4. Inspect payload and responses

## Step 9: Check Backend Logs

```bash
# In backend directory
cd quikthread-backend

# Check webhook-logs collection in Firestore
# View console logs for webhook events
```

## Step 10: Verify User Data

After successful checkout, verify in Firestore:

### users collection
```json
{
  "tier": "pro",  // or "business"
  "maxCredits": 30,  // or 100 for business
  "currentCredits": 30,
  "features": {
    "postToX": true,
    "analytics": false  // true for business only
  }
}
```

### webhook-logs collection
```json
{
  "eventType": "checkout.created",
  "status": "success",
  "timestamp": "2024-12-07T...",
  "eventData": { ... }
}
```

## Troubleshooting

### Webhook not receiving events
- Ensure backend is running and accessible
- Use ngrok for local testing: `ngrok http 8000`
- Update webhook URL in Polar.sh with ngrok URL
- Check webhook secret matches in backend .env

### Checkout redirect fails
- Verify `VITE_POLAR_ACCESS_TOKEN` is set in frontend .env
- Check product IDs match in Polar.sh and frontend .env
- Ensure Polar SDK is initialized in sandbox mode

### User tier not updating
- Check webhook-logs collection for error messages
- Verify customer email matches user email in Firestore
- Ensure backend has correct product ID mappings

### Invoice not showing
- Polar may take a few minutes to generate invoices
- Refresh billing page after a minute
- Check browser console for API errors

## Testing Checklist

- [ ] Polar.sh sandbox account created
- [ ] Pro and Business products created
- [ ] Access token copied to frontend .env
- [ ] Webhook URL configured in Polar.sh
- [ ] Webhook secret copied to backend .env
- [ ] Backend running and accessible
- [ ] Test checkout from onboarding page
- [ ] Verify webhook processes checkout event
- [ ] Confirm user tier updated in Firestore
- [ ] Test upgrade from billing page
- [ ] Test subscription management portal
- [ ] Test subscription cancellation
- [ ] Verify invoices display on billing page
- [ ] Check all webhook events logged to Firestore

## Next Steps: Production

Once testing is complete:

1. Switch Polar.sh from **Sandbox** to **Production**
2. Create production products
3. Get production access token
4. Update frontend .env with production token
5. Update backend .env with production webhook secret
6. Update webhook URL to production domain
7. Test with small real payment
8. Monitor webhook deliveries in production

## Support Resources

- [Polar.sh Documentation](https://docs.polar.sh)
- [Polar.sh API Reference](https://api.polar.sh/docs)
- [Standard Webhooks Spec](https://www.standardwebhooks.com/)
- Backend webhook integration docs: `POLAR_WEBHOOK_INTEGRATION.md`
