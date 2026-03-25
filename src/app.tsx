import { useState, useEffect } from "react";
import { Box, Text, useApp, useInput } from "ink";
import TextInput from "ink-text-input";
import SessionList from "./components/SessionList.js";
import Preview from "./components/Preview.js";
import { scanSessions, groupByProject } from "./lib/scanner.js";
import { resumeSession } from "./lib/launcher.js";
import type { Session, ProjectSummary } from "./lib/scanner.js";

type View = "sessions" | "projects";

export default function App() {
  const { exit } = useApp();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("sessions");
  const [searchMode, setSearchMode] = useState(false);
  const [filter, setFilter] = useState("");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    scanSessions().then((result) => {
      setSessions(result);
      setProjects(groupByProject(result));
      setLoading(false);
      if (result.length > 0) setSelectedSession(result[0]);
    });
  }, []);

  useInput((input, key) => {
    if (searchMode) {
      if (key.escape) {
        setSearchMode(false);
        setFilter("");
      }
      return;
    }

    if (showPreview) {
      if (key.escape || input === "q" || input === "p") {
        setShowPreview(false);
      }
      return;
    }

    if (input === "q" || key.escape) {
      exit();
    }
    if (input === "/") {
      setSearchMode(true);
    }
    if (key.tab) {
      setView((v) => (v === "sessions" ? "projects" : "sessions"));
    }
    if (input === "p" && selectedSession) {
      setShowPreview(true);
    }
  });

  const handleSelect = (session: Session) => {
    exit();
    setTimeout(() => {
      resumeSession(session.id, session.projectPath);
    }, 100);
  };

  const handleCursorChange = (session: Session) => {
    setSelectedSession(session);
  };

  if (loading) {
    return (
      <Box>
        <Text color="cyan">⏳ Scanning sessions...</Text>
      </Box>
    );
  }

  if (showPreview && selectedSession) {
    return (
      <Preview
        session={selectedSession}
        onClose={() => setShowPreview(false)}
      />
    );
  }

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          claudash
        </Text>
        <Text dimColor> — Claude Code Session Dashboard</Text>
        <Text dimColor>
          {"  "}({sessions.length} sessions, {projects.length} projects)
        </Text>
      </Box>

      {/* Tabs */}
      <Box marginBottom={1} gap={2}>
        <Text
          bold={view === "sessions"}
          color={view === "sessions" ? "cyan" : "gray"}
        >
          [Sessions]
        </Text>
        <Text
          bold={view === "projects"}
          color={view === "projects" ? "cyan" : "gray"}
        >
          [Projects]
        </Text>
      </Box>

      {/* Projects view */}
      {view === "projects" && (
        <Box flexDirection="column" marginBottom={1}>
          {projects.map((p) => (
            <Box key={p.name}>
              <Text color="green" bold>
                {p.name.padEnd(18)}
              </Text>
              <Text>{String(p.sessionCount).padStart(5)} sessions</Text>
              <Text dimColor>
                {"  "}last: {p.lastActive.toLocaleDateString()}
              </Text>
            </Box>
          ))}
        </Box>
      )}

      {/* Sessions view */}
      {view === "sessions" && (
        <SessionList
          sessions={sessions}
          onSelect={handleSelect}
          onCursorChange={handleCursorChange}
          filter={filter}
        />
      )}

      {/* Search bar */}
      {searchMode && (
        <Box marginTop={1}>
          <Text color="yellow">/</Text>
          <TextInput value={filter} onChange={setFilter} />
        </Box>
      )}

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>
          {searchMode
            ? "[Esc] cancel search"
            : "[Enter] resume  [p] preview  [/] search  [Tab] switch view  [j/k] navigate  [q] quit"}
        </Text>
      </Box>
    </Box>
  );
}
