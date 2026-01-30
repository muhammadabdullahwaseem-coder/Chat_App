import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- DEBUGGER: Check if .env is loaded ---
console.log("---------------------------------------------------");
console.log("🔍 Checking Environment Variables...");
if (!process.env.MONGO_URL) {
  console.error("❌ ERROR: MONGO_URL is missing or undefined.");
  console.error("   1. Do you have a file named .env in the root folder?");
  console.error("   2. Does it contain: MONGO_URL=your_string_here?");
} else {
  console.log("✅ MONGO_URL found. Attempting to connect...");
}
console.log("---------------------------------------------------");
// -----------------------------------------

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ Connected to MongoDB Successfully"))
  .catch((err) => console.error("❌ Could not connect to MongoDB:", err));

const messageSchema = new mongoose.Schema({
  room: String,
  author: String,
  message: String,
  time: String,
});

const Message = mongoose.model("Message", messageSchema);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://chat-app-socket-io-mj0n.onrender.com"
    ],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log('New socket connected:', socket.id);

  socket.on("join_room", async (room) => {
    socket.join(room);
    console.log(`User ID: ${socket.id} joined room: ${room}`);
    try {
      const history = await Message.find({ room: room });
      socket.emit("load_messages", history);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  });

  socket.on("send_message", async (data) => {
    const newMessage = new Message({
      room: data.room,
      author: data.author,
      message: data.message,
      time: data.time
    });
    await newMessage.save();
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));