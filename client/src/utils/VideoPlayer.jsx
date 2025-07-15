import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';

function VideoPlayer({ filename }) {
    // const videoRef = useRef(null);
    const [videoError, setVideoError] = useState(false);
    const [maxPlayedTime, setMaxPlayedTime] = useState(0);
    const [videoEl, setVideoEl] = useState(null);
    const videoRef = useCallback((node) => {
        if (node !== null) {
            setVideoEl(node);
        }
    }, []);

    const handleVideoError = () => {
        console.warn('Video failed to load. Showing placeholder.');
        setVideoError(true);
    };

    const handleTimeUpdate = () => {
        const video = videoEl;
        if (!video) return;

        // Track the farthest point watched
        if (video.currentTime > maxPlayedTime) {
            setMaxPlayedTime(video.currentTime);
        }
    };

    const handleSeeking = () => {
        const video = videoEl;
        if (!video) return;

        // If user seeks ahead of watched point, force them back
        if (video.currentTime > maxPlayedTime + 0.3) {
            video.currentTime = maxPlayedTime;
        }
    };

    useEffect(() => {
        if (!filename || !videoEl) return;

        const playlistUrl = `http://localhost:5000/video/v2/${filename}/playlist.m3u8`;

        if (Hls.isSupported()) {
            let hls = new Hls({
                maxBufferLength: 20,              // seconds
                maxMaxBufferLength: 60,           // maximum buffering duration
                maxBufferSize: 30 * 1000 * 1000,  // 30MB max buffer size in bytes
                enableWorker: true,               // improves performance
                backBufferLength: 10,             // keeps only last 10 seconds behind playhead
                liveBackBufferLength: 5
            });

            const setupHls = () => {
                hls.loadSource(playlistUrl);
                hls.attachMedia(videoEl);

                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    videoEl.play();
                });

                hls.on(Hls.Events.ERROR, (event, data) => {
                    console.error('HLS.js error:', data);
                    setVideoError(true);
                });
            }
            setupHls();

            videoEl.onended = () => {
                hls.destroy();
                hls = new Hls({
                    maxBufferLength: 20,
                    maxBufferSize: 30 * 1000 * 1000,
                    backBufferLength: 10,
                });
                setupHls();
            };

            hls.on(Hls.Events.ERROR, function (event, data) {
                console.error('HLS.js error', data);
                setVideoError(true);
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError();
                            break;
                        default:
                            hls.destroy();
                            break;
                    }
                } else {
                    if (data.details === 'bufferFullError') {
                        // Optionally remove buffer manually
                        const video = videoEl;
                        const buffered = video.buffered;
                        if (buffered.length && video.currentTime > 5) {
                            try {
                                hls.bufferController.bufferCodec.resetInitSegment('video');
                            } catch (e) {
                                console.warn('Failed to reset buffer codec:', e);
                            }
                        }
                    }
                }
            });

            return () => {
                hls.destroy();
                videoEl.onended = null;
            };
        } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
            videoEl.src = playlistUrl;
            // Safari fallback
            videoEl.onended = () => {
                hls.destroy();
                hls = new Hls({
                    maxBufferLength: 20,
                    maxBufferSize: 30 * 1000 * 1000,
                    backBufferLength: 10,
                });
                setupHls();
            };
        } else {
            setVideoError(true);
        }
    }, [filename, videoEl]);

    return (
        <>
            {videoError ? (
                <div className="video-placeholder">
                    <div className="video-placeholder-icon">📹</div>
                    <div>Upload a video or start live streaming</div>
                </div>
            ) : (
                <video
                    ref={videoRef}
                    id="previewVideo"
                    className="video-preview"
                    controls
                    autoPlay
                    muted
                    playsInline
                    preload="auto"
                    onError={handleVideoError}
                    onTimeUpdate={handleTimeUpdate}
                    onSeeking={handleSeeking}
                />
            )}

            {!videoError && (
                <div className="video-ready-indicator" id="videoReady">
                    ✅ Ready to Stream
                </div>
            )}
        </>
    );
}

export default VideoPlayer;
