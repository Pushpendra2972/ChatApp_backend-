import { Chat } from "../models/chat.models.js";
import { User } from "../models/user.models.js";
import { Message } from "../models/message.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getIO } from "../socket/socket.js";


const sendMessage = asyncHandler(async (req, res) => {
    const { chatId, content, attachments = [] } = req.body;

    if (!chatId) {
        throw new ApiError(400, "Chat ID is required");
    }

    if (
        !content?.trim() &&
        (!Array.isArray(attachments) || attachments.length === 0)
    ) {
        throw new ApiError(
            400,
            "Message must contain text or at least one attachment"
        );
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    // Verify user is a participant
    const isParticipant = chat.participants.some(
        (participant) => participant.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
        throw new ApiError(
            403,
            "You are not a participant of this chat"
        );
    }

    let message = await Message.create({
        sender: req.user._id,
        chat: chatId,
        content: content?.trim() || "",
        attachments,
        readBy: [req.user._id],
    });

    message = await Message.findById(message._id)
        .populate(
            "sender",
            "fullName username avatar"
        )
        .populate({
            path: "chat",
            populate: [
                {
                    path: "participants",
                    select: "fullName username avatar email",
                },
                {
                    path: "admin",
                    select: "fullName username avatar",
                },
            ],
        });

    await Chat.findByIdAndUpdate(
        chatId,
        {
            lastMessage: message._id,
        },
        {
            new: true,
        }
    );

    // socket-use
    const io = getIO();

    message.chat.participants.forEach((participant) => {
        if (
            participant._id.toString() ===
            message.sender._id.toString()
        ) {
            return;
        }
    
        io.to(participant._id.toString()).emit(
            "message-received",
            message
        );
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            message,
            "Message sent successfully"
        )
    );
});

const getMessages = asyncHandler(async (req, res) => {
    const { chatId } = req.params;

    if (!chatId) {
        throw new ApiError(400, "Chat ID is required");
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    // Verify user is a participant
    const isParticipant = chat.participants.some(
        participant => participant.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
        throw new ApiError(
            403,
            "You are not a participant of this chat"
        );
    }

    const messages = await Message.find({
        chat: chatId,
    })
        .populate(
            "sender",
            "fullName username avatar"
        )
        .sort({ createdAt: 1 });

    return res.status(200).json(
        new ApiResponse(
            200,
            messages,
            "Messages fetched successfully"
        )
    );
});

const editMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
        throw new ApiError(400, "Message content is required");
    }

    const message = await Message.findById(messageId);

    if (!message) {
        throw new ApiError(404, "Message not found");
    }

    if (message.sender.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only edit your own messages");
    }

    if (message.isDeleted) {
        throw new ApiError(400, "Deleted message cannot be edited");
    }

    message.content = content.trim();
    message.isEdited = true;

    await message.save();

    const updatedMessage = await Message.findById(message._id)
        .populate("sender", "fullName username avatar");

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedMessage,
            "Message edited successfully"
        )
    );
});

const deleteMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
        throw new ApiError(404, "Message not found");
    }

    if (message.sender.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own messages");
    }

    if (message.isDeleted) {
       throw new ApiError(400, "Message already deleted");
    }

    message.content = "";
    message.attachments = [];
    message.isDeleted = true;

    await message.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Message deleted successfully"
        )
    );
});

const markMessageAsRead = asyncHandler(async (req, res) => {
    const { messageId } = req.params;

    const message = await Message.findById(messageId).populate("chat");

    if (!message) {
        throw new ApiError(404, "Message not found");
    }
    
    const isParticipant = message.chat.participants.some(
        (participant) => participant.toString() === req.user._id.toString()
    );
    
    if (!isParticipant) {
        throw new ApiError(403, "You are not a participant of this chat");
    }
    
    if (!message.readBy.includes(req.user._id)) {
        message.readBy.push(req.user._id);
        await message.save();
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            message,
            "Message marked as read"
        )
    );
});


export { sendMessage,
         getMessages,
         editMessage,
         deleteMessage,
         markMessageAsRead
};