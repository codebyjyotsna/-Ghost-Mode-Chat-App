const crypto = require("crypto");

const algorithm = "aes-256-cbc";
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

export const encryptMessage = (message) => {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(message, "utf-8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
};

export const decryptMessage = (encryptedMessage) => {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedMessage, "hex", "utf-8");
  decrypted += decipher.final("utf-8");
  return decrypted;
};
