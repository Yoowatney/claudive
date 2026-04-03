import { useState, useEffect, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { getSessionPreview, type ToolStats } from "../lib/scanner.js";
import { useScrollable } from "../hooks/useScrollable.js";
import type { Session, PreviewMessage } from "../lib/scanner.js";

interface Props {
  session: Session;
  onClose: () => void;
  onSelect?: (session: Session) => void;
  demoData?: PreviewMessage[];
  demoSubtitle?: string | null;
}

function wrapText(text: string, width: number): string[] {
  const result: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (paragraph.length <= width) {
      result.push(paragraph);
      continue;
    }
    let remaining = paragraph;
    while (remaining.length > width) {
      let breakAt = remaining.lastIndexOf(" ", width);
      if (breakAt <= 0) breakAt = width;
      result.push(remaining.slice(0, breakAt));
      remaining = remaining.slice(breakAt).trimStart();
    }
    if (remaining) result.push(remaining);
  }
  return result;
}

interface DisplayLine {
  role: "user" | "assistant" | "separator";
  text: string;
  isFirstLine: boolean;
}

function buildDisplayLines(
  messages: PreviewMessage[],
  width: number,
): DisplayLine[] {
  const lines: DisplayLine[] = [];
  const contentWidth = width - 6; // padding for "You: " / "AI:  "

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const wrapped = wrapText(msg.text, Math.max(contentWidth, 40));

    wrapped.forEach((line, j) => {
      lines.push({
        role: msg.role,
        text: line,
        isFirstLine: j === 0,
      });
    });

    if (i < messages.length - 1) {
      lines.push({ role: "separator", text: "", isFirstLine: false });
    }
  }
  return lines;
}

function classifySession(stats: ToolStats): string {
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  if (total === 0) return "💬 Conversation";

  const get = (name: string) => stats[name] || 0;
  const edit = get("Edit") + get("Write");
  const bash = get("Bash");
  const read = get("Read") + get("Grep") + get("Glob");
  const write = get("Write");
  const agent = get("Agent");
  const skill = get("Skill");
  const notebook = get("NotebookEdit");
  const web = get("WebFetch") + get("WebSearch");

  const top3 = Object.entries(stats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, count]) => `${name}:${count}`)
    .join(" ");

  if (total < 5) return `💬 Conversation (${top3})`;
  if (notebook > 0) return `📓 Notebook work (${top3})`;
  if (web > 0) return `🌐 Web research (${top3})`;
  if (skill > 0 && skill >= total * 0.3) return `⚡ Skill execution (${top3})`;
  if (agent > 0 && agent >= total * 0.1) return `🤖 Agentic workflow (${top3})`;
  if (write > get("Edit")) return `📝 File creation (${top3})`;
  if (read > edit && read > bash) return `🔍 Code exploration (${top3})`;
  if (edit > bash && edit > read) return `🔨 Code editing (${top3})`;
  if (bash > edit && bash > read) return `🐛 Debugging / Building (${top3})`;
  if (Math.abs(edit - bash) / Math.max(edit, bash, 1) < 0.2) return `🔄 Build & iterate (${top3})`;

  return `🔧 Mixed (${top3})`;
}

export default function Preview({ session, onClose, onSelect, demoData, demoSubtitle }: Props) {
  const [messages, setMessages] = useState<PreviewMessage[]>([]);
  const [toolStats, setToolStats] = useState<ToolStats>({});
  const [model, setModel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);

  useEffect(() => {
    if (demoData) {
      setMessages(demoData);
      setLoading(false);
      return;
    }
    setLoading(true);
    getSessionPreview(session.id, session.project).then((result) => {
      setMessages(result.messages);
      setToolStats(result.toolStats);
      setModel(result.model);
      setLoading(false);
    });
  }, [session.id, session.project, demoData]);

  const termWidth = process.stdout.columns || 80;
  const termHeight = process.stdout.rows || 24;
  const maxVisible = termHeight - 8;

  const displayLines = useMemo(
    () => buildDisplayLines(messages, termWidth - 4),
    [messages, termWidth],
  );

  // Find matching line indices
  const matchIndices = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return displayLines
      .map((line, i) => (line.text.toLowerCase().includes(q) ? i : -1))
      .filter((i) => i >= 0);
  }, [displayLines, searchQuery]);

  const { scroll, scrollPct, setScroll } = useScrollable({
    totalLines: displayLines.length,
    maxVisible,
    onClose,
    onSelect: onSelect ? () => onSelect(session) : undefined,
    active: !searchMode,
  });

  // Jump to current match
  useEffect(() => {
    if (matchIndices.length > 0 && matchIndex < matchIndices.length) {
      const targetLine = matchIndices[matchIndex];
      setScroll(Math.max(0, targetLine - Math.floor(maxVisible / 2)));
    }
  }, [matchIndex, matchIndices]);

  // Preview search input handler
  useInput((input, key) => {
    if (searchMode) {
      if (key.return) {
        setSearchMode(false);
        // Keep query active for n/N navigation
      }
      if (key.escape) {
        setSearchMode(false);
        setSearchQuery("");
        setMatchIndex(0);
      }
      if (key.ctrl && input === "u") {
        setSearchQuery("");
      }
      return;
    }

    // Normal mode — / to enter search, n/N to navigate matches
    if (input === "/") {
      setSearchMode(true);
      setSearchQuery("");
      setMatchIndex(0);
      return;
    }
    if (input === "n" && matchIndices.length > 0) {
      setMatchIndex((i) => (i + 1) % matchIndices.length);
      return;
    }
    if (input === "N" && matchIndices.length > 0) {
      setMatchIndex((i) => (i - 1 + matchIndices.length) % matchIndices.length);
      return;
    }
  });

  const visible = displayLines.slice(scroll, scroll + maxVisible);
  const matchSet = new Set(matchIndices);

  if (loading) {
    return (
      <Box flexDirection="column">
        <Text color="cyan">Loading preview...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box>
        <Text bold color="cyan">
          Preview
        </Text>
        <Text color="green"> {session.project}</Text>
        <Text dimColor> {session.id.slice(0, 8)}...</Text>
        <Text dimColor>
          {"  "}{messages.length} messages
        </Text>
        {model && <Text dimColor>{"  "}{model.replace("claude-", "")}</Text>}
      </Box>
      <Box>
        <Text dimColor>
          {classifySession(toolStats)}
        </Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        {visible.map((line, i) => {
          const globalIdx = scroll + i;
          const isMatch = matchSet.has(globalIdx);
          const isCurrentMatch = matchIndices[matchIndex] === globalIdx;

          if (line.role === "separator") {
            return (
              <Text key={`sep-${globalIdx}`} dimColor>
                {"─".repeat(Math.min(termWidth - 4, 60))}
              </Text>
            );
          }

          const prefix = line.isFirstLine
            ? line.role === "user"
              ? "You: "
              : "AI:  "
            : "     ";

          // Highlight matching lines
          const textColor = isCurrentMatch
            ? "yellow"
            : isMatch
              ? "yellow"
              : line.role === "user"
                ? "green"
                : "white";

          return (
            <Box key={`${globalIdx}`}>
              <Text
                color={line.role === "user" ? "green" : "white"}
                bold={line.role === "user" && line.isFirstLine}
                dimColor={line.role === "assistant" && !isMatch}
              >
                {prefix}
              </Text>
              <Text
                color={textColor}
                bold={isCurrentMatch}
                wrap="wrap"
              >
                {line.text}
              </Text>
              {isCurrentMatch && <Text color="yellow"> ◀</Text>}
            </Box>
          );
        })}
      </Box>

      {/* Search bar */}
      {searchMode && (
        <Box marginTop={1}>
          <Text color="yellow">/</Text>
          <TextInput value={searchQuery} onChange={setSearchQuery} />
          {matchIndices.length > 0 && (
            <Text dimColor> {matchIndex + 1}/{matchIndices.length}</Text>
          )}
        </Box>
      )}

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>
          {searchMode
            ? "[Enter] confirm  [Esc] cancel"
            : searchQuery
              ? `/${searchQuery} ${matchIndex + 1}/${matchIndices.length}  [n/N] next/prev  [/] new search  [Esc] clear`
              : `${scrollPct}% [j/k] line [u/d] page [g/G] top/bottom [/] search [Enter] resume [p/Esc] back`}
        </Text>
      </Box>

      {demoSubtitle && (
        <Box marginTop={1} justifyContent="center">
          <Text color="yellow" bold>{demoSubtitle}</Text>
        </Box>
      )}
    </Box>
  );
}
