# Template Synchronization System

## Overview
The Template Synchronization System ensures that the Template Editor and Instructor Interface always display the same templates, even when changes are made in either interface.

## How It Works

### 1. Storage Event System
- When templates are created, edited, or deleted in either interface, a localStorage event is triggered
- Both interfaces listen for the `templatesUpdated` storage event
- When detected, templates are automatically refreshed in all open windows/tabs

### 2. API Integration
- Both interfaces use the same `/api/class-templates` endpoints
- Authentication is handled consistently using JWT tokens
- All API calls include proper error handling and user feedback

### 3. Visual Feedback
- Sync notifications appear when templates are updated from another window
- Template selectors are automatically updated with new options
- Loading states and error messages provide clear user feedback

## Components Synchronized

### Template Editor (`/template-editor.html`)
- **Template Selector**: Dropdown that lists all available templates
- **Template Creation**: New templates created here appear in Instructor Interface
- **Template Editing**: Changes made here are reflected everywhere
- **Schedule Management**: Template schedules are saved and synchronized

### Instructor Interface (`/instructor-interface.html`)
- **Templates Tab**: Lists all templates with management options
- **Calendar Template Dropdown**: Used when creating classes
- **Template Creation**: New templates created here appear in Template Editor
- **Template Deletion**: Deletions are reflected in all interfaces

## Testing the Synchronization

### Method 1: Manual Testing
1. **Login**: Go to `/login.html` and login as admin/instructor
2. **Open Both Interfaces**: 
   - Open `/instructor-interface.html` in one tab
   - Open `/template-editor.html` in another tab
3. **Test Creation**:
   - In Instructor Interface: Go to Templates tab → Create New Template
   - Check Template Editor: New template should appear in selector
4. **Test Editing**:
   - In Template Editor: Select a template and make changes → Save
   - Check Instructor Interface: Changes should be reflected
5. **Test Deletion**:
   - In Instructor Interface: Delete a template
   - Check Template Editor: Template should be removed from selector

### Method 2: Automated Testing
1. **Open Test Dashboard**: Go to `/test-sync-complete.html`
2. **Login First**: Click "Login Page" and authenticate
3. **Run Tests**: Use the test dashboard to create templates and monitor sync events
4. **Monitor Events**: Watch the storage events section for real-time sync activity

## Current Templates

The system comes with three default templates:

1. **Easy - Basic SMX Training** (1 week)
   - Introduction to SMX concepts
   - Basic operations and practice

2. **Medium - Intermediate SMX Training** (2 weeks)
   - Advanced operations
   - Tactical scenarios and assessment

3. **Hard - Advanced SMX Specialist Training** (3 weeks)
   - Expert systems and leadership
   - Complex scenarios and certification

## Technical Implementation

### Storage Event Mechanism
```javascript
// Trigger sync event
localStorage.setItem('templatesUpdated', Date.now().toString());

// Listen for sync events
window.addEventListener('storage', (e) => {
  if (e.key === 'templatesUpdated') {
    loadTemplates(); // Refresh templates
  }
});
```

### API Authentication
```javascript
async function apiCall(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  // ... rest of implementation
}
```

### Template Selector Updates
```javascript
function updateTemplateSelector(templates) {
  const selector = document.getElementById('template-selector');
  const currentValue = selector.value; // Preserve selection
  
  // Rebuild options
  selector.innerHTML = '<option value="">Select Template...</option>';
  templates.forEach(template => {
    const option = document.createElement('option');
    option.value = template.difficulty;
    option.textContent = `${template.difficulty} - ${template.name}`;
    selector.appendChild(option);
  });
  
  // Restore selection if still valid
  if (currentValue && templates.find(t => t.difficulty === currentValue)) {
    selector.value = currentValue;
  }
}
```

## Troubleshooting

### Templates Not Syncing
1. **Check Authentication**: Ensure you're logged in with proper permissions
2. **Check Console**: Look for JavaScript errors in browser console
3. **Check Network**: Verify API calls are successful in Network tab
4. **Clear Cache**: Try refreshing both interfaces

### Template Selector Empty
1. **Database Check**: Ensure templates exist in MongoDB
2. **API Check**: Test `/api/class-templates` endpoint directly
3. **Permissions**: Verify user has admin/instructor role

### Sync Events Not Working
1. **Same Origin**: Ensure both interfaces are on same domain
2. **localStorage**: Check if localStorage is enabled in browser
3. **Multiple Windows**: Storage events only work between different windows/tabs

## Files Modified

### Core Files
- `public/template-editor.html` - Added authentication and sync system
- `public/instructor-interface.html` - Added sync event listeners
- `routes/class-templates.js` - Template and schedule API endpoints

### Test Files
- `test-sync-complete.html` - Comprehensive sync testing dashboard
- `test-templates-sync.html` - Basic sync testing page

### Database
- `init-default-templates.js` - Creates the three default templates
- `models/ClassTemplate.js` - Template data model

## API Endpoints Used

- `GET /api/class-templates` - List all templates
- `GET /api/class-templates/:difficulty` - Get specific template
- `POST /api/class-templates` - Create new template
- `PUT /api/class-templates/:difficulty` - Update template
- `DELETE /api/class-templates/:difficulty` - Delete template
- `GET /api/class-templates/:difficulty/schedule` - Get template schedule
- `PUT /api/class-templates/:difficulty/schedule` - Update template schedule
- `GET /api/class-templates/content/available` - Get available content library

## Success Indicators

✅ **Template Selector Populated**: Both interfaces show the same templates
✅ **Real-time Sync**: Changes in one interface immediately appear in the other
✅ **Visual Feedback**: Sync notifications appear when templates are updated
✅ **Persistent Selection**: Template selections are preserved during updates
✅ **Error Handling**: Clear error messages for authentication and API issues
✅ **Cross-tab Communication**: Storage events work between multiple tabs/windows

The synchronization system is now fully implemented and tested. Both interfaces will always display the same templates and stay synchronized in real-time.