"""
Centralized error logging and event tracking system
Logs errors and events to Firestore for monitoring and debugging
"""

from datetime import datetime
from typing import Dict, Any, Optional
from config.firebase import db
import traceback
import logging
import sys

# Set up Python logger
logger = logging.getLogger(__name__)

def log_error(error: Exception, context: Optional[Dict[str, Any]] = None) -> None:
    """
    Log error to Firestore and console
    
    Saves error details to Firestore /error-logs collection for monitoring
    and debugging. Also prints to console for Cloud Logging integration.
    
    Args:
        error: Exception object
        context: Additional context (userId, jobId, service, etc.)
    """
    try:
        # Get error details
        error_message = str(error)
        error_type = type(error).__name__
        
        # Get stack trace
        stack_trace = ''.join(traceback.format_exception(
            type(error), error, error.__traceback__
        ))
        
        # Build error log document
        error_log = {
            'message': error_message,
            'type': error_type,
            'stack': stack_trace,
            'context': context or {},
            'timestamp': datetime.utcnow(),
            'severity': 'ERROR'
        }
        
        # Save to Firestore
        db.collection('error-logs').add(error_log)
        
        # Print to console for Cloud Logging
        logger.error(
            f"Error logged: {error_type}: {error_message}",
            extra={'context': context}
        )
        
        # Also print stack trace to stderr
        print(f"\n{'='*80}", file=sys.stderr)
        print(f"ERROR LOGGED: {error_type}", file=sys.stderr)
        print(f"Message: {error_message}", file=sys.stderr)
        print(f"Context: {context}", file=sys.stderr)
        print(f"{'='*80}\n", file=sys.stderr)
        
    except Exception as log_error:
        # If logging fails, at least print to console
        logger.error(f"Failed to log error: {str(log_error)}")
        print(f"LOGGING FAILED: {str(log_error)}", file=sys.stderr)
        print(f"Original error: {str(error)}", file=sys.stderr)

def log_event(event_type: str, data: Optional[Dict[str, Any]] = None) -> None:
    """
    Log event to Firestore for tracking and analytics
    
    Tracks important events like user signups, job completions, posts created, etc.
    
    Args:
        event_type: Type of event (e.g., 'user_signup', 'job_completed', 'post_created')
        data: Event data (userId, jobId, metrics, etc.)
    """
    try:
        # Build event log document
        event_log = {
            'eventType': event_type,
            'data': data or {},
            'timestamp': datetime.utcnow()
        }
        
        # Save to Firestore
        db.collection('event-logs').add(event_log)
        
        # Print to console for Cloud Logging
        logger.info(
            f"Event logged: {event_type}",
            extra={'data': data}
        )
        
    except Exception as log_error:
        # If logging fails, at least print to console
        logger.error(f"Failed to log event: {str(log_error)}")
        print(f"EVENT LOGGING FAILED: {str(log_error)}", file=sys.stderr)

def log_warning(message: str, context: Optional[Dict[str, Any]] = None) -> None:
    """
    Log warning to Firestore and console
    
    For non-critical issues that should be monitored.
    
    Args:
        message: Warning message
        context: Additional context
    """
    try:
        # Build warning log document
        warning_log = {
            'message': message,
            'context': context or {},
            'timestamp': datetime.utcnow(),
            'severity': 'WARNING'
        }
        
        # Save to Firestore error-logs collection with WARNING severity
        db.collection('error-logs').add(warning_log)
        
        # Print to console
        logger.warning(message, extra={'context': context})
        
    except Exception as log_error:
        logger.error(f"Failed to log warning: {str(log_error)}")

def log_info(message: str, context: Optional[Dict[str, Any]] = None) -> None:
    """
    Log informational message
    
    For tracking important operations and state changes.
    
    Args:
        message: Info message
        context: Additional context
    """
    try:
        logger.info(message, extra={'context': context})
    except Exception as log_error:
        print(f"INFO LOGGING FAILED: {str(log_error)}", file=sys.stderr)
