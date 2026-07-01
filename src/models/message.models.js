import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
    {
        chat: {
            type: Schema.Types.ObjectId,
            ref: "Chat",
            required: true,
            index: true,
        },

        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        content: {
            type: String,
            trim: true,
            default: "",
        },

        attachments: [
            {
                url: {
                    type: String,
                    required: true,
                },

                public_id: {
                    type: String,
                    required: true,
                },

                type: {
                    type: String,
                    enum: ["image", "video", "audio", "file"],
                    required: true,
                },
            },
        ],

        readBy: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        isEdited: {
            type: Boolean,
            default: false,
        },

        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

export const Message = mongoose.model("Message", messageSchema);