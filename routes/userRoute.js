import express from "express";
import isAuth from "../utils/authentication.js";
import {
  addFriend,
  friends,
  profile,
  removeFriend,
  search,
  updateProfile,
} from "../controllers/userController.js";
const router = express.Router();

router.route("/profile/:username").get(isAuth, profile);
router.route("/profile/update").put(isAuth, updateProfile);
router.route("/friends").get(isAuth, friends);
router.route("/add/:id").get(isAuth, addFriend);
router.route("/remove/:id").get(isAuth, removeFriend);
router.route("/search").post(isAuth, search);

export default router;
