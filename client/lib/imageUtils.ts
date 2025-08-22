/**
 * Utility functions for handling images and image-related operations
 */

export interface ImageMetadata {
  size?: string;
  dimensions?: string;
  format?: string;
  location?: string;
  device?: string;
  software?: string;
  colorSpace?: string;
  compression?: string;
  uploadDate?: string;
  lastModified?: string;
}

export interface ImageData {
  id: string;
  url: string;
  title: string;
  description?: string;
  date: string;
  uploadedBy?: string;
  tags?: string[];
  category?: string;
  isPublic?: boolean;
  isFavorite?: boolean;
  isBookmarked?: boolean;
  metadata?: ImageMetadata;
  permissions?: {
    canEdit?: boolean;
    canDelete?: boolean;
    canShare?: boolean;
    canDownload?: boolean;
  };
}

/**
 * Generate a shareable link for an image
 */
export const generateShareableLink = (imageId: string, baseUrl?: string): string => {
  const origin = baseUrl || window.location.origin;
  return `${origin}/image/${imageId}`;
};

/**
 * Generate a direct image link (for embedding or direct access)
 */
export const generateDirectImageLink = (imageUrl: string): string => {
  return imageUrl;
};

/**
 * Generate an embed code for the image
 */
export const generateEmbedCode = (imageId: string, baseUrl?: string): string => {
  const shareableLink = generateShareableLink(imageId, baseUrl);
  return `<iframe src="${shareableLink}" width="100%" height="600" frameborder="0"></iframe>`;
};

/**
 * Download an image from a URL
 */
export const downloadImage = async (
  imageUrl: string, 
  filename?: string, 
  format?: string
): Promise<void> => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `image.${format || 'jpg'}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};

/**
 * Share an image using the Web Share API or fallback to clipboard
 */
export const shareImage = async (
  title: string,
  text: string,
  url: string
): Promise<void> => {
  try {
    if (navigator.share) {
      await navigator.share({
        title,
        text,
        url,
      });
    } else {
      // Fallback: copy link to clipboard
      await navigator.clipboard.writeText(url);
      throw new Error('Link copied to clipboard');
    }
  } catch (error) {
    if (error.message === 'Link copied to clipboard') {
      throw error; // Re-throw to handle in UI
    }
    console.error('Share error:', error);
    throw new Error('Failed to share image');
  }
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('Clipboard error:', error);
    throw new Error('Failed to copy to clipboard');
  }
};

/**
 * Get image dimensions from URL
 */
export const getImageDimensions = (imageUrl: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = imageUrl;
  });
};

/**
 * Get file size from URL
 */
export const getFileSize = async (imageUrl: string): Promise<string> => {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    
    if (contentLength) {
      const bytes = parseInt(contentLength, 10);
      return formatFileSize(bytes);
    }
    
    throw new Error('Content-Length header not found');
  } catch (error) {
    console.error('File size error:', error);
    return 'Unknown';
  }
};

/**
 * Format file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate image file type
 */
export const validateImageType = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
};

/**
 * Validate image file size
 */
export const validateImageSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Generate image thumbnail URL
 */
export const generateThumbnailUrl = (imageUrl: string, width: number = 300, height: number = 300): string => {
  // This is a simple example - in production you might use a CDN or image processing service
  if (imageUrl.includes('unsplash.com')) {
    return `${imageUrl}?w=${width}&h=${height}&fit=crop`;
  }
  return imageUrl;
};

/**
 * Create a data URL from a file
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Compress image data URL
 */
export const compressImage = (
  dataUrl: string, 
  maxWidth: number = 1920, 
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      
      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      
      resolve(compressedDataUrl);
    };
    
    img.src = dataUrl;
  });
};

/**
 * Extract EXIF data from image (if available)
 */
export const extractExifData = async (file: File): Promise<any> => {
  // This would typically use a library like exif-js
  // For now, return basic file info
  return {
    name: file.name,
    size: formatFileSize(file.size),
    type: file.type,
    lastModified: new Date(file.lastModified).toISOString(),
  };
};

/**
 * Generate unique image ID
 */
export const generateImageId = (): string => {
  return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Sanitize image filename
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
};

/**
 * Check if image URL is accessible
 */
export const checkImageAccessibility = async (imageUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
};