const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const httpServer = http.createServer(app);
const socketServer = new Server(httpServer);

app.use(express.static(__dirname + '/public'));

httpServer.listen(8080, () => {
    console.log(`Server is running on port 8080`);
});

const users = {};

socketServer.on("connection", (socket) => {
    console.log("New socket connection established.");

    socket.on("joinroom", (username, room) => {
        if (!isValidInput(username) || !isValidInput(room)) {
            return socket.emit("error", "Invalid username or room name.");
        }
        socket.join(room);
        users[socket.id] = { username, room };
        socket.emit("roomjoined", room);
        socket.broadcast.to(room).emit("userjoined", username);
        console.log(username + " joined room " + room);
    });

    socket.on("leaveroom", () => {
        const { username, room } = users[socket.id];
        if (!isValidInput(username) || !isValidInput(room)) {
            return socket.emit("error", "Invalid username or room name.");
        }
        socket.leave(room);
        delete users[socket.id];
        socket.broadcast.to(room).emit("userleft", username);
        console.log(username + " left room " + room);
    });

    socket.on("message", (message) => {
        const { username, room } = users[socket.id];
        if (!isValidInput(username) || !isValidInput(room) || !isValidInput(message)) {
            return socket.emit("error", "Invalid message.");
        }
        socket.broadcast.to(room).emit("message", { username, message });
        console.log(username + " in room " + room + ": " + message);
    });

    socket.on("disconnect", () => {
        const { username, room } = users[socket.id];
        if (username && room) {
            delete users[socket.id];
            socket.broadcast.to(room).emit("userleft", username);
            console.log(username + " disconnected from room " + room);
        }
    });
});

function isValidInput(input) {
    return typeof input === "string" && input.trim().length > 0;
}