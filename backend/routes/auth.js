const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// helper for sending errors
function error(res, status, message) {

  // Object with the error message
  const errorResponse = {
    error: message
  };

  // Send status and JSON response
  res.status(status);
  return res.json(errorResponse);
}

// ================= SIGNUP =================
router.post("/auth/signup", async (req, res) => {
  try {
    const { username, password, name, surname } = req.body;

    // check required fields
    if (!username || !password || !name || !surname) {
    return error(res, 400, "All fields are required");
    }

    if (password.length < 6) {
      return error(res, 400, "Password must be at least 6 characters");
    }

    // normalize username (avoids duplicates like Mario/mario)
    const normalizedUsername = username.trim().toLowerCase();

    const existingUser = await User.findOne({ username: normalizedUsername });
    if (existingUser) {
      return error(res, 400, "Username already taken");
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: normalizedUsername,
      password: hashedPassword,
      name: name.trim(),
      surname: surname.trim()
    });

    return res.status(201).json({
      message: "User created",
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        surname: user.surname
      }
    });
  } catch (err) {
    console.error(err);
    return error(res, 500, "Server error");
  }
});

// ================= SIGNIN =================
router.post("/auth/signin", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return error(res, 400, "Username and password are required");
    }

    const user = await User.findOne({
      username: username.trim().toLowerCase()
    });

    if (!user) {
      return error(res, 401, "Invalid credentials");
    }

    // verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return error(res, 401, "Invalid credentials");
    }

    // create JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        surname: user.surname
      }
    });
  } catch (err) {
    console.error(err);
    return error(res, 500, "Server error");
  }
});

// ================= WHOAMI =================
router.get("/whoami", auth, async (req, res) => {
  try {
    // get the user id from the token (set by auth middleware)
    const userId = req.user.id;

    // find the user in the database (without password)
    const user = await User.findById(userId).select("-password");

    // if not found
    if (!user) {
      return error(res, 404, "User not found");
    }

    // response to the frontend (same shape as signin)
    return res.json({
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        surname: user.surname
      }
    });

  } catch (err) {
    console.error(err);
    return error(res, 500, "Server error");
  }
});

module.exports = router;
