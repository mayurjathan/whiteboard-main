const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/whiteboard", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Connected to MongoDB");
}).catch((err) => {
  console.error("MongoDB connection error:", err);
});

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

// Drawing Schema
const drawingSchema = new mongoose.Schema({
  username: String,
  drawingData: Object,
  createdAt: { type: Date, default: Date.now }
});

const Drawing = mongoose.model("Drawing", drawingSchema);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register endpoint
app.post("/api/register", async (req, res) => {
  try {
    console.log("Register request received:", req.body);
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Username and password are required" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log("Username already exists:", username);
      return res.status(400).json({ 
        success: false, 
        message: "Username already exists" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password hashed successfully");

    // Create new user
    const user = new User({
      username,
      password: hashedPassword
    });
    await user.save();
    console.log("User saved successfully:", username);

    res.json({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to register user" 
    });
  }
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  try {
    console.log("Login request received:", req.body);
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Username and password are required" 
      });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      console.log("User not found:", username);
      return res.status(400).json({ 
        success: false, 
        message: "Invalid username or password" 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("Invalid password for user:", username);
      return res.status(400).json({ 
        success: false, 
        message: "Invalid username or password" 
      });
    }

    console.log("Login successful for user:", username);
    res.json({ success: true, message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to login" 
    });
  }
});

// Save drawing endpoint
app.post("/api/save-drawing", async (req, res) => {
  try {
    const { username, drawingData } = req.body;
    const drawing = new Drawing({
      username,
      drawingData
    });
    await drawing.save();
    res.json({ success: true, message: "Drawing saved successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Load drawings endpoint
app.get("/api/load-drawings/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const drawings = await Drawing.find({ username })
      .sort({ createdAt: -1 })
      .select('drawingData createdAt');
    res.json({ success: true, drawings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

  // Initialize user list for new connection
  socket.emit("userList", users);

  // Listen for the user to send their username
  socket.on("setUsername", (username) => {
    // Remove any existing user with the same socket ID
    const existingUserIndex = users.findIndex(user => user.userID === socket.id);
    if (existingUserIndex !== -1) {
      users.splice(existingUserIndex, 1);
    }

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

    // Send the updated list of connected users to all clients
    io.emit("userList", users);
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
      
      // Update all remaining users with the new user list
      io.emit("userList", users);
    }
  });
});

server.listen(3001, () => {
  logToFile("WebSocket server running on port 3001");
  console.log("WebSocket server running on port 3001");
});
