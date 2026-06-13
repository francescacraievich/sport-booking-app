import { useState } from "react";
import { api } from "../apiClient";
import { sportLabel } from "../utils";

// Search page: independent search for teams, players and users
export default function SearchPage() {
  const [teamsQuery, setTeamsQuery] = useState("");
  const [teamsList, setTeamsList] = useState([]);

  const [playersQuery, setPlayersQuery] = useState("");
  const [playersList, setPlayersList] = useState([]);

  const [usersQuery, setUsersQuery] = useState("");
  const [usersList, setUsersList] = useState([]);
  const [userDetails, setUserDetails] = useState(null);

  const [message, setMessage] = useState("");

  async function handleSearchTeams() {
    try {
      const data = await api.searchTeams(teamsQuery.trim());
      setTeamsList(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleSearchPlayers() {
    try {
      const data = await api.searchPlayers(playersQuery.trim());
      setPlayersList(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleLoadUsers() {
    try {
      const data = await api.getUsers(usersQuery.trim());
      setUsersList(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (err) {
      setMessage(err.message);
    }
  }

  // Loads full user detail including their tournaments
  async function handleLoadUserDetails(id) {
    try {
      const data = await api.getUserById(id);
      setUserDetails(data);
    } catch (err) {
      setMessage(err.message);
    }
  }

  const tournaments = Array.isArray(userDetails?.tournaments)
    ? userDetails.tournaments
    : [];

  return (
    <section>
      <div className="section-header">
        <h2>Search</h2>
        <p>Search for teams, players and users</p>
      </div>

      {message && <div className="card mb-md">{message}</div>}

      <div className="cards-grid">
        {/* TEAMS */}
        <div className="card">
          <h3>Teams</h3>
          <div className="form-group">
            <input
              className="form-input"
              placeholder="Search team..."
              value={teamsQuery}
              onChange={(e) => setTeamsQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchTeams()}
            />
            <button className="btn btn-primary" onClick={handleSearchTeams}>
              Search
            </button>
          </div>
          <div className="list-container">
            {teamsList.map((team) => (
              <div className="item" key={team._id}>
                <h4>{team.name || "Team"}</h4>
                <p><strong>Tournament:</strong> {team.tournament?.name || "-"}</p>
              </div>
            ))}
            {teamsQuery && teamsList.length === 0 && (
              <div className="muted-box">No teams found.</div>
            )}
          </div>
        </div>

        {/* PLAYERS */}
        <div className="card">
          <h3>Players</h3>
          <div className="form-group">
            <input
              className="form-input"
              placeholder="Search player..."
              value={playersQuery}
              onChange={(e) => setPlayersQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchPlayers()}
            />
            <button className="btn btn-primary" onClick={handleSearchPlayers}>
              Search
            </button>
          </div>
          <div className="list-container">
            {playersList.map((player, index) => (
              <div className="item" key={player._id || `${player.name}-${index}`}>
                <h4>{player.name} {player.surname}</h4>
                <p><strong>Jersey number:</strong> {player.jerseyNumber ?? "-"}</p>
                <p><strong>Team:</strong> {player.team?.name || "-"}</p>
                <p><strong>Tournament:</strong> {player.team?.tournament?.name || "-"}</p>
              </div>
            ))}
            {playersQuery && playersList.length === 0 && (
              <div className="muted-box">No players found.</div>
            )}
          </div>
        </div>

        {/* USERS */}
        <div className="card">
          <h3>Users</h3>
          <div className="form-group">
            <input
              className="form-input"
              placeholder="Username, first name or last name..."
              value={usersQuery}
              onChange={(e) => setUsersQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoadUsers()}
            />
            <button className="btn btn-primary" onClick={handleLoadUsers}>
              Search
            </button>
          </div>
          <div className="list-container">
            {usersList.map((searchedUser) => (
              <div key={searchedUser._id}>
                <div className="item">
                  <h4>{searchedUser.username}</h4>
                  <p><strong>Name:</strong> {searchedUser.name} {searchedUser.surname}</p>
                  <p>
                    <strong>Tournaments created:</strong>{" "}
                    {Array.isArray(searchedUser.tournaments) ? searchedUser.tournaments.length : 0}
                  </p>
                  <div className="small-actions">
                    <button onClick={() =>
                      userDetails?._id === searchedUser._id
                        ? setUserDetails(null)
                        : handleLoadUserDetails(searchedUser._id)
                    }>
                      {userDetails?._id === searchedUser._id ? "Close" : "Details"}
                    </button>
                  </div>
                </div>

                {userDetails?._id === searchedUser._id && (
                  <div className="user-detail-inline">
                    <p className="detail-section-label">Tournaments created:</p>
                    {tournaments.length === 0 && (
                      <div className="muted-box">No tournaments created.</div>
                    )}
                    <div className="entity-list">
                      {tournaments.map((tournament) => (
                        <div className="entity-card" key={tournament._id}>
                          <strong>{tournament.name}</strong>
                          <p className="compact-text compact-text-spaced">
                            <strong>Sport:</strong> {sportLabel(tournament.sport)}&nbsp;|&nbsp;
                            <strong>Max teams:</strong> {tournament.maxTeams}&nbsp;|&nbsp;
                            <strong>Start:</strong> {tournament.startDate || "-"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {usersQuery && usersList.length === 0 && (
              <div className="muted-box">No users found.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
