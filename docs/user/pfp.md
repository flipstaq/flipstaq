# Profile Picture (PFP) System Documentation

## Overview

The Flipstaq platform includes a comprehensive Profile Picture (PFP) system that allows users to upload, manage, and display custom avatars across the platform.

## Features

### 1. Default Avatar

- New users automatically receive a default avatar upon account creation
- Default avatar is a neutral SVG image stored at `/public/avatars/default-avatar.svg`
- Users without custom avatars fall back to the default avatar

### 2. Avatar Upload

- Users can upload custom profile pictures in PNG, JPG, JPEG, or WebP formats
- Maximum file size: 5MB
- Images are stored in `/uploads/avatars/` directory
- Filename format: `{userId}-{timestamp}.{extension}`

### 3. Avatar Management

- Upload new avatar with preview functionality
- Remove custom avatar (resets to default)
- Real-time avatar display across the platform

## API Endpoints

### User Service (Internal)

- `POST /internal/users/avatar` - Upload avatar
- `DELETE /internal/users/avatar` - Remove avatar

### API Gateway (Public)

- `POST /api/v1/users/avatar` - Upload avatar (JWT required)
- `DELETE /api/v1/users/avatar` - Remove avatar (JWT required)
- `GET /api/v1/users/me` - Get current user profile with avatar

## Database Schema

```sql
-- Added to User table
avatarUrl: String? // URL to avatar file, null = use default
```

## File Storage

### Development

- Files stored locally in `/uploads/avatars/`
- Served statically by the user service
- URL format: `http://localhost:3002/uploads/avatars/{filename}`

### Production Considerations

- Consider using cloud storage (AWS S3, Cloudflare R2, etc.)
- Update avatar URLs to point to CDN endpoints
- Implement image optimization and resizing

## Frontend Components

### Avatar Component (`/components/ui/Avatar.tsx`)

- Displays user avatar with fallback support
- Multiple size variants: xs, sm, md, lg, xl, 2xl
- Automatic error handling with default avatar fallback

### AvatarUpload Component (`/components/ui/AvatarUpload.tsx`)

- Complete avatar upload interface
- File validation and preview
- Upload progress and error handling
- Remove avatar functionality

### Profile Settings Page (`/pages/profile/settings.tsx`)

- User-facing avatar management
- Profile information display
- Multi-language support

## Usage Examples

### Basic Avatar Display

```tsx
import Avatar from "@/components/ui/Avatar";

<Avatar
  src={user.avatarUrl}
  alt={`${user.firstName} ${user.lastName}`}
  size="md"
/>;
```

### Avatar Upload Interface

```tsx
import AvatarUpload from "@/components/ui/AvatarUpload";

<AvatarUpload
  currentAvatar={user.avatarUrl}
  onUpload={handleAvatarUpload}
  onRemove={handleAvatarRemove}
  size="xl"
/>;
```

### API Usage

```typescript
import { userApi } from "@/lib/api/users";

// Upload avatar
const result = await userApi.uploadAvatar(file);

// Remove avatar
await userApi.removeAvatar();

// Get current user with avatar
const user = await userApi.getCurrentUser();
```

## Security Considerations

### File Validation

- File type validation on both frontend and backend
- File size limits enforced
- Malicious file detection

### Access Control

- Only authenticated users can upload/remove avatars
- Users can only modify their own avatars
- JWT token required for all avatar operations

### File Storage Security

- Files stored outside web root when possible
- Unique filenames prevent conflicts and guessing
- Regular cleanup of orphaned files

## Error Handling

### Upload Failures

- Invalid file type: Clear error message
- File too large: Size limit notification
- Network errors: Retry mechanism
- Server errors: Graceful fallback

### Display Failures

- Broken image URLs: Automatic fallback to default
- Missing avatars: Default avatar display
- Network issues: Cached avatar or default

## Internationalization

### Supported Languages

- English (en)
- Arabic (ar)

### Localized Elements

- Upload instructions and error messages
- Profile settings labels
- File format and size information

## Performance Optimizations

### Image Loading

- Lazy loading for avatar images
- Optimized default avatar (SVG)
- Proper image sizing attributes

### Caching

- Browser caching for uploaded avatars
- CDN integration ready
- Efficient fallback mechanisms

## Migration Guide

### Existing Users

- Run migration to add `avatarUrl` column
- All existing users will use default avatar
- Users can upload custom avatars after migration

### Database Migration

```sql
-- Migration: Add avatarUrl field
ALTER TABLE users ADD COLUMN avatarUrl VARCHAR(255) NULL;
```

## Future Enhancements

### Planned Features

- Image cropping and resizing
- Multiple avatar sizes/thumbnails
- Avatar history and rollback
- Bulk avatar management for admins

### Integration Opportunities

- Social media avatar import
- AI-generated avatars
- Avatar customization tools
- Integration with chat and messaging

## Troubleshooting

### Common Issues

1. **Avatar not displaying**: Check file permissions and URL accessibility
2. **Upload fails**: Verify file type and size, check disk space
3. **Default avatar missing**: Ensure SVG file exists in public directory
4. **API errors**: Check JWT token validity and user permissions

### Debug Steps

1. Check browser network tab for failed requests
2. Verify file upload endpoint is accessible
3. Check server logs for upload errors
4. Confirm database updates are successful
