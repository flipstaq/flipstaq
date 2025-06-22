# Reporting System

The reporting system allows users to report inappropriate content, users, or messages for moderation review. It includes backend services, API gateway integration, frontend components, and an admin panel for review with advanced search, filtering, and export capabilities.

## Architecture

### Backend Components

1. **Report Service** (`services/report-service/`)

   - Handles report creation, validation, and management
   - Prevents duplicate reports from the same user
   - Stores IP addresses for abuse prevention
   - Provides admin endpoints for report review
   - **Advanced filtering** by reporter, target, dates, IP, reason, status
   - **Export functionality** for JSON and HTML formats

2. **API Gateway Integration** (`apps/api-gateway/`)
   - Proxies report requests to the report service
   - Enforces authentication and admin-only access
   - Routes: `/reports` (POST/GET), `/reports/:id/resolve`, `/reports/:id/dismiss`
   - **Export endpoints**: `/reports/export/json`, `/reports/export/html`

### Frontend Components

1. **ReportModal** (`apps/web/src/components/report/ReportModal.tsx`)

   - Reusable modal for reporting any entity type
   - Supports USER, PRODUCT, and MESSAGE reports
   - Includes reason dropdown and optional comment field
   - Fully localized with validation

2. **MessageContextMenu** (`apps/web/src/components/chat/MessageContextMenu.tsx`)

   - Right-click menu for chat messages
   - Includes "Report Message" option for non-own messages
   - Copy and delete options for better UX

3. **Integration Points**:
   - **Product Detail Page**: Report button next to seller info
   - **Chat Messages**: Context menu with report option
   - **Chat Headers**: Report user button in conversation view

### Admin Panel

1. **Reports Management Tab** (Integrated in `/admin` page)
   - Lists all submitted reports with comprehensive filtering
   - **Advanced Search Panel** with 10+ filter options
   - Shows report type, target, reason, reporter, and status
   - Actions to resolve or dismiss reports
   - **Export capabilities** (JSON/HTML) with filtered data
   - Detailed view with all report, reporter, target, and resolution info

## 🔍 Advanced Search & Export Features

### Search Capabilities

- **Reporter Filtering**: Username, ID, role information
- **Target Filtering**: Username, ID, content details
- **Date Range**: From/to date filtering
- **Content Filtering**: Reason keywords, IP addresses
- **Status & Type**: Filter by resolution status and report type
- **Resolution Tracking**: Filter by who resolved reports

### Export Features

- **JSON Export**: Machine-readable format for data analysis
- **HTML Export**: Human-readable reports with professional styling
- **Filtered Exports**: Export only the filtered subset of reports
- **Comprehensive Data**: Includes all report, reporter, target, and resolution data

See [Advanced Search & Export Documentation](./advanced-search-export.md) for detailed implementation guide.

## Database Schema

```sql
model Report {
  id              String    @id @default(cuid())
  reporterId      String
  type            ReportType
  targetUserId    String?
  targetProductId String?
  targetMessageId String?
  reason          String
  comment         String?
  status          ReportStatus @default(PENDING)
  ipAddress       String
  createdAt       DateTime  @default(now())

  reporter        User      @relation(fields: [reporterId], references: [id])

  @@unique([reporterId, type, targetUserId])
  @@unique([reporterId, type, targetProductId])
  @@unique([reporterId, type, targetMessageId])
}

enum ReportType {
  USER
  PRODUCT
  MESSAGE
}

enum ReportStatus {
  PENDING
  RESOLVED
  DISMISSED
}
```

## API Endpoints

### Public Endpoints

- `POST /reports` - Submit a new report
  - Body: `{ type, targetId, reason, comment? }`
  - Returns: `{ success: boolean, message: string }`

### Admin Endpoints

- `GET /reports` - List all reports (admin only)
- `PATCH /reports/:id/resolve` - Mark report as resolved (admin only)
- `PATCH /reports/:id/dismiss` - Mark report as dismissed (admin only)

## Frontend API Routes

- `POST /api/reports` - Proxy to API Gateway
- `GET /api/reports` - Admin-only proxy to list reports
- `PATCH /api/reports/:id/:action` - Admin actions (resolve/dismiss)

## Security Features

1. **Anti-Abuse Measures**:

   - **Unique Constraints**: One report per user per target item (enforced at database level)
     - Users cannot report the same user, product, or message multiple times
     - Database unique constraints prevent duplicate reports even in race conditions
   - **Rate Limiting**: Maximum 10 reports per user per day
   - **IP Address Logging**: All reports tracked with IP addresses for abuse monitoring
   - **Self-Report Prevention**: Users cannot report themselves

2. **Privacy Protection**:

   - Reports are only visible to admins
   - Users cannot see or delete their submitted reports
   - Reporter information is protected

3. **Admin Access**:
   - Admin-only endpoints for report management
   - Role-based access control
   - Audit trail through status changes

## Usage Examples

### Reporting a Product

```tsx
<ReportModal
  isOpen={isReportModalOpen}
  onClose={() => setIsReportModalOpen(false)}
  type="PRODUCT"
  targetId={product.id}
  targetData={{ productTitle: product.title }}
/>
```

### Reporting a User

```tsx
<ReportModal
  isOpen={isReportModalOpen}
  onClose={() => setIsReportModalOpen(false)}
  type="USER"
  targetId={user.id}
  targetData={{ username: user.username }}
/>
```

### Reporting a Message

```tsx
<ReportModal
  isOpen={isReportModalOpen}
  onClose={() => setIsReportModalOpen(false)}
  type="MESSAGE"
  targetId={message.id}
  targetData={{ messageContent: message.content }}
/>
```

## Localization

The system supports English and Arabic with the following translation keys:

### Report Modal (`packages/locales/*/report.json`)

- `report`, `report_user`, `report_product`, `report_message`
- `reason`, `comment_optional`, `submit_report`
- Reason options: `spam`, `misleading`, `offensive`, `harassment`, etc.

### Admin Panel (`packages/locales/*/admin/reports.json`)

- `reports_management`, `report_details`
- Status labels: `pending`, `resolved`, `dismissed`
- Action buttons: `resolve`, `dismiss`, `view`
- Export options: `export_json`, `export_html`
- Individual export: `export_single`, `export_single_json`, `export_single_html`
- Search and filter fields: `reporter_username`, `target_username`, `reason`, `date_from`, `date_to`, `ip_address`, `resolved_by`

## Export Features

### Bulk Export

Admins can export filtered reports in two formats:

1. **JSON Export**: Machine-readable format with complete report data
2. **HTML Export**: Human-readable format with formatted tables

### Individual Export

Each report can be exported individually:

1. **Single Report JSON**: Complete report data for one report
2. **Single Report HTML**: Formatted report for printing or sharing

All exports include:

- Reporter information
- Target information (user/product/message details)
- Report metadata (timestamp, IP, status)
- Resolution information (if resolved)
- Admin comments and actions

## Testing

1. **User Flow Testing**:

   - Report a product from product detail page
   - Report a user from chat header
   - Report a message from context menu
   - Verify duplicate prevention

2. **Admin Flow Testing**:

   - Access admin reports page
   - View report details
   - Resolve and dismiss reports
   - Verify status updates

3. **Security Testing**:
   - Test admin-only access
   - Verify IP logging
   - Test duplicate prevention
   - Test rate limiting

## Performance Considerations

1. **Database Indexing**:

   - Indexes on reporterId, type, and target fields
   - Composite indexes for duplicate prevention (products/users)

2. **Caching**:

   - Admin report list caching
   - Status change invalidation

3. **Pagination**:
   - Admin panel supports pagination for large report volumes

## Monitoring

1. **Metrics to Track**:

   - Report submission rate
   - Report resolution time
   - Most common report reasons
   - Repeat offenders

2. **Alerts**:
   - High volume of reports for specific content
   - Failed report submissions
   - Admin action failures

## Future Enhancements

1. **Automated Moderation**:

   - AI-powered content analysis
   - Automatic action for clear violations
   - Confidence scoring for reports

2. **Enhanced Admin Tools**:

   - Bulk actions for reports
   - Report analytics dashboard
   - User behavior tracking
   - Advanced search and filtering
   - Bulk export (JSON/HTML)
   - Individual report export (JSON/HTML)
   - Under review status management

3. **User Feedback**:
   - Report outcome notifications
   - Appeal process for actions taken
   - Community moderation features
