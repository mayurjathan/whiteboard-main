const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }, // Allow all origins (adjust in production)
});

const users = [];

// Log file setup
const logFilePath = path.join(__dirname, "session.log");

// Function to write logs to the file
const logToFile = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  // Append the log message to the file
  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error("Failed to write to log file:", err);
    }
  });
};

// Function to periodically delete the log file
const deleteLogFile = () => {
  fs.unlink(logFilePath, (err) => {
    if (err) {
      console.error("Failed to delete log file:", err);
    } else {
      console.log("Log file deleted successfully.");
    }
  });
};

// Schedule log file deletion every 24 hours (86400000 milliseconds)
setInterval(deleteLogFile, 1000000);

io.on("connection", (socket) => {
  logToFile(`A user connected: ${socket.id}`);
  console.log("A user connected:", socket.id);

  // Listen for the user to send their username
  socket.on("setUsername", (username) => {
    // Add the user to the list
    const newUser = {
      userID: socket.id,
      username: username,
    };
    users.push(newUser);

    logToFile(`User ${username} (${socket.id}) joined the session.`);
    console.log(`User ${username} (${socket.id}) joined the session.`);

    // Notify the user that they have successfully joined
    socket.emit("userConnected", {
      userID: socket.id,
      username: username,
    });

    // Notify all other users about the new user
    socket.broadcast.emit("userJoined", {
      userID: socket.id,
      username: username,
    });

    // Send the list of connected users to the new user
    socket.emit("userList", users);
  });

  // Listen for the "draw" event
  socket.on("draw", (data) => {
    logToFile(`Drawing from user: ${socket.id}`);
    console.log("Drawing from user:", socket.id);
    socket.broadcast.emit("draw", data); // Broadcast to all other clients
  });

  // Listen for the "clear" event
  socket.on("clear", (data) => {
    logToFile(`Clearing canvas from user: ${socket.id}`);
    console.log("Clearing canvas from user:", socket.id);
    socket.broadcast.emit("clear", data); // Broadcast to all other clients
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    logToFile(`User disconnected: ${socket.id}`);
    console.log("User disconnected:", socket.id);

    // Remove the user from the list
    const index = users.findIndex((user) => user.userID === socket.id);
    if (index !== -1) {
      const disconnectedUser = users.splice(index, 1)[0];
      logToFile(
        `User ${disconnectedUser.username} (${socket.id}) left the session.`
      );
      console.log(
        `User ${disconnectedUser.username} (${socket.id}) left the session.`
      );

      // Notify all other users about the disconnection
      io.emit("userLeft", {
        userID: socket.id,
        username: disconnectedUser.username,
      });
    }
  });
});

server.listen(3001, () => {
  logToFile("WebSocket server running on port 3001");
  console.log("WebSocket server running on port 3001");
});
