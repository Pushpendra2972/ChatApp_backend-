import { Router } from "express";

import {
    createOrAccessChat,
    fetchChats,
    createGroupChat,
    renameGroup,
    addParticipant,
    removeParticipant,
} from "../controllers/chat.controllers.js";

import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// All chat routes are protected
router.use(verifyJWT);

// One-to-One Chat
router
    .route("/")
    .post(createOrAccessChat)
    .get(fetchChats);

// Group Chat
router.route("/group").post(createGroupChat);

router.route("/rename").patch(renameGroup);

router.route("/add").patch(addParticipant);

router.route("/remove").patch(removeParticipant);

export default router;