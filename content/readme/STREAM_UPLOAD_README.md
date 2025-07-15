# Stream Upload Feature

This document explains the new video upload functionality for the SMX KITS streaming system.

## Overview

The stream upload feature allows instructors to upload MP4 videos and immediately stream them to students. The uploaded videos are temporarily stored and automatically deleted after 5 minutes.

## API Endpoints

### POST /api/stream/upload
Upload a video file for immediate streaming.

**Authentication:** Required (Admin or Instructor)

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - `video`: MP4 file (max 500MB)
  - `classId`: ID of the class to stream to

**Response:**
```json
{
  "streamUrl": "https://smxstream.new/stream/filename.m3u8",
  "filename": "stream-1234567890-123456789.mp4",
  "originalName": "my-video.mp4",
  "status": "live",
  "message": "Video uploaded and streaming started",
  "classId": "class_id_here",
  "streamKey": "class_stream_key"
}
```

### GET /api/stream/status/:classId
Get current streaming status for a class.

### POST /api/stream/notice/:classId
Send a notice message to all viewers.

### GET /api/stream/viewers/:classId
Get current viewer count for a class.

## Frontend Usage

1. **Select a Class**: Choose a class from the dropdown
2. **Upload Video**: Drag and drop an MP4 file or click to browse
3. **Automatic Streaming**: The video starts streaming immediately after upload
4. **Temporary Storage**: Files are automatically deleted after 5 minutes

## File Structure

```
routes/
├── stream-upload.route.js    # New upload route handler
├── streams.js               # Existing streaming routes
└── ...

models/
├── Class.js                 # Updated with upload fields
├── StreamSession.js         # Updated with upload fields
└── ...

temp/                        # Temporary upload directory
public/
└── Stream Mode.html         # Updated streaming interface
```

## Configuration

### Environment Variables
- `HLS_SERVER_URL`: URL for HLS streaming server (default: http://localhost:8888)
- `RTMP_SERVER_URL`: URL for RTMP server (default: rtmp://localhost:1935/live)

### File Limits
- Maximum file size: 500MB
- Supported format: MP4 only
- Automatic cleanup: 5 minutes after upload

## Security

- Authentication required for all upload operations
- Authorization checks ensure users can only upload to their assigned classes
- File type validation prevents non-video uploads
- Temporary storage with automatic cleanup

## Integration with Existing System

The upload feature integrates seamlessly with the existing streaming system:

1. **Class Management**: Uses existing class structure and permissions
2. **Stream Sessions**: Creates/updates stream sessions automatically
3. **Real-time Updates**: Notifies connected clients via Socket.IO
4. **User Authentication**: Uses existing JWT authentication

## Troubleshooting

### Common Issues

1. **"No auth token found"**: User needs to log in first
2. **"Class ID is required"**: Select a class before uploading
3. **"Only MP4 files are allowed"**: Convert video to MP4 format
4. **"File too large"**: Reduce file size to under 500MB

### File Cleanup

If temporary files are not being deleted automatically:
1. Check server logs for cleanup errors
2. Manually delete files from the `temp/` directory
3. Restart the server if needed

## Future Enhancements

- Support for additional video formats
- Progress tracking during upload
- Video preview before streaming
- Persistent storage options
- Streaming quality selection# Stream Upload Feature

This document explains the new video upload functionality for the SMX KITS streaming system.

## Overview

The stream upload feature allows instructors to upload MP4 videos and immediately stream them to students. The uploaded videos are temporarily stored and automatically deleted after 5 minutes.

## API Endpoints

### POST /api/stream/upload
Upload a video file for immediate streaming.

**Authentication:** Required (Admin or Instructor)

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - `video`: MP4 file (max 500MB)
  - `classId`: ID of the class to stream to

**Response:**
```json
{
  "streamUrl": "https://smxstream.new/stream/filename.m3u8",
  "filename": "stream-1234567890-123456789.mp4",
  "originalName": "my-video.mp4",
  "status": "live",
  "message": "Video uploaded and streaming started",
  "classId": "class_id_here",
  "streamKey": "class_stream_key"
}
```

### GET /api/stream/status/:classId
Get current streaming status for a class.

### POST /api/stream/notice/:classId
Send a notice message to all viewers.

### GET /api/stream/viewers/:classId
Get current viewer count for a class.

## Frontend Usage

1. **Select a Class**: Choose a class from the dropdown
2. **Upload Video**: Drag and drop an MP4 file or click to browse
3. **Automatic Streaming**: The video starts streaming immediately after upload
4. **Temporary Storage**: Files are automatically deleted after 5 minutes

## File Structure

```
routes/
├── stream-upload.route.js    # New upload route handler
├── streams.js               # Existing streaming routes
└── ...

models/
├── Class.js                 # Updated with upload fields
├── StreamSession.js         # Updated with upload fields
└── ...

temp/                        # Temporary upload directory
public/
└── Stream Mode.html         # Updated streaming interface
```

## Configuration

### Environment Variables
- `HLS_SERVER_URL`: URL for HLS streaming server (default: http://localhost:8888)
- `RTMP_SERVER_URL`: URL for RTMP server (default: rtmp://localhost:1935/live)

### File Limits
- Maximum file size: 500MB
- Supported format: MP4 only
- Automatic cleanup: 5 minutes after upload

## Security

- Authentication required for all upload operations
- Authorization checks ensure users can only upload to their assigned classes
- File type validation prevents non-video uploads
- Temporary storage with automatic cleanup

## Integration with Existing System

The upload feature integrates seamlessly with the existing streaming system:

1. **Class Management**: Uses existing class structure and permissions
2. **Stream Sessions**: Creates/updates stream sessions automatically
3. **Real-time Updates**: Notifies connected clients via Socket.IO
4. **User Authentication**: Uses existing JWT authentication

## Troubleshooting

### Common Issues

1. **"No auth token found"**: User needs to log in first
2. **"Class ID is required"**: Select a class before uploading
3. **"Only MP4 files are allowed"**: Convert video to MP4 format
4. **"File too large"**: Reduce file size to under 500MB

### File Cleanup

If temporary files are not being deleted automatically:
1. Check server logs for cleanup errors
2. Manually delete files from the `temp/` directory
3. Restart the server if needed

## Future Enhancements

- Support for additional video formats
- Progress tracking during upload
- Video preview before streaming
- Persistent storage options
- Streaming quality selection