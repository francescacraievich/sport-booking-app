export function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('it-IT');
}

export function formatTime(t) {
  return t ? t.substring(0, 5) : '';
}

export function today() {
  return new Date().toISOString().split('T')[0];
}

export function toDateStr(d) {
  return new Date(d).toISOString().split('T')[0];
}

export function isPastDate(dateStr) {
  return toDateStr(dateStr) < today();
}
