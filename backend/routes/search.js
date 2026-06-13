const express = require("express");

const Team = require("../models/Team");
const Player = require("../models/Player");

const router = express.Router();

function error(res, status, message) {
  return res.status(status).json({ error: message });
}

// ================= TEAM =================
router.get("/teams", async (req, res) => {
  try {
    const { q = "" } = req.query;

    // MongoDB filter: empty = returns all teams
    const filter = {};

    // if there is a search, find teams whose name contains q
    if (q) {
      filter.name = { $regex: q, $options: "i" };
    }

    const teams = await Team.find(filter)
      .populate("tournament", "name sport startDate") // adds tournament info
      .sort({ name: 1 }); // alphabetical order

    return res.json(teams);
  } catch (err) {
    console.error(err);
    return error(res, 500, "Server error");
  }
});

// ================= PLAYER =================
router.get("/players", async (req, res) => {
  try {
    const { q = "" } = req.query;

    // MongoDB filter: empty = returns all players
    const filter = {};

    // if there is a search, look by first name or last name
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { surname: { $regex: q, $options: "i" } }
      ];
    }

    // get the players
    let players = await Player.find(filter);

    // add the team
    players = await Player.populate(players, {
      path: "team",
      select: "name tournament"
    });

    // add the tournament inside the team
    players = await Player.populate(players, {
      path: "team.tournament",
      select: "name sport startDate"
    });

    return res.json(players);
  } catch (err) {
    console.error(err);
    return error(res, 500, "Server error");
  }
});

module.exports = router;
