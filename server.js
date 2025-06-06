const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const socketio = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(express.static('.'));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/progress', require('./routes/progress'));

// KitComm - real-time chat (simple, can expand as needed)
const channels = {}; // { channel: [msg, msg, ...] }

io.on('connection', socket => {
  socket.on('join', channel => {
    socket.join(channel);
    if (channels[channel]) {
      socket.emit('history', channels[channel]);
    }
  });
  
  socket.on('message', data => {
    if (!channels[data.channel]) channels[data.channel] = [];
    channels[data.channel].push(data);
    io.to(data.channel).emit('message', data);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));