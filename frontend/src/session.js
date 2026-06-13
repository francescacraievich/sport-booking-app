const TOKEN_KEY = "sport_token";

// Returns the JWT token from localStorage, or empty string if not present
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
