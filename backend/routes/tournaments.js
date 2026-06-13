const express = require("express");
const auth = require("../middleware/auth");
const handlers = require("./tournamentLogic");

const router = express.Router();

// tournament list
router.get("/tournaments", handlers.getTournaments);

// create tournament (login required)
router.post("/tournaments", auth, handlers.createTournament);

// tournament detail (includes teams, matches, standings)
router.get("/tournaments/:id", handlers.getTournamentById);

// tournament match list
router.get("/tournaments/:id/matches", handlers.getTournamentMatches);

// tournament standings
router.get("/tournaments/:id/standings", handlers.getTournamentStandings);

// update tournament (creator only)
router.put("/tournaments/:id", auth, handlers.updateTournament);

// delete tournament (creator only)
router.delete("/tournaments/:id", auth, handlers.deleteTournament);

// add team to tournament (creator only)
router.post("/tournaments/:id/teams", auth, handlers.createTeam);

// add player to a team (tournament creator only)
router.post("/teams/:id/players", auth, handlers.createPlayer);

// generate match schedule (round-robin)
router.post("/tournaments/:id/matches/generate", auth, handlers.generateMatches);

module.exports = router;
