import React from 'react';
import axios from 'axios';
import {Link} from 'react-router-dom';
import './LiveStreams.scss';
import config from '../../server/config/default';


export default class Navbar extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            live_streams: []
        }
    }

    componentDidMount() {
        this.getLiveStreams();
    }

    getLiveStreams() {
        axios.get('http://127.0.0.1:' + config.rtmp_server.http.port + '/api/streams')
            .then(res => {
                let streams = res.data;
                if (typeof (streams['live'] !== 'undefined')) {
                    this.getStreamsInfo(streams['live']);
                }
            });
    }

    getStreamsInfo(live_streams) {
        axios.get('/streams/info', {
            params: {
                streams: live_streams
            }
        }).then(res => {
            this.setState({
                live_streams: res.data
            }, () => {
                console.log(this.state);
            });
        });
    }

    render() {
        let streams = this.state.live_streams.map((stream, index) => {
            return (
                <div key={index} style={{
                    position: 'relative',
                    margin: '1rem',
                    width: 'calc(33.333% - 2rem)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    background: 'var(--track)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}>
                    <span style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'var(--accent)',
                        color: 'white',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        zIndex: 1
                    }}>LIVE</span>
                    
                    <Link to={'/stream/' + stream.username} style={{textDecoration: 'none'}}>
                        <div style={{
                            width: '100%',
                            paddingTop: '56.25%', // 16:9 aspect ratio
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <img 
                                src={'/thumbnails/' + stream.stream_key + '.png'} 
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                                alt={stream.username + "'s stream"}
                            />
                        </div>
                        
                        <div style={{
                            padding: '1rem',
                            color: 'var(--fg)'
                        }}>
                            <h3 style={{
                                fontSize: '1.25rem',
                                fontWeight: 'bold',
                                marginBottom: '0.5rem'
                            }}>{stream.username}</h3>
                            <p style={{
                                fontSize: '0.875rem',
                                color: 'rgba(255,255,255,0.7)'
                            }}>SMX Live Training Session</p>
                        </div>
                    </Link>
                </div>
            );
        });

        return (
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '2rem 1rem'
            }}>
                <h2 style={{
                    fontSize: '1.75rem',
                    marginBottom: '1.5rem',
                    color: 'var(--fg)',
                    fontWeight: 'bold'
                }}>SMX Live Training Sessions</h2>
                
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    margin: '-1rem'
                }}>
                    {streams.length > 0 ? streams : (
                        <div style={{
                            width: '100%',
                            padding: '4rem 0',
                            textAlign: 'center',
                            color: 'rgba(255,255,255,0.7)'
                        }}>
                            <h3 style={{marginBottom: '1rem'}}>No Live Sessions Available</h3>
                            <p>There are currently no active training sessions.</p>
                        </div>
                    )}
                </div>
            </div>
        )
    }
}