const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const os = require('os');

const { extractActionItems } = require('./services/nlpService');
const Meeting = require('./models/Meeting');
const Transcript = require('./models/Transcript');
const ActionItem = require('./models/ActionItem');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ["websocket"],
  pingTimeout: 60000,
  pingInterval: 25000
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aimeeting';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('⚠️ Mock Mode Active'));

// --- IN-MEMORY MEETING STORE ---
// Format: { meetingId: { secretKey, participants: [] } }
const meetingsStore = {};
// Format: { roomId: [ { userId, userName, message, timestamp, msgId, deviceType } ] }
const messageStore = {};

/* ============================ API ============================ */
const tryDb = async (fn, fallback) => {
    try {
        if (mongoose.connection.readyState === 1) {
            return await fn();
        }
    } catch (e) {
        console.error('Database Operation Error:', e);
    }
    return fallback;
};

app.get('/api/meetings', async (req, res) => res.json(await tryDb(() => Meeting.find().sort({ createdAt: -1 }), [])));
app.post('/api/meetings', async (req, res) => {
    try {
        const { title } = req.body;
        
        // Target Requirements: 
        // 1. meetingId = Date.now().toString()
        // 2. secretKey = random 6-digit number
        const meetingId = Date.now().toString();
        const secretKey = Math.floor(100000 + Math.random() * 900000).toString();

        // Persist to DB (for history)
        const m = new Meeting({ _id: meetingId, title: title || 'New Meeting', passcode: secretKey });
        await tryDb(() => m.save(), m);

        // Store in memory for instant socket validation
        meetingsStore[meetingId] = { secretKey, participants: [] };

        console.log(`✅ Created Secure Meeting: ${meetingId} | Key: ${secretKey}`);
        res.json({ meetingId, secretKey });
    } catch (error) {
        console.error('Error creating meeting:', error);
        res.status(500).json({ error: 'Failed to create meeting' });
    }
});

app.post('/api/meetings/validate', async (req, res) => {
    const { meetingId, secretKey } = req.body;
    
    // Check memory first, then DB
    let meeting = meetingsStore[meetingId];
    if (!meeting) {
        const dbMeeting = await tryDb(() => Meeting.findById(meetingId), null);
        if (dbMeeting) {
            meeting = { secretKey: dbMeeting.passcode };
            meetingsStore[meetingId] = meeting; // Cache back to memory
        }
    }

    if (meeting) {
        if (meeting.secretKey === secretKey) {
            return res.json({ success: true, message: 'Access granted' });
        }
        return res.status(401).json({ error: 'Invalid Secret Key' });
    }
    
    res.status(404).json({ error: 'Meeting not found' });
});
app.get('/api/meetings/:id', async (req, res) => {
    const meeting = await tryDb(() => Meeting.findById(req.params.id), { _id: req.params.id, title: 'Meeting' });
    const transcripts = await tryDb(() => Transcript.find({ meetingId: req.params.id }).sort({ timestamp: 1 }), []);
    const actionItems = await tryDb(() => ActionItem.find({ meetingId: req.params.id }), []);
    res.json({ meeting, transcripts, actionItems });
});
app.get('/api/action-items', async (req, res) => res.json(await tryDb(() => ActionItem.find().sort({ createdAt: -1 }), [])));
app.put('/api/action-items/:id', async (req, res) => res.json(await tryDb(() => ActionItem.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }), { _id: req.params.id, status: req.body.status })));

/* ============================ WEBRTC SIGNALING ============================ */
const rooms = {};

io.on("connection", (socket) => {
  const userAgent = socket.handshake.headers['user-agent'] || 'Unknown Device';
  const deviceType = /Mobi|Android/i.test(userAgent) ? 'Mobile' : 'Desktop';
  console.log(`⚡ User connected: ${socket.id} | Device: ${deviceType} (${userAgent})`);

  socket.on("join-room", async ({ roomId, userName, secretKey }) => {
    // 1. Strict Validation
    let meeting = meetingsStore[roomId];
    if (!meeting) {
        const dbMeeting = await tryDb(() => Meeting.findById(roomId), null);
        if (dbMeeting) {
            meeting = { secretKey: dbMeeting.passcode, participants: [] };
            meetingsStore[roomId] = meeting; 
        }
    }

    if (!meeting || meeting.secretKey !== secretKey) {
        console.log(`🚫 Rejecting join for ${socket.id}: ${!meeting ? 'Room not found' : 'Invalid key'}`);
        socket.emit("error", { message: "Access Denied: Invalid Meeting ID or Secret Key." });
        return;
    }

    // 2. Prevent Duplicate/Ghost Connections
    // If a user with the same name already exists, we should probably clear them or at least their entry
    if (meetingsStore[roomId] && meetingsStore[roomId].participants) {
        meetingsStore[roomId].participants = meetingsStore[roomId].participants.filter(p => p.name !== userName && p.id !== socket.id);
    }
    if (rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
    }

    // 3. Successful Join
    socket.join(roomId);
    socket.roomId = roomId;
    socket.userName = userName || "Guest";

    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(socket.id);

    // Track in meeting store for UI/Management
    if (meetingsStore[roomId]) {
        if (!meetingsStore[roomId].participants) meetingsStore[roomId].participants = [];
        meetingsStore[roomId].participants.push({ id: socket.id, name: socket.userName });
    }

    // 4. Mesh Logic: Tell new user about others, and notify others
    const otherUsers = rooms[roomId].filter(id => id !== socket.id);
    socket.emit("all-users", otherUsers);

    socket.to(roomId).emit("user-joined", { 
        caller: socket.id, 
        userName: socket.userName 
    });

    console.log(`👤 ${socket.userName} [${socket.id}] joined room: ${roomId}`);
  });

  socket.on("offer", ({ target, sdp }) => {
    io.to(target).emit("offer", { sdp, caller: socket.id });
  });

  socket.on("answer", ({ target, sdp }) => {
    io.to(target).emit("answer", { sdp, caller: socket.id });
  });

  socket.on("ice-candidate", ({ target, candidate }) => {
    io.to(target).emit("ice-candidate", { candidate, from: socket.id });
  });

  /* === TRANSCRIPTIONS === */
  socket.on("send-transcript", async (data) => {
    try {
      if (mongoose.connection.readyState === 1) {
        await new Transcript({ meetingId: data.meetingId, speaker: data.speaker, text: data.text }).save();
      }
      socket.to(data.meetingId).emit("receive-transcript", data);
      const tasks = extractActionItems(data.text);
      if (tasks) {
        for (const task of tasks) {
          let saved = { ...task, meetingId: data.meetingId, _id: 'ti-' + Date.now(), createdAt: new Date() };
          if (mongoose.connection.readyState === 1) {
            saved = await new ActionItem({ meetingId: data.meetingId, task: task.task, assignee: task.assignee, deadline: task.deadline }).save();
          }
          io.to(data.meetingId).emit("new-action-item", saved);
        }
      }
    } catch (err) { console.error(err); }
  });

  socket.on("toggle-task", (payload) => {
    socket.to(payload.meetingId).emit("task-updated", payload);
  });

  /* === GROUP CHAT === */
  socket.on("send-message", (data) => {
    // Validation
    if (!data.message || typeof data.message !== 'string' || data.message.trim() === '') return;
    if (!data.roomId || !data.userId) return;

    // Verify socket is actually in the room (Security & Ghost connection check)
    if (!Array.from(socket.rooms).includes(data.roomId)) {
        console.log(`🚫 Security: Socket ${socket.id} attempted to broadcast to ${data.roomId} without membership. [Rooms: ${Array.from(socket.rooms)}]`);
        return;
    }

    const msgObj = {
      userId: data.userId,
      userName: data.userName || 'Guest',
      message: data.message.trim(),
      timestamp: new Date().toISOString(),
      msgId: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
      deviceType: data.deviceType || 'Desktop'
    };

    if (!messageStore[data.roomId]) messageStore[data.roomId] = [];
    messageStore[data.roomId].push(msgObj);

    // Memory Management: Max 100 messages per room
    if (messageStore[data.roomId].length > 100) {
      messageStore[data.roomId].shift();
    }

    // Atomic Broadcast
    io.to(data.roomId).emit("receive-message", msgObj);
  });

  socket.on("sync-chat-state", (roomId) => {
     if (messageStore[roomId]) {
         socket.emit("chat-history", messageStore[roomId]);
     }
  });

  socket.on("leave-room", (roomId) => {
      socket.leave(roomId);
      console.log(`🚪 Socket ${socket.id} explicitly left room ${roomId}`);
  });

  socket.on("disconnect", () => {
    const roomId = socket.roomId;
    if (roomId) {
      // 1. Clean up rooms list
      if (rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
        if (rooms[roomId].length === 0) delete rooms[roomId];
      }

      // 2. Clean up meetingsStore participants
      if (meetingsStore[roomId] && meetingsStore[roomId].participants) {
        meetingsStore[roomId].participants = meetingsStore[roomId].participants.filter(p => p.id !== socket.id);
      }

      // 3. Notify others
      socket.to(roomId).emit("user-left", socket.id);
    }
    console.log("👋 User disconnected:", socket.id);
  });
});

app.get(/\/.*/, (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Unified Server running on port ${PORT}`);
  
  // Log all network interfaces to help with mobile connections
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`🌍 Network Access: http://${net.address}:${PORT}`);
      }
    }
  }
});