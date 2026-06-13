// Returns true if the value is null, undefined or whitespace only
export function isEmpty(value) {
  const text = value !== null && value !== undefined ? String(value) : "";
  return text.trim() === "";
}

export function isValidDateInput(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

export function sportLabel(sport) {
  if (sport === "football") return "Football";
  if (sport === "volleyball") return "Volleyball";
  if (sport === "basketball") return "Basketball";
  return sport || "-";
}

export function statusLabel(status) {
  if (status === "played") return "Played";
  if (status === "upcoming") return "Upcoming";
  if (status === "active") return "Active";
  if (status === "completed") return "Completed";
  return status || "-";
}

// Returns today's date in YYYY-MM-DD format for date inputs
export function todayInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
