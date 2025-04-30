import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { encryptMessage, decryptMessage } from "../utils/encryption";

const socket = io("http://localhost:5000");

const ChatRoom = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [room, setRoom] = useState("general");

  useEffect(() => {
    socket.emit("joinRoom", room);

    socket.on("receiveMessage", (message) => {
      const decryptedMessage = message.encrypted
        ? decryptMessage(message.message)
        : message.message;
      setMessages((prevMessages) => [
        ...prevMessages,
        { ...message, message: decryptedMessage },
      ]);
    });

    socket.on("deleteMessage", (messageId) => {
      setMessages((prevMessages) =>
        prevMessages.filter((message) => message._id !== messageId)
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [room]);

  const sendMessage = () => {
    const encryptedMessage = encryptMessage(input);
    socket.emit("sendMessage", {
      room,
      message: encryptedMessage,
      encrypted: true,
    });
    setInput("");
  };

  return (
    <div>
      <h2>Room: {room}</h2>
      <div>
        {messages.map((msg) => (
          <p key={msg._id}>{msg.message}</p>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default ChatRoom;
