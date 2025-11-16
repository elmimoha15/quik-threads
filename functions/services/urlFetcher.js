const ytdl = require('ytdl-core');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { getAudioDurationInSeconds } = require('get-audio-duration');
const { storage, getCurrentTime } = require('../config/firebase');

/**
 * Check if URL is a YouTube URL
 */
const isYouTubeUrl = (url) => {
  return ytdl.validateURL(url);
};

/**
 * Get content type and size from URL using HEAD request
 */
const getUrlInfo = (url) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'HEAD',
      timeout: 10000
    }, (res) => {
      resolve({
        contentType: res.headers['content-type'] || '',
        contentLength: parseInt(res.headers['content-length'] || '0'),
        statusCode: res.statusCode
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
};

/**
 * Download file from URL with timeout
 */
const downloadFile = (url, outputPath, timeoutMs = 300000) => { // 5 minute timeout
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const file = fs.createWriteStream(outputPath);
    let downloadedBytes = 0;
    
    const req = client.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(outputPath, () => {});
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      res.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        // Limit download size to 500MB
        if (downloadedBytes > 500 * 1024 * 1024) {
          req.destroy();
          file.close();
          fs.unlink(outputPath, () => {});
          reject(new Error('File too large (>500MB)'));
          return;
        }
      });

      res.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(downloadedBytes);
      });
    });

    req.on('error', (err) => {
      file.close();
      fs.unlink(outputPath, () => {});
      reject(err);
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      file.close();
      fs.unlink(outputPath, () => {});
      reject(new Error('Download timeout'));
    });
  });
};

/**
 * Download YouTube audio using ytdl-core
 */
const downloadYouTubeAudio = async (url, outputPath, timeoutMs = 300000) => {
  return new Promise((resolve, reject) => {
    try {
      const stream = ytdl(url, {
        quality: 'highestaudio',
        filter: 'audioonly'
      });

      const file = fs.createWriteStream(outputPath);
      let downloadedBytes = 0;

      const timeout = setTimeout(() => {
        stream.destroy();
        file.close();
        fs.unlink(outputPath, () => {});
        reject(new Error('YouTube download timeout'));
      }, timeoutMs);

      stream.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (downloadedBytes > 500 * 1024 * 1024) {
          clearTimeout(timeout);
          stream.destroy();
          file.close();
          fs.unlink(outputPath, () => {});
          reject(new Error('File too large (>500MB)'));
          return;
        }
      });

      stream.on('error', (error) => {
        clearTimeout(timeout);
        file.close();
        fs.unlink(outputPath, () => {});
        reject(error);
      });

      stream.pipe(file);

      file.on('finish', () => {
        clearTimeout(timeout);
        file.close();
        resolve(downloadedBytes);
      });

      file.on('error', (error) => {
        clearTimeout(timeout);
        stream.destroy();
        fs.unlink(outputPath, () => {});
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Main function to fetch audio/video from URL
 * @param {string} url - URL to fetch from
 * @param {string} userId - User ID for storage path
 * @param {number} maxDuration - Maximum allowed duration in seconds
 * @returns {Object} { storagePath, duration, fileSize, originalUrl }
 */
const fetchFromUrl = async (url, userId, maxDuration) => {
  let tempFilePath = null;
  
  try {
    console.log(`Fetching from URL: ${url} for user: ${userId}`);
    
    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      throw new Error('Invalid URL format');
    }

    const timestamp = Date.now();
    const tempDir = os.tmpdir();
    
    if (isYouTubeUrl(url)) {
      console.log('Detected YouTube URL');
      
      // Get YouTube video info first
      let videoInfo;
      try {
        videoInfo = await ytdl.getInfo(url);
      } catch (error) {
        throw new Error('Failed to get YouTube video information');
      }

      // Check if video is available
      if (!videoInfo.videoDetails.isLiveContent && videoInfo.videoDetails.lengthSeconds) {
        const videoDuration = parseInt(videoInfo.videoDetails.lengthSeconds);
        
        if (videoDuration > maxDuration) {
          const maxMinutes = Math.floor(maxDuration / 60);
          const videoMinutes = Math.floor(videoDuration / 60);
          throw new Error(`Video duration (${videoMinutes} minutes) exceeds your plan limit of ${maxMinutes} minutes. Please upgrade your plan or use a shorter video.`);
        }
      }

      tempFilePath = path.join(tempDir, `youtube_${timestamp}.m4a`);
      
      // Download YouTube audio
      const fileSize = await downloadYouTubeAudio(url, tempFilePath);
      console.log(`YouTube audio downloaded: ${fileSize} bytes`);
      
    } else {
      console.log('Processing generic URL');
      
      // Check URL info first
      const urlInfo = await getUrlInfo(url);
      
      if (urlInfo.statusCode !== 200) {
        throw new Error(`URL returned status ${urlInfo.statusCode}`);
      }

      // Check if it's audio/video content
      const contentType = urlInfo.contentType.toLowerCase();
      const isAudioVideo = contentType.includes('audio/') || 
                          contentType.includes('video/') ||
                          contentType.includes('application/octet-stream');

      if (!isAudioVideo) {
        throw new Error(`URL does not contain audio/video content. Content type: ${contentType}`);
      }

      // Check file size
      if (urlInfo.contentLength > 500 * 1024 * 1024) {
        throw new Error('File too large (>500MB)');
      }

      if (urlInfo.contentLength < 1 * 1024 * 1024) {
        throw new Error('File too small (<1MB)');
      }

      // Determine file extension based on content type
      let extension = '.m4a'; // default
      if (contentType.includes('mp3')) extension = '.mp3';
      else if (contentType.includes('wav')) extension = '.wav';
      else if (contentType.includes('mp4')) extension = '.mp4';
      else if (contentType.includes('webm')) extension = '.webm';

      tempFilePath = path.join(tempDir, `download_${timestamp}${extension}`);
      
      // Download the file
      const fileSize = await downloadFile(url, tempFilePath);
      console.log(`File downloaded: ${fileSize} bytes`);
    }

    // Extract duration from downloaded file
    let duration;
    try {
      duration = await getAudioDurationInSeconds(tempFilePath);
      console.log(`Extracted duration: ${duration} seconds`);
    } catch (error) {
      throw new Error('Failed to extract duration from downloaded file');
    }

    // Validate duration against user's limit
    if (duration > maxDuration) {
      const maxMinutes = Math.floor(maxDuration / 60);
      const fileMinutes = Math.floor(duration / 60);
      throw new Error(`File duration (${fileMinutes} minutes) exceeds your plan limit of ${maxMinutes} minutes. Please upgrade your plan or use a shorter file.`);
    }

    // Upload to Firebase Storage
    const storageFilename = `${timestamp}.m4a`;
    const storagePath = `users/${userId}/fetched/${storageFilename}`;
    
    const bucket = storage.bucket();
    const file = bucket.file(storagePath);
    
    const fileBuffer = fs.readFileSync(tempFilePath);
    
    await file.save(fileBuffer, {
      metadata: {
        contentType: 'audio/mp4',
        metadata: {
          originalUrl: url,
          fetchedBy: userId,
          fetchedAt: getCurrentTime().toISOString(),
          duration: duration.toString(),
          fileSize: fileBuffer.length.toString()
        }
      }
    });

    console.log(`File uploaded to Firebase Storage: ${storagePath}`);

    // Clean up temp file
    fs.unlink(tempFilePath, (err) => {
      if (err) console.error('Error cleaning up temp file:', err);
    });

    return {
      storagePath,
      duration,
      fileSize: fileBuffer.length,
      originalUrl: url,
      fetchedAt: getCurrentTime().toISOString()
    };

  } catch (error) {
    console.error('Error in fetchFromUrl:', error);
    
    // Clean up temp file on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error('Error cleaning up temp file:', err);
      });
    }
    
    throw error;
  }
};

/**
 * Helper function to validate if URL is accessible
 */
const validateUrl = async (url) => {
  try {
    if (isYouTubeUrl(url)) {
      const info = await ytdl.getInfo(url);
      return {
        valid: true,
        type: 'youtube',
        title: info.videoDetails.title,
        duration: parseInt(info.videoDetails.lengthSeconds) || 0
      };
    } else {
      const urlInfo = await getUrlInfo(url);
      return {
        valid: urlInfo.statusCode === 200,
        type: 'generic',
        contentType: urlInfo.contentType,
        contentLength: urlInfo.contentLength
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
};

module.exports = {
  fetchFromUrl,
  validateUrl,
  isYouTubeUrl
};
