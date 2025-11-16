const { GoogleGenerativeAI } = require('@google/generative-ai');

// Lazy initialization of Gemini client
let genAI = null;

const getGeminiClient = () => {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

/**
 * Validate and truncate tweet if it exceeds character limit
 * @param {string} tweet - Tweet text to validate
 * @param {number} maxLength - Maximum character length (default 270)
 * @returns {string} Validated and potentially truncated tweet
 */
const validateTweetLength = (tweet, maxLength = 270) => {
  if (!tweet || typeof tweet !== 'string') {
    return '';
  }
  
  // Remove extra whitespace
  const cleanTweet = tweet.trim();
  
  if (cleanTweet.length <= maxLength) {
    return cleanTweet;
  }
  
  // Truncate and add ellipsis, ensuring we don't break words
  const truncated = cleanTweet.substring(0, maxLength - 3);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > maxLength * 0.8) {
    // If we can find a good word boundary, use it
    return truncated.substring(0, lastSpaceIndex) + '...';
  } else {
    // Otherwise, just truncate with ellipsis
    return truncated + '...';
  }
};

/**
 * Parse and validate Gemini response for thread generation
 * @param {string} response - Raw response from Gemini
 * @returns {Array} Validated array of thread objects
 */
const parseThreadsResponse = (response) => {
  try {
    // Try to extract JSON from response if it's wrapped in markdown or other text
    let jsonStr = response.trim();
    
    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '');
    }
    
    const threads = JSON.parse(jsonStr);
    
    if (!Array.isArray(threads)) {
      throw new Error('Response is not an array');
    }
    
    // Validate and clean each thread
    const validatedThreads = threads.map((thread, index) => {
      const threadNumber = thread.threadNumber || index + 1;
      const hook = thread.hook || thread.title || `Thread ${threadNumber}`;
      const tweets = Array.isArray(thread.tweets) ? thread.tweets : [];
      
      // Validate and truncate each tweet
      const validatedTweets = tweets.map(tweet => validateTweetLength(tweet, 270));
      
      return {
        threadNumber,
        hook: validateTweetLength(hook, 270),
        tweets: validatedTweets.filter(tweet => tweet.length > 0) // Remove empty tweets
      };
    });
    
    return validatedThreads.filter(thread => thread.tweets.length > 0); // Remove empty threads
    
  } catch (error) {
    console.error('Error parsing threads response:', error);
    throw new Error(`Failed to parse Gemini response: ${error.message}`);
  }
};

/**
 * Generate viral X threads from transcript using Gemini
 * @param {Object} transcriptData - Enhanced transcript data from Deepgram
 * @param {string} aiInstructions - Optional AI instructions for customization
 * @param {Object} options - Generation options
 * @returns {Array} Array of thread objects with hooks and tweets
 */
const generateThreads = async (transcriptData, aiInstructions = null, options = {}) => {
  const maxRetries = 1;
  let lastError = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Generating threads (attempt ${attempt + 1}/${maxRetries + 1})`);
      
      // Get Gemini client
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      
      // Extract key information from transcript data
      const {
        transcript,
        summary,
        topics = [],
        speakers = [],
        duration,
        wordCount,
        paragraphs = [],
        hasMultipleSpeakers = false
      } = transcriptData;
      
      if (!transcript || transcript.trim().length === 0) {
        throw new Error('No transcript content provided');
      }
      
      // Build context information
      const contextInfo = [];
      if (summary) contextInfo.push(`Summary: ${summary}`);
      if (topics.length > 0) {
        const topicList = topics.map(t => t.topic || t).join(', ');
        contextInfo.push(`Key Topics: ${topicList}`);
      }
      if (speakers.length > 1) {
        contextInfo.push(`Speakers: ${speakers.join(', ')}`);
      }
      if (duration) {
        const minutes = Math.floor(duration / 60);
        contextInfo.push(`Duration: ${minutes} minutes`);
      }
      
      // Create the prompt with AI instructions if provided
      const customInstructions = aiInstructions ? `\n\nCustom Instructions: ${aiInstructions}` : '';
      
      const prompt = `
You are an expert social media content creator specializing in viral X (Twitter) threads.

Context Information:
${contextInfo.join('\n')}

Content to Transform:
${transcript}${customInstructions}

Task: Generate 5 viral X threads based on this content. Each thread should:
- Have 5-8 tweets maximum
- Each tweet must be under 270 characters
- Start with a compelling hook tweet
- Be engaging, informative, and shareable
- Use natural language and conversational tone
- Include relevant insights and takeaways
${aiInstructions ? `- Follow the custom instructions provided above` : ''}

Return ONLY a JSON array in this exact format:
[
  {
    "threadNumber": 1,
    "hook": "Hook tweet text here",
    "tweets": [
      "Hook tweet text here",
      "Second tweet expanding on the topic...",
      "Third tweet with key insight...",
      "Final tweet with conclusion or CTA..."
    ]
  }
]

Important: 
- Return ONLY the JSON array, no other text
- Ensure each tweet is under 270 characters
- Make hooks attention-grabbing and clickable
- Focus on the most interesting and valuable insights
`;

      console.log('Sending request to Gemini...');
      
      // Generate content
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini');
      }
      
      console.log('Received response from Gemini, parsing...');
      
      // Parse and validate the response
      const threads = parseThreadsResponse(text);
      
      if (threads.length === 0) {
        throw new Error('No valid threads generated');
      }
      
      console.log(`Successfully generated ${threads.length} threads`);
      
      // Add metadata to the response
      return {
        threads,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'gemini-2.0-flash-exp',
          sourceWordCount: wordCount,
          sourceDuration: duration,
          threadsGenerated: threads.length,
          totalTweets: threads.reduce((sum, thread) => sum + thread.tweets.length, 0),
          hasMultipleSpeakers,
          topics: topics.map(t => t.topic || t).slice(0, 5) // Top 5 topics
        }
      };
      
    } catch (error) {
      console.error(`Thread generation attempt ${attempt + 1} failed:`, error.message);
      lastError = error;
      
      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        console.log('Retrying thread generation in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  // If we get here, all attempts failed
  throw new Error(`Thread generation failed after ${maxRetries + 1} attempts. Last error: ${lastError?.message || 'Unknown error'}`);
};

/**
 * Generate a single thread from transcript (for testing or specific use cases)
 * @param {Object} transcriptData - Enhanced transcript data from Deepgram
 * @param {Object} options - Generation options
 * @returns {Object} Single thread object
 */
const generateSingleThread = async (transcriptData, options = {}) => {
  const result = await generateThreads(transcriptData, { ...options, threadCount: 1 });
  return result.threads[0] || null;
};

/**
 * Validate thread structure and content
 * @param {Object} thread - Thread object to validate
 * @returns {Object} Validation result
 */
const validateThread = (thread) => {
  const errors = [];
  const warnings = [];
  
  if (!thread.hook || thread.hook.length === 0) {
    errors.push('Thread must have a hook');
  } else if (thread.hook.length > 270) {
    errors.push('Hook exceeds 270 characters');
  }
  
  if (!Array.isArray(thread.tweets) || thread.tweets.length === 0) {
    errors.push('Thread must have tweets array');
  } else {
    if (thread.tweets.length < 2) {
      warnings.push('Thread has fewer than 2 tweets');
    }
    if (thread.tweets.length > 8) {
      warnings.push('Thread has more than 8 tweets (may be too long)');
    }
    
    thread.tweets.forEach((tweet, index) => {
      if (!tweet || tweet.length === 0) {
        errors.push(`Tweet ${index + 1} is empty`);
      } else if (tweet.length > 270) {
        errors.push(`Tweet ${index + 1} exceeds 270 characters`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      hookLength: thread.hook?.length || 0,
      tweetCount: thread.tweets?.length || 0,
      totalCharacters: (thread.hook?.length || 0) + (thread.tweets?.reduce((sum, tweet) => sum + tweet.length, 0) || 0)
    }
  };
};

module.exports = {
  generateThreads,
  generateSingleThread,
  validateTweetLength,
  validateThread,
  parseThreadsResponse
};
