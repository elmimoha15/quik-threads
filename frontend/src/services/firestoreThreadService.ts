import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Thread {
  id: string;
  userId: string;
  title: string;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
  posts?: Record<string, string[]>;
  tweetCount?: number;
  firstTweet?: string;
  contentSource?: string;
  error?: string;
  updatedAt?: string;
}

class FirestoreThreadService {
  private readonly COLLECTION = 'threads';

  /**
   * Add a new thread to Firestore
   */
  async addThread(userId: string, thread: Omit<Thread, 'userId'>): Promise<void> {
    try {
      const threadRef = doc(db, this.COLLECTION, thread.id);
      await setDoc(threadRef, {
        ...thread,
        userId,
        createdAt: thread.createdAt || new Date().toISOString(),
      });
      console.log('✅ Thread added to Firestore:', thread.id);
    } catch (error) {
      console.error('❌ Error adding thread to Firestore:', error);
      throw new Error('Failed to save thread');
    }
  }

  /**
   * Get all threads for a specific user
   */
  async getUserThreads(userId: string): Promise<Thread[]> {
    try {
      const threadsQuery = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(threadsQuery);
      const threads: Thread[] = [];
      
      querySnapshot.forEach((doc) => {
        threads.push({ id: doc.id, ...doc.data() } as Thread);
      });
      
      console.log(`✅ Fetched ${threads.length} threads for user ${userId}`);
      return threads;
    } catch (error) {
      console.error('❌ Error fetching threads:', error);
      // If it's an index error, provide helpful message
      if (error instanceof Error && error.message.includes('index')) {
        console.error('📝 You need to create a Firestore index. Check the console for the link.');
      }
      throw new Error('Failed to fetch threads');
    }
  }

  /**
   * Get a single thread by ID
   */
  async getThread(threadId: string, userId: string): Promise<Thread | null> {
    try {
      const threadRef = doc(db, this.COLLECTION, threadId);
      const threadDoc = await getDoc(threadRef);
      
      if (!threadDoc.exists()) {
        return null;
      }
      
      const thread = { id: threadDoc.id, ...threadDoc.data() } as Thread;
      
      // Verify the thread belongs to the user
      if (thread.userId !== userId) {
        console.warn('⚠️ Thread does not belong to user');
        return null;
      }
      
      return thread;
    } catch (error) {
      console.error('❌ Error fetching thread:', error);
      throw new Error('Failed to fetch thread');
    }
  }

  /**
   * Update an existing thread
   */
  async updateThread(threadId: string, userId: string, updates: Partial<Thread>): Promise<void> {
    try {
      const threadRef = doc(db, this.COLLECTION, threadId);
      
      // First verify the thread exists and belongs to the user
      const threadDoc = await getDoc(threadRef);
      if (!threadDoc.exists()) {
        throw new Error('Thread not found');
      }
      
      const thread = threadDoc.data() as Thread;
      if (thread.userId !== userId) {
        throw new Error('Unauthorized');
      }
      
      await updateDoc(threadRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      
      console.log('✅ Thread updated:', threadId);
    } catch (error) {
      console.error('❌ Error updating thread:', error);
      throw new Error('Failed to update thread');
    }
  }

  /**
   * Delete a thread
   */
  async deleteThread(threadId: string, userId: string): Promise<void> {
    try {
      const threadRef = doc(db, this.COLLECTION, threadId);
      
      // First verify the thread exists and belongs to the user
      const threadDoc = await getDoc(threadRef);
      if (!threadDoc.exists()) {
        throw new Error('Thread not found');
      }
      
      const thread = threadDoc.data() as Thread;
      if (thread.userId !== userId) {
        throw new Error('Unauthorized');
      }
      
      await deleteDoc(threadRef);
      console.log('✅ Thread deleted:', threadId);
    } catch (error) {
      console.error('❌ Error deleting thread:', error);
      throw new Error('Failed to delete thread');
    }
  }

  /**
   * Get thread count for a user
   */
  async getThreadCount(userId: string): Promise<number> {
    try {
      const threadsQuery = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(threadsQuery);
      return querySnapshot.size;
    } catch (error) {
      console.error('❌ Error getting thread count:', error);
      return 0;
    }
  }
}

export const firestoreThreadService = new FirestoreThreadService();
