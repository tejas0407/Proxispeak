require('dotenv').config();

const path = require('path');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const Room = require('./models/Room');

const PORT = Number(process.env.PORT || 3000);
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/proxispeak';
const WIDTH = 1200;
const HEIGHT = 800;
const COLORS = ['#8ef0c8', '#ffb18c', '#b7a1ff', '#f2d36b', '#79d8f2', '#ff8ead'];
const activeRooms = new Map();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  maxHttpBufferSize: 1e6,
  pingTimeout: 20000,
  pingInterval: 25000
});

app.use(express.json({ limit: '32kb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ProxiSpeak room server', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.get('/api/rooms', async (req, res, next) => {
  try {
    const rooms = await Room.find().sort({ createdAt: -1 }).limit(100).lean();
    res.json(rooms.map((room) => ({
      _id: String(room._id),
      name: room.name,
      radius: room.radius,
      online: activeRooms.get(String(room._id))?.size || 0
    })));
  } catch (error) {
    next(error);
  }
});

app.post('/api/rooms', async (req, res, next) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const radius = body.radius === undefined ? 250 : Number(body.radius);
    if (!name || name.length > 40) {
      return res.status(400).json({ error: 'Room name is required and must be at most 40 characters.' });
    }
    if (!Number.isFinite(radius) || radius < 80 || radius > 600) {
      return res.status(400).json({ error: 'Room radius must be between 80 and 600 virtual units.' });
    }
    const room = await Room.create({ name, radius });
    res.status(201).json({ _id: String(room._id), name: room.name, radius: room.radius, online: 0 });
  } catch (error) {
    next(error);
  }
});

app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found.' }));

const clientBuild = path.resolve(__dirname, '..', 'dist');
app.use(express.static(clientBuild));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/socket.io')) return next();
  res.sendFile(path.join(clientBuild, 'index.html'), (error) => error && next(error));
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: 'Internal server error.' });
});

function roomMembers(roomId) {
  const members = activeRooms.get(roomId);
  return members ? Array.from(members.values()) : [];
}

function broadcastState(roomId) {
  io.to(roomId).emit('state', roomMembers(roomId));
}

function removeFromRoom(socket) {
  const roomId = socket.data.roomId;
  if (!roomId) return;
  const members = activeRooms.get(roomId);
  if (members) {
    members.delete(socket.id);
    if (members.size === 0) activeRooms.delete(roomId);
  }
  socket.leave(roomId);
  socket.data.roomId = null;
  broadcastState(roomId);
}

io.on('connection', (socket) => {
  socket.on('join', async (payload = {}, acknowledge) => {
    const reply = typeof acknowledge === 'function' ? acknowledge : () => {};
    try {
      const roomId = typeof payload.roomId === 'string' ? payload.roomId : '';
      const name = typeof payload.name === 'string' ? payload.name.trim().slice(0, 20) : '';
      if (!name) return reply({ error: 'Enter a name before joining.' });
      if (!mongoose.isValidObjectId(roomId)) return reply({ error: 'That room could not be found.' });

      const room = await Room.findById(roomId).lean();
      if (!room) return reply({ error: 'That room could not be found.' });

      removeFromRoom(socket);
      const id = String(room._id);
      if (!activeRooms.has(id)) activeRooms.set(id, new Map());
      const members = activeRooms.get(id);
      const member = {
        id: socket.id,
        name,
        x: Math.round(WIDTH / 2 + (Math.random() - 0.5) * 100),
        y: Math.round(HEIGHT / 2 + (Math.random() - 0.5) * 100),
        color: COLORS[members.size % COLORS.length]
      };

      socket.data.roomId = id;
      await socket.join(id);
      members.set(socket.id, member);
      reply({ id: socket.id, room: room.name, radius: room.radius, w: WIDTH, h: HEIGHT, color: member.color });
      broadcastState(id);
    } catch (error) {
      console.error('Room join failed:', error.message);
      reply({ error: 'Unable to join the room right now.' });
    }
  });

  socket.on('move', (position = {}) => {
    const roomId = socket.data.roomId;
    const member = roomId && activeRooms.get(roomId)?.get(socket.id);
    const x = Number(position.x);
    const y = Number(position.y);
    if (!member || !Number.isFinite(x) || !Number.isFinite(y)) return;
    member.x = Math.max(0, Math.min(WIDTH, x));
    member.y = Math.max(0, Math.min(HEIGHT, y));
    broadcastState(roomId);
  });

  socket.on('sig', (message = {}) => {
    const roomId = socket.data.roomId;
    const targetId = typeof message.to === 'string' ? message.to : '';
    const data = message.data;
    const target = io.sockets.sockets.get(targetId);
    if (!roomId || !target || target.data.roomId !== roomId || !data || typeof data !== 'object') return;
    if (!data.sdp && !data.ice) return;
    target.emit('sig', { from: socket.id, data });
  });

  socket.on('disconnect', () => removeFromRoom(socket));
});

async function start() {
  await mongoose.connect(MONGO_URI);
  httpServer.listen(PORT, () => {
    console.log('ProxiSpeak room server listening on port ' + PORT);
  });
}

start().catch((error) => {
  console.error('Could not start ProxiSpeak room server:', error.message);
  process.exitCode = 1;
});
