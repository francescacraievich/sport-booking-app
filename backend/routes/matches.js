const express = require("express");

const auth = require("../middleware/auth"); // authentication middleware
const Match = require("../models/Match");
const Tournament = require("../models/Tournament");
const Field = require("../models/Field");

const router = express.Router();

function error(res, status, message) {
  return res.status(status).json({ error: message });
}

// MATCH DETAIL
router.get("/matches/:id", async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate("tournament", "name sport startDate") // replaces the tournament ID with real data
      .populate("homeTeam", "name") // home team
      .populate("awayTeam", "name") // away team
      .populate("field", "name sport address"); // field

    if (!match) {
      return error(res, 404, "Match not found");
    }

    return res.json(match);
  } catch (err) {
    console.error(err);
    return error(res, 500, "Server error");
  }
});

// ENTER RESULT
router.put("/matches/:id/result", auth, async (req, res) => {
  try {
    const { homeScore, awayScore } = req.body;

    // check valid scores
    if (
      homeScore === undefined ||
      awayScore === undefined ||
      Number.isNaN(Number(homeScore)) ||
      Number.isNaN(Number(awayScore)) ||
      Number(homeScore) < 0 ||
      Number(awayScore) < 0
    ) {
      return error(res, 400, "Scores must be numbers >= 0");
    }

    const match = await Match.findById(req.params.id);
    if (!match) {
      return error(res, 404, "Match not found");
    }

    const tournament = await Tournament.findById(match.tournament);
    if (!tournament) {
      return error(res, 404, "Tournament not found");
    }

    // only the tournament creator can enter the result
    if (tournament.creator.toString() !== req.user.id) {
      return error(res, 403, "Not authorized");
    }

    // the result cannot be entered before the match
    const matchDate = new Date(`${match.date}T00:00:00`);
    if (matchDate > new Date()) {
      return error(res, 400, "You can only enter the result after the match");
    }

    // draw is not valid for some sports
    if (
      tournament.sport !== "football" &&
      Number(homeScore) === Number(awayScore)
    ) {
      return error(res, 400, "Draw is not valid for this sport");
    }

    // update result
    match.homeScore = Number(homeScore);
    match.awayScore = Number(awayScore);
    match.status = "played";

    await match.save();

    // return the updated match
    const updatedMatch = await Match.findById(match._id)
      .populate("tournament", "name sport startDate")  // replaces the tournament ID with real data
      .populate("homeTeam", "name")
      .populate("awayTeam", "name")
      .populate("field", "name sport address");

    return res.json(updatedMatch);
  } catch (err) {
    console.error(err);
    return error(res, 500, "Server error");
  }
});

// ASSIGN OR REMOVE FIELD FROM MATCH
router.put("/matches/:id/field", auth, async (req, res) => {
  try {
    const { fieldId } = req.body;

    const match = await Match.findById(req.params.id);
    if (!match) {
      return error(res, 404, "Match not found");
    }

    const tournament = await Tournament.findById(match.tournament);
    if (!tournament) {
      return error(res, 404, "Tournament not found");
    }

    // only the tournament creator can assign the field
    if (tournament.creator.toString() !== req.user.id) {
      return error(res, 403, "Not authorized");
    }

    // if fieldId is empty, remove the field
    if (!fieldId) {
      match.field = null;
    } else {
      const field = await Field.findById(fieldId);
      if (!field) {
        return error(res, 404, "Field not found");
      }
      match.field = field._id;
    }

    await match.save();
    return res.json(match);
  } catch (err) {
    console.error(err);
    return error(res, 500, "Server error");
  }
});

module.exports = router;
