const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

// --------------------
// ONLINE USERS
// username -> socket.id
// --------------------
const users = {};
const prekeys = {}; // username -> { identityKey, prekey }


// --------------------
// OFFLINE MESSAGE QUEUE
// username -> [ { from, payload } ]
// --------------------
const offlineMessages = {};

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // -------- REGISTER USER --------
  socket.on("register", (username) => {
    users[username] = socket.id;
    socket.username = username;

    console.log("Registered:", username);

    // 🔔 DELIVER OFFLINE MESSAGES
    if (offlineMessages[username]) {
      console.log(`Delivering offline messages to ${username}`);

      offlineMessages[username].forEach(msg => {
        io.to(socket.id).emit("message", msg);
      });

      delete offlineMessages[username];
    }
  });
    // -------- PUBLISH PREKEYS --------
  socket.on("publish-prekeys", ({ username, identityKey, prekey }) => {
    prekeys[username] = { identityKey, prekey };
    console.log("Prekeys stored for:", username);
  });
  
  // -------- FETCH PREKEYS (SENDER SIDE) --------
  socket.on("get-prekeys", (username, cb) => {
    console.log("Prekeys request for:", username, prekeys[username]);
    cb(prekeys[username] || null);
  });

  // -------- MESSAGE HANDLER --------
  socket.on("message", ({ from, to, payload }) => {
    const targetSocketId = users[to];

    if (targetSocketId) {
      // User online → deliver now
      io.to(targetSocketId).emit("message", { from, payload });
    } else {
      // User offline → store encrypted message
      console.log(`User offline, storing message for ${to}`);

      if (!offlineMessages[to]) {
        offlineMessages[to] = [];
      }

      offlineMessages[to].push({ from, payload });
    }
  });

  // -------- DISCONNECT --------
  socket.on("disconnect", () => {
    if (socket.username) {
      delete users[socket.username];
      console.log("Disconnected:", socket.username);
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
