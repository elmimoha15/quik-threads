const express = require('express');
const busboy = require('busboy');
const { getAudioDurationInSeconds } = require('get-audio-duration');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { storage, getCurrentTime } = require('../config/firebase');
const { getUserProfile } = require('./users');

const router = express.Router();

// Allowed file types
const ALLOWED_TYPES = ['mp3', 'mp4', 'm4a', 'wav', 'webm'];
const ALLOWED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/wav',
  'audio/webm',
  'video/mp4',
  'video/webm'
];

// File size limits (in bytes)
const MIN_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

/**
 * Helper function to get file extension from filename
 */
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase().substring(1);
};

/**
 * Helper function to validate file type
 */
const isValidFileType = (filename, mimeType) => {
  const extension = getFileExtension(filename);
  return ALLOWED_TYPES.includes(extension) && ALLOWED_MIME_TYPES.includes(mimeType);
};

/**
 * Helper function to format duration for user messages
 */
const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Helper function to get tier duration limit in seconds
 */
const getTierDurationLimit = (tier) => {
  switch (tier) {
    case 'free':
      return 1800; // 30 minutes
    case 'pro':
    case 'business':
      return 3600; // 60 minutes
    default:
      return 1800; // Default to free tier limit
  }
};

/**
 * POST /api/upload
 * Upload audio/video files with tier-based duration validation
 */
router.post('/', async (req, res) => {
  try {
    const { userId } = req;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required'
      });
    }

    // Get user profile for tier-based validation
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User profile not found'
      });
    }

    const maxDuration = getTierDurationLimit(userProfile.tier);

    // Parse multipart form data
    const bb = busboy({ 
      headers: req.headers,
      limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1 // Only allow one file at a time
      }
    });

    let fileProcessed = false;
    let uploadResult = null;
    let uploadError = null;

    bb.on('file', async (name, file, info) => {
      try {
        if (fileProcessed) {
          file.resume(); // Drain the file stream
          return;
        }
        fileProcessed = true;

        const { filename, mimeType } = info;

        // Validate file type
        if (!isValidFileType(filename, mimeType)) {
          uploadError = {
            status: 400,
            error: 'Invalid File Type',
            message: `Only ${ALLOWED_TYPES.join(', ')} files are allowed`,
            allowedTypes: ALLOWED_TYPES
          };
          file.resume();
          return;
        }

        // Create temporary file
        const tempDir = os.tmpdir();
        const tempFilename = `upload_${Date.now()}_${filename}`;
        const tempFilePath = path.join(tempDir, tempFilename);
        const writeStream = fs.createWriteStream(tempFilePath);

        let fileSize = 0;
        let fileSizeExceeded = false;

        // Track file size during upload
        file.on('data', (data) => {
          fileSize += data.length;
          if (fileSize > MAX_FILE_SIZE) {
            fileSizeExceeded = true;
            file.destroy();
            writeStream.destroy();
            fs.unlink(tempFilePath, () => {}); // Clean up temp file
          }
        });

        file.on('error', (error) => {
          console.error('File stream error:', error);
          uploadError = {
            status: 500,
            error: 'Upload Error',
            message: 'Failed to process uploaded file'
          };
          writeStream.destroy();
          fs.unlink(tempFilePath, () => {});
        });

        file.on('end', async () => {
          try {
            writeStream.end();

            if (fileSizeExceeded) {
              uploadError = {
                status: 413,
                error: 'File Too Large',
                message: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
              };
              fs.unlink(tempFilePath, () => {});
              return;
            }

            // Validate minimum file size
            if (fileSize < MIN_FILE_SIZE) {
              uploadError = {
                status: 400,
                error: 'File Too Small',
                message: `File size must be at least ${MIN_FILE_SIZE / (1024 * 1024)}MB`
              };
              fs.unlink(tempFilePath, () => {});
              return;
            }

            // Extract audio duration
            let duration;
            try {
              duration = await getAudioDurationInSeconds(tempFilePath);
            } catch (durationError) {
              console.error('Duration extraction error:', durationError);
              uploadError = {
                status: 400,
                error: 'Invalid Media File',
                message: 'Could not extract duration from the uploaded file. Please ensure it is a valid audio/video file.'
              };
              fs.unlink(tempFilePath, () => {});
              return;
            }

            // Validate duration against tier limits
            if (duration > maxDuration) {
              const maxDurationFormatted = formatDuration(maxDuration);
              const fileDurationFormatted = formatDuration(duration);
              
              uploadError = {
                status: 403,
                error: 'Duration Limit Exceeded',
                message: `Your ${userProfile.tier} plan allows files up to ${maxDurationFormatted}. This file is ${fileDurationFormatted}. Please upgrade your plan or use a shorter file.`,
                currentTier: userProfile.tier,
                maxDuration: maxDurationFormatted,
                fileDuration: fileDurationFormatted,
                upgradeUrl: userProfile.tier === 'free' ? 'https://quikthread.com/upgrade?from=free&to=pro' : 'https://quikthread.com/upgrade'
              };
              fs.unlink(tempFilePath, () => {});
              return;
            }

            // Upload to Firebase Storage
            const timestamp = Date.now();
            const storageFilename = `${timestamp}-${filename}`;
            const storagePath = `users/${userId}/uploads/${storageFilename}`;
            
            const bucket = storage.bucket();
            const file = bucket.file(storagePath);
            
            await file.save(fs.readFileSync(tempFilePath), {
              metadata: {
                contentType: mimeType,
                metadata: {
                  originalName: filename,
                  uploadedBy: userId,
                  uploadedAt: getCurrentTime().toISOString(),
                  duration: duration.toString(),
                  fileSize: fileSize.toString()
                }
              }
            });

            // Get download URL
            const [url] = await file.getSignedUrl({
              action: 'read',
              expires: '03-01-2500' // Far future date
            });

            uploadResult = {
              fileUrl: url,
              fileName: filename,
              duration: duration,
              size: fileSize,
              storagePath: storagePath,
              uploadedAt: getCurrentTime().toISOString()
            };

            // Clean up temp file
            fs.unlink(tempFilePath, () => {});

          } catch (error) {
            console.error('File processing error:', error);
            uploadError = {
              status: 500,
              error: 'Processing Error',
              message: 'Failed to process uploaded file'
            };
            fs.unlink(tempFilePath, () => {});
          }
        });

        file.pipe(writeStream);

      } catch (error) {
        console.error('File handler error:', error);
        uploadError = {
          status: 500,
          error: 'Upload Error',
          message: 'Failed to handle uploaded file'
        };
        file.resume();
      }
    });

    bb.on('error', (error) => {
      console.error('Busboy error:', error);
      if (!res.headersSent) {
        res.status(400).json({
          error: 'Upload Error',
          message: 'Failed to parse uploaded file'
        });
      }
    });

    bb.on('finish', () => {
      if (!fileProcessed) {
        return res.status(400).json({
          error: 'No File Uploaded',
          message: 'Please select a file to upload'
        });
      }

      if (uploadError) {
        return res.status(uploadError.status).json(uploadError);
      }

      if (uploadResult) {
        return res.status(200).json({
          message: 'File uploaded successfully',
          ...uploadResult
        });
      }

      // Fallback error
      return res.status(500).json({
        error: 'Upload Error',
        message: 'Unknown error occurred during upload'
      });
    });

    req.pipe(bb);

  } catch (error) {
    console.error('Upload endpoint error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process upload request'
    });
  }
});

module.exports = { router };
