/**
 * Shared helper utilities used by scrapers and screens.
 */

/** Strip excessive whitespace and non-breaking spaces from a string. */
export function cleanText(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Normalise a raw date string from the portal.
 * TODO: Adapt this function to match the portal's actual date format.
 */
export function parseDate(raw: string): string {
  if (!raw) return '';
  return raw.trim();
}

/**
 * Return the colour category for a Dutch grade (1–10 scale).
 *   ≥ 6.0  → green  (pass)
 *   5.0–5.9 → orange (borderline)
 *   < 5.0  → red    (fail)
 */
export function gradeColor(value: number): 'green' | 'orange' | 'red' {
  if (value >= 6.0) return 'green';
  if (value >= 5.0) return 'orange';
  return 'red';
}

/** Format a numeric grade for Dutch display – e.g. 7.8 → "7,8". */
export function formatGrade(value: number): string {
  return value.toFixed(1).replace('.', ',');
}
