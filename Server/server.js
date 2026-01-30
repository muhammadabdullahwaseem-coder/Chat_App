import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import mongoose from 'mongoose'; // 1. Import Mongoose
import dotenv from 'dotenv'; 

dotenv.config(); // Load .env file

const app = express();
app.use(cors());
app.use(express.json());

// 2. CONNECT TO MONGODB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

// 3. DEFINE A MESSAGE SCHEMA
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

  // join a chat room & LOAD HISTORY
  socket.on("join_room", async (room) => {
    socket.join(room);
    console.log(`User ID: ${socket.id} joined room: ${room}`);

    // Operation 1: READ (Fetch History)
    try {
      // Find messages for this specific room
      const history = await Message.find({ room: room });
      
      // Emit an event ONLY to the user who just joined
      socket.emit("load_messages", history); 
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  });

  // relay messages & SAVE TO DB
  socket.on("send_message", async (data) => {
    console.log("send message data", data);
    
    // Operation 2: CREATE (Save Message)
    const newMessage = new Message({
      room: data.room,
      author: data.author,
      message: data.message,
      time: data.time
    });

    await newMessage.save(); // Save to MongoDB

    // Send to everyone else in the room
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 1000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));