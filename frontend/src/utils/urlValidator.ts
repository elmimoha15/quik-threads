/**
 * Validates and identifies URLs from various video and audio platforms
 */

export interface UrlValidationResult {
  isValid: boolean;
  platform?: string;
  error?: string;
}

// Supported platforms and their URL patterns
const SUPPORTED_PLATFORMS = {
  youtube: [
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i,
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=.+$/i,
    /^(https?:\/\/)?(www\.)?youtu\.be\/.+$/i,
    /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/.+$/i,
  ],
  tiktok: [
    /^(https?:\/\/)?(www\.)?(tiktok\.com|vm\.tiktok\.com)\/.+$/i,
    /^(https?:\/\/)?(www\.)?tiktok\.com\/@.+\/video\/.+$/i,
  ],
  spotify: [
    /^(https?:\/\/)?(open\.)?spotify\.com\/(episode|show|track)\/.+$/i,
  ],
  soundcloud: [
    /^(https?:\/\/)?(www\.)?soundcloud\.com\/.+$/i,
  ],
  apple_podcasts: [
    /^(https?:\/\/)?(podcasts\.)?apple\.com\/.+$/i,
  ],
  instagram: [
    /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel|tv)\/.+$/i,
  ],
  twitter: [
    /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+\/status\/.+$/i,
  ],
  facebook: [
    /^(https?:\/\/)?(www\.)?facebook\.com\/.+\/videos\/.+$/i,
    /^(https?:\/\/)?(www\.)?fb\.watch\/.+$/i,
  ],
  vimeo: [
    /^(https?:\/\/)?(www\.)?vimeo\.com\/.+$/i,
  ],
  twitch: [
    /^(https?:\/\/)?(www\.)?twitch\.tv\/videos\/.+$/i,
  ],
  // Generic audio/video URLs
  direct_media: [
    /^https?:\/\/.+\.(mp3|mp4|wav|m4a|aac|ogg|webm|mov|avi|flac)(\?.*)?$/i,
  ],
};

/**
 * Validates if a URL is from a supported platform
 */
export function validateUrl(url: string): UrlValidationResult {
  // Check if URL is empty
  if (!url || !url.trim()) {
    return {
      isValid: false,
      error: 'Please provide a URL',
    };
  }

  const trimmedUrl = url.trim();

  // Check if it's a valid URL format
  try {
    new URL(trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`);
  } catch {
    return {
      isValid: false,
      error: 'Please provide a valid URL',
    };
  }

  // Check against supported platforms
  for (const [platform, patterns] of Object.entries(SUPPORTED_PLATFORMS)) {
    for (const pattern of patterns) {
      if (pattern.test(trimmedUrl)) {
        return {
          isValid: true,
          platform: platform.replace('_', ' '),
        };
      }
    }
  }

  // If no specific platform matched, check if it's a valid HTTP(S) URL
  // This allows for other podcast platforms or direct media URLs
  if (/^https?:\/\/.+/i.test(trimmedUrl)) {
    return {
      isValid: true,
      platform: 'web',
    };
  }

  return {
    isValid: false,
    error: 'URL format not recognized. Please provide a link from YouTube, TikTok, Spotify, or other supported platforms.',
  };
}

/**
 * Gets a user-friendly platform name
 */
export function getPlatformDisplayName(platform?: string): string {
  if (!platform) return 'Unknown';
  
  const displayNames: Record<string, string> = {
    youtube: 'YouTube',
    tiktok: 'TikTok',
    spotify: 'Spotify',
    soundcloud: 'SoundCloud',
    apple_podcasts: 'Apple Podcasts',
    instagram: 'Instagram',
    twitter: 'X (Twitter)',
    facebook: 'Facebook',
    vimeo: 'Vimeo',
    twitch: 'Twitch',
    direct_media: 'Direct Media',
    web: 'Web',
  };
  
  return displayNames[platform] || platform;
}

/**
 * Checks if URL needs preprocessing (e.g., adding https://)
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
}
