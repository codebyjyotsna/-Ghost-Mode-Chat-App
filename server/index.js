const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/ghost-chat", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Store chatroom creation timestamps for expiration
const chatrooms = {};

// Generate random usernames
const generateRandomUsername = () => {
  const adjectives = ["Silent", "Quick", "Mysterious", "Shadow", "Ghostly"];
  const nouns = ["Fox", "Wolf", "Panther", "Raven", "Specter"];
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${randomAdjective}${randomNoun}${Math.floor(Math.random() * 1000)}`;
};

// WebSocket setup
io.on("connection", (socket) => {
  const username = generateRandomUsername();
  socket.emit("assignUsername", username); // Send username to client
  console.log(`User connected: ${username}`);

  // Join a room
  socket.on("joinRoom", (room) => {
    chatrooms[room] = chatrooms[room] || Date.now(); // Record room creation time
    socket.join(room);
    console.log(`User ${username} joined room: ${room}`);
  });

  // Handle incoming messages
  socket.on("sendMessage", async ({ room, message, encrypted }) => {
    const newMessage = await Message.create({ room, message, encrypted });
    io.to(room).emit("receiveMessage", {
      ...newMessage.toObject(),
      sender: username,
    });

    // Self-destruct message after 10 seconds
    setTimeout(async () => {
      await Message.findByIdAndDelete(newMessage._id);
      io.to(room).emit("deleteMessage", newMessage._id);
    }, 10000);
  });

  // Typing indicator
  socket.on("typing", (room) => {
    socket.to(room).emit("userTyping", username);
  });

  socket.on("stopTyping", (room) => {
    socket.to(room).emit("userStoppedTyping", username);
  });

  // File sharing
  socket.on("sendFile", ({ room, file, fileName }) => {
    io.to(room).emit("receiveFile", { file, fileName, sender: username });
  });

  // Periodically check and delete expired chatrooms
  setInterval(() => {
    const now = Date.now();
    for (const room in chatrooms) {
      if (now - chatrooms[room] > 3600000) {
        io.in(room).socketsLeave(room); // Disconnect users
        delete chatrooms[room];
        console.log(`Room ${room} deleted due to expiration.`);
      }
    }
  }, 60000);

  // Disconnect user
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${username}`);
  });
});

// Start server
server.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
