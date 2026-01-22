# Advertisements Feature Documentation

## Overview

The Advertisements feature allows school managers to create and manage announcements that can be displayed to teachers and students across different dashboards. This feature provides a centralized way to communicate important information, updates, and announcements to the school community.

## Features

### 1. **Manager Dashboard - Ads Management**
- **Full CRUD Operations**: Create, read, update, and delete advertisements
- **Target Audience Selection**: Choose who sees the ad (students, teachers, both, or custom)
- **Display Location**: Set where the ad appears (dashboard, banner, notification, other)
- **Scheduling**: Set specific date and time for when ads become active
- **Rich Content**: Title and description fields for comprehensive messaging

### 2. **Multi-Dashboard Display**
- **Teacher Dashboard**: Side panel showing relevant announcements
- **Student Dashboard**: Side panel showing relevant announcements  
- **Manager Dashboard**: Side panel showing all announcements
- **Responsive Design**: Works on both desktop and mobile devices

### 3. **Smart Filtering**
- **Role-Based Targeting**: Ads are filtered based on user role and target audience
- **Time-Based Activation**: Ads only show after their scheduled date/time
- **School-Specific**: Each school only sees their own advertisements

## Technical Implementation

### Frontend Components

#### `AdsTab.jsx` (Manager Dashboard)
- **Location**: `client/src/components/manager/AdsTab.jsx`
- **Purpose**: Full advertisement management interface
- **Features**: 
  - Table view of all advertisements
  - Create/Edit modal with form validation
  - Delete confirmation
  - Status badges and metadata display

#### `AdsPanel.jsx` (Shared Component)
- **Location**: `client/src/components/shared/AdsPanel.jsx`
- **Purpose**: Display advertisements on user dashboards
- **Features**:
  - Side panel design (right side)
  - Current ad display with navigation
  - List of all available ads
  - Responsive and collapsible

### Backend API

#### Routes
- **Location**: `server/routes/advertisementRoutes.js`
- **Endpoints**:
  - `POST /api/advertisements` - Create new ad (Manager only)
  - `GET /api/advertisements` - Get all ads for school (Manager only)
  - `PUT /api/advertisements/:id` - Update ad (Manager only)
  - `DELETE /api/advertisements/:id` - Delete ad (Manager only)
  - `GET /api/advertisements/user/:role` - Get ads for specific user role

#### Controller
- **Location**: `server/controllers/advertisementController.js`
- **Features**:
  - Role-based access control
  - School-specific data isolation
  - Input validation and error handling
  - Smart filtering for user-specific ads

#### Model
- **Location**: `server/models/Advertisement.js`
- **Schema Fields**:
  - `schoolId`: Reference to school
  - `title`: Advertisement title
  - `description`: Detailed content
  - `dateTime`: When the ad becomes active
  - `targetAudience`: Who should see it (students/teachers/both/custom)
  - `location`: Where it displays (dashboard/banner/notification/other)
  - `status`: Active/inactive/draft
  - `createdAt`: Creation timestamp

## User Experience

### Manager Workflow
1. Navigate to "Advertisements" tab in manager dashboard
2. Click "Create Advertisement" button
3. Fill out the form:
   - Title and description
   - Target audience selection
   - Display location
   - Date and time for activation
4. Save the advertisement
5. View, edit, or delete existing ads as needed

### Teacher/Student Workflow
1. Click the "Announcements" button (megaphone icon) in the top navigation
2. View current announcement in the side panel
3. Navigate between multiple announcements using arrows or dots
4. Click on any announcement in the list to view details
5. Close panel when finished

## Display Strategy

### Side Panel Approach
We chose a **side panel** design over popups because:
- **Less Intrusive**: Doesn't block main content
- **Always Accessible**: Users can view announcements without losing context
- **Better UX**: Follows modern dashboard patterns
- **Responsive**: Works well on all screen sizes

### Positioning
- **Right Side**: Consistent placement across all dashboards
- **Fixed Position**: Stays visible while scrolling
- **Z-Index**: Proper layering with other UI elements

## Security & Access Control

### Role-Based Permissions
- **Managers**: Full CRUD access to advertisements for their school
- **Teachers**: View-only access to ads targeted at teachers or both
- **Students**: View-only access to ads targeted at students or both

### Data Isolation
- Each school only sees their own advertisements
- Users cannot access ads from other schools
- Proper authentication required for all endpoints

## Future Enhancements

### Planned Features
1. **Rich Media Support**: Images, videos, and file attachments
2. **Analytics**: Track views, clicks, and engagement metrics
3. **Advanced Targeting**: Custom audience groups and filters
4. **Scheduling**: Recurring ads and advanced time management
5. **Templates**: Pre-designed ad layouts for common announcements
6. **Push Notifications**: Real-time alerts for important announcements

### Technical Improvements
1. **Caching**: Redis-based caching for better performance
2. **Real-time Updates**: WebSocket integration for live announcements
3. **Search & Filtering**: Advanced search capabilities for managers
4. **Bulk Operations**: Mass create/edit/delete functionality
5. **Export Features**: CSV/PDF export of advertisement data

## Configuration

### Environment Variables
No additional environment variables are required for basic functionality.

### Database Indexes
The Advertisement model includes performance indexes:
- `schoolId`: For school-specific queries
- `dateTime`: For time-based filtering
- `targetAudience`: For audience-based queries
- `location`: For location-based filtering

## Troubleshooting

### Common Issues

1. **Ads Not Displaying**
   - Check if user has a valid school assignment
   - Verify advertisement date/time has passed
   - Ensure target audience matches user role

2. **Permission Errors**
   - Verify user authentication token
   - Check user role permissions
   - Ensure school assignment is correct

3. **API Errors**
   - Check server logs for detailed error messages
   - Verify database connection
   - Ensure all required fields are provided

### Debug Mode
Enable debug logging in the advertisement controller for detailed request/response information.

## Support

For technical support or feature requests related to the Advertisements feature, please contact the development team or create an issue in the project repository.
