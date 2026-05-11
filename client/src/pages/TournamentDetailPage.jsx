import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const SPORT_LABEL = { football: 'Calcio', volleyball: 'Pallavolo', basketball: 'Basket' };

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('it-IT');
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function matchDateStr(d) {
  if (!d) return '';
  return new Date(d).toISOString().split('T')[0];
}

function isPastDate(dateStr) {
  return matchDateStr(dateStr) < today();
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function TeamSection({ tournament, isCreator, onRefresh }) {
  const [playersByTeam, setPlayersByTeam] = useState({});
  const [expanded, setExpanded] = useState(new Set());
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [addingTeam, setAddingTeam] = useState(false);
  const [addPlayerTeam, setAddPlayerTeam] = useState(null);
  const [newPlayer, setNewPlayer] = useState({ name: '', surname: '', jersey_number: '' });
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [error, setError] = useState('');

  const loadPlayers = async (teamId) => {
    if (playersByTeam[teamId]) return;
    try {
      const players = await api.getPlayers(tournament.id, teamId);
      setPlayersByTeam((prev) => ({ ...prev, [teamId]: players }));
    } catch {
      // silently fail
    }
  };

  const toggleTeam = (teamId) => {
    const next = new Set(expanded);
    if (next.has(teamId)) {
      next.delete(teamId);
    } else {
      next.add(teamId);
      loadPlayers(teamId);
    }
    setExpanded(next);
  };

  const handleAddTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setAddingTeam(true);
    setError('');
    try {
      await api.addTeam(tournament.id, { name: newTeamName.trim() });
      setNewTeamName('');
      setShowAddTeam(false);
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingTeam(false);
    }
  };

  const handleAddPlayer = async (e, teamId) => {
    e.preventDefault();
    if (!newPlayer.name.trim() || !newPlayer.surname.trim()) return;
    setAddingPlayer(true);
    setError('');
    try {
      const payload = {
        name: newPlayer.name.trim(),
        surname: newPlayer.surname.trim(),
        jersey_number: newPlayer.jersey_number ? parseInt(newPlayer.jersey_number) : null,
      };
      await api.addPlayer(tournament.id, teamId, payload);
      setNewPlayer({ name: '', surname: '', jersey_number: '' });
      setAddPlayerTeam(null);
      // reload players for this team
      const players = await api.getPlayers(tournament.id, teamId);
      setPlayersByTeam((prev) => ({ ...prev, [teamId]: players }));
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingPlayer(false);
    }
  };

  const teamsCount = tournament.teams.length;
  const maxTeams = tournament.max_teams;

  return (
    <div className="tab-section">
      <div className="section-top">
        <span className="section-info">
          {teamsCount}/{maxTeams} squadre registrate
        </span>
        {isCreator && teamsCount < maxTeams && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddTeam((v) => !v)}>
            {showAddTeam ? 'Annulla' : '+ Aggiungi squadra'}
          </button>
        )}
      </div>

      {showAddTeam && (
        <form className="inline-form" onSubmit={handleAddTeam}>
          <input
            className="form-control"
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Nome squadra"
            autoFocus
          />
          <button className="btn btn-success btn-sm" type="submit" disabled={addingTeam}>
            {addingTeam ? 'Aggiunta...' : 'Aggiungi'}
          </button>
        </form>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {tournament.teams.length === 0 ? (
        <div className="empty-state">
          Nessuna squadra ancora.{' '}
          {isCreator && 'Aggiungi la prima squadra per iniziare!'}
        </div>
      ) : (
        <div className="teams-list">
          {tournament.teams.map((team) => (
            <div key={team.id} className="team-item">
              <button className="team-header" onClick={() => toggleTeam(team.id)}>
                <span className="team-toggle">{expanded.has(team.id) ? '▼' : '▶'}</span>
                <span className="team-name">{team.name}</span>
                <span className="team-count">
                  {playersByTeam[team.id]
                    ? `${playersByTeam[team.id].length} giocatori`
                    : ''}
                </span>
              </button>

              {expanded.has(team.id) && (
                <div className="team-players">
                  {!playersByTeam[team.id] ? (
                    <div className="loading-sm">Caricamento...</div>
                  ) : playersByTeam[team.id].length === 0 ? (
                    <p className="empty-sm">Nessun giocatore.</p>
                  ) : (
                    <table className="players-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Nome</th>
                          <th>Cognome</th>
                          <th>Maglia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {playersByTeam[team.id].map((p, i) => (
                          <tr key={p.id}>
                            <td className="muted">{i + 1}</td>
                            <td>{p.name}</td>
                            <td>{p.surname}</td>
                            <td className="muted">{p.jersey_number ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {isCreator && (
                    <div className="add-player-section">
                      {addPlayerTeam === team.id ? (
                        <form
                          className="inline-form player-form"
                          onSubmit={(e) => handleAddPlayer(e, team.id)}
                        >
                          <input
                            className="form-control form-control-sm"
                            type="text"
                            value={newPlayer.name}
                            onChange={(e) =>
                              setNewPlayer((p) => ({ ...p, name: e.target.value }))
                            }
                            placeholder="Nome"
                            autoFocus
                          />
                          <input
                            className="form-control form-control-sm"
                            type="text"
                            value={newPlayer.surname}
                            onChange={(e) =>
                              setNewPlayer((p) => ({ ...p, surname: e.target.value }))
                            }
                            placeholder="Cognome"
                          />
                          <input
                            className="form-control form-control-sm num-input"
                            type="number"
                            value={newPlayer.jersey_number}
                            onChange={(e) =>
                              setNewPlayer((p) => ({ ...p, jersey_number: e.target.value }))
                            }
                            placeholder="N° maglia"
                            min="1"
                            max="99"
                          />
                          <button
                            className="btn btn-success btn-sm"
                            type="submit"
                            disabled={addingPlayer}
                          >
                            {addingPlayer ? '...' : 'Salva'}
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            type="button"
                            onClick={() => setAddPlayerTeam(null)}
                          >
                            Annulla
                          </button>
                        </form>
                      ) : (
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={() => setAddPlayerTeam(team.id)}
                        >
                          + Aggiungi giocatore
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MatchesSection({ tournament, isCreator, onRefresh }) {
  const [generating, setGenerating] = useState(false);
  const [resultForms, setResultForms] = useState({});
  const [submitting, setSubmitting] = useState(null);
  const [fieldForms, setFieldForms] = useState({});
  const [fields, setFields] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isCreator) {
      api.getFields().then(setFields).catch(() => {});
    }
  }, [isCreator]);

  const handleGenerate = async () => {
    if (!window.confirm('Generare il calendario? Le partite esistenti verranno sostituite.')) return;
    setGenerating(true);
    setError('');
    try {
      await api.generateMatches(tournament.id);
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const openResultForm = (matchId) => {
    setResultForms((prev) => ({
      ...prev,
      [matchId]: { score1: '', score2: '' },
    }));
  };

  const handleResultSubmit = async (e, matchId) => {
    e.preventDefault();
    const { score1, score2 } = resultForms[matchId];
    if (score1 === '' || score2 === '') return;
    setSubmitting(matchId);
    setError('');
    try {
      await api.enterResult(matchId, {
        score1: parseInt(score1),
        score2: parseInt(score2),
      });
      setResultForms((prev) => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(null);
    }
  };

  const handleAssignField = async (matchId, fieldId) => {
    try {
      await api.updateMatch(matchId, { field_id: fieldId ? parseInt(fieldId) : null });
      setFieldForms((prev) => ({ ...prev, [matchId]: undefined }));
      onRefresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const allTeamsRegistered = tournament.teams.length === tournament.max_teams;
  const canGenerate = isCreator && allTeamsRegistered;

  return (
    <div className="tab-section">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="section-top">
        {canGenerate && (
          <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generazione...' : '⚙ Genera calendario'}
          </button>
        )}
        {isCreator && !allTeamsRegistered && (
          <p className="muted-note">
            Registra tutte le squadre per generare il calendario ({tournament.teams.length}/{tournament.max_teams}).
          </p>
        )}
      </div>

      {tournament.matches.length === 0 ? (
        <div className="empty-state">Nessuna partita pianificata.</div>
      ) : (
        <div className="matches-list">
          {tournament.matches.map((m) => {
            const played = m.score1 !== null;
            const pastDate = isPastDate(m.date);
            const canEnter = isCreator && !played && pastDate;

            return (
              <div key={m.id} className={`match-item ${played ? 'match-played' : ''}`}>
                <div className="match-date">
                  {formatDate(m.date)}
                  {m.field_name && !isCreator && (
                    <span className="match-field-label"> · 📍 {m.field_name}</span>
                  )}
                </div>
                <div className="match-teams">
                  <span className="team-name-match">{m.team1_name}</span>
                  <span className="match-score">
                    {played ? `${m.score1} – ${m.score2}` : 'vs'}
                  </span>
                  <span className="team-name-match">{m.team2_name}</span>
                </div>
                <div className="match-status">
                  {played ? (
                    <span className="badge badge-played">Giocata</span>
                  ) : (
                    <span className="badge badge-upcoming">In programma</span>
                  )}
                </div>
                <div className="match-actions">
                  {!played && isCreator && (
                    fieldForms[m.id] ? (
                      <div className="field-assign-form">
                        <select
                          className="form-control form-control-sm"
                          defaultValue={m.field_id || ''}
                          onChange={(e) => handleAssignField(m.id, e.target.value)}
                        >
                          <option value="">— Nessun campo —</option>
                          {fields
                            .filter((f) => f.sport_type === tournament.sport)
                            .map((f) => (
                              <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                        <button
                          className="btn btn-secondary btn-xs"
                          type="button"
                          onClick={() => setFieldForms((prev) => ({ ...prev, [m.id]: undefined }))}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-outline btn-xs"
                        onClick={() => setFieldForms((prev) => ({ ...prev, [m.id]: true }))}
                      >
                        📍 {m.field_name ? m.field_name : 'Assegna campo'}
                      </button>
                    )
                  )}
                  {played && m.field_name && (
                    <span className="match-field-label">📍 {m.field_name}</span>
                  )}
                  {canEnter && !resultForms[m.id] && (
                    <button
                      className="btn btn-outline btn-xs"
                      onClick={() => openResultForm(m.id)}
                    >
                      Inserisci risultato
                    </button>
                  )}
                  {resultForms[m.id] && (
                    <form
                      className="result-form"
                      onSubmit={(e) => handleResultSubmit(e, m.id)}
                    >
                      <input
                        type="number"
                        min="0"
                        className="score-input"
                        value={resultForms[m.id].score1}
                        onChange={(e) =>
                          setResultForms((prev) => ({
                            ...prev,
                            [m.id]: { ...prev[m.id], score1: e.target.value },
                          }))
                        }
                        placeholder="0"
                      />
                      <span className="dash">–</span>
                      <input
                        type="number"
                        min="0"
                        className="score-input"
                        value={resultForms[m.id].score2}
                        onChange={(e) =>
                          setResultForms((prev) => ({
                            ...prev,
                            [m.id]: { ...prev[m.id], score2: e.target.value },
                          }))
                        }
                        placeholder="0"
                      />
                      <button
                        className="btn btn-success btn-xs"
                        type="submit"
                        disabled={submitting === m.id}
                      >
                        {submitting === m.id ? '...' : 'Salva'}
                      </button>
                      <button
                        className="btn btn-secondary btn-xs"
                        type="button"
                        onClick={() =>
                          setResultForms((prev) => {
                            const next = { ...prev };
                            delete next[m.id];
                            return next;
                          })
                        }
                      >
                        ✕
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StandingsSection({ tournamentId, sport }) {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getStandings(tournamentId)
      .then(setStandings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tournamentId]);

  if (loading) return <div className="loading">Caricamento classifica...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (standings.length === 0) return <div className="empty-state">Nessun dato disponibile.</div>;

  const isFootball = sport === 'football';

  return (
    <div className="tab-section">
      <div className="table-responsive">
        <table className="table standings-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Squadra</th>
              <th title="Partite giocate">PG</th>
              <th title="Punti">Pt</th>
              <th title={isFootball ? 'Gol fatti' : 'Punti fatti'}>{isFootball ? 'GF' : 'PF'}</th>
              <th title={isFootball ? 'Gol subiti' : 'Punti subiti'}>{isFootball ? 'GS' : 'PS'}</th>
              <th title="Differenza">{isFootball ? 'DR' : 'DP'}</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => (
              <tr key={row.team_id} className={i === 0 ? 'standings-leader' : ''}>
                <td className="pos-cell">{i + 1}</td>
                <td className="team-cell">{row.team_name}</td>
                <td>{row.matches_played}</td>
                <td className="points-cell">{row.points}</td>
                <td>{row.goals_scored}</td>
                <td>{row.goals_conceded}</td>
                <td className={row.goal_difference > 0 ? 'positive' : row.goal_difference < 0 ? 'negative' : ''}>
                  {row.goal_difference > 0 ? '+' : ''}{row.goal_difference}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function TournamentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [activeTab, setActiveTab] = useState('teams');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    api
      .getTournament(id)
      .then(setTournament)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!window.confirm('Eliminare il torneo? Questa azione è irreversibile.')) return;
    setDeleting(true);
    try {
      await api.deleteTournament(id);
      navigate('/tournaments');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  if (loading) return <div className="loading">Caricamento torneo...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!tournament) return null;

  const isCreator = user && user.id === tournament.creator_id;

  return (
    <div className="page">
      <Link to="/tournaments" className="back-link">
        ← Torna ai tornei
      </Link>

      <div className="tournament-header card">
        <div className="tournament-header-top">
          <div>
            <h1 className="page-title">{tournament.name}</h1>
            <div className="tournament-meta">
              <span className={`badge badge-${tournament.sport}`}>
                {SPORT_LABEL[tournament.sport]}
              </span>
              <span className="meta-item">
                👤 {tournament.creator_username}
              </span>
              <span className="meta-item">
                📅 Inizio: {formatDate(tournament.start_date)}
              </span>
              <span className="meta-item">
                🏆 Max squadre: {tournament.max_teams}
              </span>
            </div>
          </div>
          {isCreator && (
            <div className="creator-actions">
              <Link to={`/tournaments/${id}/edit`} className="btn btn-secondary btn-sm">
                ✏️ Modifica
              </Link>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? '...' : '🗑 Elimina'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="tabs">
        {['teams', 'matches', 'standings'].map((tab) => (
          <button
            key={tab}
            className={`tab-btn${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'teams' && '👥 Squadre'}
            {tab === 'matches' && '⚽ Partite'}
            {tab === 'standings' && '🏅 Classifica'}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'teams' && (
          <TeamSection tournament={tournament} isCreator={isCreator} onRefresh={load} />
        )}
        {activeTab === 'matches' && (
          <MatchesSection tournament={tournament} isCreator={isCreator} onRefresh={load} />
        )}
        {activeTab === 'standings' && (
          <StandingsSection tournamentId={id} sport={tournament.sport} />
        )}
      </div>
    </div>
  );
}
