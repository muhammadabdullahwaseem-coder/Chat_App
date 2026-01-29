import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import http from 'http'

const app = express();
app.use(cors());
const server = http.createServer(app);
    app.get("/", (req, res) => {
  res.send("<h1>Server is Running Successfully! </h1>");
});
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",              
      "https://chat-app-socket-io-mj0n.onrender.com/" // ADD YOUR NEW RENDER FRONTEND LINK HERE
    ],
    methods: ["GET", "POST"],
  },
});
io.on("connection",(socket)=>{console.log(socket.id)
    socket.on("join_room",(data)=>{
        socket.join(data);
        console.log(`User ID :- ${socket.id} joined room : ${data}`)
    })


    socket.on("send_message",(data)=>{console.log("send message data ",data)
    socket.to(data.room).emit("receive_message",data)
})

    socket.on("disconnect",()=>{
        console.log("User Disconnected..",socket.id)
    })
});
// Listen on Railway's dynamic port
const PORT = process.env.PORT || 1000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
