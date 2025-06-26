# OBS Studio v31+ Compatibility Upgrade

## Overview
Updated the Stream Mode to work with OBS Studio v31 and later versions by implementing the new OBS WebSocket 5+ protocol. The previous implementation used the legacy WebSocket 4.x protocol which is incompatible with OBS v31+.

## Changes Made

### 1. Dependencies Updated
- **Added**: `obs-websocket-js@5.0.6` to package.json
- **Purpose**: Provides a modern JavaScript client for OBS WebSocket 5+ protocol

### 2. Stream Mode HTML Updated (`public/Stream Mode.html`)

#### JavaScript Library Integration
- Added CDN link for `obs-websocket-js@5.0.6`
- Replaced manual WebSocket handling with the official OBS WebSocket library

#### Protocol Changes
**Before (WebSocket 4.x):**
```javascript
const request = {
  'request-type': 'StartStreaming',
  'message-id': Date.now().toString()
};
obsWebSocket.send(JSON.stringify(request));
```

**After (WebSocket 5+):**
```javascript
await obs.call('StartStream');
```

#### Key Function Updates

1. **Connection Management**
   - `connectToOBS()`: Now uses `OBSWebSocket()` class with proper event handlers
   - Supports automatic reconnection and better error handling
   - Uses `obs.connect()` with RPC version specification

2. **Stream Control**
   - `startClassStream()`: Uses `obs.call('StartStream')` instead of legacy format
   - `stopClassStream()`: Uses `obs.call('StopStream')` instead of legacy format
   - `configureOBSOutput()`: Uses `obs.call('SetStreamServiceSettings')` for RTMP configuration

3. **Event Handling**
   - Replaced manual message parsing with proper event listeners
   - `StreamStateChanged` event handling for real-time stream status updates
   - Better error handling and connection state management

4. **Version Detection**
   - `GetVersion` call now returns structured data with OBS version, WebSocket version, and RPC version
   - Improved compatibility checking

### 3. Setup Instructions Updated
Updated the UI instructions to reflect OBS v31+ requirements:
- OBS Studio v31 or later (WebSocket 5+ built-in)
- Enable WebSocket server in Tools → WebSocket Server Settings
- No separate plugin installation required

### 4. Test File Created
Created `test-obs-v31.html` for standalone testing of OBS WebSocket 5+ connectivity.

## OBS WebSocket 5+ Protocol Benefits

1. **Built-in Support**: No separate plugin required for OBS v31+
2. **Better Performance**: More efficient message handling and reduced latency
3. **Improved Reliability**: Better connection management and error recovery
4. **Future-Proof**: Designed to be compatible with future OBS versions
5. **Enhanced Security**: Better authentication and connection security options

## Compatibility

### Supported OBS Versions
- ✅ OBS Studio v31.0.0 and later (WebSocket 5+ built-in)
- ❌ OBS Studio v30.x and earlier (requires WebSocket 4.x plugin)

### Migration Notes
- Users with OBS v30.x and earlier need to upgrade to OBS v31+
- No changes required for RTMP server configuration
- Stream keys and server URLs remain the same
- All existing streaming functionality preserved

## Testing Instructions

1. **Install OBS Studio v31+**
   - Download from https://obsproject.com/
   - Ensure version is 31.0.0 or later

2. **Enable WebSocket Server**
   - Open OBS Studio
   - Go to Tools → WebSocket Server Settings
   - Check "Enable WebSocket server"
   - Set port to 4455 (default)
   - Optionally set authentication password

3. **Test Connection**
   - Open `test-obs-v31.html` in browser
   - Click "Connect to OBS"
   - Verify connection success and version information

4. **Test Stream Mode**
   - Open Stream Mode in SMXKITS
   - Select a class
   - Click "Connect to OBS Studio"
   - Configure stream settings
   - Test start/stop streaming functionality

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Ensure OBS Studio v31+ is running
   - Verify WebSocket server is enabled in OBS settings
   - Check port 4455 is not blocked by firewall

2. **Authentication Error**
   - If password is set in OBS, update connection code to include password
   - Consider disabling authentication for local connections

3. **Stream Start Failed**
   - Verify RTMP server is accessible
   - Check stream key is generated correctly
   - Ensure OBS has proper streaming service configured

### Debug Steps
1. Open browser developer console for detailed error messages
2. Use the test file (`test-obs-v31.html`) to isolate connection issues
3. Check OBS Studio logs for WebSocket-related errors
4. Verify network connectivity to RTMP server

## Future Enhancements

1. **Authentication Support**: Add password authentication for WebSocket connections
2. **Scene Management**: Integrate OBS scene switching capabilities
3. **Source Control**: Add ability to control OBS sources and filters
4. **Recording Control**: Add recording start/stop functionality
5. **Statistics Monitoring**: Display stream statistics and performance metrics

## Files Modified

1. `package.json` - Added obs-websocket-js dependency
2. `public/Stream Mode.html` - Complete WebSocket 5+ protocol implementation
3. `test-obs-v31.html` - New test file for OBS connectivity verification
4. `OBS-V31-UPGRADE-SUMMARY.md` - This documentation file

## Installation Commands

```bash
# Install the new dependency
npm install obs-websocket-js@5

# Start the server
npm start
```

The Stream Mode is now fully compatible with OBS Studio v31+ and uses the modern WebSocket 5+ protocol for reliable streaming integration.