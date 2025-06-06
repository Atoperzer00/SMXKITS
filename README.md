# SMXKITS

SMX KITS Training Management System - A comprehensive training management system built with Node.js, Express, MongoDB, and Socket.IO.

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
   git clone https://github.com/Atoperzer00/SMXKITS.git
   cd SMXKITS
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Environment Setup**:
   - Configure your MongoDB connection string in `.env`
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
├── routes/           # API routes
├── middleware/       # Custom middleware
├── public/          # Static files
├── server.js        # Main server file
├── index.html       # Entry point
├── SMXKITS.html     # Main application interface
└── package.json     # Project dependencies
```

## License

MIT License

---

**SMX KITS Training Management System** - Empowering education through technology.