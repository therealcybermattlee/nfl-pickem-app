/**
 * Input sanitization utilities to prevent XSS attacks
 */

/**
 * Sanitize string input by removing potentially malicious characters
 * and trimming whitespace
 */
export function sanitizeString(input: string): string {
  if (!input) return '';

  // Trim whitespace
  let sanitized = input.trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(email: string): string {
  const sanitized = sanitizeString(email);

  // Basic email pattern check (more thorough validation should happen server-side)
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailPattern.test(sanitized) ? sanitized : '';
}

/**
 * Sanitize name input (allows letters, spaces, hyphens, apostrophes)
 */
export function sanitizeName(name: string): string {
  const sanitized = sanitizeString(name);

  // Allow only letters, spaces, hyphens, apostrophes, and dots
  return sanitized.replace(/[^a-zA-Z\s\-'.]/g, '');
}

/**
 * Prevent HTML/script injection by escaping special characters
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
