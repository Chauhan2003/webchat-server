import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// password
export const hashString = async (password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return hashedPassword;
};

export const compareString = async (userPassword, password) => {
  const isMatch = await bcrypt.compare(userPassword, password);
  return isMatch;
};

// json webtoken
export const generateToken = (id) => {
  return jwt.sign({ userId: id }, process.env.JWT_SECRET_KEY, {
    expiresIn: 2 * 24 * 60 * 60 * 1000,
  });
};
