# SMX Stream Backend API

This is the backend implementation for the SMX Stream platform, providing live streaming management, class control, and student interaction features.

## Features

- **User Authentication**: Login, registration, and JWT-based auth
- **Class Management**: Create, list, and manage streaming classes
- **Stream Control**: Start, pause, and stop live streams for specific classes
- **Media Management**: Upload and stream MP4 files
- **Bookmarks**: Add timeline bookmarks during live sessions
- **Live Chat**: Real-time messaging between students and instructors
- **Viewer Tracking**: Monitor active viewer counts for each stream

## API Routes

### Authentication

- `POST /api/register` - Register a new user
- `POST /api/login` - Login and get auth token
- `GET /api/me` - Get current user data

### Classes

- `GET /api/classes` - List classes (filtered by user role)
- `GET /api/classes/:id` - Get class details
- `POST /api/classes` - Create a new class (admin/instructor only)

### Lessons/Exercises

- `GET /api/lessons` - List lessons (can filter by class)
- `POST /api/lessons` - Upload a new lesson MP4 (instructor only)

### Stream Control

- `POST /api/classes/:id/startStream` - Start streaming a class
- `POST /api/classes/:id/pauseStream` - Pause a stream
- `POST /api/classes/:id/stopStream` - Stop a stream
- `POST /api/classes/:id/playLesson` - Play a lesson MP4 as the stream

### Interaction

- `POST /api/classes/:id/bookmark` - Add a session bookmark
- `GET /api/classes/:id/bookmarks` - Get bookmarks for a class
- `POST /api/classes/:id/broadcastNotice` - Send a notice to all viewers
- `GET /api/classes/:id/viewers` - Get current viewer count

## Socket.IO Events

- `joinClass` - Join a class room (for viewing)
- `leaveClass` - Leave a class room
- `sendMessage` - Send a chat message
- `sendNotice` - Send an instructor notice
- `streamStatus` - Broadcast stream status changes
- `viewerCount` - Broadcast viewer count updates
- `bookmark` - Broadcast new bookmarks

## Models

### User

```js
{
  username: String,
  email: String,
  passwordHash: String,
  role: 'student' | 'instructor' | 'admin',
  classes: [ObjectId]
}
```

### Class

```js
{
  name: String,
  description: String,
  instructors: [ObjectId],
  students: [ObjectId],
  streamKey: String,
  status: 'offline' | 'live' | 'paused',
  currentLesson: ObjectId,
  bookmarks: [{ time: Number, label: String }]
}
```

### Lesson

```js
{
  title: String,
  description: String,
  filePath: String,
  module: String,
  order: Number,
  classId: ObjectId,
  createdBy: ObjectId
}
```

### StreamSession

```js
{
  classId: ObjectId,
  status: 'live' | 'paused' | 'offline',
  startedAt: Date,
  endedAt: Date,
  currentLesson: ObjectId,
  currentSource: 'mp4' | 'live',
  viewerCount: Number,
  bookmarks: [{ time, label }],
  messages: [{ userId, message, timestamp }]
}
```

## Setup and Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Set up MongoDB:
   ```
   # Make sure MongoDB is running
   mongod --dbpath=/data
   ```

3. Start the server:
   ```
   npm start
   ```

## Integration with Frontend

The frontend can connect to this backend using:

1. REST API calls for data operations
2. Socket.IO for real-time features like chat and notifications

See `SMXStream-integrated.html` for a complete frontend implementation that works with this backend.