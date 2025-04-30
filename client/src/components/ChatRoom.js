import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { encryptMessage, decryptMessage } from "../utils/encryption";

const socket = io("http://localhost:5000");

const ChatRoom = () => {
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [room, setRoom] = useState("general");
  const [typingUsers, setTypingUsers] = useState([]);
  const [file, setFile] = useState(null);

  useEffect(() => {
    // Assign username
    socket.on("assignUsername", (generatedUsername) => {
      setUsername(generatedUsername);
    });

    // Join room
    socket.emit("joinRoom", room);

    // Receive messages
    socket.on("receiveMessage", (message) => {
      const decryptedMessage = message.encrypted
        ? decryptMessage(message.message)
        : message.message;
      setMessages((prevMessages) => [
        ...prevMessages,
        { ...message, message: decryptedMessage },
      ]);
    });

    // Delete messages
    socket.on("deleteMessage", (messageId) => {
      setMessages((prevMessages) =>
        prevMessages.filter((message) => message._id !== messageId)
      );
    });

    // Typing indicator
    socket.on("userTyping", (user) => {
      setTypingUsers((prev) => [...new Set([...prev, user])]);
    });

    socket.on("userStoppedTyping", (user) => {
      setTypingUsers((prev) => prev.filter((u) => u !== user));
    });

    // File sharing
    socket.on("receiveFile", ({ file, fileName, sender }) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { message: `${sender} sent a file:`, file, fileName },
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, [room]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const encryptedMessage = encryptMessage(input);
    socket.emit("sendMessage", {
      room,
      message: encryptedMessage,
      encrypted: true,
    });
    setInput("");
  };

  const handleTyping = () => {
    socket.emit("typing", room);
  };

  const handleStopTyping = () => {
    socket.emit("stopTyping", room);
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setFile(reader.result);
      socket.emit("sendFile", {
        room,
        file: reader.result,
        fileName: uploadedFile.name,
      });
    };
    reader.readAsDataURL(uploadedFile);
  };

  return (
    <div>
      <h2>Room: {room}</h2>
      <h3>Username: {username}</h3>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <p>{msg.message}</p>
            {msg.file && (
              <a href={msg.file} download={msg.fileName}>
                Download {msg.fileName}
              </a>
            )}
          </div>
        ))}
      </div>
      {typingUsers.length > 0 && (
        <p>{typingUsers.join(", ")} is typing...</p>
      )}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={handleTyping}
        onBlur={handleStopTyping}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage}>Send</button>
      <input type="file" onChange={handleFileUpload} />
    </div>
  );
};

export default ChatRoom;
