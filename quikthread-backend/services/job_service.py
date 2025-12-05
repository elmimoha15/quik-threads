from datetime import datetime
from typing import Dict, Any, Optional, List
import uuid
from config.firebase import db
import logging
from utils.logger import log_error, log_event

logger = logging.getLogger(__name__)

class JobService:
    """Service for managing job processing and status"""
    
    def __init__(self):
        self.jobs_collection = db.collection('jobs')
        self.users_collection = db.collection('users')
    
    async def create_job(self, user_id: str, request_data: Dict[str, Any]) -> str:
        """
        Create a new job in Firestore
        
        Args:
            user_id: User ID who created the job
            request_data: Job request data (type, fileUrl, contentUrl)
            
        Returns:
            Job ID
        """
        try:
            # Generate unique job ID
            job_id = f"job_{uuid.uuid4().hex[:12]}"
            
            # Create job document
            job_data = {
                'jobId': job_id,
                'userId': user_id,
                'status': 'processing',
                'progress': 0,
                'type': request_data.get('type', 'upload'),
                'fileUrl': request_data.get('fileUrl'),
                'contentUrl': request_data.get('contentUrl'),
                'duration': None,
                'posts': None,  # New format-based field
                'threads': None,  # Legacy field
                'error': None,
                'createdAt': datetime.utcnow(),
                'completedAt': None
            }
            
            # Save to Firestore
            self.jobs_collection.document(job_id).set(job_data)
            
            logger.info(f"Created job {job_id} for user {user_id}")
            return job_id
            
        except Exception as e:
            log_error(e, {
                "service": "job",
                "operation": "create_job",
                "user_id": user_id
            })
            logger.error(f"Error creating job: {str(e)}")
            raise
    
    async def update_job_progress(self, job_id: str, progress: int, status: str) -> None:
        """
        Update job progress and status
        
        Args:
            job_id: Job ID to update
            progress: Progress percentage (0-100)
            status: Current status
        """
        try:
            self.jobs_collection.document(job_id).update({
                'progress': progress,
                'status': status,
                'updatedAt': datetime.utcnow()
            })
            
            logger.info(f"Updated job {job_id}: {status} ({progress}%)")
            
        except Exception as e:
            log_error(e, {
                "service": "job",
                "operation": "update_job_progress",
                "job_id": job_id
            })
            logger.error(f"Error updating job progress: {str(e)}")
            raise
    
    async def complete_job(self, job_id: str, posts: Dict[str, List[str]], duration: Optional[float] = None) -> None:
        """
        Mark job as completed and save results
        
        Args:
            job_id: Job ID to complete
            posts: Generated posts by format (dict with format keys: one_liner, hot_take, etc.)
            duration: Audio/video duration in seconds
        """
        try:
            # Update job document with new format-based structure
            self.jobs_collection.document(job_id).update({
                'status': 'completed',
                'progress': 100,
                'posts': posts,  # New format-based structure
                'threads': None,  # Legacy field set to None
                'duration': duration,
                'completedAt': datetime.utcnow()
            })
            
            # Get job to find user_id
            job_doc = self.jobs_collection.document(job_id).get()
            if job_doc.exists:
                job_data = job_doc.to_dict()
                user_id = job_data.get('userId')
                
                # Increment user's creditsUsed
                if user_id:
                    await self.increment_user_credits(user_id)
            
            # Count total posts across all formats
            total_posts = sum(len(format_posts) for format_posts in posts.values())
            logger.info(f"Completed job {job_id} with {total_posts} posts across {len(posts)} formats")
            
        except Exception as e:
            log_error(e, {
                "service": "job",
                "operation": "complete_job",
                "job_id": job_id
            })
            logger.error(f"Error completing job: {str(e)}")
            raise
    
    async def fail_job(self, job_id: str, error_message: str) -> None:
        """
        Mark job as failed with error message
        
        Args:
            job_id: Job ID to fail
            error_message: Error description
        """
        try:
            self.jobs_collection.document(job_id).update({
                'status': 'failed',
                'error': error_message,
                'completedAt': datetime.utcnow()
            })
            
            logger.error(f"Failed job {job_id}: {error_message}")
            
        except Exception as e:
            log_error(e, {
                "service": "job",
                "operation": "fail_job",
                "job_id": job_id
            })
            logger.error(f"Error failing job: {str(e)}")
            raise
    
    async def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get job by ID
        
        Args:
            job_id: Job ID to retrieve
            
        Returns:
            Job data or None if not found
        """
        try:
            job_doc = self.jobs_collection.document(job_id).get()
            
            if not job_doc.exists:
                return None
            
            return job_doc.to_dict()
            
        except Exception as e:
            logger.error(f"Error getting job: {str(e)}")
            raise
    
    async def get_user_jobs(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get all jobs for a user
        
        Args:
            user_id: User ID
            limit: Maximum number of jobs to return
            
        Returns:
            List of job data
        """
        try:
            jobs_query = (
                self.jobs_collection
                .where('userId', '==', user_id)
                .order_by('createdAt', direction='DESCENDING')
                .limit(limit)
            )
            
            jobs = []
            for doc in jobs_query.stream():
                job_data = doc.to_dict()
                jobs.append(job_data)
            
            logger.info(f"Retrieved {len(jobs)} jobs for user {user_id}")
            return jobs
            
        except Exception as e:
            logger.error(f"Error getting user jobs: {str(e)}")
            raise
    
    async def increment_user_credits(self, user_id: str) -> None:
        """
        Increment user's creditsUsed by 1
        
        Args:
            user_id: User ID
        """
        try:
            user_ref = self.users_collection.document(user_id)
            user_doc = user_ref.get()
            
            if user_doc.exists:
                user_data = user_doc.to_dict()
                current_credits = user_data.get('creditsUsed', 0)
                
                user_ref.update({
                    'creditsUsed': current_credits + 1,
                    'updatedAt': datetime.utcnow()
                })
                
                logger.info(f"Incremented credits for user {user_id}: {current_credits} -> {current_credits + 1}")
            else:
                logger.warning(f"User {user_id} not found when incrementing credits")
                
        except Exception as e:
            logger.error(f"Error incrementing user credits: {str(e)}")
            # Don't raise - this shouldn't fail the job
