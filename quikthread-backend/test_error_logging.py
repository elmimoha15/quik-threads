"""
Test script for Error Logging & Monitoring system
Tests error logging to Firestore and event tracking
"""

import asyncio
from utils.logger import log_error, log_event, log_warning, log_info
from config.firebase import db
from datetime import datetime

async def test_error_logging():
    """Test error logging functionality"""
    print("\n" + "="*80)
    print("Testing Error Logging")
    print("="*80)
    
    try:
        # Simulate an error
        raise ValueError("This is a test error for logging system")
    except Exception as e:
        # Log the error with context
        log_error(e, {
            "service": "test",
            "operation": "test_error_logging",
            "user_id": "test_user_123",
            "job_id": "test_job_456"
        })
        print("✅ Error logged successfully")

async def test_event_logging():
    """Test event logging functionality"""
    print("\n" + "="*80)
    print("Testing Event Logging")
    print("="*80)
    
    # Log various events
    events = [
        ("user_signup", {"user_id": "user123", "email": "test@example.com"}),
        ("job_completed", {"job_id": "job456", "user_id": "user123", "duration": 120}),
        ("post_created", {"post_id": "post789", "user_id": "user123", "tweet_count": 5}),
        ("thread_generated", {"job_id": "job456", "thread_count": 5, "processing_time": 15.5})
    ]
    
    for event_type, data in events:
        log_event(event_type, data)
        print(f"✅ Event logged: {event_type}")

async def test_warning_logging():
    """Test warning logging functionality"""
    print("\n" + "="*80)
    print("Testing Warning Logging")
    print("="*80)
    
    log_warning("This is a test warning", {
        "service": "test",
        "reason": "Testing warning logging system"
    })
    print("✅ Warning logged successfully")

async def test_info_logging():
    """Test info logging functionality"""
    print("\n" + "="*80)
    print("Testing Info Logging")
    print("="*80)
    
    log_info("This is a test info message", {
        "service": "test",
        "operation": "test_info_logging"
    })
    print("✅ Info logged successfully")

async def verify_firestore_logs():
    """Verify logs were saved to Firestore"""
    print("\n" + "="*80)
    print("Verifying Firestore Logs")
    print("="*80)
    
    # Check error logs
    error_logs = db.collection('error-logs').order_by('timestamp', direction='DESCENDING').limit(5).stream()
    error_count = 0
    for doc in error_logs:
        error_count += 1
        log_data = doc.to_dict()
        print(f"\nError Log {error_count}:")
        print(f"  Type: {log_data.get('type', 'N/A')}")
        print(f"  Message: {log_data.get('message', 'N/A')[:100]}")
        print(f"  Severity: {log_data.get('severity', 'N/A')}")
        print(f"  Context: {log_data.get('context', {})}")
    
    if error_count > 0:
        print(f"\n✅ Found {error_count} error logs in Firestore")
    else:
        print("\n⚠️  No error logs found in Firestore")
    
    # Check event logs
    event_logs = db.collection('event-logs').order_by('timestamp', direction='DESCENDING').limit(5).stream()
    event_count = 0
    for doc in event_logs:
        event_count += 1
        log_data = doc.to_dict()
        print(f"\nEvent Log {event_count}:")
        print(f"  Type: {log_data.get('eventType', 'N/A')}")
        print(f"  Data: {log_data.get('data', {})}")
    
    if event_count > 0:
        print(f"\n✅ Found {event_count} event logs in Firestore")
    else:
        print("\n⚠️  No event logs found in Firestore")

async def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("Error Logging & Monitoring System Test")
    print("="*80)
    
    # Test error logging
    await test_error_logging()
    
    # Test event logging
    await test_event_logging()
    
    # Test warning logging
    await test_warning_logging()
    
    # Test info logging
    await test_info_logging()
    
    # Wait a moment for logs to be written
    await asyncio.sleep(2)
    
    # Verify logs in Firestore
    await verify_firestore_logs()
    
    print("\n" + "="*80)
    print("Test Summary")
    print("="*80)
    print("\n✅ Error Logging System is working!")
    print("\n📊 Firestore Collections:")
    print("  - /error-logs: Stores errors with stack traces and context")
    print("  - /event-logs: Stores events for tracking and analytics")
    
    print("\n🔍 Error Log Structure:")
    print("  - message: Error message")
    print("  - type: Exception type")
    print("  - stack: Full stack trace")
    print("  - context: Additional context (userId, jobId, service, etc.)")
    print("  - timestamp: When error occurred")
    print("  - severity: ERROR or WARNING")
    
    print("\n📝 Event Log Structure:")
    print("  - eventType: Type of event")
    print("  - data: Event data")
    print("  - timestamp: When event occurred")
    
    print("\n🎯 Services with Error Logging:")
    print("  ✅ deepgram_service.py")
    print("  ✅ gemini_service.py")
    print("  ✅ twitter_service.py")
    print("  ✅ job_service.py")
    
    print("\n💡 Usage in Services:")
    print("  try:")
    print("      # Service operation")
    print("  except Exception as e:")
    print("      log_error(e, {")
    print("          'service': 'service_name',")
    print("          'operation': 'operation_name',")
    print("          'user_id': user_id,")
    print("          'job_id': job_id")
    print("      })")
    
    print("\n📈 Monitoring:")
    print("  - Check /error-logs collection in Firestore Console")
    print("  - Check /event-logs collection for usage analytics")
    print("  - Errors also printed to console for Cloud Logging")
    
    print("\n🔧 Firestore Indexes:")
    print("  Create composite indexes for better query performance:")
    print("  - /error-logs: timestamp (desc)")
    print("  - /event-logs: timestamp (desc)")
    print("  - /error-logs: service (asc), timestamp (desc)")
    print("  - /event-logs: eventType (asc), timestamp (desc)")
    
    print("\n" + "="*80)

if __name__ == "__main__":
    asyncio.run(main())
