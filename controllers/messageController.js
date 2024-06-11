import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";
import { getReceiverSocketId, io } from "../config/socket.js";
import { v2 as cloudinary } from "cloudinary";

export const create = async (req, res) => {
  const senderId = req.user.userId;
  const receiverId = req.params.id;
  const { text, image } = req.body;

  // Validate input
  if (!text && !image) {
    return res
      .status(400)
      .json({ message: "Please type something to send a message!" });
  }

  try {
    // Find the conversation between the sender and receiver
    let gotConversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    // Check if the conversation exists
    if (!gotConversation) {
      return res.status(400).json({ message: "You are not friends" });
    }

    // Prepare message data
    let messageData = { senderId, receiverId };

    if (text) messageData.text = text;
    if (image) {
      const uploadedResponse = await cloudinary.uploader.upload(image);
      messageData.image = uploadedResponse.secure_url;
    }

    // Create new message
    const newMessage = await Message.create(messageData);

    // Update the conversation
    if (newMessage) {
      gotConversation.messages.push(newMessage._id);
      gotConversation.latestMessage = messageData.text || "";
      gotConversation.lastMessageTime = Date.now();
      await gotConversation.save();
    }

    // Emit the new message to the receiver via socket.io
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    // Send response
    res.status(201).json(newMessage);
  } catch (err) {
    console.error(err.message); // Use console.error for errors
    res.status(500).json({ message: "Server error!" }); // Use status 500 for server errors
  }
};

export const messages = async (req, res) => {
  const senderId = req.user.userId;
  const receiverId = req.params.id;

  try {
    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    }).populate("messages");

    if (!conversation) {
      return res.status(404).json({ message: "You are not friends" });
    }

    const messages = conversation.messages || [];

    res.status(200).send(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error!" });
  }
};
