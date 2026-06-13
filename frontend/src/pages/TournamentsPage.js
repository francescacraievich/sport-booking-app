import { useEffect, useState } from "react";
import { api } from "../apiClient";
import {
  sportLabel,
  statusLabel,
  isValidDateInput,
  isEmpty,
  todayInputValue,
} from "../utils";

// Full tournament management: create, search, teams, players, matches, standings
export default function TournamentsPage({ user }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [list, setList] = useState([]);

  const [createForm, setCreateForm] = useState({
    name: "",
    sport: "football",
    maxTeams: "",
    startDate: todayInputValue(),
  });

  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);

  const [editName, setEditName] = useState("");
  const [editMaxTeams, setEditMaxTeams] = useState("");

  const [teamName, setTeamName] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);

  const [playerName, setPlayerName] = useState("");
  const [playerSurname, setPlayerSurname] = useState("");
  const [playerJersey, setPlayerJersey] = useState("");

  const [selectedMatch, setSelectedMatch] = useState(null);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [availableFields, setAvailableFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState("");

  const [standings, setStandings] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadList();
  }, []);

  function resetDetailState() {
    setSelectedTeam(null);
    setSelectedMatch(null);
    setHomeScore("");
    setAwayScore("");
    setSelectedFieldId("");
    setEditName("");
    setEditMaxTeams("");
  }

  async function loadList() {
    try {
      const data = await api.getTournaments(query, statusFilter);
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      setMessage(err.message);
    }
  }

  // Fetches tournament detail, matches and standings in parallel
  async function loadDetails(id) {
    try {
      const detailsData = await api.getTournamentById(id);
      const matchesData = await api.getMatches(id);
      const standingsData = await api.getStandings(id);

      setDetails({
        ...detailsData,
        matches: Array.isArray(matchesData) ? matchesData : [],
      });
      setStandings(Array.isArray(standingsData) ? standingsData : []);
      resetDetailState();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleCreate() {
    const name = createForm.name.trim();
    const maxTeams = Number(createForm.maxTeams);

    if (!name || !isValidDateInput(createForm.startDate) || maxTeams < 2) {
      return setMessage("Please fill in all fields (max teams >= 2, valid date).");
    }

    try {
      await api.createTournament({
        name,
        sport: createForm.sport,
        maxTeams,
        startDate: createForm.startDate,
      });
      setCreateForm({ name: "", sport: "football", maxTeams: "", startDate: todayInputValue() });
      await loadList();
      setMessage("Tournament created.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleUpdate() {
    if (!selected) return;

    const body = {};
    const name = editName.trim();
    if (!isEmpty(name)) body.name = name;

    if (editMaxTeams !== "") {
      const n = Number(editMaxTeams);
      if (n < 2) return setMessage("Max teams must be >= 2.");
      body.maxTeams = n;
    }

    if (!Object.keys(body).length) return setMessage("No fields to update.");

    try {
      await api.updateTournament(selected._id, body);
      setEditName("");
      setEditMaxTeams("");
      await loadList();
      await loadDetails(selected._id);
      setMessage("Tournament updated.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    try {
      await api.deleteTournament(selected._id);
      setSelected(null);
      setDetails(null);
      resetDetailState();
      await loadList();
      setMessage("Tournament deleted.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleAddTeam() {
    if (!selected) return setMessage("Please select a tournament.");
    if (isEmpty(teamName)) return setMessage("Please enter the team name.");
    try {
      await api.createTeam(selected._id, { name: teamName.trim() });
      setTeamName("");
      await loadDetails(selected._id);
      setMessage("Team added.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleAddPlayer() {
    if (!selectedTeam) return setMessage("Please select a team.");
    if (isEmpty(playerName) || isEmpty(playerSurname))
      return setMessage("First name and last name are required.");

    const body = { name: playerName.trim(), surname: playerSurname.trim() };
    if (playerJersey !== "") body.jerseyNumber = Number(playerJersey);

    try {
      await api.createPlayer(selectedTeam._id, body);
      setPlayerName("");
      setPlayerSurname("");
      setPlayerJersey("");
      await loadDetails(selected._id);
      setMessage("Player added.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleGenerateMatches() {
    if (!selected) return setMessage("Please select a tournament.");
    try {
      await api.generateMatches(selected._id);
      await loadDetails(selected._id);
      setMessage("Schedule generated.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleSaveResult() {
    if (!selectedMatch) return setMessage("Please select a match.");

    const hs = Number(homeScore);
    const as_ = Number(awayScore);

    if (!Number.isInteger(hs) || !Number.isInteger(as_) || hs < 0 || as_ < 0) {
      return setMessage("Please enter integer scores >= 0.");
    }

    try {
      await api.saveResult(selectedMatch._id, { homeScore: hs, awayScore: as_ });

      const updatedMatches = await api.getMatches(selected._id);
      const updatedStandings = await api.getStandings(selected._id);

      setDetails({ ...details, matches: Array.isArray(updatedMatches) ? updatedMatches : [] });
      setStandings(Array.isArray(updatedStandings) ? updatedStandings : []);
      setSelectedMatch(null);
      setHomeScore("");
      setAwayScore("");
      setSelectedFieldId("");
      setMessage("Result saved.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleAssignField() {
    if (!selectedMatch) return setMessage("Please select a match.");
    try {
      await api.assignField(selectedMatch._id, selectedFieldId);
      const updatedMatches = await api.getMatches(selected._id);
      setDetails({ ...details, matches: Array.isArray(updatedMatches) ? updatedMatches : [] });
      setMessage(selectedFieldId ? "Field assigned." : "Field removed.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleSelectMatch(match) {
    try {
      if (selectedMatch?._id === match._id) {
        setSelectedMatch(null);
        setHomeScore("");
        setAwayScore("");
        setSelectedFieldId("");
        return;
      }

      const data = await api.getMatchById(match._id);
      setSelectedMatch(data);
      setHomeScore(data.homeScore != null ? String(data.homeScore) : "");
      setAwayScore(data.awayScore != null ? String(data.awayScore) : "");
      setSelectedFieldId(data.field?._id || "");

      const fields = await api.getFields("", tournament.sport);
      setAvailableFields(Array.isArray(fields) ? fields : []);
      setMessage("Match detail loaded.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  const teams = details?.teams || [];
  const players = details?.players || [];
  const matches = details?.matches || [];
  const tournament = details?.tournament || {};

  const userId = user?._id || user?.id;
  const creatorId = tournament?.creator?._id || tournament?.creator?.id;
  const isCreator = userId && creatorId && creatorId.toString() === userId.toString();

  const hasMatches = matches.length > 0;
  const mustCompleteTeams = isCreator && !hasMatches && teams.length !== tournament.maxTeams;

  return (
    <section>
      <div className="section-header">
        <h2>Tournaments</h2>
        <p>Create, search and manage tournaments</p>
      </div>

      {message && <div className="card mb-md">{message}</div>}

      <div className="cards-grid">
        <div className="card">
          <div className="card-header">
            <h3>Create Tournament</h3>
          </div>
          <div className="form-group">
            <input
              className="form-input"
              placeholder="Tournament name"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            />
            <select
              className="form-input"
              value={createForm.sport}
              onChange={(e) => setCreateForm({ ...createForm, sport: e.target.value })}
            >
              <option value="football">Football</option>
              <option value="volleyball">Volleyball</option>
              <option value="basketball">Basketball</option>
            </select>
            <input
              className="form-input"
              type="number"
              min="2"
              placeholder="Max teams"
              value={createForm.maxTeams}
              onChange={(e) => setCreateForm({ ...createForm, maxTeams: e.target.value })}
            />
            <input
              className="form-input"
              type="date"
              value={createForm.startDate}
              onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
            />
            <button className="btn btn-primary" onClick={handleCreate}>
              Create Tournament
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Search Tournaments</h3>
          </div>
          <div className="form-group">
            <input
              className="form-input"
              placeholder="Tournament name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
            <button className="btn btn-primary" onClick={loadList}>
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="list-container">
        {list.length === 0 && <div className="item">No tournaments found.</div>}

        {list.map((tournamentItem) => {
          const isSelected = selected?._id === tournamentItem._id;
          const tournamentStatus = tournamentItem.status;

          return (
            <div
              key={tournamentItem._id}
              className={`item ${isSelected ? "selected-outline" : ""}`}
            >
              <h4>{tournamentItem.name}</h4>
              <p className="compact-text">
                <strong>Sport:</strong> {sportLabel(tournamentItem.sport)} |{" "}
                <strong>Max teams:</strong> {tournamentItem.maxTeams} |{" "}
                <strong>Start:</strong> {tournamentItem.startDate || "-"} |{" "}
                <strong>Created by:</strong> {tournamentItem.creator?.username || "-"}
                {tournamentStatus && (
                  <> {" | "}<strong>Status:</strong> {statusLabel(tournamentStatus)}</>
                )}
              </p>
              <div className="small-actions">
                <button
                  onClick={() => {
                    if (isSelected) {
                      setSelected(null);
                      setDetails(null);
                      resetDetailState();
                      setMessage("");
                      return;
                    }
                    setSelected(tournamentItem);
                    setDetails(null);
                    resetDetailState();
                    setMessage("");
                    loadDetails(tournamentItem._id);
                  }}
                >
                  {isSelected ? "Deselect" : "Select"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selected && details && (
        <div className="details-stack">
          <div className="card">
            <div className="card-header">
              <h3>{tournament.name}</h3>
            </div>
            <div className="info-card mt-sm">
              <p><strong>Sport:</strong> {sportLabel(tournament.sport)}</p>
              <p><strong>Max teams:</strong> {tournament.maxTeams}</p>
              <p><strong>Start date:</strong> {tournament.startDate || "-"}</p>
              <p><strong>Creator:</strong> {tournament.creator?.username || "-"}</p>
              <p><strong>Enrolled teams:</strong> {teams.length} / {tournament.maxTeams}</p>
            </div>
          </div>

          {isCreator && (
            <div className="card">
              <div className="card-header">
                <h3>Edit Tournament</h3>
              </div>
              <div className="form-group">
                <input
                  className="form-input"
                  placeholder="New name (leave blank to keep current)"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <input
                  className="form-input"
                  type="number"
                  min="2"
                  placeholder="New max teams (leave blank to keep current)"
                  value={editMaxTeams}
                  onChange={(e) => setEditMaxTeams(e.target.value)}
                />
                <div className="inline-input-row">
                  <button className="btn btn-secondary" onClick={handleUpdate}>Update</button>
                  <button className="btn btn-danger" onClick={handleDelete}>Delete Tournament</button>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h3>Teams</h3>
            </div>
            {isCreator && teams.length < tournament.maxTeams && (
              <div className="form-group form-group-spaced">
                <input
                  className="form-input"
                  placeholder="New team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
                <button className="btn btn-success" onClick={handleAddTeam}>Add Team</button>
              </div>
            )}
            <div className="entity-list">
              {teams.length === 0 && <div className="muted-box">No teams.</div>}
              {teams.map((team) => {
                const isSelected = selectedTeam?._id === team._id;
                return (
                  <div key={team._id} className={`entity-card ${isSelected ? "selected-outline" : ""}`}>
                    <div className="card-header">
                      <strong>{team.name}</strong>
                      {isCreator && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => setSelectedTeam(isSelected ? null : team)}
                        >
                          {isSelected ? "Deselect" : "Select"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Players</h3>
            </div>
            {isCreator && (
              <>
                <p className="helper-text">
                  Selected team: <strong>{selectedTeam?.name || "none"}</strong>
                </p>
                <div className="form-group form-group-spaced">
                  <input
                    className="form-input"
                    placeholder="First name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                  />
                  <input
                    className="form-input"
                    placeholder="Last name"
                    value={playerSurname}
                    onChange={(e) => setPlayerSurname(e.target.value)}
                  />
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    placeholder="Jersey number (optional)"
                    value={playerJersey}
                    onChange={(e) => setPlayerJersey(e.target.value)}
                  />
                  <button className="btn btn-primary" onClick={handleAddPlayer}>Add Player</button>
                </div>
              </>
            )}
            <div className="entity-list">
              {!players.length && <div className="muted-box">No players.</div>}
              {players.map((player, index) => (
                <div className="entity-card" key={player._id || index}>
                  <strong>{player.name} {player.surname}</strong>
                  {player.jerseyNumber != null && <span> #{player.jerseyNumber}</span>}
                  {player.team?.name && <span className="text-muted"> · {player.team.name}</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Matches</h3>
              {isCreator && !hasMatches && (
                <button
                  className="btn btn-primary"
                  onClick={handleGenerateMatches}
                  disabled={teams.length !== tournament.maxTeams}
                >
                  Generate Schedule
                </button>
              )}
            </div>

            {mustCompleteTeams && (
              <p className="helper-text">
                Complete the teams to generate the schedule:
                <strong> {teams.length} / {tournament.maxTeams}</strong>
              </p>
            )}

            {isCreator && hasMatches && (
              <p className="helper-text">Select a match to enter the result.</p>
            )}

            {!hasMatches && <div className="muted-box mt-sm">No matches generated.</div>}

            <div className="entity-list mt-sm">
              {matches.map((match) => {
                const isSelected = selectedMatch?._id === match._id;
                const score =
                  match.homeScore != null && match.awayScore != null
                    ? `${match.homeScore} - ${match.awayScore}`
                    : "To be played";

                return (
                  <div
                    key={match._id}
                    className={`entity-card ${isSelected ? "selected-outline selected-outline-success" : ""}`}
                  >
                    <div className="card-header card-header-compact">
                      <strong>{match.homeTeam?.name} vs {match.awayTeam?.name}</strong>
                      {isCreator && (
                        <button className="btn btn-secondary" onClick={() => handleSelectMatch(match)}>
                          {isSelected ? "Deselect" : "Select"}
                        </button>
                      )}
                    </div>
                    <p className="compact-text compact-text-spaced">
                      <strong>Date:</strong> {match.date} &nbsp;|&nbsp;
                      <strong>Status:</strong> {statusLabel(match.status)} &nbsp;|&nbsp;
                      <strong>Result:</strong> {score} &nbsp;|&nbsp;
                      <strong>Field:</strong> {match.field?.name || "TBD"}
                    </p>
                  </div>
                );
              })}
            </div>

            {isCreator && selectedMatch && (
              <div className="form-group mt-md">
                <p className="result-title">
                  Result: {selectedMatch.homeTeam?.name} vs {selectedMatch.awayTeam?.name}
                </p>
                <div className="inline-input-row">
                  <select
                    className="form-input"
                    value={selectedFieldId}
                    onChange={(e) => setSelectedFieldId(e.target.value)}
                  >
                    <option value="">No field</option>
                    {availableFields.map((f) => (
                      <option key={f._id} value={f._id}>{f.name} ({f.address})</option>
                    ))}
                  </select>
                  <button className="btn btn-secondary" onClick={handleAssignField}>Save Field</button>
                </div>
                <div className="inline-input-row">
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    placeholder="Home goals"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                  />
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    placeholder="Away goals"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                  />
                </div>
                <button className="btn btn-success" onClick={handleSaveResult}>Save Result</button>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Standings</h3>
            </div>
            {!standings.length && <div className="muted-box mt-sm">No standings available.</div>}
            <div className="entity-list mt-sm">
              {standings.map((row, index) => (
                <div className="entity-card" key={row.teamId || index}>
                  <strong>#{index + 1} {row.team}</strong>
                  <p className="compact-text compact-text-spaced">
                    <strong>Points:</strong> {row.points} &nbsp;|&nbsp;
                    <strong>Played:</strong> {row.played} &nbsp;|&nbsp;
                    <strong>GF:</strong> {row.goalsFor} &nbsp;
                    <strong>GA:</strong> {row.goalsAgainst} &nbsp;|&nbsp;
                    <strong>GD:</strong> {row.goalDifference}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
