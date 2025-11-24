"""
Test script for Polar.sh webhook integration
Simulates webhook events to test signature verification and event handling
"""

import requests
import json
import hmac
import hashlib
import base64

# Configuration
BASE_URL = "http://localhost:8000"
WEBHOOK_SECRET = "your_polar_webhook_secret_here"  # Replace with actual secret from .env

def generate_signature(payload: str, secret: str) -> str:
    """
    Generate webhook signature using HMAC-SHA256
    Following Standard Webhooks specification
    """
    # Base64 encode the secret
    secret_bytes = base64.b64encode(secret.encode())
    
    # Generate HMAC-SHA256 signature
    signature = hmac.new(
        secret_bytes,
        payload.encode(),
        hashlib.sha256
    ).digest()
    
    # Base64 encode the signature
    return base64.b64encode(signature).decode()

def test_webhook_health():
    """Test webhook health endpoint"""
    print("\n" + "="*80)
    print("Testing Webhook Health Endpoint")
    print("="*80)
    
    response = requests.get(f"{BASE_URL}/api/webhooks/polar/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.json().get('configured'):
        print("✅ Webhook is configured")
    else:
        print("⚠️  Webhook secret not configured")

def test_checkout_success():
    """Test checkout success webhook"""
    print("\n" + "="*80)
    print("Testing Checkout Success Webhook")
    print("="*80)
    
    # Sample checkout success payload
    payload = {
        "type": "checkout.updated",
        "data": {
            "customer_email": "test@example.com",
            "product_id": "prod_pro",
            "status": "succeeded",
            "amount": 2900,
            "currency": "USD"
        }
    }
    
    payload_str = json.dumps(payload)
    signature = generate_signature(payload_str, WEBHOOK_SECRET)
    
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print(f"Signature: {signature[:50]}...")
    
    response = requests.post(
        f"{BASE_URL}/api/webhooks/polar",
        data=payload_str,
        headers={
            "Content-Type": "application/json",
            "webhook-signature": signature
        }
    )
    
    print(f"\nStatus: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("✅ Webhook processed successfully")
    else:
        print("❌ Webhook processing failed")

def test_subscription_cancelled():
    """Test subscription cancellation webhook"""
    print("\n" + "="*80)
    print("Testing Subscription Cancelled Webhook")
    print("="*80)
    
    # Sample subscription cancelled payload
    payload = {
        "type": "subscription.cancelled",
        "data": {
            "customer_email": "test@example.com",
            "customer_id": "cus_123456",
            "subscription_id": "sub_123456"
        }
    }
    
    payload_str = json.dumps(payload)
    signature = generate_signature(payload_str, WEBHOOK_SECRET)
    
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    response = requests.post(
        f"{BASE_URL}/api/webhooks/polar",
        data=payload_str,
        headers={
            "Content-Type": "application/json",
            "webhook-signature": signature
        }
    )
    
    print(f"\nStatus: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("✅ Webhook processed successfully")
    else:
        print("❌ Webhook processing failed")

def test_invalid_signature():
    """Test webhook with invalid signature"""
    print("\n" + "="*80)
    print("Testing Invalid Signature")
    print("="*80)
    
    payload = {
        "type": "checkout.updated",
        "data": {
            "customer_email": "test@example.com",
            "product_id": "prod_pro"
        }
    }
    
    payload_str = json.dumps(payload)
    invalid_signature = "invalid_signature_here"
    
    response = requests.post(
        f"{BASE_URL}/api/webhooks/polar",
        data=payload_str,
        headers={
            "Content-Type": "application/json",
            "webhook-signature": invalid_signature
        }
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 401:
        print("✅ Invalid signature correctly rejected")
    else:
        print("❌ Should have rejected invalid signature")

def test_missing_signature():
    """Test webhook without signature"""
    print("\n" + "="*80)
    print("Testing Missing Signature")
    print("="*80)
    
    payload = {
        "type": "checkout.updated",
        "data": {
            "customer_email": "test@example.com"
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/api/webhooks/polar",
        json=payload
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 401:
        print("✅ Missing signature correctly rejected")
    else:
        print("❌ Should have rejected missing signature")

if __name__ == "__main__":
    print("\n" + "="*80)
    print("Polar.sh Webhook Integration Test")
    print("="*80)
    
    # Test health endpoint
    test_webhook_health()
    
    # Test missing signature
    test_missing_signature()
    
    # Test invalid signature
    test_invalid_signature()
    
    print("\n" + "="*80)
    print("Note: To test actual webhook processing:")
    print("1. Set WEBHOOK_SECRET to your actual secret from .env")
    print("2. Create a test user with email 'test@example.com'")
    print("3. Run test_checkout_success() and test_subscription_cancelled()")
    print("4. Check Firestore /users and /webhook-logs collections")
    print("="*80)
    
    print("\n" + "="*80)
    print("Integration with Polar.sh:")
    print("="*80)
    print("1. Go to Polar.sh dashboard → Settings → Webhooks")
    print("2. Add webhook endpoint: https://your-domain.com/api/webhooks/polar")
    print("3. Set webhook secret (same as POLAR_WEBHOOK_SECRET in .env)")
    print("4. Select events: checkout.updated, subscription.cancelled")
    print("5. Use Polar's test tool to send test events")
    print("="*80)
