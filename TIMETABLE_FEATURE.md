# Timetable Feature Documentation

## Overview
The Timetable feature provides both teachers and managers with a comprehensive weekly view of class schedules. It displays classes in a grid format with 2-hour time slots from 8 AM to 8 PM, covering all days from Saturday to Friday.

## User Types

### Teacher Timetable
- **Personal View**: Shows only the teacher's own classes
- **Simplified Interface**: Focused on personal schedule management
- **Class Type Filtering**: Filter by class types (Support Lessons, Review Courses, etc.)

### Manager Timetable
- **School-wide View**: Shows all classes across the entire school
- **Advanced Filtering**: Filter by class type, teacher, and search functionality
- **Comprehensive Management**: View and manage all school schedules

## Features

### 🕒 Weekly Schedule View
- **Time Slots**: 2-hour intervals from 8:00 AM to 8:00 PM
- **Days**: Saturday through Friday (7-day week)
- **Visual Grid**: Clean, organized layout with color-coded days

### 🎨 Enhanced Visual Design
- **Color-Coded Days**: Each day has a unique color scheme
- **Class Type Badges**: Different colors for different class types
- **Hover Effects**: Interactive elements with smooth transitions
- **Responsive Design**: Works on all screen sizes

### 🔍 Interactive Features
- **Clickable Sessions**: Click on any class session to view details
- **Detailed Modal**: Comprehensive class information display
- **Filtering**: Filter classes by type (Support Lessons, Review Courses, etc.)
- **Search & Advanced Filters**: Manager-specific features for comprehensive schedule management

### 📱 Session Details Modal
When you click on a class session, you'll see:
- Class name and type
- Room assignment and capacity
- Time slot information
- Weekly schedule overview
- Student capacity
- Edit schedule option

## Class Types & Colors

| Class Type | Color Scheme | Description |
|------------|--------------|-------------|
| Support Lessons | Blue | Academic support and tutoring |
| Review Courses | Green | Course review and preparation |
| Vocational Training | Purple | Skills-based training |
| Languages | Orange | Language learning classes |
| Other Activities | Gray | Miscellaneous activities |

## Navigation

### Filtering
- **Filter Button**: Toggle class type filtering
- **Class Type Dropdown**: Select specific class types to display
- **All Types**: View all classes regardless of type

### Manager-Specific Features
- **Search Functionality**: Search classes, teachers, and rooms
- **Teacher Filtering**: Filter classes by specific teachers
- **School-wide View**: See all classes across the entire school

## Technical Implementation

### Frontend Components
- `Timetable.jsx`: Teacher timetable component
- `ManagerTimetable.jsx`: Manager timetable component
- Integrated with existing sidebar navigation
- Responsive grid layout using Tailwind CSS

### Backend API
- **Teacher Endpoint**: `GET /api/classes/teacher`
- **Manager Endpoint**: `GET /api/classes`
- **Authentication**: Role-based access (teacher/manager)
- **Data**: Returns appropriate classes based on user role

### Data Structure
```javascript
{
  _id: "class_id",
  name: "Class Name",
  catalogItem: { type: "classType" },
  roomId: { name: "Room Name", capacity: 25 },
  capacity: 25,
  schedules: [
    {
      dayOfWeek: "monday",
      startTime: "08:00",
      endTime: "10:00"
    }
  ]
}
```

## Usage Instructions

### Teacher Timetable
1. **Access Timetable**
   - Navigate to Teacher Dashboard
   - Click on "Timetable" in the sidebar
   - View your personal weekly schedule

2. **View Class Details**
   - Click on any class session box
   - Review detailed information in the modal
   - Close modal to return to timetable view

3. **Filter Classes**
   - Click "Filter" button to show/hide filter options
   - Select specific class types from dropdown
   - View filtered results in real-time

### Manager Timetable
1. **Access Timetable**
   - Navigate to Manager Dashboard
   - Click on "Timetable" in the sidebar
   - View all school classes across the week

2. **Search and Filter**
   - Use search bar to find specific classes, teachers, or rooms
   - Apply filters by class type and teacher
   - View comprehensive school schedule

3. **Manage Schedules**
   - Click on class sessions to view details
   - Access edit and management options
   - Monitor school-wide scheduling

## Responsive Design

The timetable is fully responsive and works on:
- **Desktop**: Full grid view with all features
- **Tablet**: Optimized layout for medium screens
- **Mobile**: Stacked view for small screens

## Future Enhancements

Planned improvements include:
- **Drag & Drop**: Reschedule classes by dragging
- **Calendar Integration**: Sync with external calendars
- **Conflict Detection**: Visual warnings for scheduling conflicts
- **Export Options**: PDF/Excel export functionality
- **Student View**: Allow students to view teacher schedules

## Troubleshooting

### Common Issues
1. **Classes Not Loading**: Check authentication and API connectivity
2. **Display Issues**: Ensure browser supports CSS Grid
3. **Performance**: Large numbers of classes may affect rendering

### Support
For technical issues or feature requests, contact the development team or create an issue in the project repository.

---

*This feature enhances the teacher experience by providing a clear, visual representation of their weekly schedule, making it easier to manage classes and plan their time effectively.*
