# Legal Service

The Legal Service manages all legal documents for the Flipstaq platform, including Terms of Service, Privacy Policy, Cookie Policy, and other legal content.

## Overview

The Legal Service provides a centralized solution for managing legal documents with the following key features:

- **Multi-language support**: Store legal documents in multiple languages (English, Arabic, etc.)
- **Version control**: Track document versions and updates
- **Role-based access**: Only Owners and Higher Staff can create/update/delete documents
- **Audit logging**: Track who made changes and when
- **Active document management**: Ensure only one version per document type/language is active

## Technology Stack

- **Framework**: NestJS 11.1.3
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based with role validation
- **API Documentation**: Swagger/OpenAPI
- **Rate Limiting**: 100 requests per IP per 15 minutes

## Architecture

### Database Model

```prisma
model LegalDocument {
  id          String   @id @default(cuid())
  type        String   // e.g., "tos", "privacy", "cookie_policy"
  language    String   // e.g., "en", "ar"
  title       String   // Document title
  content     String   @db.Text // Markdown or rich text content
  version     Int      @default(1)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  updatedById String   // User who last updated this document

  updatedBy   User     @relation(fields: [updatedById], references: [id])

  @@unique([type, language, isActive])
  @@index([type, language])
  @@map("legal_documents")
}
```

### Key Features

1. **Document Types**: Flexible system supporting any document type (tos, privacy, cookie_policy, etc.)
2. **Language Support**: Each document type can have multiple language versions
3. **Version Control**: Automatic version incrementing when content changes
4. **Active Management**: Only one version per type/language can be active at a time
5. **Audit Trail**: Full tracking of who created/updated documents and when

## API Endpoints

### Public Endpoints (No Authentication Required)

- `GET /legal/documents/{type}?language=en` - Get active legal document by type and language
- `GET /legal/documents/types` - Get list of all available document types
- `GET /legal/documents/types/{type}/languages` - Get available languages for a document type

### Admin Endpoints (Owners/Higher Staff Only)

- `GET /legal/documents` - Get all legal documents (all versions)
- `GET /legal/documents/id/{id}` - Get specific document by ID
- `POST /legal/documents` - Create new legal document
- `PATCH /legal/documents/{id}` - Update existing document
- `DELETE /legal/documents/{id}` - Delete document

## Security

### Role-Based Access Control

- **Public access**: Reading active documents (for frontend display)
- **Admin access**: Full CRUD operations for Owners and Higher Staff only
- **JWT validation**: All admin operations require valid authentication token

### Rate Limiting

- **Global limit**: 100 requests per IP per 15 minutes
- **Consistent with other services**: Uses same rate limiting strategy

### Input Validation

- Content validation and sanitization
- Required field validation
- Type and language format validation

## Integration

### API Gateway

The Legal Service is integrated with the API Gateway at `/api/v1/legal/*` routes:

- Public routes are accessible without authentication
- Admin routes require valid JWT token
- Automatic request forwarding to the legal service

### Frontend Integration

Legal documents can be accessed in the frontend via:

```typescript
// Get Terms of Service in user's language
const tos = await fetch("/api/v1/legal/documents/tos?language=en");

// Get Privacy Policy in Arabic
const privacy = await fetch("/api/v1/legal/documents/privacy?language=ar");
```

### Admin Panel Integration

The admin panel includes a "Legal" tab where administrators can:

- View all legal documents
- Create new documents for different types/languages
- Edit existing documents (creates new version)
- Delete outdated documents
- Preview documents before publishing

## Deployment

### Environment Variables

```env
PORT=3010
DATABASE_URL=postgresql://username:password@localhost:5432/flipstaq_dev
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### Docker

The service includes a Dockerfile for containerized deployment:

```bash
# Build and run
docker build -t flipstaq-legal-service .
docker run -p 3010:3010 flipstaq-legal-service
```

### Health Checks

The service provides health check endpoints:

- Service health: `GET /`
- API documentation: `GET /api/docs`

## Monitoring and Logging

### Audit Logging

All document operations are logged with:

- User ID who performed the action
- Document type and language
- Version information
- Timestamp of the operation
- Action type (create, update, delete)

### Rate Limit Logging

Rate limit violations are logged with:

- IP address
- Number of requests
- Endpoint accessed
- Timestamp

## Usage Examples

### Creating a Terms of Service Document

```typescript
POST / legal / documents;
Authorization: Bearer <
  admin - jwt - token >
  {
    type: "tos",
    language: "en",
    title: "Terms of Service",
    content: "# Terms of Service\n\nWelcome to Flipstaq...",
    isActive: true,
  };
```

### Getting Active Privacy Policy

```typescript
GET /legal/documents/privacy?language=ar

Response:
{
  "id": "clh2k3j4h0000qwerty123456",
  "type": "privacy",
  "language": "ar",
  "title": "سياسة الخصوصية",
  "content": "# سياسة الخصوصية\n\nمرحباً بك في فليبستاق...",
  "version": 2,
  "isActive": true,
  "createdAt": "2025-06-27T10:00:00Z",
  "updatedAt": "2025-06-27T12:00:00Z",
  "updatedBy": {
    "id": "admin123",
    "username": "admin",
    "firstName": "Admin",
    "lastName": "User"
  }
}
```

## Best Practices

1. **Version Management**: Always increment versions when making content changes
2. **Language Consistency**: Ensure all critical documents are available in all supported languages
3. **Content Review**: Review legal documents with legal counsel before publishing
4. **Backup**: Regular database backups to prevent loss of legal documents
5. **Audit Compliance**: Maintain audit logs for legal compliance requirements

## Troubleshooting

### Common Issues

1. **Document Not Found**: Check if document exists and is active for the requested language
2. **Permission Denied**: Ensure user has Owner or Higher Staff role for admin operations
3. **Version Conflicts**: Only one document per type/language can be active at a time
4. **Rate Limiting**: Respect rate limits to avoid 429 errors

### Debug Mode

Enable debug logging by setting `DEBUG_REQUESTS=true` in environment variables.

## Recent Improvements (June 2025)

✅ **Translation Integration Fixed**:

- Added `admin-legal` namespace to LanguageProvider for proper translation loading
- Fixed raw translation keys appearing in admin panel (e.g., `admin-legal:title`)
- Enhanced Arabic RTL support for legal document editing

✅ **Admin Panel UI Polish**:

- Modernized legal tab design with consistent styling across admin panel
- Improved visual hierarchy with better typography and spacing
- Added document status indicators and improved table layout
- Enhanced editor modal with better UX and character count
- Added proper loading states and error handling

✅ **Authentication & Error Handling**:

- Created proper `.env` configuration with correct JWT_SECRET for token validation
- Fixed "Invalid or expired token" errors when saving legal documents
- Implemented comprehensive error handling with user-friendly messages
- Added authentication state validation and proper error recovery

✅ **Technical Improvements**:

- Consistent button styling and hover states
- Responsive design for mobile-friendly admin panel
- Improved form validation with proper feedback
- Added confirmation dialogs for destructive actions
- Enhanced loading spinners with size variants

✅ **Code Quality**:

- TypeScript error resolution across legal service files
- Proper prop types and component interfaces
- Consistent error handling patterns
- Improved API client integration

## Latest Fixes (June 27, 2025)

### 🔧 Issues Resolved

#### 1. **Translation Loading Fixed**

- **Issue**: Raw translation keys like `admin-legal:editor.createNew` were appearing instead of actual translated text
- **Solution**: Added missing `'admin-legal': adminLegal.default` to both English and Arabic translation data in `LanguageProvider.tsx`
- **Result**: All admin legal tab text now displays correctly in both languages

#### 2. **UI Consistency & Aesthetics Improved**

- **Issue**: Legal tab table looked different from other admin tabs and select elements were too small
- **Solution**:
  - Updated table styling to match other admin tabs with consistent spacing, borders, and hover effects
  - Increased select element size with better padding (`px-4 py-3`) and modern styling
  - Added responsive design with proper RTL support
  - Enhanced visual hierarchy with better typography and spacing
- **Result**: Legal tab now has a polished, consistent appearance that matches the overall admin panel design

#### 3. **User Tracking Fixed**

- **Issue**: Legal documents showed "Updated by System" instead of the actual user who made changes
- **Solution**:
  - Updated frontend interface to use `updatedBy` instead of `lastEditedBy` to match backend schema
  - Verified backend service correctly passes `req.user.sub` to create/update operations
  - Fixed all references in admin panel to use the correct field name
- **Result**: Legal documents now correctly display the user who last edited them, including user avatars and usernames

#### 4. **Title Field Integration**

- **Issue**: Backend required `title` field but frontend wasn't sending it
- **Solution**:
  - Updated `CreateLegalDocumentDto` interface to include `title` field
  - Modified admin panel to auto-generate titles based on document type translations
  - Updated `UpdateLegalDocumentDto` to include optional title field
- **Result**: Document creation and updates now work without validation errors

### ✅ Current Status: **FULLY FUNCTIONAL**

The legal service integration is now complete with:

- ✅ Proper translation support (English/Arabic)
- ✅ Consistent, modern UI design
- ✅ Accurate user tracking and attribution
- ✅ Full CRUD operations working
- ✅ Authentication and authorization working
- ✅ Responsive design with RTL support

## Status: ✅ COMPLETE

The legal service is now fully integrated, polished, and ready for production use with a modern, consistent UI and robust error handling.
