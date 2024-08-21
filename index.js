const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = createServer(app);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to our chat app Websocket API");
});

const io = new Server(server, {
  path: "/socket",
  // wsEngine: ["ws", "wss"],
  transports: ["websocket", "polling"],
  cors: {
    origin:
      process.env.NODE_ENV === "production" ? false : ["http://localhost:5173"],
  },
  allowEIO3: true,
});

const port = process.env.PORT || 3020;
const f = process.env.FRONT_END_DOMAIN;
let onlineUsers = [];

io.on("connection", (socket) => {
  // ...
  console.log("New connection", socket.id);
  // console.log("Front-End Domain", f);
  // console.log("Front-End Domain", port);

  // listen to a connection
  // resend an event coming from the client
  socket.on("addNewUser", (userId) => {
    const newUser = {
      userId,
      socketId: socket.id,
    };

    const foundUserIndex = onlineUsers.findIndex(
      (user) => user.userId === userId
    );

    if (foundUserIndex !== -1) {
      onlineUsers[foundUserIndex] = newUser;
    } else {
      onlineUsers.push(newUser);
    }
    console.log("onlineUsers", onlineUsers);

    // trigger event and recieved by the client
    io.emit("getOnlineUsers", onlineUsers);
  });

  // add message
  socket.on("sendMessage", (newMessage) => {
    const user = onlineUsers.find(
      (user) => user.userId === newMessage.recipientId
    );

    if (user) {
      io.to(user.socketId).emit("getMessage", newMessage);

      if (newMessage.senderId) {
        io.to(user.socketId).emit("getNotification", {
          senderId: newMessage.senderId,
          isRead: false,
          date: new Date(),
        });
      }
    }
  });

  // if socket is disconnected the trigger the event to update the online user and send it back to the client
  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
    io.emit("getOnlineUsers", onlineUsers);
  });
});

// io.listen(port);
// io.listen(3020);
server.listen(3020, () => {
  console.log("Server start for socket");
});
