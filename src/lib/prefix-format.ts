/**
 * Prefix format utility for generating custom formatted IDs
 * Handles format patterns like DOC-{0000}, INV-{year}{MM}-{0000}, etc.
 */

export interface PrefixSettings {
  prefix: string;
  sequence: number;
}

/**
 * Format an ID using the prefix pattern and sequence number
 * @param prefix - The prefix format pattern (e.g., "DOC-{0000}", "INV-{year}{MM}-{0000}")
 * @param sequence - The sequence number to format
 * @returns Formatted ID string
 */
export function formatId(prefix: string, sequence: number): string {
  const now = new Date();

  return prefix.replace(/\{([^}]+)\}/g, (match, placeholder) => {
    switch (placeholder) {
      // Sequence placeholders
      case '0':
        return String(sequence);
      case '000':
        return String(sequence).padStart(3, '0');
      case '0000':
        return String(sequence).padStart(4, '0');
      case '00000':
        return String(sequence).padStart(5, '0');

      // Year placeholders
      case 'year':
        return String(now.getFullYear());
      case 'YY':
        return String(now.getFullYear()).slice(-2);

      // Month placeholders
      case 'month':
      case 'MM':
        return String(now.getMonth() + 1).padStart(2, '0');

      // Day placeholders
      case 'day':
      case 'DD':
        return String(now.getDate()).padStart(2, '0');

      default:
        // Handle variable length padding: {0...n}
        const zeroMatch = placeholder.match(/^0+$/);
        if (zeroMatch) {
          return String(sequence).padStart(placeholder.length, '0');
        }
        return match;
    }
  });
}

/**
 * Generate a formatted ID for a specific entity type
 * @param settings - Prefix settings containing prefix and sequence
 * @param offset - Optional offset from the base sequence (e.g., for row index)
 * @returns Formatted ID string
 */
export function generateId(settings: PrefixSettings, offset: number = 0): string {
  const sequence = (settings.sequence || 1) + offset;
  return formatId(settings.prefix || '{0000}', sequence);
}

/**
 * Extract the base sequence number from a formatted ID
 * @param id - The formatted ID string
 * @param prefix - The prefix pattern used
 * @returns The sequence number, or null if unable to extract
 */
export function extractSequence(id: string, _prefix: string): number | null {
  // Remove static parts of the prefix to find the sequence
  // This is a simplified version - for complex patterns with dates,
  // the backend should store and return the sequence number
  const numericMatch = id.match(/\d+$/);
  if (numericMatch) {
    return parseInt(numericMatch[0], 10);
  }
  return null;
}
