import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";
import morgan from "morgan";
import { app, server } from "./config/socket.js"; // Adjust the path as needed
import dbConnection from "./config/database.js";
import authRoutes from "./routes/authRoute.js";
import userRoutes from "./routes/userRoute.js";
import messageRoutes from "./routes/messageRoute.js";

dotenv.config();

const port = process.env.PORT || 5000;

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Database connection
dbConnection();

// Middleware setup
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: "https://chitchat-gagan.netlify.app",
    credentials: true,
  })
);

// Dummy route for testing server
app.get("/", (req, res) => {
  res.send("server is working");
});

// Route handlers
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/message", messageRoutes);

// Start server
server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
