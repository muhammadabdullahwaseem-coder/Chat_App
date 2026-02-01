import React, { useEffect, useState, useRef } from "react";
import music from './assets/abcd.mp3';
import notificationSound from './notification.mp3';

export const Chat = ({ socket, username, room }) => {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const notification = new Audio(music);
  const containRef = useRef(null);
  const sendMessage = () => {
    if (currentMessage !== "" && currentMessage !== " ") {
      const messageData = {
        id: Math.random(),
        room: room,
        author: username,
        message: currentMessage,
        time: (() => {
          const d = new Date();
          const hours = d.getHours();
          const minutes = d.getMinutes().toString().padStart(2, '0');
          const hrs12 = hours % 12 === 0 ? 12 : hours % 12;
          const ampm = hours >= 12 ? 'PM' : 'AM';
          return `${hrs12}:${minutes} ${ampm}`;
        })(),
      };
      if (socket) {
        socket.emit("send_message", messageData);
      }
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
      notification.play();
    }
  };
  useEffect(() => {
    const receiveMessageHandler = (data) => {
      setMessageList((list) => [...list, data]);
      new Audio(notificationSound).play().catch(err => console.log("Audio play failed:", err));
    };
    const loadMessagesHandler = (history) => {
      setMessageList(history); 
    };
    socket.on("receive_message", receiveMessageHandler);
    socket.on("load_messages", loadMessagesHandler);
    return () => {
      socket.off("receive_message", receiveMessageHandler);
      socket.off("load_messages", loadMessagesHandler);
    };
  }, [socket]);
  useEffect(() => {
    if (containRef.current) {
      containRef.current.scrollTop = containRef.current.scrollHeight;
    }
  }, [messageList]);
  return (
    <div className="chat_container">
      <div className="chat_box">
        <div className="chat_body_scroll" ref={containRef}>
          {messageList.map((messageContent, index) => {
            return (
              <div
                className="message_content"
                id={username === messageContent.author ? "you" : "other"}
                key={index}
              >
                <div className="message_bubble">
                  <p>{messageContent.message}</p>
                  <div className="msg_detail">
                    <p id="time">{messageContent.time}</p>
                    <p id="author">{messageContent.author}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="chat_footer">
          <input
            type="text"
            value={currentMessage}
            placeholder="Type a message..."
            onChange={(event) => {
              setCurrentMessage(event.target.value);
            }}
            onKeyPress={(event) => {
              event.key === "Enter" && sendMessage();
            }}
          />
          <button onClick={sendMessage}>
  <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
  </svg>
</button>
        </div>
      </div>
    </div>
  );
};

export default Chat;