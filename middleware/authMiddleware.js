import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized. No token provided." });
    }

    // Verify the token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_secret_key"
    );

    // Attach user data to the request object for further use
    req.user = decoded;

    next(); // Move to the next middleware/controller
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

export default verifyToken;
