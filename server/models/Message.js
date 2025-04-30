const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  room: { type: String, required: true },
  message: { type: String, required: true },
  encrypted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 10 }, // TTL index
});

module.exports = mongoose.model("Message", messageSchema);
