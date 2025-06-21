# Report Service - Advanced Search and Export Documentation

## Overview

The Report Service now includes comprehensive advanced search/filtering capabilities and export functionality for admin users. This enables detailed moderation and reporting with full data export capabilities.

## Advanced Search & Filtering Features

### Filter Options

1. **Status Filter** - Filter by report status (PENDING, RESOLVED, DISMISSED)
2. **Type Filter** - Filter by report type (USER, PRODUCT, MESSAGE)
3. **Reporter Username** - Search by reporter's username (partial match, case-insensitive)
4. **Reporter ID** - Search by exact reporter ID
5. **Target Username** - Search by target's username (supports user/product owner/message sender)
6. **Target ID** - Search by exact target ID (user/product/message ID)
7. **Reason** - Search by reason keyword (partial match, case-insensitive)
8. **Date Range** - Filter by creation date (from/to date range)
9. **IP Address** - Filter by reporter's IP address (partial match)
10. **Resolved By** - Filter by resolver's username (partial match)

### API Endpoints

#### GET /api/v1/reports

Enhanced report listing with comprehensive filtering:

```
Query Parameters:
- page: number (pagination)
- limit: number (pagination)
- status: PENDING|RESOLVED|DISMISSED
- type: USER|PRODUCT|MESSAGE
- reporterUsername: string
- reporterId: string
- targetUsername: string
- targetId: string
- reason: string
- dateFrom: YYYY-MM-DD
- dateTo: YYYY-MM-DD
- ipAddress: string
- resolvedBy: string
```

#### GET /api/v1/reports/export/json

Export filtered reports as JSON:

```
Query Parameters: (same as above, excluding pagination)
Response: {
  data: ReportForAdmin[],
  exportedAt: string,
  totalRecords: number
}
```

#### GET /api/v1/reports/export/html

Export filtered reports as HTML:

```
Query Parameters: (same as above, excluding pagination)
Response: {
  html: string,
  exportedAt: string,
  totalRecords: number
}
```

## Frontend Implementation

### Admin Panel Features

- **Advanced Filter Panel** - Collapsible search interface with all filter options
- **Real-time Search** - Apply filters without page reload
- **Clear Filters** - Reset all filters with single click
- **Export Dropdown** - Download reports as JSON or HTML
- **Loading States** - Visual feedback during search and export operations

### UI Components

1. **Filter Toggle Button** - Show/hide advanced search panel
2. **Filter Form** - Grid layout with all search options
3. **Export Button** - Dropdown with JSON/HTML options
4. **Action Buttons** - Apply filters, clear filters

### Translations

Complete localization support in English and Arabic:

- `admin-reports:search.*` - All search-related translations
- `admin-reports:search.placeholder.*` - Input placeholders
- `admin-reports:search.export_*` - Export-related messages

## Data Storage & Security

### Comprehensive Data Storage

All report data is stored including:

- Reporter information (name, username, email, role, IP)
- Target information (users, products, messages with full context)
- Report metadata (timestamps, status, resolution info)
- Resolution tracking (who resolved, when, status changes)

### Security Features

- **Admin-only Access** - All search and export features require OWNER/HIGHER_STAFF/STAFF roles
- **IP Tracking** - Reporter IP addresses stored for moderation
- **Audit Trail** - Complete resolution history with timestamps
- **Data Protection** - Exported HTML includes data handling notice

## Technical Implementation

### Backend Services

- **Report Service** - Core business logic, filtering, and export generation
- **API Gateway** - Public endpoints with authentication and authorization
- **Database** - PostgreSQL with Prisma ORM for complex queries

### Performance Optimizations

- **Pagination** - Configurable page sizes (1-100 items)
- **Efficient Queries** - Optimized database queries with proper indexing
- **Targeted Filtering** - Server-side filtering reduces data transfer
- **Export Limits** - Maximum 10,000 records per export to prevent timeouts

### Export Formats

#### JSON Export

- Machine-readable format
- Complete data structure
- Suitable for data analysis
- Includes metadata (export timestamp, record count)

#### HTML Export

- Human-readable format
- Styled report cards
- Print-friendly layout
- Comprehensive information display
- Professional formatting with CSS

## Use Cases

### Daily Moderation

- Filter by PENDING status to see new reports
- Search by reporter username for repeat offenders
- Date range filtering for daily/weekly reviews

### Investigation

- IP address filtering for suspicious activity
- Target username search for problematic users/content
- Reason filtering for specific violation types

### Reporting & Analytics

- Export resolved reports for analysis
- Generate monthly/quarterly reports
- Track moderation team performance

### Compliance & Auditing

- Export all reports for legal compliance
- Track resolution history for appeals
- Generate comprehensive audit trails

## Monitoring & Maintenance

### Key Metrics to Monitor

- Report volume by type and status
- Average resolution time
- Most reported users/content
- Geographic distribution via IP analysis

### Regular Maintenance

- Archive old resolved reports (consider retention policies)
- Monitor export performance for large datasets
- Review and update search indexes for performance
- Regular backup of report data for compliance

## Future Enhancements

### Potential Improvements

- **Advanced Analytics Dashboard** - Visual charts and metrics
- **Automated Filtering** - AI-powered content analysis
- **Bulk Actions** - Resolve/dismiss multiple reports
- **Export Scheduling** - Automated periodic exports
- **Integration APIs** - Connect with external moderation tools
