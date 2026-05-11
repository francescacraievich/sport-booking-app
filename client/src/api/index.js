const BASE = '/api';

async function req(endpoint, opts = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opts.headers,
  };

  const res = await fetch(`${BASE}${endpoint}`, { ...opts, headers });
  const data = await res.json().catch(() => null);

  if (!res.ok) throw new Error((data && data.error) || `Errore ${res.status}`);
  return data;
}

const body = (d) => JSON.stringify(d);

export const api = {
  // Auth
  signup: (d) => req('/auth/signup', { method: 'POST', body: body(d) }),
  signin: (d) => req('/auth/signin', { method: 'POST', body: body(d) }),
  whoami: () => req('/whoami'),

  // Fields
  getFields: (q) => req(`/fields${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getField: (id) => req(`/fields/${id}`),
  getSlots: (fieldId, date) => req(`/fields/${fieldId}/slots?date=${date}`),
  bookSlot: (fieldId, d) => req(`/fields/${fieldId}/bookings`, { method: 'POST', body: body(d) }),
  cancelBooking: (fieldId, bookingId) =>
    req(`/fields/${fieldId}/bookings/${bookingId}`, { method: 'DELETE' }),

  // My bookings
  getMyBookings: () => req('/bookings'),

  // Tournaments
  getTournaments: (q) => req(`/tournaments${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getTournament: (id) => req(`/tournaments/${id}`),
  createTournament: (d) => req('/tournaments', { method: 'POST', body: body(d) }),
  updateTournament: (id, d) => req(`/tournaments/${id}`, { method: 'PUT', body: body(d) }),
  deleteTournament: (id) => req(`/tournaments/${id}`, { method: 'DELETE' }),

  // Teams
  addTeam: (tId, d) => req(`/tournaments/${tId}/teams`, { method: 'POST', body: body(d) }),

  // Players
  getPlayers: (tId, teamId) => req(`/tournaments/${tId}/teams/${teamId}/players`),
  addPlayer: (tId, teamId, d) =>
    req(`/tournaments/${tId}/teams/${teamId}/players`, { method: 'POST', body: body(d) }),

  // Matches
  generateMatches: (tId) => req(`/tournaments/${tId}/matches/generate`, { method: 'POST' }),
  getMatches: (tId) => req(`/tournaments/${tId}/matches`),
  getMatch: (id) => req(`/matches/${id}`),
  updateMatch: (matchId, d) => req(`/matches/${matchId}`, { method: 'PUT', body: body(d) }),
  enterResult: (matchId, d) => req(`/matches/${matchId}/result`, { method: 'PUT', body: body(d) }),

  // Standings
  getStandings: (tId) => req(`/tournaments/${tId}/standings`),

  // Users
  getUsers: (q) => req(`/users${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getUser: (id) => req(`/users/${id}`),

  // Global search
  getTeams: (q) => req(`/teams${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getPlayersSearch: (q) => req(`/players${q ? `?q=${encodeURIComponent(q)}` : ''}`),
};
