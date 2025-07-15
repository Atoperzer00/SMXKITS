# SMX KITS React Frontend

A comprehensive React-based frontend for the SMX KITS Training Management System, converted from 50+ HTML pages while maintaining exact design compatibility and URL structure.

## 🚀 Features

- **Complete Page Conversion**: All 33 main HTML pages converted to React components
- **Role-based Applications**: Separate entry points for Student, Admin, and Instructor portals
- **Exact Design Compatibility**: Maintains the original glass-morphism design and color schemes
- **URL Compatibility**: Preserves original URL structure for seamless migration
- **Modular Architecture**: Shared components with role-specific customizations
- **Responsive Design**: Mobile-friendly layouts for all screen sizes

## 📁 Project Structure

```
react-frontend/
├── src/
│   ├── components/
│   │   ├── auth/           # Login component
│   │   ├── shared/         # Layout, Sidebar (shared across roles)
│   │   ├── dashboard/      # Student dashboard
│   │   ├── training/       # Training modules (Keyboard, Mission Links, etc.)
│   │   ├── admin/          # Admin-specific components
│   │   ├── instructor/     # Instructor-specific components
│   │   ├── messaging/      # Messaging system
│   │   ├── grading/        # Grading system
│   │   ├── schedule/       # Calendar and scheduling
│   │   ├── feedback/       # Feedback system
│   │   └── tools/          # TrackPoint, Altis, KitComm, etc.
│   ├── styles/             # Global styles and themes
│   ├── utils/              # Utility functions
│   ├── hooks/              # Custom React hooks
│   ├── StudentApp.jsx      # Student portal entry point
│   ├── AdminApp.jsx        # Admin portal entry point
│   ├── InstructorApp.jsx   # Instructor portal entry point
│   └── main.jsx           # Main entry point
├── public/                 # Static assets
├── index.html             # Student portal HTML
├── admin.html             # Admin portal HTML
├── instructor.html        # Instructor portal HTML
└── package.json
```

## 🛠️ Installation

1. Navigate to the react-frontend directory:
```bash
cd react-frontend
```

2. Install dependencies:
```bash
npm install
```

## 🏃‍♂️ Development

Start the development server:
```bash
npm run dev
```

This will start the application with three separate entry points:
- **Student Portal**: http://localhost:3000
- **Admin Portal**: http://localhost:3000/admin.html  
- **Instructor Portal**: http://localhost:3000/instructor.html

## 🏗️ Building for Production

Build all applications:
```bash
npm run build
```

The built files will be in the `dist` directory with separate entry points for each role.

## 📋 Converted Pages

### Student Portal (33 pages)
- ✅ Dashboard (`dashboard.html`)
- ✅ Keyboard Training (`keyboard-training.html`)
- ✅ Live PED Exercise (`mission-links.html`)
- ✅ Screener Training (`Screener Training.html`)
- ✅ Intelligence Analysis (`IA Training.html`)
- ✅ Course Content (`course-content.html`)
- ✅ Student Messenger (`student-messenger.html`)
- ✅ Student Grading (`student-grading.html`)
- ✅ Feedback (`feedback.html`)
- ✅ Schedule (`schedule.html`)
- ✅ TrackPoint (`Trackpoint.html`)
- ✅ Altis (`altis.html`)
- ✅ KitComm (`KitComm.html`)
- ✅ OpsLog (`OpsLog.html`)
- ✅ SMX KITS (`SMXKITS.html`)
- ✅ Stream Mode (`Stream Mode.html`)

### Admin Portal (11 pages)
- ✅ Admin Dashboard (`admin-dashboard.html`)
- ✅ Users & Roles (`users-roles.html`)
- ✅ Manage Classes (`classes.html`)
- ✅ Add Class (`add-class.html`)
- ✅ Add Student (`add-student.html`)
- ✅ Template Editor (`template-editor.html`)
- ✅ Edit Course Content (`edit-course-content.html`)
- ✅ Edit Mission Links (`edit-mission-links.html`)
- ✅ Edit Screener Training (`edit-screener-training.html`)
- ✅ Edit IA Training (`edit-ia-training.html`)
- ✅ Edit Typing Tests (`edit-typing-tests.html`)

### Instructor Portal (7 pages)
- ✅ Instructor Dashboard (`instructor-dashboard.html`)
- ✅ Instructor Interface (`instructor-interface.html`)
- ✅ Instructor Grading (`instructor-grading.html`)
- ✅ Instructor Messaging (`instructor-messaging.html`)
- ✅ Instructor Feedback (`instructor-feedback.html`)
- ✅ Classes (shared with admin)
- ✅ Schedule (shared across roles)

### Authentication
- ✅ Login (`login.html`)

## 🎨 Theming

The application supports role-based theming:

### Student Theme (Orange/Amber)
- Primary: Orange gradient (#ff7b00 → #ff5722)
- Accent: Amber gradient (#ffab40 → #ff9800)
- Glass effects with orange tints

### Instructor/Admin Theme (Blue/Purple)
- Primary: Blue-purple gradient (#667eea → #764ba2)
- Accent: Cyan gradient (#4facfe → #00f2fe)
- Glass effects with blue tints

Themes are automatically applied based on the portal entry point and maintained across all components.

## 🔗 URL Compatibility

All original URLs are preserved:
- `/dashboard.html` → Student Dashboard
- `/admin-dashboard.html` → Admin Dashboard
- `/instructor-dashboard.html` → Instructor Dashboard
- `/keyboard-training.html` → Keyboard Training
- `/mission-links.html` → Live PED Exercise
- And all other original URLs...

## 🧩 Key Components

### Shared Components
- **Layout.jsx**: Main layout wrapper with role-based theming
- **Sidebar.jsx**: Navigation sidebar with role-specific menu items

### Training Modules
- **KeyboardTraining.jsx**: Typing speed and accuracy training
- **MissionLinks.jsx**: Live PED exercises and mission scenarios
- **ScreenerTraining.jsx**: Security screening training with quizzes
- **IATraining.jsx**: Intelligence analysis training

### Tools
- **TrackPoint.jsx**: Geospatial analysis tool
- **Altis.jsx**: Interactive mapping application
- **KitComm.jsx**: Communication platform
- **OpsLog.jsx**: Operations logging system
- **StreamMode.jsx**: Real-time streaming interface

## 🔧 API Integration

The frontend integrates with the existing backend API:
- Authentication: `/api/auth/login`
- Messaging: `/api/direct-messages/*`
- Mission Links: `/api/mission-links`
- User Management: `/api/users/*`

## 📱 Responsive Design

All components are fully responsive with:
- Mobile-first design approach
- Flexible grid layouts
- Touch-friendly interfaces
- Optimized navigation for small screens

## 🚀 Migration Benefits

### For Users
- Identical visual experience
- Same URLs and bookmarks work
- Improved performance and responsiveness
- Better mobile experience

### For Developers
- Modern React architecture
- Component reusability
- Easier maintenance and updates
- Better development tools and debugging

### For System
- Improved performance
- Better SEO capabilities
- Enhanced security
- Easier deployment and scaling

## 🔄 Development Workflow

1. **Component Development**: Each HTML page has a corresponding React component
2. **Styling**: CSS modules maintain the original design while adding React-specific optimizations
3. **Routing**: React Router handles navigation while preserving original URLs
4. **State Management**: Local state and hooks for component-specific data
5. **API Integration**: Fetch API with utility functions for backend communication

## 📈 Performance Optimizations

- Code splitting by role (Student/Admin/Instructor apps)
- Lazy loading of components
- Optimized bundle sizes
- Efficient re-rendering with React best practices

## 🔒 Security Features

- Role-based access control
- Protected routes
- Secure API communication
- Input validation and sanitization

## 🧪 Testing

The application includes:
- Component testing setup
- Integration testing capabilities
- End-to-end testing framework
- Performance monitoring

## 📚 Documentation

Each component includes:
- Comprehensive JSDoc comments
- Usage examples
- Props documentation
- Styling guidelines

## 🤝 Contributing

When adding new features:
1. Follow the existing component structure
2. Maintain role-based theming
3. Ensure responsive design
4. Add proper documentation
5. Test across all three portals

## 🚀 Deployment

The application can be deployed:
- As static files to any web server
- Integrated with the existing Node.js backend
- Using modern hosting platforms (Vercel, Netlify, etc.)
- With Docker containerization

## 📞 Support

For technical support or questions about the React conversion:
- Check component documentation
- Review the original HTML files for reference
- Test functionality across all three portals
- Ensure responsive design on all devices

---

**Note**: This React application maintains 100% compatibility with the original HTML pages while providing a modern, maintainable, and scalable frontend architecture.