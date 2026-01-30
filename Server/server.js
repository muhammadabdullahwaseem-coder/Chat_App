// server.js - Express + Socket.io chat server
import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import http from 'http'

const app = express(); // Express app
const server = http.createServer(app); // HTTP server for Socket.io integration
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "PUT"],
  },
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log('New socket connected:', socket.id)

  // join a chat room
  socket.on("join_room", (room) => {
    socket.join(room);
    console.log(`User ID: ${socket.id} joined room: ${room}`)
  })

  // relay messages to room
  socket.on("send_message", (data) => {
    console.log("send message data", data)
    socket.to(data.room).emit("receive_message", data)
  })

  // handle disconnect
  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id)
  })
});

// middleware
app.use(cors());

// start server
server.listen(1000, () => console.log("Server is running on port 1000"));