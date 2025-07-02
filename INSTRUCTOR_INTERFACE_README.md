# Instructor Interface - SMX KITS

## Overview

The new Instructor Interface consolidates all instructor-facing functionality into a single, comprehensive page. This interface combines the functionality of the previous separate pages:
- `add-class.html`
- `add-student.html` 
- `users-roles.html`

## Features

### 🎯 Unified Interface
- **Single Page Application**: All instructor functions accessible from one interface
- **Tabbed Navigation**: Clean organization with sidebar navigation
- **Consistent Styling**: Matches existing SMX KITS dark theme with blue accents
- **Responsive Design**: Works on desktop and mobile devices

### 📚 Class Creation with Templates
- **Template-Based Classes**: Select difficulty level (Easy, Medium, Hard) to auto-populate modules
- **Template Preview**: See modules and lessons before creating class
- **Auto-Date Calculation**: End dates automatically calculated based on template duration
- **Deep Copy Modules**: Templates are cloned into classes to prevent side effects

### 👥 Student Management
- **Add Students**: Create new student accounts with class assignment
- **Edit Students**: Modify student details and reassign classes
- **Class Reassignment**: Automatically handles removing from old class and adding to new class
- **Student List**: View all students with their current class assignments

### 🛠️ Template Management
- **View Templates**: See all available class templates (Easy, Medium, Hard)
- **Create Templates**: Add new templates with basic information
- **Edit Templates**: Modify existing templates (placeholder for full module editor)
- **Delete Templates**: Remove unused templates

### 📅 Calendar View
- **Template Calendar**: View day-by-day schedule for any template
- **Class Calendar**: View schedule for existing classes
- **Daily Content Management**: Click any day to edit content
- **Content Types**: Mission References, Course Content, and Typing Tests
- **Visual Indicators**: Color-coded dots show content types for each day
- **Month Navigation**: Browse through different months
- **Content Assignment**: Add/remove content from extensive libraries

### 👤 User Role Management
- **All User Types**: Manage admin, instructor, and student accounts
- **Role-Based Fields**: Class assignment only shown for student role
- **Bulk Operations**: Edit and delete users efficiently
- **Status Management**: Activate/deactivate user accounts

## Technical Implementation

### 🗄️ Database Schema

#### ClassTemplate Model
```javascript
{
  difficulty: String (enum: 'Easy', 'Medium', 'Hard'),
  name: String,
  description: String,
  durationWeeks: Number,
  modules: [{
    name: String,
    description: String,
    order: Number,
    lessons: [{
      title: String,
      description: String,
      filePath: String,
      duration: Number,
      order: Number
    }],
    estimatedWeeks: Number
  }]
}
```

#### Updated Class Model
```javascript
{
  // ... existing fields ...
  difficulty: String (enum: 'Easy', 'Medium', 'Hard'),
  modules: [ClassModuleSchema] // Deep copied from templates
}
```

#### Enhanced ClassTemplate Model
```javascript
{
  difficulty: String (enum: 'Easy', 'Medium', 'Hard'),
  name: String,
  description: String,
  durationWeeks: Number,
  modules: [{
    name: String,
    description: String,
    order: Number,
    lessons: [LessonSchema],
    estimatedWeeks: Number,
    dailySchedule: [{
      day: Number, // Day number from start
      date: Date, // Optional specific date
      missionReferences: [ContentSchema],
      courseContent: [ContentSchema],
      typingTests: [TypingTestSchema],
      notes: String
    }]
  }]
}
```

### 🔌 API Endpoints

#### Class Templates
- `GET /api/class-templates` - Get all templates
- `GET /api/class-templates/:difficulty` - Get specific template
- `POST /api/class-templates` - Create new template
- `PUT /api/class-templates/:difficulty` - Update template
- `DELETE /api/class-templates/:difficulty` - Delete template

#### Daily Content Management
- `GET /api/class-templates/:difficulty/day/:dayNumber` - Get daily content
- `PUT /api/class-templates/:difficulty/day/:dayNumber` - Update daily content
- `GET /api/class-templates/content/available` - Get available content library

### 🎨 UI Components

#### Sidebar Navigation
- Fixed sidebar with tabbed navigation
- Active state indicators
- Icon-based menu items

#### Form Handling
- Consistent form styling across all tabs
- Real-time validation
- Success/error messaging
- Auto-population from templates

#### Data Tables
- Sortable columns
- Action buttons (Edit, Delete)
- Loading states
- Empty state handling

#### Modals
- Student edit modal
- User management modal
- Template creation modal
- Responsive design

## Usage Instructions

### 🚀 Getting Started

1. **Access the Interface**
   - Navigate to `/instructor-interface.html`
   - Requires admin or instructor role authentication

2. **Create a Class**
   - Go to "Add Class" tab
   - Fill in basic information
   - Select difficulty level to load template
   - Review template preview
   - Dates auto-populate based on template duration
   - Submit to create class with cloned modules

3. **Add Students**
   - Go to "Add Student" tab
   - Fill in student details
   - Assign to existing class
   - Student automatically added to class roster

4. **Manage Templates**
   - Go to "Templates" tab
   - View existing templates
   - Create new templates
   - Edit/delete as needed

5. **User Management**
   - Go to "User Roles" tab
   - Add/edit/delete users
   - Assign classes to students
   - Manage user status

6. **Calendar View**
   - Go to "Calendar View" tab
   - Select a template or class from dropdowns
   - Navigate months using Previous/Next buttons
   - Click any day with content to edit
   - Add/remove mission references, course content, and typing tests
   - Save changes to update template or class schedule

### 🔧 Default Templates

The system comes with three pre-configured templates:

#### Easy Template - "Basic SMX Training" (4 weeks)
- Introduction to SMX
- Basic Operations  
- Practice Exercises

#### Medium Template - "Intermediate SMX Training" (8 weeks)
- Advanced Operations
- Tactical Scenarios
- Advanced Practice
- Assessment

#### Hard Template - "Advanced SMX Specialist Training" (12 weeks)
- Expert Systems
- Leadership & Training
- Complex Scenarios
- Certification

### 🔒 Security Features

- **Role-Based Access**: Only admin/instructor roles can access
- **JWT Authentication**: All API calls require valid tokens
- **Session Management**: Automatic redirect on expired sessions
- **Input Validation**: Client and server-side validation

### 🎯 Key Benefits

1. **Efficiency**: All instructor functions in one place
2. **Consistency**: Template-based class creation ensures standardization
3. **Flexibility**: Templates can be customized while preserving originals
4. **User Experience**: Clean, intuitive interface matching existing design
5. **Maintainability**: Consolidated codebase easier to maintain
6. **Visual Planning**: Calendar view provides clear day-by-day course visualization
7. **Content Management**: Extensive libraries of missions, courses, and typing tests
8. **Real-time Editing**: Click-to-edit functionality for rapid schedule adjustments

## Future Enhancements

- **Advanced Template Editor**: Drag-and-drop module/lesson editing
- **Bulk Student Import**: CSV import functionality
- **Class Analytics**: Progress tracking and reporting
- **Calendar Integration**: Schedule management
- **Notification System**: Email/SMS notifications for students

## Files Modified/Created

### New Files
- `public/instructor-interface.html` - Main interface
- `models/ClassTemplate.js` - Template data model
- `routes/class-templates.js` - Template API routes
- `init-default-templates.js` - Default template initialization

### Modified Files
- `models/Class.js` - Added template support
- `server.js` - Added template routes
- `public/admin-dashboard.html` - Added interface link

## Installation & Setup

1. **Initialize Templates**
   ```bash
   node init-default-templates.js
   ```

2. **Start Server**
   ```bash
   node server.js
   ```

3. **Access Interface**
   - Login as admin or instructor
   - Navigate to "Instructor Interface" from admin dashboard

The interface is now ready for use with full template-based class creation and comprehensive user management capabilities.