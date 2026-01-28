import React, { useEffect, useState, useRef } from "react";
import music from "../src/assets/abcd.mp3";

export const Chat = ({ socket, username, room }) => {
  // FIXED: Standardized camelCase for 'setCurrentMessage'
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);

  const notification = new Audio(music);
  // FIXED: Renamed ref to be clearer, but 'containRef' works too
  const containRef = useRef(null);

  const sendMessage = async () => {
    if (currentMessage !== "" && currentMessage !== " ") {
      const messageData = {
        id: Math.random(),
        room: room,
        author: username,
        message: currentMessage,
        time:
          (new Date(Date.now()).getHours() % 12) +
          ":" +
          new Date(Date.now()).getMinutes(),
      };

      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage(""); // FIXED: Matches the state setter name
      notification.play();
    }
  };

  useEffect(() => {
    const handleReceiveMsg = (data) => {
      setMessageList((list) => [...list, data]);
      notification.play(); // Optional: Play sound on receive too
    };
    socket.on("receive_message", handleReceiveMsg);

    return () => {
      socket.off("receive_message", handleReceiveMsg);
    };
  }, [socket]);

  // FIXED: Added safety check to prevent crash if ref is null
  useEffect(() => {
    if (containRef.current) {
      containRef.current.scrollTop = containRef.current.scrollHeight;
    }
  }, [messageList]);

  return (
    <div className="chat_container">
      <div className="chat_box">
        
        {/* FIXED: Added ref={containRef} here so scrolling works */}
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