import User from "../models/userModel.js";
import { compareString, generateToken, hashString } from "../utils/common.js";
import { v2 as cloudinary } from "cloudinary";

export const register = async (req, res) => {
  const { fullName, email, username, password, profilePhoto } = req.body;
  if (!fullName || !email || !username || !password) {
    return res.status(400).json({ message: "Please fill in all fields!" });
  }

  if (fullName && fullName.length < 6) {
    return res
      .status(400)
      .json({ message: "Name must be at least 6 characters long!" });
  }

  if (username && username.length < 8) {
    return res
      .status(400)
      .json({ message: "Username must be at least 8 characters long!" });
  }

  if (password && password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters long!" });
  }

  try {
    const userExist = await User.findOne({ username, email });
    if (userExist) {
      return res.status(400).json({ message: "User already exists!" });
    }

    let profilePhotoUrl = "";
    if (profilePhoto) {
      let uploadedResponse = await cloudinary.uploader.upload(profilePhoto);
      profilePhotoUrl = uploadedResponse.secure_url;
    }

    const hashedPassword = await hashString(password);

    const newUser = await User.create({
      fullName,
      email,
      username,
      password: hashedPassword,
      profilePhoto: profilePhotoUrl,
    });

    const user = {
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      username: newUser.username,
      profilePhoto: newUser.profilePhoto,
      about: newUser.about,
    };

    const token = generateToken(newUser._id);

    res
      .cookie("chitchat", token, {
        maxAge: 2 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: true,
        sameSite: "None",
      })
      .status(201)
      .send(user);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({
      message: "Server error!",
    });
  }
};

export const login = async (req, res) => {
  const { email, username, password } = req.body;
  if ((!email && !username) || !password) {
    return res.status(400).json({ message: "Please fill in all fields!" });
  }

  if (username && username.length < 8) {
    return res
      .status(400)
      .json({ message: "Username must be at least 8 characters long!" });
  }

  if (password && password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters long!" });
  }

  try {
    let userExist;

    if (username) {
      userExist = await User.findOne({ username });
    } else {
      userExist = await User.findOne({ email });
    }
    if (!userExist) {
      return res.status(400).json({ message: "User not exist!" });
    }

    const isPasswordMatch = await compareString(password, userExist.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Password is incorrect!" });
    }

    const user = {
      _id: userExist._id,
      fullName: userExist.fullName,
      email: userExist.email,
      username: userExist.username,
      profilePhoto: userExist.profilePhoto,
      about: userExist.about,
    };

    const token = generateToken(userExist._id);

    res
      .cookie("chitchat", token, {
        maxAge: 2 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: true,
        sameSite: "None",
      })
      .status(200)
      .send(user);
  } catch (err) {
    console.log(err.message);
    res.status(404).json({
      message: "Server error!",
    });
  }
};

export const logout = (req, res) => {
  res.status(200).clearCookie("chitchat").json({
    message: "Logout successfull",
  });
};

export const myself = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "-password -friends"
    );

    res.status(200).send(user);
  } catch (err) {
    console.log(err.message);
    res.status(404).json({
      message: "Server error!",
    });
  }
};

export const deleteAccount = async (req, res) => {
  const { username, email, password } = req.body;
  if ((!email && !username) || !password) {
    return res.status(400).json({ message: "Please fill in all fields!" });
  }

  if (username && username.length < 8) {
    return res
      .status(400)
      .json({ message: "Username must be at least 8 characters long!" });
  }

  if (password && password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters long!" });
  }

  try {
    const user = await User.findById(req.user.userId);

    let userExist;

    if (username) {
      userExist = user.username === username;
    } else {
      userExist = user.email === email;
    }
    if (!userExist) {
      return res.status(400).json({
        message: "Credentials are wrong, you can not delete account!",
      });
    }

    const isPasswordMatch = await compareString(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Credentials are wrong, you can not delete account!",
      });
    }

    res.status(200).json({
      message: "Account deleted",
    });
  } catch (err) {
    console.log(err.message);
    res.status(404).json({
      message: "Server error!",
    });
  }
};
