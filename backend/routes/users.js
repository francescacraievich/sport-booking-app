const express = require("express");

const User = require("../models/User");
const Tournament = require("../models/Tournament");

const router = express.Router();

function error(res, status, message) {
  return res.status(status).json({ error: message });
}

// USER LIST
router.get("/users", async (req, res) => {
  try {
    const q = req.query.q || "";
    const filter = {};

    // search by username, first name or last name
    if (q) {
      filter.$or = [
        { username: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
        { surname: { $regex: q, $options: "i" } }
      ];
    }

    // exclude password from the response
    const users = await User.find(filter)
      .select("-password")
      .sort({ username: 1 });

    // for each user, add the tournaments they created
    const result = [];

    for (let i = 0; i < users.length; i++) {
     const user = users[i];

      // get the tournaments created by this user
      const tournaments = await Tournament.find({ creator: user._id });

     // add user + tournaments to the final list
      result.push({
        ...user.toObject(), // copies all user data (id, username, name, surname)
        tournaments: tournaments
      });
    }

    return res.json(result);
  } catch (err) {
    console.error(err);
    return error(res, 500, "Server error");
  }
});

// USER DETAIL
router.get("/users/:id", async (req, res) => {
  try {
    // get the user without the password
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return error(res, 404, "User not found");
    }

    // get the tournaments created by this user
    const tournaments = await Tournament.find({ creator: user._id })
      .select("name sport maxTeams startDate creator")
      .sort({ createdAt: -1 });

    return res.json({
      ...user.toObject(),
      tournaments
    });
  } catch (err) {
    console.error(err);
    return error(res, 500, "Server error");
  }
});

module.exports = router;
