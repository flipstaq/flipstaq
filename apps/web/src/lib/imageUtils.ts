/**
 * Image utility functions for handling product and user images
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';

/**
 * Get the full image URL
 * Handles both relative paths (/uploads/...) and full URLs (http://...)
 * @param imageUrl - The image URL from the API (can be relative or absolute)
 * @returns Full image URL
 */
export function getImageUrl(
  imageUrl: string | null | undefined
): string | null {
  if (!imageUrl) return null;

  // If it's already a full URL (starts with http:// or https://), return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Otherwise, prepend the API base URL
  return `${API_BASE_URL}${imageUrl}`;
}

/**
 * Get avatar URL with fallback to default avatar
 * @param avatarUrl - The avatar URL from the API
 * @returns Full avatar URL or default avatar path
 */
export function getAvatarUrl(avatarUrl: string | null | undefined): string {
  if (!avatarUrl) {
    return '/default-avatar.png'; // Default avatar
  }

  return getImageUrl(avatarUrl) || '/default-avatar.png';
}

/**
 * Get product image URL with optional fallback
 * @param imageUrl - The product image URL from the API
 * @param fallback - Optional fallback image URL
 * @returns Full image URL or fallback
 */
export function getProductImageUrl(
  imageUrl: string | null | undefined,
  fallback?: string
): string | null {
  const url = getImageUrl(imageUrl);

  if (!url && fallback) {
    return fallback;
  }

  return url;
}
