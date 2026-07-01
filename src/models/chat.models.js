import mongoose, { Schema } from "mongoose";

const chatSchema = new Schema(
    {
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],

        isGroupChat: {
            type: Boolean,
            default: false,
        },

        groupName: {
            type: String,
            trim: true,
        },

        groupAvatar: {
            type: String,
        },

        admin: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },

        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: "Message",
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster chat lookup
chatSchema.index({ participants: 1 });

export const Chat = mongoose.model("Chat", chatSchema);