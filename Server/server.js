import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.MONGO_URL) {
  console.error("❌ ERROR: MONGO_URL is missing. Add it to your .env and restart the server.");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.log("❌ DB Error:", err));

const messageSchema = new mongoose.Schema({
  room: String,
  author: String,
  message: String,
  time: String,
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);


const allowedOrigins = (process.env.CLIENT_URLS || "http://localhost:5173").split(',').map(s => s.trim());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`🔌 New Connection: ${socket.id}`);

  socket.on("join_room", async (room) => {
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
    console.log(`Received message for room: ${data?.room}`);
    if (!data || !data.room || !data.message) {
      socket.emit('error', { message: 'Invalid message payload' });
      return;
    }

    socket.to(data.room).emit("receive_message", data);

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

  socket.on("disconnecting", async () => {
    const rooms = socket.rooms;

    for (const room of rooms) {
      if (room !== socket.id) {
        
        const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;

        if (roomSize === 1) {
          console.log(`🧹 Room "${room}" is now empty. Deleting history...`);
          
          try {
            await Message.deleteMany({ room: room });
            console.log(`🗑️ All messages deleted for room: ${room}`);
          } catch (err) {
            console.error("❌ Error clearing room history:", err);
          }
        }
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
  });
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('Server is running');
});

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
process.on('SIGTERM', () => shutdown('SIGTERM'))