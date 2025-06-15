# Admin Panel Documentation

## Overview

The Admin Panel provides a web-based interface for managing users, roles, and platform operations. It's integrated into the main Next.js frontend and uses real JWT authentication through the API Gateway.

## 🔐 Authentication & Access

### Access Levels

The admin panel enforces role-based access control:

- **OWNER**: Full platform access (can manage all users, settings, and data)
- **HIGHER_STAFF**: Elevated backend/admin access
- **STAFF**: Restricted management access
- **USER**: No admin panel access (redirected to main app)

### Authentication Flow

1. **Login Required**: Users must log in via `/auth/signin` with valid credentials
2. **JWT Tokens**: Real JWT tokens issued by `auth-service` (not mock data)
3. **Role Verification**: Frontend checks user role before showing admin interface
4. **API Authorization**: All admin API calls include `Authorization: Bearer <token>` header
5. **Session Management**: Tokens automatically refreshed or user logged out when expired

### Test Admin Credentials

For development and testing:

- **Email**: `testadmin@flipstaq.com`
- **Password**: `password123`
- **Role**: `OWNER` (full access)

## 🛠️ API Communication

### Architecture

```
Admin Panel → API Gateway (Port 3100) → Microservices
```

### Base Configuration

- **API Gateway URL**: `http://localhost:3100` (configured via `NEXT_PUBLIC_API_URL`)
- **API Base Path**: `/api/v1/`
- **Authentication**: JWT Bearer tokens in `Authorization` header
- **CORS**: Enabled for frontend origin (`http://localhost:3000`)

### User Management API

**Endpoint**: `GET /api/v1/users`

**Headers Required**:

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
Accept: application/json
```

**Response Format**:

```json
{
  "users": [
    {
      "id": "cmbva6fni000ow70g38g1azx9",
      "email": "testadmin@flipstaq.com",
      "username": "testadmin",
      "firstName": "Test",
      "lastName": "Admin",
      "country": "US",
      "role": "OWNER",
      "status": "ACTIVE",
      "isActive": true,
      "createdAt": "2025-06-13T20:49:23.647Z",
      "updatedAt": "2025-06-13T20:49:23.647Z",
      "deletedAt": null
    }
  ],
  "total": 24,
  "page": 1,
  "limit": 10,
  "totalPages": 3,
  "hasNext": true,
  "hasPrev": false
}
```

## 📱 Frontend Implementation

### Key Components

1. **`AdminPanel.tsx`**: Main admin users listing page with user detail modal
2. **`UserTable`**: Data table with user information and action buttons
3. **`UserDetailModal`**: Comprehensive user information modal with action controls
4. **`ConfirmationModal`**: Reusable confirmation dialogs for destructive actions
5. **`AdminRouteGuard`**: Authentication and authorization protection
6. **`ToastContainer`**: Success/error notification system

### User Detail Modal Features

The admin panel includes a comprehensive user detail modal accessible via the "View" button in each user row:

#### **Modal Content**:

- **Personal Information**: Full name, email, username, date of birth, country
- **Account Information**: Role, status, join date, last update, deletion timestamp
- **Deletion Metadata**: For deleted users, displays deletion date and admin who performed the action (visible to OWNER and HIGHER_STAFF only)
- **Role Management**: Inline role change functionality (respects permissions)
- **Action Buttons**: Delete/restore user directly from modal

#### **Access Control**:

- **OWNER**: Can view all users and manage any user except other owners
- **HIGHER_STAFF**: Can view all users, manage STAFF and USER roles only
- **STAFF**: Can view all users, cannot modify any accounts
- **USER**: No access to admin panel

#### **Responsive Design**:

- Mobile-optimized layout with stacked information sections
- Dark/light mode compatible
- RTL support for Arabic localization
- Touch-friendly action buttons

#### **Integration**:

- Seamless integration with existing confirmation modals
- Real-time data updates after actions
- Toast notifications for success/error feedback
- Proper error handling and validation

### State Management

- **`useUsers` hook**: Manages user data fetching, pagination, and filters
- **Real-time data**: All user information fetched from live database
- **Error handling**: Proper error states for API failures
- **Loading states**: User feedback during API calls

### Navigation

- **Access URL**: `http://localhost:3000/admin/users`
- **Authentication Guard**: Automatically redirects unauthenticated users
- **Role Guard**: Restricts access based on user role

## 👤 User Detail Modal

### Overview

The User Detail Modal provides administrators with a comprehensive view of user information and quick access to management actions. Accessible via the "View" button in the user table, this modal consolidates all user information and administrative controls in a single interface.

### Features

#### **Information Display**

- **Personal Information Section**:

  - Full name with avatar initials
  - Email address
  - Username with @ prefix
  - Date of birth (if available)
  - Country of residence

- **Account Information Section**:
  - Current role with color-coded badge
  - Account status (Active/Deleted)
  - Date joined (formatted for readability)
  - Last update timestamp
  - Deletion timestamp (for deleted accounts)

#### **Interactive Elements**

- **Role Management Dropdown**: Quick role changes for eligible users
- **Action Buttons**: Context-sensitive buttons based on user status and permissions
- **Close Controls**: Multiple ways to close modal (X button, backdrop click, Close button)

#### **Visual Indicators**

- **Deleted User Styling**: Grayed out avatars and text for deleted accounts
- **Status Badges**: Color-coded role and status indicators
- **Responsive Grid**: Two-column layout on larger screens, single column on mobile

### Access Control Matrix

| User Role    | Can View Modal | Can Change Roles | Can Delete       | Can Restore      |
| ------------ | -------------- | ---------------- | ---------------- | ---------------- |
| OWNER        | All users      | All except OWNER | All except OWNER | All except OWNER |
| HIGHER_STAFF | All users      | STAFF, USER only | STAFF, USER only | STAFF, USER only |
| STAFF        | All users      | None             | None             | None             |
| USER         | No access      | No access        | No access        | No access        |

### Implementation Details

#### **Modal Workflow**

1. User clicks "View" button in user table row
2. Modal opens with selected user data pre-populated
3. Role changes trigger confirmation modal before execution
4. Delete/restore actions close detail modal and open confirmation modal
5. Actions completed with toast notifications and data refresh

#### **Technical Integration**

- **Data Source**: Fetches detailed user information including deletion metadata via `userApi.getUser(id)`
- **Modal State**: Managed via `showDetailModal` and `selectedUser` state
- **Action Handlers**: Integrates with existing confirmation modal system
- **Responsive Design**: CSS Grid for optimal layout on all screen sizes

#### **Deletion Traceability**

The admin panel provides full audit traceability for user deletions:

**For Deleted Users**:

- **Deletion Date**: Shows exact timestamp when user was deleted
- **Deleted By**: Displays admin name and role who performed the deletion
- **Access Control**: Only OWNER and HIGHER_STAFF can view deletion metadata
- **Visual Indicators**: Grayed out styling and "Deleted" badge

**Implementation**:

- Fetches full user details including `deletedBy` relation on modal open
- Displays deletion metadata in Account Information section
- Respects role-based access for sensitive deletion information
- Integrated with localization system for multi-language support

**Localization Keys**:

- `admin.users.modals.userDetail.deletedAt`: "Deleted At"
- `admin.users.modals.userDetail.deletedBy`: "Deleted By"
- `admin.users.modals.userDetail.deletionInfo`: "This account was deleted by {{adminName}} on {{date}}"

#### **Localization**

All text content is fully localized with support for:

- **English** (`packages/locales/en/admin/users.json`)
- **Arabic** (`packages/locales/ar/admin/users.json`)
- **RTL Layout**: Proper right-to-left text direction for Arabic

### Usage Examples

#### **Opening User Details**

```tsx
// In user table row
<button
  onClick={() => openDetailModal(tableUser)}
  className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
>
  View
</button>
```

#### **Role Change from Modal**

```tsx
// Role change triggers confirmation
onRoleChange={(user, newRole) => {
  setSelectedUser(user);
  setNewRole(newRole);
  setShowDetailModal(false);  // Close detail modal
  setShowRoleModal(true);     // Open confirmation modal
}}
```

#### **Action Integration**

```tsx
// Actions flow through confirmation system
onDelete={(user) => {
  setSelectedUser(user);
  setShowDetailModal(false);
  setShowDeleteModal(true);
}}
```

## 🔧 Recent Fixes Applied

### 1. API Gateway Proxy Fix

**Issue**: Auth requests were failing due to incorrect routing path.

**Fix**: Updated `forwardAuthRequest` in API Gateway from `/auth/` to `/internal/auth/`.

**Result**: Authentication now works correctly through the API Gateway.

### 2. Mock Data Removal

**Issue**: Frontend was using hardcoded/mock user data.

**Fix**: Removed all mock authentication and user data from:

- API client configurations
- Frontend components
- Authentication providers

**Result**: Admin panel now displays real users from the database.

### 3. JWT Token Integration

**Issue**: Frontend not properly handling real JWT tokens.

**Fix**: Updated API client to:

- Use real tokens from localStorage
- Include proper Authorization headers
- Handle token expiration correctly

**Result**: All admin API calls now use valid authentication.

## 🧪 Testing

### Manual Testing Steps

1. **Start all services**:

   ```bash
   # Frontend
   cd apps/web && npm run dev  # Port 3000

   # API Gateway
   cd apps/api-gateway && npm run start:dev  # Port 3100

   # Auth Service
   cd services/auth-service && npm run start:dev  # Port 3001

   # User Service
   cd services/user-service && npm run start:dev  # Port 3003
   ```

2. **Access admin panel**:

   - Navigate to `http://localhost:3000/auth/signin`
   - Login with test credentials
   - Navigate to `http://localhost:3000/admin`
   - Verify real user data loads correctly

3. **Test User Detail Modal**:

   - Click "View" button on any user row
   - Verify modal opens with complete user information
   - Test role change functionality (if permitted)
   - Test delete/restore actions from modal
   - Verify modal closes properly
   - Check mobile responsiveness

4. **Test Admin Features**:

   - Switch between "Active Users" and "Deleted Users" views
   - Test search and filtering functionality
   - Verify permission-based action availability
   - Test toast notifications for all actions

5. **Test API directly**:
   ```bash
   # Run the test script
   bash test-admin-api.sh
   ```

### Expected Results

- ✅ Login successful with real JWT token
- ✅ Admin panel loads without errors
- ✅ User table displays real database users with "View" buttons
- ✅ User detail modal opens and displays comprehensive user information
- ✅ Role management and action buttons work correctly based on permissions
- ✅ Delete/restore functionality works with proper confirmations
- ✅ Toast notifications appear for all admin actions
- ✅ Modal is responsive and supports dark/light modes
- ✅ Pagination and filtering work correctly
- ✅ No CORS or network errors in browser console

## 🚀 Deployment Notes

### Environment Variables

Ensure the following are set in production:

```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://api.flipstaq.com

# API Gateway (.env)
CORS_ORIGINS=https://flipstaq.com,https://admin.flipstaq.com
JWT_SECRET=production-jwt-secret
AUTH_SERVICE_URL=http://auth-service:3001
USER_SERVICE_URL=http://user-service:3003
```

### Security Considerations

1. **JWT Secrets**: Use strong, unique secrets in production
2. **CORS Origins**: Restrict to actual production domains
3. **HTTPS**: All communication should use TLS in production
4. **Token Expiration**: Short access token lifetimes (15 minutes)
5. **Role Validation**: Server-side role checks on all admin endpoints

### Performance

- **Pagination**: Large user lists are paginated (10-50 per page)
- **Caching**: Consider implementing Redis caching for frequently accessed data
- **Rate Limiting**: Implement rate limiting on admin endpoints

## 📚 Related Documentation

- [API Gateway Documentation](../api-gateway/README.md)
- [Frontend Authentication Guide](../frontend-authentication.md)
- [Auth Service Documentation](../auth-service/README.md)
- [User Service Documentation](../user-service/README.md)
