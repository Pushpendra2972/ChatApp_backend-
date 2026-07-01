import { Server } from "socket.io";
import registerSocketEvents from "./socket.events.js";

let io;

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN,
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log(`🟢 User Connected: ${socket.id}`);

        // Register all socket events
        registerSocketEvents(socket, io);

        socket.on("disconnect", () => {
            console.log(`🔴 User Disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized");
    }

    return io;
};

export { initializeSocket, getIO };