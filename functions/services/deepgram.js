const { createClient } = require('@deepgram/sdk');
const { storage } = require('../config/firebase');

// Lazy initialization of Deepgram client
let deepgram = null;

const getDeepgramClient = () => {
  if (!deepgram) {
    if (!process.env.DEEPGRAM_API_KEY) {
      throw new Error('DEEPGRAM_API_KEY environment variable is required');
    }
    deepgram = createClient(process.env.DEEPGRAM_API_KEY);
  }
  return deepgram;
};

/**
 * Get signed URL from Firebase Storage file
 * @param {string} storageFilePath - Path to file in Firebase Storage
 * @param {number} expiryHours - URL expiry in hours (default 1 hour)
 * @returns {string} Signed URL
 */
const getSignedUrl = async (storageFilePath, expiryHours = 1) => {
  try {
    const bucket = storage.bucket();
    const file = bucket.file(storageFilePath);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`File not found: ${storageFilePath}`);
    }
    
    // Generate signed URL
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + (expiryHours * 60 * 60 * 1000) // Convert hours to milliseconds
    });
    
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

/**
 * Extract additional metadata from Deepgram response for better Gemini processing
 * @param {Object} deepgramResponse - Full Deepgram API response
 * @returns {Object} Enhanced metadata
 */
const extractMetadata = (deepgramResponse) => {
  const metadata = deepgramResponse.metadata || {};
  const results = deepgramResponse.results || {};
  const channels = results.channels || [];
  const channel = channels[0] || {};
  const alternatives = channel.alternatives || [];
  const alternative = alternatives[0] || {};
  
  // Extract speaker information if diarization is available
  const speakers = [];
  const speakerStats = {};
  
  if (alternative.words) {
    alternative.words.forEach(word => {
      if (word.speaker !== undefined) {
        const speakerId = `Speaker ${word.speaker}`;
        if (!speakers.includes(speakerId)) {
          speakers.push(speakerId);
          speakerStats[speakerId] = {
            wordCount: 0,
            totalTime: 0,
            segments: []
          };
        }
        speakerStats[speakerId].wordCount++;
      }
    });
  }
  
  // Extract paragraphs if available
  const paragraphs = alternative.paragraphs?.paragraphs || [];
  const paragraphTexts = paragraphs.map(p => p.sentences?.map(s => s.text).join(' ')).filter(Boolean);
  
  // Calculate confidence scores
  const confidenceScores = alternative.words?.map(w => w.confidence).filter(c => c !== undefined) || [];
  const avgConfidence = confidenceScores.length > 0 
    ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length 
    : 0;
  
  return {
    // Basic metadata
    duration: metadata.duration || 0,
    channels: metadata.channels || 1,
    model: metadata.model_info?.name || 'unknown',
    language: results.language || 'en',
    
    // Content analysis
    wordCount: alternative.words?.length || 0,
    paragraphCount: paragraphs.length,
    speakerCount: speakers.length,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
    
    // Speaker information
    speakers,
    speakerStats,
    
    // Content structure
    paragraphs: paragraphTexts,
    hasMultipleSpeakers: speakers.length > 1,
    
    // Quality indicators
    lowConfidenceWords: alternative.words?.filter(w => w.confidence < 0.8).length || 0,
    
    // Timestamps for key moments
    firstWordTime: alternative.words?.[0]?.start || 0,
    lastWordTime: alternative.words?.[alternative.words.length - 1]?.end || 0
  };
};

/**
 * Transcribe audio file using Deepgram
 * @param {string} storageFilePath - Path to audio file in Firebase Storage
 * @param {Object} options - Transcription options
 * @returns {Object} Transcription result with enhanced metadata
 */
const transcribe = async (storageFilePath, options = {}) => {
  const maxRetries = 1;
  let lastError = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Transcribing file: ${storageFilePath} (attempt ${attempt + 1}/${maxRetries + 1})`);
      
      // Get signed URL for the file
      const signedUrl = await getSignedUrl(storageFilePath, 1); // 1 hour expiry
      console.log('Generated signed URL for transcription');
      
      // Prepare Deepgram options
      const deepgramOptions = {
        model: 'nova-2',
        smart_format: true,
        punctuate: true,
        diarize: true,
        language: 'en',
        utterances: true,
        paragraphs: true,
        summarize: 'v2',
        detect_topics: true,
        ...options // Allow override of default options
      };
      
      console.log('Deepgram options:', deepgramOptions);
      
      // Call Deepgram API
      const deepgramClient = getDeepgramClient();
      const { result, error } = await deepgramClient.listen.prerecorded.transcribeUrl(
        { url: signedUrl },
        deepgramOptions
      );
      
      if (error) {
        throw new Error(`Deepgram API error: ${error.message || error}`);
      }
      
      if (!result || !result.results) {
        throw new Error('Invalid response from Deepgram API');
      }
      
      console.log('Transcription completed successfully');
      
      // Extract transcript text
      const channels = result.results.channels || [];
      const channel = channels[0] || {};
      const alternatives = channel.alternatives || [];
      const alternative = alternatives[0] || {};
      const transcript = alternative.transcript || '';
      
      if (!transcript.trim()) {
        throw new Error('No transcript text found in response');
      }
      
      // Extract enhanced metadata
      const metadata = extractMetadata(result);
      
      // Extract summary if available
      const summary = result.results.summary?.short || '';
      
      // Extract topics if available
      const topics = result.results.topics?.segments?.map(segment => ({
        topic: segment.topic,
        confidence: segment.confidence_score,
        text: segment.text
      })) || [];
      
      // Return comprehensive data for Gemini
      return {
        // Core transcription data
        transcript,
        wordCount: metadata.wordCount,
        duration: metadata.duration,
        
        // Enhanced metadata for better X post generation
        summary,
        topics,
        paragraphs: metadata.paragraphs,
        
        // Speaker information
        speakerCount: metadata.speakerCount,
        speakers: metadata.speakers,
        hasMultipleSpeakers: metadata.hasMultipleSpeakers,
        speakerStats: metadata.speakerStats,
        
        // Content quality
        avgConfidence: metadata.avgConfidence,
        language: metadata.language,
        
        // Structure information
        paragraphCount: metadata.paragraphCount,
        
        // Key insights for content creation
        keyMoments: {
          startTime: metadata.firstWordTime,
          endTime: metadata.lastWordTime,
          totalDuration: metadata.duration
        },
        
        // Quality indicators
        transcriptionQuality: {
          avgConfidence: metadata.avgConfidence,
          lowConfidenceWords: metadata.lowConfidenceWords,
          model: metadata.model
        },
        
        // Raw response for advanced processing
        rawResponse: result,
        
        // Processing metadata
        processedAt: new Date().toISOString(),
        storageFilePath
      };
      
    } catch (error) {
      console.error(`Transcription attempt ${attempt + 1} failed:`, error.message);
      lastError = error;
      
      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        console.log('Retrying transcription in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  // If we get here, all attempts failed
  throw new Error(`Transcription failed after ${maxRetries + 1} attempts. Last error: ${lastError?.message || 'Unknown error'}`);
};

/**
 * Get transcription status and metadata without full processing
 * @param {string} storageFilePath - Path to audio file in Firebase Storage
 * @returns {Object} Basic file information
 */
const getFileInfo = async (storageFilePath) => {
  try {
    const bucket = storage.bucket();
    const file = bucket.file(storageFilePath);
    
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`File not found: ${storageFilePath}`);
    }
    
    const [metadata] = await file.getMetadata();
    
    return {
      exists: true,
      size: parseInt(metadata.size),
      contentType: metadata.contentType,
      created: metadata.timeCreated,
      updated: metadata.updated,
      storageFilePath
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    throw error;
  }
};

module.exports = {
  transcribe,
  getSignedUrl,
  getFileInfo,
  extractMetadata
};
