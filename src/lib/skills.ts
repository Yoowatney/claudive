import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";

export interface Skill {
  name: string;
  description: string;
  path: string;
  source: "global" | "project";
}

const GLOBAL_SKILLS_DIR = join(homedir(), ".claude", "skills");

function parseFrontmatter(content: string): { name?: string; description?: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const result: { name?: string; description?: string } = {};
  for (const line of match[1].split("\n")) {
    const [key, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    if (key.trim() === "name") result.name = value;
    if (key.trim() === "description") result.description = value;
  }
  return result;
}

export async function scanSkills(): Promise<Skill[]> {
  const skills: Skill[] = [];

  // Global skills
  try {
    const dirs = await readdir(GLOBAL_SKILLS_DIR);
    for (const dir of dirs) {
      const dirPath = join(GLOBAL_SKILLS_DIR, dir);
      const dirStat = await stat(dirPath).catch(() => null);

      if (dirStat?.isDirectory()) {
        const skillFile = join(dirPath, "SKILL.md");
        try {
          const content = await readFile(skillFile, "utf-8");
          const fm = parseFrontmatter(content);
          skills.push({
            name: fm.name || dir,
            description: fm.description || "",
            path: skillFile,
            source: "global",
          });
        } catch {
          // no SKILL.md
        }
      }
    }
  } catch {
    // no skills dir
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSkillContent(skill: Skill): Promise<string> {
  try {
    return await readFile(skill.path, "utf-8");
  } catch {
    return "(unreadable)";
  }
}

export function editSkill(skill: Skill): void {
  const editor = process.env["EDITOR"] || process.env["VISUAL"] || "vi";
  spawnSync(editor, [skill.path], { stdio: "inherit" });
}
