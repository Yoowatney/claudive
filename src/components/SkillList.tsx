import { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { scanSkills, getSkillContent, editSkill } from "../lib/skills.js";
import type { Skill } from "../lib/skills.js";

interface Props {
  onExit: () => void;
}

export default function SkillList({ onExit }: Props) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [cursor, setCursor] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scanSkills().then((result) => {
      setSkills(result);
      setLoading(false);
    });
  }, []);

  useInput((input, key) => {
    if (preview) {
      if (key.escape || input === "p" || input === "q") {
        setPreview(null);
      }
      return;
    }

    if (key.upArrow || input === "k") {
      setCursor((c) => Math.max(0, c - 1));
    }
    if (key.downArrow || input === "j") {
      setCursor((c) => Math.min(skills.length - 1, c + 1));
    }
    if (input === "p" && skills[cursor]) {
      getSkillContent(skills[cursor]).then(setPreview);
    }
    if (input === "e" && skills[cursor]) {
      editSkill(skills[cursor]);
      // Reload after edit
      scanSkills().then(setSkills);
    }
  });

  if (loading) {
    return <Text dimColor>Scanning skills...</Text>;
  }

  if (skills.length === 0) {
    return (
      <Box flexDirection="column">
        <Text dimColor>No skills found in ~/.claude/skills/</Text>
      </Box>
    );
  }

  if (preview) {
    const lines = preview.split("\n");
    const maxVisible = (process.stdout.rows || 24) - 6;
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color="cyan">Skill Preview</Text>
          <Text color="green"> {skills[cursor]?.name}</Text>
        </Box>
        <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1}>
          {lines.slice(0, maxVisible).map((line, i) => (
            <Text key={i} wrap="wrap">{line}</Text>
          ))}
          {lines.length > maxVisible && (
            <Text dimColor>... ({lines.length - maxVisible} more lines)</Text>
          )}
        </Box>
        <Box marginTop={1}>
          <Text dimColor>[p/Esc] back</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {skills.map((skill, i) => {
        const selected = i === cursor;
        return (
          <Box key={skill.path}>
            <Text color={selected ? "white" : "gray"} bold={selected}>
              {selected ? "▶ " : "  "}
            </Text>
            <Text color={selected ? "cyan" : "green"} bold={selected}>
              {skill.name.padEnd(24)}
            </Text>
            <Text dimColor>{skill.description.slice(0, 50)}</Text>
          </Box>
        );
      })}
      <Box marginTop={1}>
        <Text dimColor>
          {skills.length} skills | {cursor + 1}/{skills.length}
        </Text>
      </Box>
    </Box>
  );
}
