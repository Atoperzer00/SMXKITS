import React, { useRef, useState } from 'react';

function FileUploader(props) {
    const {setVideoFileName} = props;
    const inputRef = useRef(null);
    const [message, setMessage] = useState('');

    const handleBrowseClick = () => {
        inputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setVideoFileName(file.name);
            await uploadFile(file);
        }
    };

    const uploadFile = async (file) => {
        if (!file.type.includes('mp4')) {
            setMessage('Only MP4 videos are allowed.');
            return;
        }

        const formData = new FormData();
        formData.append('video', file);

        try {
            const res = await fetch('http://localhost:5000/upload/v2', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (res.ok) {
                setMessage(`✅ Uploaded: ${data.file}`);
            } else {
                setMessage(`❌ Upload failed: ${data.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error(err);
            setMessage('❌ Upload failed. Server not reachable.');
        }
    };

    return (
        <div className="file-drop" id="fileDrop">
            <input
                type="file"
                id="fileInput"
                ref={inputRef}
                accept="video/mp4"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
            <div><strong>Drop your MP4 video here</strong></div>
            <div style={{ marginTop: '8px', fontSize: '0.95rem', opacity: 0.8 }}>
                or <span className="file-browse-text" id="fileBrowse" onClick={handleBrowseClick} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                    click to browse
                </span>
            </div>
            <div style={{ marginTop: '12px', fontSize: '0.85rem', opacity: 0.6 }}>
                Maximum file size: 4GB • Auto-deleted after 24 hours
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 500 }}>
                📋 Workflow: Upload file → Drag to video player → Upload to server → Go Live
            </div>
            <div className="drag-instruction" id="dragInstruction" style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--success)', display: 'none' }}>
                💡 You can drag this area to the video player to load the file
            </div>
            <p style={{ marginTop: '12px', fontSize: '0.85rem' }}>{message}</p>
        </div>
    );
}

export default FileUploader;
