/**
 * Generate a unique ID using timestamp and random string
 * This method significantly reduces the chance of collision
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substr(2, 9);
  const additionalRandom = Math.random().toString(36).substr(2, 5);

  return `${timestamp}-${randomPart}-${additionalRandom}`;
}

/**
 * Generate a shorter ID for UI components
 * Still has very low collision probability
 */
export function generateShortId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substr(2, 6);

  return `${timestamp}${randomPart}`;
}
