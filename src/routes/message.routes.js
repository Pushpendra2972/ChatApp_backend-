import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
    sendMessage,
    getMessages,
    editMessage,
    deleteMessage,
    markMessageAsRead
} from "../controllers/message.controllers.js";

const router = Router();

router.use(verifyJWT);

router.route("/")
    .post(sendMessage);

router.route("/:chatId")
    .get(getMessages);

router.route("/:messageId")
    .patch(editMessage);

router.route("/:messageId")
    .delete(deleteMessage);

router.route("/:messageId/read")
    .patch(markMessageAsRead);

export default router;