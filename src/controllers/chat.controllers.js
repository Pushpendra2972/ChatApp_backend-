import { Chat } from "../models/chat.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createOrAccessChat = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    if (userId === req.user._id.toString()) {
        throw new ApiError(400, "You cannot create a chat with yourself");
    }

    const receiver = await User.findById(userId);

    if (!receiver) {
        throw new ApiError(404, "User not found");
    }

    // Check if one-to-one chat already exists
    let chat = await Chat.findOne({
        isGroupChat: false,
        participants: {
            $all: [req.user._id, userId],
        },
    })
        .populate("participants", "-password -refreshToken")
        .populate({
            path: "lastMessage",
            populate: {
                path: "sender",
                select: "fullName username avatar",
            },
        });

    if (chat) {
        return res.status(200).json(
            new ApiResponse(
                200,
                chat,
                "Chat fetched successfully"
            )
        );
    }

    // Create new chat
    chat = await Chat.create({
        participants: [req.user._id, userId],
    });

    chat = await Chat.findById(chat._id)
        .populate("participants", "-password -refreshToken");

    return res.status(201).json(
        new ApiResponse(
            201,
            chat,
            "Chat created successfully"
        )
    );
});

const fetchChats = asyncHandler(async (req, res) => {
    const chats = await Chat.find({
        participants: req.user._id,
    })
        .populate(
            "participants",
            "-password -refreshToken"
        )
        .populate(
            "admin",
            "-password -refreshToken"
        )
        .populate({
            path: "lastMessage",
            populate: {
                path: "sender",
                select: "fullName username avatar",
            },
        })
        .sort({ updatedAt: -1 });

    return res.status(200).json(
        new ApiResponse(
            200,
            chats,
            "Chats fetched successfully"
        )
    );
});

const createGroupChat = asyncHandler(async (req, res) => {
    const { groupName, participants } = req.body;

    if (!groupName) {
        throw new ApiError(400, "Group name is required");
    }

    if (!participants || !Array.isArray(participants)) {
        throw new ApiError(400, "Participants must be an array");
    }

    if (participants.length < 2) {
        throw new ApiError(
            400,
            "A group chat must have at least 3 members including you"
        );
    }

    // Remove duplicate users
    const uniqueParticipants = [...new Set(participants)];

    // Add current user if not already present
    if (!uniqueParticipants.includes(req.user._id.toString())) {
        uniqueParticipants.push(req.user._id);
    }

    const groupChat = await Chat.create({
        isGroupChat: true,
        groupName: groupName.trim(),
        participants: uniqueParticipants,
        admin: req.user._id,
    });

    const chat = await Chat.findById(groupChat._id)
        .populate("participants", "-password -refreshToken")
        .populate("admin", "-password -refreshToken");

    return res.status(201).json(
        new ApiResponse(
            201,
            chat,
            "Group chat created successfully"
        )
    );
});

const renameGroup = asyncHandler(async (req, res) => {
    const { chatId, groupName } = req.body;

    if (!chatId || !groupName) {
        throw new ApiError(400, "Chat ID and group name are required");
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    if (!chat.isGroupChat) {
        throw new ApiError(400, "This is not a group chat");
    }

    if (chat.admin.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only group admin can rename the group");
    }

    chat.groupName = groupName.trim();

    await chat.save();

    const updatedChat = await Chat.findById(chat._id)
        .populate("participants", "-password -refreshToken")
        .populate("admin", "-password -refreshToken")
        .populate({
            path: "lastMessage",
            populate: {
                path: "sender",
                select: "fullName username avatar",
            },
        });

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedChat,
            "Group renamed successfully"
        )
    );
});

const addParticipant = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.body;

    if (!chatId || !userId) {
        throw new ApiError(400, "Chat ID and User ID are required");
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    if (!chat.isGroupChat) {
        throw new ApiError(400, "This is not a group chat");
    }

    if (chat.admin.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only group admin can add participants");
    }

    if (chat.participants.includes(userId)) {
        throw new ApiError(400, "User is already a participant");
    }

    chat.participants.push(userId);

    await chat.save();

    const updatedChat = await Chat.findById(chat._id)
        .populate("participants", "-password -refreshToken")
        .populate("admin", "-password -refreshToken")
        .populate({
            path: "lastMessage",
            populate: {
                path: "sender",
                select: "fullName username avatar",
            },
        });

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedChat,
            "Participant added successfully"
        )
    );
});

const removeParticipant = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.body;

    if (!chatId || !userId) {
        throw new ApiError(400, "Chat ID and User ID are required");
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    if (!chat.isGroupChat) {
        throw new ApiError(400, "This is not a group chat");
    }

    const isAdmin = chat.admin.toString() === req.user._id.toString();
    const isSelf = userId === req.user._id.toString();

    // Non-admin can only remove themselves
    if (!isAdmin && !isSelf) {
        throw new ApiError(
            403,
            "Only the admin can remove other participants"
        );
    }

    if (!chat.participants.some(id => id.toString() === userId)) {
        throw new ApiError(404, "Participant not found in this group");
    }

    chat.participants = chat.participants.filter(
        participant => participant.toString() !== userId
    );

    // If admin leaves, assign a new admin
    if (isSelf && isAdmin && chat.participants.length > 0) {
        chat.admin = chat.participants[0];
    }

    await chat.save();

    const updatedChat = await Chat.findById(chat._id)
        .populate("participants", "-password -refreshToken")
        .populate("admin", "-password -refreshToken")
        .populate({
            path: "lastMessage",
            populate: {
                path: "sender",
                select: "fullName username avatar",
            },
        });

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedChat,
            isSelf
                ? "You left the group successfully"
                : "Participant removed successfully"
        )
    );
});

export { createOrAccessChat,
         fetchChats,
         createGroupChat,
         renameGroup,
         addParticipant,
         removeParticipant
};