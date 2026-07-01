const registerSocketEvents = (socket, io) => {
    console.log(`🟢 Socket Connected: ${socket.id}`);

    // ==============================
    // User Setup (Personal Room)
    // ==============================
    socket.on("setup", (userId) => {
        socket.join(userId);

        console.log(`User ${userId} joined personal room`);

        socket.emit("connected");
    });

    // ==============================
    // Join Chat Room
    // ==============================
    socket.on("join-chat", (chatId) => {
        socket.join(chatId);

        console.log(`${socket.id} joined chat ${chatId}`);
    });

    // ==============================
    // Leave Chat Room
    // ==============================
    socket.on("leave-chat", (chatId) => {
        socket.leave(chatId);

        console.log(`${socket.id} left chat ${chatId}`);
    });

    // ==============================
    // Typing
    // ==============================
    socket.on("typing", (chatId) => {
        socket.to(chatId).emit("typing");
    });

    // ==============================
    // Stop Typing
    // ==============================
    socket.on("stop-typing", (chatId) => {
        socket.to(chatId).emit("stop-typing");
    });

    // ==============================
    // New Message
    // ==============================
    socket.on("new-message", (message) => {
        const chat = message.chat;

        if (!chat?.participants) return;

        chat.participants.forEach((participant) => {
            if (participant._id.toString() === message.sender._id.toString()) {
                return;
            }

            io.to(participant._id.toString()).emit(
                "message-received",
                message
            );
        });
    });

    // ==============================
    // Disconnect
    // ==============================
    socket.on("disconnect", () => {
        console.log(`🔴 Socket Disconnected: ${socket.id}`);
    });
};

export default registerSocketEvents;