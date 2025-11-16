const OpenAI = require('openai');

// Lazy initialization of OpenAI client
let openai = null;

const getOpenAIClient = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
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
  
  // Truncate and add ellipsis
  return cleanTweet.substring(0, maxLength - 3) + '...';
};

/**
 * Generate X threads from a topic using OpenAI GPT-4o Mini
 * @param {string} topic - The topic to generate threads about
 * @param {string} aiInstructions - Additional instructions for the AI
 * @param {number} threadCount - Number of threads to generate (default 5)
 * @returns {Promise<Array>} Array of thread objects
 */
const generateThreads = async (topic, aiInstructions = '', threadCount = 5) => {
  const client = getOpenAIClient();
  
  const systemPrompt = `You are an expert X (Twitter) content creator. Generate engaging, viral-worthy X threads that are informative, actionable, and shareable. Each thread should be 5-10 tweets long.

IMPORTANT FORMATTING RULES:
- Each tweet must be under 270 characters
- Use emojis strategically for engagement
- Include relevant hashtags (2-3 per thread)
- Make the first tweet a compelling hook
- End with a call-to-action or engagement prompt
- Use numbered format (1/, 2/, etc.) for thread structure

Return your response as a valid JSON array where each thread is an object with:
- "hook": The compelling first tweet
- "tweets": Array of tweet strings (including the hook as first element)
- "hashtags": Array of relevant hashtags
- "topic": The main topic/theme

${aiInstructions ? `Additional instructions: ${aiInstructions}` : ''}`;

  const userPrompt = `Generate ${threadCount} viral X threads about: "${topic}"

Make them engaging, actionable, and shareable. Focus on providing value while being entertaining.`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content;
    
    // Try to parse JSON response
    let threads;
    try {
      threads = JSON.parse(content);
    } catch (parseError) {
      // If JSON parsing fails, try to extract threads from text
      threads = parseThreadsFromText(content, threadCount);
    }

    // Validate and process threads
    if (!Array.isArray(threads)) {
      throw new Error('Generated content is not in expected array format');
    }

    // Validate and clean each thread
    const validatedThreads = threads.map((thread, index) => {
      if (!thread.tweets || !Array.isArray(thread.tweets)) {
        throw new Error(`Thread ${index + 1} missing tweets array`);
      }

      // Validate tweet lengths
      const validatedTweets = thread.tweets.map(tweet => validateTweetLength(tweet));

      return {
        hook: thread.hook || validatedTweets[0] || `Thread ${index + 1} about ${topic}`,
        tweets: validatedTweets,
        hashtags: thread.hashtags || [`#${topic.replace(/\s+/g, '')}`],
        topic: thread.topic || topic,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'gpt-4o-mini',
          tweetCount: validatedTweets.length
        }
      };
    });

    return validatedThreads;

  } catch (error) {
    console.error('OpenAI thread generation error:', error);
    throw new Error(`Thread generation failed: ${error.message}`);
  }
};

/**
 * Parse threads from text format when JSON parsing fails
 * @param {string} content - Raw text content from OpenAI
 * @param {number} threadCount - Expected number of threads
 * @returns {Array} Array of thread objects
 */
const parseThreadsFromText = (content, threadCount) => {
  const threads = [];
  const lines = content.split('\n').filter(line => line.trim());
  
  let currentThread = null;
  let currentTweets = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check if this is a thread separator or new thread indicator
    if (trimmedLine.includes('Thread') || trimmedLine.includes('🧵') || 
        (trimmedLine.startsWith('1/') && currentThread)) {
      
      // Save previous thread if exists
      if (currentThread && currentTweets.length > 0) {
        threads.push({
          hook: currentTweets[0],
          tweets: currentTweets,
          hashtags: extractHashtags(currentTweets.join(' ')),
          topic: currentThread
        });
      }
      
      // Start new thread
      currentThread = trimmedLine;
      currentTweets = [];
    }
    
    // Check if this is a numbered tweet
    if (/^\d+\//.test(trimmedLine)) {
      currentTweets.push(trimmedLine);
    } else if (trimmedLine.length > 10 && !trimmedLine.includes('Thread')) {
      // Add as regular tweet if it's substantial content
      currentTweets.push(trimmedLine);
    }
  }
  
  // Add the last thread
  if (currentThread && currentTweets.length > 0) {
    threads.push({
      hook: currentTweets[0],
      tweets: currentTweets,
      hashtags: extractHashtags(currentTweets.join(' ')),
      topic: currentThread
    });
  }
  
  return threads.slice(0, threadCount);
};

/**
 * Extract hashtags from text
 * @param {string} text - Text to extract hashtags from
 * @returns {Array} Array of hashtags
 */
const extractHashtags = (text) => {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? [...new Set(matches)] : [];
};

/**
 * Generate threads from transcribed content
 * @param {string} transcription - The transcribed text
 * @param {string} aiInstructions - Additional instructions for the AI
 * @param {number} threadCount - Number of threads to generate
 * @returns {Promise<Array>} Array of thread objects
 */
const generateThreadsFromTranscription = async (transcription, aiInstructions = '', threadCount = 5) => {
  const client = getOpenAIClient();
  
  const systemPrompt = `You are an expert X (Twitter) content creator. Convert the provided transcription into engaging, viral-worthy X threads.

IMPORTANT FORMATTING RULES:
- Each tweet must be under 270 characters
- Use emojis strategically for engagement
- Include relevant hashtags (2-3 per thread)
- Make the first tweet a compelling hook
- End with a call-to-action or engagement prompt
- Use numbered format (1/, 2/, etc.) for thread structure

Extract the key insights, quotes, and actionable advice from the transcription. Make it engaging and shareable.

Return your response as a valid JSON array where each thread is an object with:
- "hook": The compelling first tweet
- "tweets": Array of tweet strings (including the hook as first element)
- "hashtags": Array of relevant hashtags
- "topic": The main topic/theme

${aiInstructions ? `Additional instructions: ${aiInstructions}` : ''}`;

  const userPrompt = `Convert this transcription into ${threadCount} engaging X threads:

"${transcription}"

Focus on the most valuable insights and make them shareable and actionable.`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content;
    
    // Try to parse JSON response
    let threads;
    try {
      threads = JSON.parse(content);
    } catch (parseError) {
      // If JSON parsing fails, try to extract threads from text
      threads = parseThreadsFromText(content, threadCount);
    }

    // Validate and process threads (same as generateThreads)
    if (!Array.isArray(threads)) {
      throw new Error('Generated content is not in expected array format');
    }

    const validatedThreads = threads.map((thread, index) => {
      if (!thread.tweets || !Array.isArray(thread.tweets)) {
        throw new Error(`Thread ${index + 1} missing tweets array`);
      }

      const validatedTweets = thread.tweets.map(tweet => validateTweetLength(tweet));

      return {
        hook: thread.hook || validatedTweets[0] || `Thread ${index + 1} from transcription`,
        tweets: validatedTweets,
        hashtags: thread.hashtags || ['#Content'],
        topic: thread.topic || 'Transcription Content',
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'gpt-4o-mini',
          tweetCount: validatedTweets.length,
          source: 'transcription'
        }
      };
    });

    return validatedThreads;

  } catch (error) {
    console.error('OpenAI transcription thread generation error:', error);
    throw new Error(`Thread generation from transcription failed: ${error.message}`);
  }
};

module.exports = {
  generateThreads,
  generateThreadsFromTranscription,
  validateTweetLength
};
