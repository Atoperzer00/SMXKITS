import React from 'react';
import axios from 'axios';

export default class Navbar extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            stream_key : ''
        };

        this.generateStreamKey = this.generateStreamKey.bind(this);
    }

    componentDidMount() {
        this.getStreamKey();
    }

    generateStreamKey(e){
        axios.post('/settings/stream_key')
            .then(res => {
                this.setState({
                    stream_key : res.data.stream_key
                });
            })
    }

    getStreamKey(){
        axios.get('/settings/stream_key')
            .then(res => {
                this.setState({
                    stream_key : res.data.stream_key
                });
            })
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
                    padding: '2rem',
                    marginBottom: '2rem',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                }}>
                    <h2 style={{
                        fontSize: '1.5rem',
                        color: 'var(--fg)',
                        marginBottom: '1.5rem',
                        fontWeight: 'bold'
                    }}>SMX Stream Key</h2>

                    <div style={{
                        background: 'rgba(0,0,0,0.2)',
                        padding: '1rem',
                        borderRadius: '5px',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        overflow: 'hidden'
                    }}>
                        <code style={{
                            fontFamily: 'monospace',
                            fontSize: '1.1rem',
                            color: 'var(--fg)',
                            wordBreak: 'break-all'
                        }}>{this.state.stream_key}</code>
                    </div>

                    <button 
                        onClick={this.generateStreamKey}
                        style={{
                            background: 'var(--accent)',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '5px',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                    >
                        Generate New Stream Key
                    </button>
                </div>

                <div style={{
                    background: 'var(--track)',
                    borderRadius: '10px',
                    padding: '2rem',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                }}>
                    <h2 style={{
                        fontSize: '1.5rem',
                        color: 'var(--fg)',
                        marginBottom: '1.5rem',
                        fontWeight: 'bold'
                    }}>SMX Streaming Instructions</h2>

                    <div style={{
                        color: 'rgba(255,255,255,0.85)',
                        lineHeight: '1.6'
                    }}>
                        <p style={{marginBottom: '1rem'}}>
                            You can use <a href="https://obsproject.com/" target="_blank" style={{color: 'var(--accent)', textDecoration: 'none'}}>OBS Studio</a> or <a href="https://www.xsplit.com/" target="_blank" style={{color: 'var(--accent)', textDecoration: 'none'}}>XSplit</a> to stream your SMX training sessions.
                        </p>
                        
                        <div style={{
                            background: 'rgba(0,0,0,0.2)',
                            padding: '1.5rem',
                            borderRadius: '5px',
                            marginBottom: '1rem'
                        }}>
                            <h3 style={{
                                fontSize: '1.1rem',
                                color: 'var(--fg)',
                                marginBottom: '1rem'
                            }}>OBS Studio Configuration:</h3>
                            
                            <ol style={{
                                paddingLeft: '1.5rem',
                                marginBottom: '0'
                            }}>
                                <li style={{marginBottom: '0.5rem'}}>Go to Settings &gt; Stream</li>
                                <li style={{marginBottom: '0.5rem'}}>Select "Custom" from the service dropdown</li>
                                <li style={{marginBottom: '0.5rem'}}>Enter <code style={{background: 'rgba(0,0,0,0.3)', padding: '0.25rem 0.5rem', borderRadius: '3px'}}>rtmp://127.0.0.1:1935/live</code> in the Server field</li>
                                <li style={{marginBottom: '0.5rem'}}>Enter your Stream Key in the Stream Key field</li>
                                <li style={{marginBottom: '0.5rem'}}>Click "Apply" to save your settings</li>
                                <li>Click "Start Streaming" when you're ready to begin your SMX training session</li>
                            </ol>
                        </div>
                        
                        <p>
                            <strong style={{color: 'var(--fg)'}}>Note:</strong> For optimal streaming quality, we recommend setting your video output to 1080p (1920x1080) at 30fps with a bitrate of 4000-6000 Kbps.
                        </p>
                    </div>
                </div>
            </div>
        )
    }
}