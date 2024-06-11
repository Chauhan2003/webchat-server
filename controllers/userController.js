import Conversation from "../models/conversationModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";

export const profile = async (req, res) => {
  const { username } = req.params;

  try {
    const profile = await User.findOne({ username }).select(
      "-password -friends"
    );
    if (!profile) {
      return res.status(200).json({ message: "User not found!" });
    }

    res.status(200).send(profile);
  } catch (err) {
    console.log(err.message);
    res.status(404).json({
      message: "Server error!",
    });
  }
};

export const updateProfile = async (req, res) => {
  let { profilePhoto, fullName, about } = req.body;
  if (!profilePhoto && !fullName && !about) {
    return res
      .status(400)
      .json({ message: "Please fill something to update!" });
  }

  if (fullName && fullName.length < 6) {
    return res
      .status(400)
      .json({ message: "Name must be at least 6 characters long!" });
  }

  let updateFields = {};
  if (fullName) updateFields.name = fullName;
  if (about) updateFields.about = about;

  try {
    const user = await User.findById(req.user.userId);

    if (profilePhoto) {
      if (user.profilePhoto) {
        await cloudinary.uploader.destroy(
          user.profilePhoto.split("/").pop().split(".")[0]
        );
      }

      const uploadedResponse = await cloudinary.uploader.upload(profilePhoto);
      profilePhoto = uploadedResponse.secure_url;

      updateFields.profilePhoto = profilePhoto;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      updateFields,
      {
        new: true,
      }
    ).select("-password -friends");

    res.status(200).send(updatedUser);
  } catch (err) {
    console.log(err.message);
    res.status(404).json({
      message: "Server error!",
    });
  }
};

export const friends = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    // Fetch the user's friends excluding sensitive fields
    const friends = await User.find({
      _id: { $in: user.friends },
    }).select("-password -email -about -friends");

    // Fetch conversations including the latestMessage and lastMessageTime fields
    const conversations = await Conversation.find({
      participants: { $in: [req.user.userId] },
    }).select("participants latestMessage lastMessageTime");

    // Map friends to their latest messages and last message time
    const friendsWithLatestMessages = friends.map((friend) => {
      const conversation = conversations.find((convo) =>
        convo.participants.includes(friend._id)
      );

      return {
        ...friend.toObject(),
        latestMessage: conversation ? conversation.latestMessage : null,
        lastMessageTime: conversation ? conversation.lastMessageTime : null,
      };
    });

    res.status(200).send(friendsWithLatestMessages);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

export const addFriend = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(req.user.userId);

    const isFriend = user.friends.includes(id);
    if (isFriend) {
      return res
        .status(400)
        .json({ message: "Unable to add, User already your friend!" });
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.userId, {
      $push: { friends: id },
    });

    await User.findByIdAndUpdate(id, {
      $push: { friends: req.user.userId },
    });

    await Conversation.create({
      participants: [req.user.userId, id],
    });

    res.status(200).json({
      message: "User added",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

export const removeFriend = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(req.user.userId);

    const isFriend = user.friends.includes(id);
    if (!isFriend) {
      return res
        .status(400)
        .json({ message: "Unable to remove, User not your friend!" });
    }

    await User.findByIdAndUpdate(req.user.userId, {
      $pull: { friends: id },
    });

    await User.findByIdAndUpdate(id, {
      $pull: { friends: req.user.userId },
    });

    await Conversation.findOneAndDelete({
      participants: { $all: [req.user.userId, id] },
    });

    res.status(200).json({
      message: "User removed",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

export const search = async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ message: "Please provide a username" });
  }

  try {
    const user = await User.findById(req.user.userId).populate("friends");

    const friendIds = user.friends.map((friend) => friend._id);

    const searchUsers = await User.find({
      _id: { $nin: [...friendIds, req.user.userId] },
      username: { $regex: username, $options: "i" },
    }).select("-password -email -about -friends");

    res.json({ searchUsers });
  } catch (err) {
    console.log(err.message);
    res.status(404).json({
      message: "Server error!",
    });
  }
};
