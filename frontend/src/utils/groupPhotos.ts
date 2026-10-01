/** Splits photos, in order, into groups of `size` (default 2); a trailing odd photo is its own group. */
export function groupPhotos<T>(items: T[], size = 2): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) groups.push(items.slice(i, i + size));
  return groups;
}
