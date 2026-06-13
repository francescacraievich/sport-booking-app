import { getToken } from "./session";

const BASE_URL = "/api"

async function request(path, options = {}) {
  const method = options.method || "GET";
  const body = options.body;
  const requiresAuth = options.auth || false;

  const headers = { "Content-Type": "application/json" };

  if (requiresAuth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = { message: "Non-JSON response" };
  }

  if (!response.ok) {
    throw new Error((data && data.error) || (data && data.message) || "API error");
  }

  return data;
}

function buildQueryString(params) {
  const validEntries = Object.entries(params)
    .filter(([key, value]) => value !== undefined && value !== null && value !== "");
  const qs = new URLSearchParams(validEntries).toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  // AUTH
  signup(payload) {
    return request("/auth/signup", { method: "POST", body: payload });
  },
  signin(payload) {
    return request("/auth/signin", { method: "POST", body: payload });
  },
  whoami() {
    return request("/whoami", { auth: true });
  },

  // FIELDS
  getFields(query = "", sport = "") {
    return request(`/fields${buildQueryString({ q: query, sport })}`);
  },
  getFieldById(id) {
    return request(`/fields/${id}`);
  },
  getSlots(fieldId, date) {
    return request(`/fields/${fieldId}/slots?date=${encodeURIComponent(date)}`);
  },
  bookSlot(fieldId, payload) {
    return request(`/fields/${fieldId}/bookings`, { method: "POST", body: payload, auth: true });
  },
  cancelBooking(fieldId, bookingId) {
    return request(`/fields/${fieldId}/bookings/${bookingId}`, { method: "DELETE", auth: true });
  },

  // TOURNAMENTS
  getTournaments(query = "", status = "") {
    return request(`/tournaments${buildQueryString({ q: query, status })}`);
  },
  getTournamentById(id) {
    return request(`/tournaments/${id}`);
  },
  createTournament(payload) {
    return request("/tournaments", { method: "POST", body: payload, auth: true });
  },
  updateTournament(id, payload) {
    return request(`/tournaments/${id}`, { method: "PUT", body: payload, auth: true });
  },
  deleteTournament(id) {
    return request(`/tournaments/${id}`, { method: "DELETE", auth: true });
  },
  generateMatches(id) {
    return request(`/tournaments/${id}/matches/generate`, { method: "POST", auth: true });
  },
  getMatches(id) {
    return request(`/tournaments/${id}/matches`);
  },
  getStandings(id) {
    return request(`/tournaments/${id}/standings`);
  },

  // TEAMS / PLAYERS
  createTeam(tournamentId, payload) {
    return request(`/tournaments/${tournamentId}/teams`, { method: "POST", body: payload, auth: true });
  },
  createPlayer(teamId, payload) {
    return request(`/teams/${teamId}/players`, { method: "POST", body: payload, auth: true });
  },
  searchTeams(query = "") {
    return request(`/teams${buildQueryString({ q: query })}`);
  },
  searchPlayers(query = "") {
    return request(`/players${buildQueryString({ q: query })}`);
  },

  // MATCHES
  getMatchById(id) {
    return request(`/matches/${id}`);
  },
  saveResult(id, payload) {
    return request(`/matches/${id}/result`, { method: "PUT", body: payload, auth: true });
  },
  assignField(id, fieldId) {
    return request(`/matches/${id}/field`, { method: "PUT", body: { fieldId }, auth: true });
  },

  // USERS
  getUsers(query = "") {
    return request(`/users${buildQueryString({ q: query })}`);
  },
  getUserById(id) {
    return request(`/users/${id}`);
  },
};
