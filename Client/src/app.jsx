import React, { useState, useRef, useEffect } from 'react'
import io from 'socket.io-client'
import { Chat } from './Chat'
import music from './Client_src_mixkit-tile-game-reveal-960.wav'


const backendUrl = import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_API_URL || "http://localhost:3001";
const App = () => {
  const socketRef = useRef(null);

const [username, setUsername] = useState("");
const [room, setRoom] = useState("");
const [showChat, setShowChat] = useState(false); 
  
const notification = new Audio(music)

const joinChat = () => {
  if (username !== "" && room !== "") {
    if (!socketRef.current) {
      socketRef.current = io(backendUrl);
    }
    socketRef.current.emit("join_room", room);
    setShowChat(true)
    notification.play();
  }
};

useEffect(() => {
  return () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };
}, []);

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
    <Chat socket={socketRef.current} username={username} room={room} />

  )
}
    </>
  );
}

export default App