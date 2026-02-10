export function monsterUrl(seed, size = 300) {
  // RoboHash monster set: set2
  // Example: https://robohash.org/ice-beast?set=set2&size=300x300
  const s = encodeURIComponent(seed || "anjett");
  return `https://robohash.org/${s}?set=set2&size=${size}x${size}`;
}
