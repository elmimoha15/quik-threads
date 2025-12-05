// Utility functions for managing threads in localStorage

export const addThreadToList = (newThread: any) => {
  const threadsData = localStorage.getItem('threads');
  const existingThreads = threadsData ? JSON.parse(threadsData) : [];
  
  // Check if this thread already exists
  const existingIndex = existingThreads.findIndex((t: any) => t.id === newThread.id);
  
  if (existingIndex === -1) {
    // Only add if it doesn't exist
    existingThreads.unshift(newThread);
    localStorage.setItem('threads', JSON.stringify(existingThreads));
    return true; // Thread was added
  }
  
  return false; // Thread already exists
};

export const updateThreadInList = (jobId: string, updates: any) => {
  const threadsData = localStorage.getItem('threads');
  const existingThreads = threadsData ? JSON.parse(threadsData) : [];
  
  const threadIndex = existingThreads.findIndex((t: any) => t.id === jobId);
  
  if (threadIndex !== -1) {
    existingThreads[threadIndex] = {
      ...existingThreads[threadIndex],
      ...updates
    };
    localStorage.setItem('threads', JSON.stringify(existingThreads));
    return true;
  }
  
  return false;
};

export const removeThreadFromList = (jobId: string) => {
  const threadsData = localStorage.getItem('threads');
  const existingThreads = threadsData ? JSON.parse(threadsData) : [];
  
  const updatedThreads = existingThreads.filter((t: any) => t.id !== jobId);
  localStorage.setItem('threads', JSON.stringify(updatedThreads));
};

export const getThreadById = (jobId: string) => {
  const threadsData = localStorage.getItem('threads');
  const existingThreads = threadsData ? JSON.parse(threadsData) : [];
  
  return existingThreads.find((t: any) => t.id === jobId);
};

export const removeDuplicateThreads = () => {
  const threadsData = localStorage.getItem('threads');
  if (!threadsData) return;
  
  const existingThreads = JSON.parse(threadsData);
  
  // Remove duplicates by keeping only the first occurrence of each ID
  const seenIds = new Set();
  const uniqueThreads = existingThreads.filter((thread: any) => {
    if (seenIds.has(thread.id)) {
      console.warn(`Removing duplicate thread with ID: ${thread.id}`);
      return false;
    }
    seenIds.add(thread.id);
    return true;
  });
  
  // Only update if we found duplicates
  if (uniqueThreads.length !== existingThreads.length) {
    console.log(`Removed ${existingThreads.length - uniqueThreads.length} duplicate threads`);
    localStorage.setItem('threads', JSON.stringify(uniqueThreads));
  }
  
  return uniqueThreads;
};
