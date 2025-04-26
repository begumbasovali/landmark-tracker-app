const jwt = require("jsonwebtoken");

// Environment değişkeni yoksa varsayılan bir secret kullan
const JWT_SECRET = process.env.JWT_SECRET || "landmark-tracker-secret-key";

module.exports = function (req, res, next) {
  // Get token from the header
  const token = req.header("x-auth-token");

  // Token yoksa
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // Token'ı doğrula
    const decoded = jwt.verify(token, JWT_SECRET);

    // Decoded token'ı request'e ekle
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};
