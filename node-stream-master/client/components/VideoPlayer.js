import React from 'react';
import videojs from 'video.js'
import axios from 'axios';
import config from '../../server/config/default';


export default class VideoPlayer extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            stream: false,
            videoJsOptions: null
        }
    }

    componentDidMount() {
        axios.get('/user', {
            params: {
                username: this.props.match.params.username
            }
        }).then(res => {
            this.setState({
                stream: true,
                videoJsOptions: {
                    autoplay: true,
                    controls: true,
                    sources: [{
                        src: 'http://127.0.0.1:' + config.rtmp_server.http.port + '/live/' + res.data.stream_key + '/index.m3u8',
                        type: 'application/x-mpegURL'
                    }],
                    fluid: true,
                    responsive: true,
                    aspectRatio: '16:9',
                    controlBar: {
                        volumePanel: { inline: false },
                        pictureInPictureToggle: false
                    },
                    userActions: {
                        hotkeys: true
                    },
                    playbackRates: [0.5, 1, 1.5, 2]
                }
            }, () => {
                this.player = videojs(this.videoNode, this.state.videoJsOptions, function onPlayerReady() {
                    console.log('onPlayerReady', this);
                    // Add SMX Stream custom class to player
                    this.addClass('smx-stream-player');
                });
            });
        })
    }

    componentWillUnmount() {
        if (this.player) {
            this.player.dispose()
        }
    }

    render() {
        return (
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '2rem 1rem'
            }}>
                <div style={{
                    background: 'var(--track)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                    marginBottom: '1.5rem'
                }}>
                    {this.state.stream ? (
                        <div data-vjs-player style={{
                            width: '100%',
                            borderRadius: '10px 10px 0 0',
                            overflow: 'hidden'
                        }}>
                            <video 
                                ref={node => this.videoNode = node} 
                                className="video-js vjs-big-play-centered vjs-fluid" 
                                style={{
                                    '--primary-color': 'var(--accent)'
                                }}
                            />
                        </div>
                    ) : (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            background: '#111',
                            height: '500px',
                            borderRadius: '10px 10px 0 0'
                        }}>
                            <div style={{textAlign: 'center'}}>
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    border: '5px solid rgba(255,255,255,0.1)',
                                    borderTopColor: 'var(--accent)',
                                    borderRadius: '50%',
                                    margin: '0 auto 20px',
                                    animation: 'spin 1s infinite linear'
                                }}></div>
                                <div style={{color: 'var(--fg)', fontSize: '1.2rem'}}>
                                    Loading SMX Stream...
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div style={{padding: '1.5rem'}}>
                        <h2 style={{
                            fontSize: '1.5rem',
                            color: 'var(--fg)',
                            marginBottom: '0.5rem'
                        }}>
                            SMX Live Training: {this.props.match.params.username}
                        </h2>
                        <p style={{color: 'rgba(255,255,255,0.7)'}}>
                            Security Mission Exercise - Live Training Session
                        </p>
                    </div>
                </div>
                
                <style jsx>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    /* Custom Video.js skin for SMX Stream */
                    .video-js {
                        font-family: 'Segoe UI', sans-serif;
                    }
                    
                    .video-js .vjs-big-play-button {
                        background-color: var(--accent) !important;
                        border-color: var(--accent) !important;
                    }
                    
                    .video-js .vjs-play-progress,
                    .video-js .vjs-volume-level {
                        background-color: var(--accent) !important;
                    }
                    
                    .video-js .vjs-control-bar {
                        background-color: rgba(28, 28, 28, 0.9) !important;
                    }
                `}</style>
            </div>
        )
    }
}