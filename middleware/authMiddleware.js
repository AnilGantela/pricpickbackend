const verifyToken = (req) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    throw new Error("Unauthorized. No token provided.");
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
  } catch (err) {
    throw new Error("Invalid or expired token.");
  }
};

export default verifyToken;
