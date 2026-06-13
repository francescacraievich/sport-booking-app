const Tournament = require("../models/Tournament");
const Team = require("../models/Team");
const Player = require("../models/Player");
const Match = require("../models/Match");

const {
  error,
  isValidDateString,
  calculateStandings,
  addDays
} = require("./standingsHelper");


async function getTournaments(req, res) {
  try {
    const { q = "", status = "" } = req.query;
    const filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { sport: { $regex: q, $options: "i" } }
      ];
    }

    let tournaments = await Tournament.find(filter);

    tournaments = await Tournament.populate(tournaments, {
      path: "creator",
      select: "username name surname"
    });

    tournaments.sort((a, b) => b.createdAt - a.createdAt);

    if (!status) return res.json(tournaments);

    const result = [];

    for (const tournament of tournaments) {
      const matches = await Match.find({ tournament: tournament._id });

      let computedStatus = "active";

      if (matches.length > 0) {
        let allPlayed = true;

        for (const match of matches) {
          if (match.status !== "played") {
            allPlayed = false;
            break;
          }
        }

        if (allPlayed) {
          computedStatus = "completed";
        }
      }

      if (computedStatus === status) {
        result.push({
          ...tournament.toObject(),
          status: computedStatus
        });
      }
    }

    return res.json(result);
  } catch (err) {
    console.error(err);
    return error(res, 500, "Server error");
  }
}

async function createTournament(req, res) {
  try {
    const { name, sport, maxTeams, startDate } = req.body;

    if (!name || !sport || !maxTeams || !startDate) {
      return error(res, 400, "All fields are required");
    }

    const parsedMaxTeams = Number(maxTeams);

    if (Number.isNaN(parsedMaxTeams) || parsedMaxTeams < 2) {
      return error(res, 400, "maxTeams must be at least 2");
    }

    if (!isValidDateString(startDate)) {
      return error(res, 400, "Invalid startDate");
    }

    const tournament = await Tournament.create({
      name: name.trim(),
      sport,
      maxTeams: parsedMaxTeams,
      startDate,
      creator: req.user.id
    });

    return res.status(201).json(tournament);
  } catch (err) {
    console.error(err);
    return error(res, 500, "Server error");
  }
}


async function getTournamentById(req, res) {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate("creator", "username name surname");

    if (!tournament) {
      return error(res, 404, "Tournament not found");
    }

    const teams = await Team.find({ tournament: tournament._id });

    const teamIds = [];

    for (const team of teams) {
      teamIds.push(team._id);
    }

    const players = await Player.find({
      team: { $in: teamIds }
    }).populate("team", "name");

    return res.json({
      tournament,
      teams,
      players
    });

  } catch (err) {
    console.error(err);
    return error(res, 500, "Server error");
  }
}

async function getTournamentMatches(req, res) {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return error(res, 404, "Tournament not found");

    const matches = await Match.find({ tournament: tournament._id })
      .populate("homeTeam", "name")
      .populate("awayTeam", "name")
      .populate("field", "name")
      .sort({ date: 1 });

    return res.json(matches);
  } catch (err) {
    console.error(err);
    return error(res, 500, "Server error");
  }
}


// ================= STANDINGS =================
// Returns standings only
async function getTournamentStandings(req, res) {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return error(res, 404, "Tournament not found");

    const teams = await Team.find({ tournament: tournament._id });
    const matches = await Match.find({ tournament: tournament._id });

    return res.json(calculateStandings(teams, matches, tournament.sport));
  } catch (err) {
    console.error(err);
    return error(res, 500, "Server error");
  }
}


// ================= UPDATE =================
// Edit name or maxTeams (creator only)
async function updateTournament(req, res) {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return error(res, 404, "Tournament not found");

    // only the creator can edit
    if (tournament.creator.toString() !== req.user.id) {
      return error(res, 403, "Not authorized");
    }

    const { name, maxTeams } = req.body;

    // update name if provided
    if (name) tournament.name = name.trim();

    if (maxTeams !== undefined) {
      const parsed = Number(maxTeams);

      // maxTeams must be a valid number
      if (Number.isNaN(parsed) || parsed < 2) {
        return error(res, 400, "Invalid maxTeams");
      }

      // cannot drop below the number of teams already enrolled
      const count = await Team.countDocuments({ tournament: tournament._id });

      if (parsed < count) {
        return error(res, 400, "maxTeams too low");
      }

      tournament.maxTeams = parsed;
    }

    // save the changes to the tournament in the database
    await tournament.save();

    // return the updated tournament to the frontend
    return res.json(tournament);

  } catch (err) {
    console.error(err);
    return error(res, 500, "Server error");
  }
}


// ================= DELETE =================
// Delete tournament and related data
async function deleteTournament(req, res) {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return error(res, 404, "Tournament not found");

    // only the creator can delete
    if (tournament.creator.toString() !== req.user.id) {
      return error(res, 403, "Not authorized");
    }

    // get the tournament's teams in order to also delete their players
    const teams = await Team.find({ tournament: tournament._id }).select("_id");

    // delete the tournament's matches
    await Match.deleteMany({ tournament: tournament._id });

    // build the team id list
    const teamIds = [];

    for (const team of teams) {
      teamIds.push(team._id);
    }

    // delete the players belonging to the tournament's teams
    await Player.deleteMany({
      team: { $in: teamIds }
    });

    // delete teams and then the tournament
    await Team.deleteMany({ tournament: tournament._id });
    await tournament.deleteOne();

    return res.json({ message: "Tournament deleted" });

  } catch (err) {
    console.error(err);
    return error(res, 500, "Server error");
  }
}


// ================= CREATE TEAM =================
// Adds a team to the tournament
async function createTeam(req, res) {
  try {
    const { name } = req.body;

    if (!name?.trim()) return error(res, 400, "Name is required");

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return error(res, 404, "Tournament not found");

    // only the creator can add teams
    if (tournament.creator.toString() !== req.user.id) {
      return error(res, 403, "Not authorized");
    }

    // count how many teams are already enrolled in this tournament
    const count = await Team.countDocuments({
     tournament: tournament._id
    });

    // if the number of teams has already reached the maximum, no more can be added
    if (count >= tournament.maxTeams) {
      return error(res, 400, "Max teams reached");
    }

    const team = await Team.create({
      name: name.trim(),
      tournament: tournament._id
    });

    return res.status(201).json(team);

  } catch (err) {
    if (err.code === 11000) {
      return error(res, 400, "Team already exists");
    }

    console.error(err);
    return error(res, 500, "Server error");
  }
}


// ================= CREATE PLAYER =================
// Adds a player to a team
async function createPlayer(req, res) {
  try {
    const { name, surname, jerseyNumber } = req.body;

    if (!name?.trim() || !surname?.trim()) {
      return error(res, 400, "First name and last name are required");
    }

    const team = await Team.findById(req.params.id);
    if (!team) return error(res, 404, "Team not found");

    const tournament = await Tournament.findById(team.tournament);
    if (!tournament) return error(res, 404, "Tournament not found");

    // only the tournament creator can add players
    if (tournament.creator.toString() !== req.user.id) {
      return error(res, 403, "Not authorized");
    }

    const playerData = {
      name: name.trim(),
      surname: surname.trim(),
      team: team._id
    };

    // jersey number is optional
    if (jerseyNumber !== undefined && jerseyNumber !== "") {
      const parsed = Number(jerseyNumber);

      if (Number.isNaN(parsed)) {
        return error(res, 400, "Invalid jersey number");
      }

      playerData.jerseyNumber = parsed;
    }

    // create the new player in the database using the prepared data
    const player = await Player.create(playerData);

    // return the newly created player to the frontend
    return res.status(201).json(player);

  } catch (err) {
    console.error(err);
    return error(res, 500, "Server error");
  }
}


// ================= GENERATE MATCHES =================
// Generates a round-robin schedule
async function generateMatches(req, res) {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return error(res, 404, "Tournament not found");

    // only the creator can generate the schedule
    if (tournament.creator.toString() !== req.user.id) {
      return error(res, 403, "Not authorized");
    }

    // prevent double generation
    const existing = await Match.countDocuments({ tournament: tournament._id }); // counts how many matches already exist for this tournament

    if (existing > 0) {
      return error(res, 400, "Matches already generated");
    }

    const teams = await Team.find({ tournament: tournament._id });

    // all teams must be present before generating matches
    if (teams.length !== tournament.maxTeams) {
      return error(res, 400, "Teams not complete");
    }

    const matches = [];
    let dayOffset = 0;

    // each team plays against every other team once
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matches.push({
          tournament: tournament._id,
          homeTeam: teams[i]._id,
          awayTeam: teams[j]._id,
          date: addDays(tournament.startDate, dayOffset),
          field: null,
          status: "upcoming"
        });

        dayOffset++;
      }
    }

    const created = await Match.insertMany(matches);

    return res.status(201).json({
      message: "Schedule generated",
      matches: created
    });

  } catch (err) {
    console.error(err);
    return error(res, 500, "Server error");
  }
}

module.exports = {
  getTournaments,
  createTournament,
  getTournamentById,
  getTournamentMatches,
  getTournamentStandings,
  updateTournament,
  deleteTournament,
  createTeam,
  createPlayer,
  generateMatches
};
