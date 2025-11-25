/**
 * Generate a URL-friendly project key (slug) from the provided name.
 * Mirrors the backend logic so the client preview matches persisted values.
 */
export function generateProjectKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Drop special characters
    .trim()
    .replace(/\s+/g, '-') // Spaces -> hyphen
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '') // Trim hyphens at ends
    .substring(0, 30); // Limit length
}
