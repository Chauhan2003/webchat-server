import jwt from "jsonwebtoken";

const isAuth = (req, res, next) => {
  try {
    const { chitchat } = req.cookies;

    if (!chitchat) {
      return res.status(401).json({ message: "Login again!" });
    }

    const decode = jwt.verify(chitchat, process.env.JWT_SECRET_KEY);

    if (!decode) {
      return res.status(401).json({ message: "Login again!" });
    }

    req.user = decode;
    next();
  } catch (err) {
    console.log(err.message);
    res.status(404).json({
      message: "Server error!",
    });
  }
};

export default isAuth;
