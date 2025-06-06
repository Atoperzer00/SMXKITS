# SMX KITS Training Management System

A comprehensive training management system built with Node.js, Express, MongoDB, and Socket.IO.

## Features

- **User Management**: Authentication and role-based access (Admin, Instructor, Student)
- **Class Management**: Create and manage training classes
- **Progress Tracking**: Monitor student progress and performance
- **Real-time Communication**: KitComm chat system using Socket.IO
- **Admin Dashboard**: Administrative interface for system management
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO for live chat
- **Authentication**: JWT tokens with bcrypt password hashing
- **Frontend**: HTML5, CSS3, JavaScript

## Installation

1. **Prerequisites**:
   - Node.js (v14 or higher)
   - MongoDB (v4.4 or higher)
   - npm or yarn

2. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd SMXKITS
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Environment Setup**:
   - Copy `.env.example` to `.env` (if available)
   - Configure your MongoDB connection string
   - Set your JWT secret key

5. **Start MongoDB**:
   - Ensure MongoDB service is running
   - Default connection: `mongodb://localhost:27017/smxkits`

6. **Run the application**:
   ```bash
   npm start
   ```

7. **Access the application**:
   - Open your browser and navigate to `http://localhost:5000`

## Project Structure

```
SMXKITS/
├── models/           # Database models
│   ├── User.js
│   ├── Class.js
│   └── Progress.js
├── routes/           # API routes
│   ├── auth.js
│   ├── users.js
│   ├── classes.js
│   └── progress.js
├── middleware/       # Custom middleware
│   └── auth.js
├── public/          # Static files
│   └── admin-dashboard.html
├── .env             # Environment variables
├── server.js        # Main server file
├── index.html       # Entry point (redirects to SMXKITS.html)
├── SMXKITS.html     # Main application interface
├── KitComm.html     # Chat interface
└── package.json     # Project dependencies
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Users
- `GET /api/users` - Get all users (admin/instructor)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Classes
- `GET /api/classes` - Get all classes
- `POST /api/classes` - Create new class (admin)

### Progress
- `GET /api/progress/:userId` - Get user progress
- `POST /api/progress` - Create/update progress

## Environment Variables

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/smxkits
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
```

## Development

For development with auto-restart:
```bash
npm run dev
```

## Deployment

1. **Static Hosting** (Frontend only):
   - Ensure `index.html` is in the root directory
   - Upload all files to your hosting provider

2. **Full Stack Deployment**:
   - Deploy to platforms like Heroku, Railway, or DigitalOcean
   - Ensure MongoDB is accessible
   - Set environment variables on your hosting platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions, please contact the development team.

---

**SMX KITS Training Management System** - Empowering education through technology.