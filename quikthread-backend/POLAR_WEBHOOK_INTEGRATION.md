# Polar.sh Webhook Integration

Complete implementation of Polar.sh webhook integration for payment processing and tier management.

## Overview

The webhook integration automatically upgrades/downgrades user tiers based on Polar.sh payment events:
- **Checkout Success** → Upgrade user to Pro or Business tier
- **Subscription Cancelled** → Downgrade user to Free tier

## Components

### 1. PolarService (`services/polar_service.py`)

Handles all Polar.sh webhook event processing:

**Methods:**
- `verify_signature(payload, signature)` - Verifies webhook signatures using HMAC-SHA256 with Standard Webhooks spec
- `handle_checkout_success(event_data)` - Upgrades user tier on successful payment
- `handle_subscription_cancelled(event_data)` - Downgrades user to free tier
- `log_webhook_event(...)` - Logs all webhook events to Firestore

**Tier Configurations:**

| Tier | Credits/Month | Max Duration | Features |
|------|--------------|--------------|----------|
| Free | 2 | 30 min | Basic generation |
| Pro | 30 | 60 min | Post to X |
| Business | 100 | 60 min | Post to X + Analytics |

### 2. Webhook Endpoint (`routes/webhooks.py`)

**Endpoint:** `POST /api/webhooks/polar`
- **Authentication:** None (uses signature verification)
- **Headers Required:** `webhook-signature` or `Webhook-Signature`

**Supported Events:**
- `checkout.created`
- `checkout.updated`
- `order.created`
- `subscription.cancelled`
- `subscription.canceled`

**Response:** Always returns `200 OK` to acknowledge receipt (prevents Polar retries on processing errors)

### 3. Configuration

**Environment Variables (.env):**
```bash
POLAR_WEBHOOK_SECRET=your_polar_webhook_secret_here
```

**Settings (config/settings.py):**
```python
polar_webhook_secret: Optional[str] = None
```

## Setup Instructions

### 1. Configure Webhook Secret

Get your webhook secret from Polar.sh dashboard and add it to `.env`:

```bash
POLAR_WEBHOOK_SECRET=whsec_abc123...
```

### 2. Deploy Backend

Ensure your backend is accessible from the internet (for Polar to send webhooks).

For development/testing, you can use ngrok:
```bash
ngrok http 8000
```

### 3. Configure Polar.sh Dashboard

1. Go to Polar.sh Dashboard → Settings → Webhooks
2. Add webhook endpoint: `https://your-domain.com/api/webhooks/polar`
3. Select events to subscribe to:
   - `checkout.created`
   - `checkout.updated`
   - `subscription.cancelled`
4. Copy the webhook secret and add to `.env`

### 4. Set Product IDs

In your Polar.sh products, ensure the product IDs match:
- Pro plan: `prod_pro`
- Business plan: `prod_business`

Or update the product IDs in `polar_service.py`:
```python
if product_id == 'prod_pro':  # Update this
    # ...
elif product_id == 'prod_business':  # Update this
    # ...
```

## Testing

### Local Testing

Run the test script:
```bash
cd quikthread-backend
python3 test_polar_webhook.py
```

This will:
1. Check backend health
2. Test webhook health endpoint
3. Simulate checkout success events
4. Simulate subscription cancellation
5. Test signature verification

### Test with Polar.sh Dashboard

1. Go to Polar.sh Dashboard → Webhooks
2. Click "Send test webhook"
3. Select event type
4. Check backend logs and Firestore collections

### Verify in Firestore

Check these collections:
- `users` - User tier should be updated
- `webhook-logs` - Event should be logged with status

## Event Flow

### Successful Checkout

```
1. User completes payment on Polar.sh
2. Polar sends webhook to /api/webhooks/polar
3. Backend verifies signature
4. Extracts customer email and product_id
5. Finds user in Firestore by email
6. Updates user tier, credits, and features
7. Logs event to webhook-logs
8. Returns 200 OK
```

### Subscription Cancellation

```
1. User cancels subscription on Polar.sh
2. Polar sends webhook
3. Backend verifies signature
4. Finds user by email or customer ID
5. Downgrades to free tier
6. Logs event
7. Returns 200 OK
```

## Security

### Signature Verification

Uses **Standard Webhooks** specification:
1. Secret is base64 encoded
2. HMAC-SHA256 signature generated from payload
3. Signature is base64 encoded
4. Constant-time comparison used to prevent timing attacks

### No Authentication Required

Webhooks don't use JWT auth because:
- Polar.sh can't send authenticated requests
- Security is handled via signature verification
- Invalid signatures are rejected with 401

## Monitoring

### Webhook Logs Collection

All events are logged to Firestore `webhook-logs`:

```json
{
  "eventType": "checkout.created",
  "eventData": { ... },
  "status": "success",
  "error": null,
  "timestamp": "2024-01-01T12:00:00Z",
  "processedAt": "2024-01-01T12:00:00Z"
}
```

### Backend Logs

Check application logs for:
- `Received Polar webhook: <event_type>`
- `Upgrading user <id> to <tier> tier`
- `Successfully upgraded user <id>`

## Troubleshooting

### Webhook Returns 401

- **Cause:** Invalid signature
- **Solution:** 
  1. Verify `POLAR_WEBHOOK_SECRET` matches Polar dashboard
  2. Check signature header name (`webhook-signature` or `Webhook-Signature`)
  3. Ensure secret is not base64 encoded in .env (service handles encoding)

### User Not Found

- **Cause:** Email doesn't match
- **Solution:**
  1. Ensure customer email in Polar matches user email in Firestore
  2. Check `webhook-logs` for actual email received
  3. Verify user exists with `where('email', '==', '<email>')` query

### Tier Not Updating

- **Cause:** Unknown product_id
- **Solution:**
  1. Check logs for actual product_id received
  2. Update product_id checks in `handle_checkout_success()`
  3. Verify product_id in Polar dashboard matches code

### Events Not Being Received

- **Cause:** Webhook URL not accessible
- **Solution:**
  1. Test endpoint health: `curl https://your-domain.com/api/webhooks/polar/health`
  2. Check firewall/security groups
  3. Ensure backend is running
  4. Verify webhook URL in Polar dashboard

## API Reference

### Health Check

```bash
GET /api/webhooks/polar/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "Polar Webhooks",
  "configured": true
}
```

### Webhook Endpoint

```bash
POST /api/webhooks/polar
Headers:
  webhook-signature: <signature>
  Content-Type: application/json

Body:
{
  "type": "checkout.created",
  "data": {
    "customer_email": "user@example.com",
    "product_id": "prod_pro",
    "status": "succeeded"
  }
}
```

**Response:**
```json
{
  "received": true
}
```

## Production Checklist

- [ ] `POLAR_WEBHOOK_SECRET` configured in production .env
- [ ] Webhook URL added to Polar.sh dashboard
- [ ] Product IDs match between code and Polar
- [ ] Backend accessible from internet
- [ ] HTTPS enabled (required by Polar)
- [ ] Firestore permissions configured for webhook-logs collection
- [ ] Monitoring/alerting set up for failed webhooks
- [ ] Test webhook with Polar test events
- [ ] Verify user tier updates in production Firestore

## Support

For issues:
1. Check `webhook-logs` collection in Firestore
2. Review backend application logs
3. Test with `test_polar_webhook.py`
4. Verify signature with Polar.sh webhook testing tool
