"""
Test script for Polar.sh webhook integration

This script tests the webhook endpoint locally by simulating Polar.sh webhook events.

Usage:
    python test_polar_webhook.py
"""

import requests
import hmac
import hashlib
import base64
import json
from datetime import datetime

# Configuration
WEBHOOK_URL = "http://localhost:8000/api/webhooks/polar"
WEBHOOK_SECRET = "your_polar_webhook_secret_here"  # Should match POLAR_WEBHOOK_SECRET in .env

def generate_signature(payload: str, secret: str) -> str:
    """
    Generate webhook signature using Standard Webhooks format
    (same as Polar.sh uses)
    """
    # Base64 encode the secret
    secret_bytes = base64.b64encode(secret.encode())
    
    # Generate HMAC-SHA256 signature
    signature = hmac.new(
        secret_bytes,
        payload.encode('utf-8'),
        hashlib.sha256
    ).digest()
    
    # Base64 encode the signature
    signature_b64 = base64.b64encode(signature).decode()
    
    return signature_b64

def test_checkout_success_pro():
    """Test successful checkout for Pro plan"""
    print("\n=== Testing Checkout Success (Pro Plan) ===")
    
    event_data = {
        "type": "checkout.created",
        "data": {
            "customer_email": "test@example.com",
            "product_id": "prod_pro",
            "status": "succeeded",
            "amount": 2900,
            "currency": "USD"
        },
        "timestamp": datetime.utcnow().isoformat()
    }
    
    payload = json.dumps(event_data)
    signature = generate_signature(payload, WEBHOOK_SECRET)
    
    headers = {
        "Content-Type": "application/json",
        "webhook-signature": signature
    }
    
    response = requests.post(WEBHOOK_URL, data=payload, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        print("✓ Checkout success webhook processed successfully")
    else:
        print("✗ Checkout success webhook failed")

def test_checkout_success_business():
    """Test successful checkout for Business plan"""
    print("\n=== Testing Checkout Success (Business Plan) ===")
    
    event_data = {
        "type": "checkout.updated",
        "data": {
            "customer_email": "test@example.com",
            "product_id": "prod_business",
            "status": "succeeded",
            "amount": 9900,
            "currency": "USD"
        },
        "timestamp": datetime.utcnow().isoformat()
    }
    
    payload = json.dumps(event_data)
    signature = generate_signature(payload, WEBHOOK_SECRET)
    
    headers = {
        "Content-Type": "application/json",
        "Webhook-Signature": signature
    }
    
    response = requests.post(WEBHOOK_URL, data=payload, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        print("✓ Checkout success (Business) webhook processed successfully")
    else:
        print("✗ Checkout success (Business) webhook failed")

def test_subscription_cancelled():
    """Test subscription cancellation"""
    print("\n=== Testing Subscription Cancellation ===")
    
    event_data = {
        "type": "subscription.cancelled",
        "data": {
            "customer_email": "test@example.com",
            "customer_id": "cus_123456",
            "subscription_id": "sub_123456"
        },
        "timestamp": datetime.utcnow().isoformat()
    }
    
    payload = json.dumps(event_data)
    signature = generate_signature(payload, WEBHOOK_SECRET)
    
    headers = {
        "Content-Type": "application/json",
        "webhook-signature": signature
    }
    
    response = requests.post(WEBHOOK_URL, data=payload, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        print("✓ Subscription cancellation webhook processed successfully")
    else:
        print("✗ Subscription cancellation webhook failed")

def test_invalid_signature():
    """Test webhook with invalid signature"""
    print("\n=== Testing Invalid Signature ===")
    
    event_data = {
        "type": "checkout.created",
        "data": {
            "customer_email": "test@example.com",
            "product_id": "prod_pro",
            "status": "succeeded"
        }
    }
    
    payload = json.dumps(event_data)
    
    headers = {
        "Content-Type": "application/json",
        "webhook-signature": "invalid_signature_here"
    }
    
    response = requests.post(WEBHOOK_URL, data=payload, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 401:
        print("✓ Invalid signature correctly rejected")
    else:
        print("✗ Invalid signature should return 401")

def test_webhook_health():
    """Test webhook health check endpoint"""
    print("\n=== Testing Webhook Health Check ===")
    
    response = requests.get("http://localhost:8000/api/webhooks/polar/health")
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        print("✓ Webhook health check passed")
    else:
        print("✗ Webhook health check failed")

if __name__ == "__main__":
    print("===========================================")
    print("Polar.sh Webhook Integration Test")
    print("===========================================")
    
    # Check if backend is running
    try:
        response = requests.get("http://localhost:8000/health")
        if response.status_code == 200:
            print("✓ Backend is running")
        else:
            print("✗ Backend health check failed")
            exit(1)
    except requests.exceptions.ConnectionError:
        print("✗ Backend is not running. Please start the backend first:")
        print("  cd quikthread-backend && python3 main.py")
        exit(1)
    
    # Run tests
    test_webhook_health()
    test_checkout_success_pro()
    test_checkout_success_business()
    test_subscription_cancelled()
    test_invalid_signature()
    
    print("\n===========================================")
    print("Test Summary")
    print("===========================================")
    print("All webhook tests completed!")
    print("\nNext steps:")
    print("1. Check Firestore 'webhook-logs' collection for logged events")
    print("2. Verify user tier was updated in Firestore 'users' collection")
    print("3. Configure actual webhook URL in Polar.sh dashboard:")
    print("   https://your-domain.com/api/webhooks/polar")
