import express from "express";
import {
  deleteAccount,
  login,
  logout,
  myself,
  register,
} from "../controllers/authController.js";
import isAuth from "../utils/authentication.js";
const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").get(isAuth, logout);
router.route("/me").get(isAuth, myself);
router.route("/delete").delete(isAuth, deleteAccount);

export default router;
