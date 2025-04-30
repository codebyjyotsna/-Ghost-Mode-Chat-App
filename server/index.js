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

// WebSocket setup
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Join a room
  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
  });

  // Handle incoming messages
  socket.on("sendMessage", async ({ room, message, encrypted }) => {
    const newMessage = await Message.create({ room, message, encrypted });
    io.to(room).emit("receiveMessage", newMessage);

    // Self-destruct message after 10 seconds
    setTimeout(async () => {
      await Message.findByIdAndDelete(newMessage._id);
      io.to(room).emit("deleteMessage", newMessage._id);
    }, 10000);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
