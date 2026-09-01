// Deterministic warm gradient per fic id so a shelf of fics reads as varied
// without needing real cover art.
const SPINES = [
  ["#c9502f", "#a53d22"],
  ["#faa55a", "#c9502f"],
  ["#626cda", "#4a4fb0"],
  ["#8a7767", "#5c4f43"],
  ["#d97a4a", "#8a3f24"],
  ["#7d84e0", "#626cda"],
] as const;

export function spineFor(id: string): readonly [string, string] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return SPINES[hash % SPINES.length];
}
