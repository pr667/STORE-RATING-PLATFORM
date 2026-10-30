// The backend runs .escape() on text, so "Joe's" is stored as "Joe&#x27;s".
// This turns those HTML entities back into normal characters for display.
// (React already protects against XSS when it renders text, so this is safe.)
export function decodeEntities(text: string | null | undefined): string {
  if (!text) return '';
  const el = document.createElement('textarea');
  el.innerHTML = text;
  return el.value;
}

// Postgres NUMERIC values arrive as strings like "4.50", so convert first
export function formatRating(value: string | number | null | undefined): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(1) : '0.0';
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}