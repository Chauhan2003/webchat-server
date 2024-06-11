import express from "express";
import isAuth from "../utils/authentication.js";
import { create, messages } from "../controllers/messageController.js";
const router = express.Router();

router.route("/create/:id").post(isAuth, create);
router.route("/:id").get(isAuth, messages);

export default router;
