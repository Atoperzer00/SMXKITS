import React from 'react'
import ReactDOM from 'react-dom/client'
import TrackPointStandalone from './components/tools/TrackPointStandalone.jsx'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('trackpoint-root')).render(
  <React.StrictMode>
    <TrackPointStandalone />
  </React.StrictMode>,
)