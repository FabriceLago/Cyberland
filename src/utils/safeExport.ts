/**
 * Shared defensive export utilities for CSV, XML/SVG, and download filenames.
 */

const CSV_FORMULA_TRIGGER = /^[\s]*[=+\-@\t\r]/;
const XML_ILLEGAL_CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/**
 * Neutralizes spreadsheet formula injection (CSV/DDE injection) and escapes quotes/newlines.
 */
export function sanitizeCsvCell(value: string | number): string {
  const normalized = String(value)
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(XML_ILLEGAL_CONTROL_CHARS, '');
  const safeValue = CSV_FORMULA_TRIGGER.test(normalized) ? `'${normalized}` : normalized;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

/**
 * Escapes all XML 1.0 special characters and strips illegal control characters
 * to prevent SVG/XML markup or attribute injection.
 */
export function sanitizeXmlText(value: string): string {
  return value
    .replace(XML_ILLEGAL_CONTROL_CHARS, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Produces a safe ASCII filename slug with a guaranteed non-empty fallback.
 */
export function sanitizeFilenameSlug(value: string, fallback = 'cyberland'): string {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || fallback;
}
