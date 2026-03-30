interface Subtitle {
  start: number; // seconds from loading complete (session list visible)
  end: number;
  text: string;
}

// Timed to demo.tape script:
// 0s      session list visible
// 0~2.65s j/k navigation
// 2.65s   o (sort)
// 4.65s   o (sort back)
// 5.65s   p (preview)
// 11.75s  Esc (back)
// 12.75s  b (bookmark)
// 14.55s  Tab Tab (bookmarks tab)
// 16.55s  Shift+Tab (back)
// 17.55s  / (search)
// 20.25s  Esc (close search)
// 21.25s  ? (help)
// 24.25s  ? (close help)
// 25.25s  Enter (dive menu)
// 27.25s  Enter (confirm dive)
// VHS adds ~0.1s overhead per key input beyond Sleep times.
// Cumulative drift: +0.5s by sort, +1s by preview, +1.5s by bookmark, +2s by search, +2.5s by help
const subtitles: Subtitle[] = [
  { start: 0, end: 3, text: "Browse all Claude Code sessions" },
  { start: 3, end: 6.5, text: "Sort by recent or message count" },
  { start: 6.5, end: 13.5, text: "Preview full conversations" },
  { start: 14, end: 16.5, text: "Bookmark important sessions" },
  { start: 16.5, end: 20, text: "View your bookmarks" },
  { start: 20, end: 24, text: "Search through conversations" },
  { start: 24, end: 28, text: "Help shows all keybindings" },
  { start: 28, end: 30, text: "Choose how to dive" },
  { start: 30, end: 35, text: "Dive into your sessions" },
];

export function getSubtitle(elapsedMs: number): string | null {
  const elapsed = elapsedMs / 1000;
  for (const sub of subtitles) {
    if (elapsed >= sub.start && elapsed < sub.end) {
      return sub.text;
    }
  }
  return null;
}
