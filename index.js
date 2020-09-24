const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

const workspaces = io.of(/^\/\w+$/);

const allSockets = {};

workspaces.on("connection", (socket) => {
  const workspace = socket.nsp;
  allSockets[socket.id] = socket;
  socket.on("broadcast", ({ eventName, data }) => {
    socket.broadcast.emit(eventName, data);
  });
  socket.on("all", ({ eventName, data }) => {
    workspace.emit(eventName, data);
  });

  socket.on("direct", ({ socketId, eventName, data }) => {
    const chosenSocket = allSockets[socketId];
    if (!chosenSocket) return;
    chosenSocket.emit(eventName, data);
  });

  socket.on("disconnect", () => {
    socket.broadcast.emit("connectionDestroyed", { socketId: socket.id });
  });

  socket.broadcast.emit("connectionCreated", { socketId: socket.id });
});

// https://socket.io/docs/namespaces/
// this middleware will be assigned to each namespace
workspaces.use((socket, next) => {
  // Random middleware used for documentation.
  // ensure the user has access to the workspace
  next();
});

io.on("connection", (socket) => {
  console.log("a user connected");
});

http.listen(3005, () => {
  console.log("listening on *:3005, realtime.songz.dev");
});
