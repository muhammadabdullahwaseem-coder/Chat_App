import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Load environment variables and validate required configuration
if (!process.env.MONGO_URL) {
  console.error("❌ ERROR: MONGO_URL is missing. Add it to your .env and restart the server.");
  process.exit(1);
}

const app = express();
// Enable CORS and JSON body parsing for incoming requests
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.log("❌ DB Error:", err));

// Message schema & model for storing chat messages
const messageSchema = new mongoose.Schema({
  room: String,
  author: String,
  message: String,
  time: String,
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);


// Parse allowed client origins from environment or use default
const allowedOrigins = (process.env.CLIENT_URLS || "http://localhost:5173").split(',').map(s => s.trim());

const server = http.createServer(app);

// Initialize Socket.IO server with CORS settings
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

// Handle new Socket.IO connections and register event listeners
io.on("connection", (socket) => {
  console.log(`🔌 New Connection: ${socket.id}`);

  socket.on("join_room", async (room) => {
    // Join the socket to the requested chat room and send message history
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
    try {
      const history = await Message.find({ room }).sort({ createdAt: 1 });
      socket.emit("load_messages", history);
    } catch (err) {
      console.error("Error fetching history:", err);
      socket.emit("error", { message: 'Could not load message history' });
    }
  });

  socket.on("send_message", async (data) => {
    // Validate payload
    console.log(`Received message for room: ${data?.room}`);
    if (!data || !data.room || !data.message) {
      socket.emit('error', { message: 'Invalid message payload' });
      return;
    }

    // Broadcast message to other clients in the room
    socket.to(data.room).emit("receive_message", data);

    // Persist message to DB
    try {
      const newMessage = new Message({
        room: data.room,
        author: data.author,
        message: data.message,
        time: data.time
      });
      const saved = await newMessage.save();
      console.log("Saved message to DB:", saved._id);
      socket.emit('message_saved', { _id: saved._id, createdAt: saved.createdAt });
    } catch (e) {
      console.error('DB Save failed:', e);
      socket.emit('error', { message: 'Message could not be saved' });
    }
  });

  socket.on("disconnect", () => {
    // Clean up when a client disconnects
    console.log("User Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;
// Start HTTP server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('Server is running');
});

app.get('/', (req, res) => res.send('Server is running'));
app.get('/health', (req, res) => res.json({ status: 'running' }));


// Graceful shutdown handler
const shutdown = async (signal) => {
  try {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    await mongoose.disconnect();
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('Forcing shutdown.');
      process.exit(1);
    }, 5000);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));