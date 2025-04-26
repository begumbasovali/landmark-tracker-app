const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

// Environment değişkeni yoksa varsayılan bir secret kullan
const JWT_SECRET = process.env.JWT_SECRET || "landmark-tracker-secret-key";

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Kullanıcı adı veya emailin zaten alınıp alınmadığını kontrol et
    let user = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (user) {
      return res.status(400).json({
        message: "User already exists with that username or email",
      });
    }

    // Yeni kullanıcı oluştur
    user = new User({
      username,
      email,
      password,
    });

    // Kullanıcıyı kaydet (password otomatik hash'lenir)
    await user.save();

    // JWT için payload
    const payload = {
      user: {
        id: user.id,
      },
    };

    // JWT token oluştur
    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: "7d" }, // Token 7 gün geçerli
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Kullanıcı adını kontrol et
    let user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Şifreyi kontrol et
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // JWT için payload
    const payload = {
      user: {
        id: user.id,
      },
    };

    // JWT token oluştur
    jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get("/user", auth, async (req, res) => {
  try {
    // Authentication middleware'den gelen user id'si
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
