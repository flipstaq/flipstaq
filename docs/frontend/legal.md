# Legal Documents Integration

## Overview

The legal documents system allows administrators to manage legal content (Terms of Service, Privacy Policy, etc.) through the admin panel and displays them on public pages with proper internationalization support.

## Public Pages

### Routes

- `/tos` - Terms of Service page
- `/privacy` - Privacy Policy page

### Features

- **Automatic Language Detection**: Uses the current language from the LanguageProvider
- **RTL Support**: Properly handles Arabic text direction and layout
- **Responsive Design**: Works on all screen sizes
- **Dark Mode Support**: Adapts to system/user theme preference
- **Fallback Handling**: Shows appropriate message when content is not available

### Implementation Details

- Each page fetches the appropriate legal document based on type and current language
- Content is displayed with proper formatting (line breaks preserved)
- Loading states and error handling are implemented
- Last updated date is shown with proper localization

## Admin Panel Integration

### Access Control

- Only **Owners** and **Higher Staff** can access the Legal tab
- Follows the same permission model as other admin features

### Features

- **Document Type Selection**: Choose from Terms of Service, Privacy Policy, Cookie Policy, Community Guidelines, Data Policy
- **Language Selection**: Create/edit documents in English and Arabic
- **Rich Text Editor**: Large text area for content editing with RTL support
- **Document Management**: View existing documents, edit content, delete documents
- **Real-time Updates**: Changes are immediately reflected on public pages
- **Audit Trail**: Shows who last edited each document and when

### UI Components

- **Legal Tab**: Added to the existing admin panel tab structure
- **Document Selector**: Dropdown menus for type and language selection
- **Editor Modal**: Full-screen modal for content editing
- **Document List**: Table showing all existing legal documents with actions
- **Validation**: Ensures content requirements are met before saving

## API Integration

### Endpoints Used

- `GET /legal/documents/{type}?language={lang}` - Fetch document by type and language (public)
- `GET /legal/documents` - Fetch all documents (admin)
- `POST /legal/documents` - Create new document (admin)
- `PUT /legal/documents/{id}` - Update existing document (admin)
- `DELETE /legal/documents/{id}` - Delete document (admin)

### Error Handling

- Network errors are handled gracefully
- Missing documents show appropriate fallback messages
- Admin actions include success/error notifications via toast system

## Localization

### Supported Languages

- English (`en`)
- Arabic (`ar`)

### Translation Files

- `packages/locales/en/admin/legal.json` - English admin interface
- `packages/locales/ar/admin/legal.json` - Arabic admin interface
- Uses existing common translations for shared UI elements

### RTL Support

- Content direction changes based on selected language
- Text alignment and layout adapt automatically
- Editor supports RTL input for Arabic content

## Styling Guidelines

### Design Consistency

- Follows existing Flipstaq design system
- Uses Tailwind CSS classes consistent with other admin components
- Maintains dark/light mode compatibility
- Responsive design principles applied

### Accessibility

- Proper heading hierarchy
- Keyboard navigation support
- Screen reader friendly
- Color contrast compliance

## Future Enhancements

### Potential Improvements

- Rich text editor with formatting options
- Document versioning and history
- Approval workflow for document changes
- Email notifications for document updates
- Export functionality for legal documents
- Template system for common legal content

### Additional Document Types

- Cookie Policy
- Community Guidelines
- Data Protection Policy
- Refund Policy
- Intellectual Property Policy
