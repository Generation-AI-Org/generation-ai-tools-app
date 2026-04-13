// lib/sanitize.ts
// Server-side HTML sanitization using isomorphic-dompurify
// Works in both browser and Node.js without jsdom dependency
// Source: CONTEXT.md D-07, D-10

import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize user input before storing in database.
 * Removes XSS vectors while preserving safe formatting.
 *
 * @param input - Raw user input string
 * @returns Sanitized string safe for storage
 */
export function sanitizeUserInput(input: string): string {
  return DOMPurify.sanitize(input, {
    // Allow basic text formatting tags that might come from copy-paste
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
    // Only allow href and title on links
    ALLOWED_ATTR: ['href', 'title'],
    // Disallow data-* attributes (potential XSS vector)
    ALLOW_DATA_ATTR: false,
  })
}
