import React, { useState } from 'react'
import io from 'socket.io-client'
import { Chat } from './Chat'
import music from './Client_src_mixkit-tile-game-reveal-960.wav'
import abcd from  '../src/assets/abcd.mp3'

const socket = io.connect("http://localhost:1000")

const App = () => {
const socket = io.connect(import.meta.env.VITE_SERVER_URL);

const [username, setUsername] = useState("");
const [room, setRoom] = useState("");
const [showChat, setShowChat] = useState(false); 
  
const notification = new Audio(music)

const joinChat = () => {
  if (username !== "" && room !== "") {
    socket.emit("join_room", room);
    setShowChat(true)
    notification.play();
  }
};


  return (
    <>
      {!showChat && (
        <div className="join_room"  >
          <h1>Join Chat</h1>
          <input
            type="text"
            placeholder="Enter Your Name"
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="text"
            placeholder="Enter Chat Room"
            onChange={(e) => setRoom(e.target.value)}
          />
          <button onClick={joinChat}>Join</button>
        </div>
        
      )}
{
  showChat &&
  (
    <Chat socket={socket} username={username} room={room} />

  )
}
    </>
  );
}

export default App