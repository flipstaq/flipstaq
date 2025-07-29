import React, { useState, useRef } from 'react';
import Avatar from './Avatar';
import LoadingSpinner from './LoadingSpinner';

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onUpload: (file: File) => Promise<any>;
  onRemove?: () => Promise<any>;
  disabled?: boolean;
  size?: 'lg' | 'xl' | '2xl';
}

export default function AvatarUpload({
  currentAvatar,
  onUpload,
  onRemove,
  disabled = false,
  size = 'xl',
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PNG, JPG, JPEG, or WebP image');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      await onUpload(file);
      setPreviewUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!onRemove || !currentAvatar) return;

    setIsUploading(true);
    try {
      await onRemove();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Display */}
      <div className="relative">
        <Avatar
          src={previewUrl || currentAvatar}
          size={size}
          showHoverEffect={!disabled && !isUploading}
          onClick={handleClick}
          className={`
            border-2 border-gray-200 dark:border-gray-600
            ${!disabled && !isUploading ? 'hover:border-indigo-500 dark:hover:border-indigo-400' : ''}
          `}
        />

        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-50">
            <LoadingSpinner size="sm" />
          </div>
        )}

        {/* Upload icon */}
        {!disabled && !isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-0 transition-all duration-200 hover:bg-opacity-30">
            <svg
              className="h-6 w-6 text-white opacity-0 transition-opacity duration-200 hover:opacity-100"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-4l-2-2H7a2 2 0 00-2 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {disabled
            ? 'Avatar upload disabled'
            : 'Click to upload a new profile picture'}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
          PNG, JPG, JPEG, or WebP • Max 5MB
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex space-x-3">
        <button
          onClick={handleClick}
          disabled={disabled || isUploading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? 'Uploading...' : 'Upload New'}
        </button>

        {currentAvatar && onRemove && (
          <button
            onClick={handleRemoveAvatar}
            disabled={disabled || isUploading}
            className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpg,image/jpeg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  );
}
