export interface LyricLine {
  time: number;
  text: string;
}

export function parseLRC(lrc: string): LyricLine[] {
  const lines = lrc.split("\n");
  const lyrics: LyricLine[] = [];

  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3], 10);

      // Convert to seconds
      const time = minutes * 60 + seconds + milliseconds / 1000;
      const text = line.replace(timeRegex, "").trim();

      if (text) {
        lyrics.push({ time, text });
      }
    }
  }

  return lyrics;
}
