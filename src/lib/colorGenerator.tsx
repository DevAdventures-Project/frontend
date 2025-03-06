export function generateColorFromUsername(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }

  const color = `#${((hash >> 8) & 0xffffff).toString(16).padStart(6, "0")}`;

  return color;
}
