// ===== ERROR HELPER =====
// standard response for API errors
function error(res, status, message) {
  return res.status(status).json({ error: message });
}


// ===== DATE VALIDATION =====
// checks YYYY-MM-DD format + real valid date
function isValidDateString(dateString) {

  // check base format (e.g. 2026-04-25)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }

  // try to create a real date
  const date = new Date(`${dateString}T00:00:00.000Z`);

  // if invalid → error
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  // final comparison to avoid dates like 2026-02-31
  return date.toISOString().slice(0, 10) === dateString;
}


// ===== ADD DAYS =====
// adds X days to a date (used for the match schedule)
function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);

  // add days
  date.setUTCDate(date.getUTCDate() + days);

  // always return YYYY-MM-DD format
  return date.toISOString().slice(0, 10);
}


// ===== STANDINGS CALCULATION =====
// calculates standings based on teams + matches + sport
function calculateStandings(teams, matches, sport) {
  const standings = [];

  // iterate over all teams
  for (const team of teams) {
    // initial team stats
    let points = 0;
    let played = 0;
    let won = 0;
    let drawn = 0;
    let lost = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    // iterate over all matches
    for (const match of matches) {
      // check if this team is the home team
      const isHome = match.homeTeam.toString() === team._id.toString();

      // check if this team is the away team
      const isAway = match.awayTeam.toString() === team._id.toString();

      // if the match has no result, skip it
      if (match.homeScore == null || match.awayScore == null) {
        continue;
      }

      // if the team does not participate in this match, skip it
      if (!isHome && !isAway) {
        continue;
      }

      // if we reach here, the team has played this match
      played++;

      let scored;
      let conceded;

      // if the team plays at home
      if (isHome) {
        scored = match.homeScore;
        conceded = match.awayScore;
      }
      // if the team plays away
      else {
        scored = match.awayScore;
        conceded = match.homeScore;
      }

      // update goals scored and conceded
      goalsFor += scored;
      goalsAgainst += conceded;

      // win
      if (scored > conceded) {
        won++;

        if (sport === "football") {
          points += 3;
        } else {
          points += 2;
        }
      }

      // draw
      else if (scored === conceded) {
        drawn++;

        if (sport === "football") {
          points += 1;
        }
      }

      // loss
      else {
        lost++;
      }
    }

    // add this team to the final standings
    standings.push({
      team: team.name,
      teamId: team._id,
      points,
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst
    });
  }

  // sort the standings
  standings.sort((a, b) => {
    // first by points
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    // then by goal difference
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }

    // then by goals scored
    return b.goalsFor - a.goalsFor;
  });

  return standings;
}


module.exports = {
  error,
  isValidDateString,
  addDays,
  calculateStandings
};
