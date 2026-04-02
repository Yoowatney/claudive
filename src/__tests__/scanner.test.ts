import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  scanSessions,
  getSessionPreview,
  deleteSession,
} from "../lib/scanner.js";

let TEST_DIR = "";

function freshDir() {
  TEST_DIR = join(tmpdir(), "claudive-test-" + Date.now() + "-" + Math.random().toString(36).slice(2));
  mkdirSync(TEST_DIR, { recursive: true });
}

function createSession(
  projectDir: string,
  sessionId: string,
  lines: object[],
) {
  const dir = join(TEST_DIR, projectDir);
  mkdirSync(dir, { recursive: true });
  const content = lines.map((l) => JSON.stringify(l)).join("\n");
  writeFileSync(join(dir, `${sessionId}.jsonl`), content);
}

function makeUser(text: string, cwd: string) {
  return {
    type: "user",
    cwd,
    message: { role: "user", content: text },
    uuid: "u-" + Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
    sessionId: "s",
  };
}

function makeAssistant(text: string, model = "claude-sonnet-4-6") {
  return {
    type: "assistant",
    message: { role: "assistant", content: text, model },
    uuid: "a-" + Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
  };
}

function makeToolUse(toolName: string, model = "claude-opus-4-6") {
  return {
    type: "assistant",
    message: {
      role: "assistant",
      content: [
        { type: "text", text: "..." },
        { type: "tool_use", name: toolName, id: "t-1", input: {} },
      ],
      model,
    },
    uuid: "a-" + Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
  };
}

describe("scanSessions", () => {
  beforeEach(() => freshDir());
  afterEach(() => rmSync(TEST_DIR, { recursive: true, force: true }));

  it("parses simple project", async () => {
    createSession("-tmp-project-alpha", "s1", [
      makeUser("hello", "/tmp/project-alpha"),
      makeAssistant("hi"),
    ]);

    const sessions = await scanSessions(TEST_DIR);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].projectPath).toBe("/tmp/project-alpha");
    expect(sessions[0].project).toBe("project-alpha");
  });

  it("handles dashes in directory name via cwd", async () => {
    const cwd = "/tmp/my-org/repo-name_fix-auth-bug-v2";
    createSession("-tmp-my-org-repo-name_fix-auth-bug-v2", "s2", [
      makeUser("fix", cwd),
      makeAssistant("ok"),
    ]);

    const sessions = await scanSessions(TEST_DIR);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].projectPath).toBe(cwd);
    expect(sessions[0].projectPath).not.toContain("/fix/auth/");
  });

  it("handles dots in directory name via cwd", async () => {
    const cwd = "/tmp/projects/nightly.so_fix-sleep-debt-v2-phase2";
    createSession(
      "-tmp-projects-nightly.so_fix-sleep-debt-v2-phase2",
      "s3",
      [makeUser("fix", cwd), makeAssistant("ok")],
    );

    const sessions = await scanSessions(TEST_DIR);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].projectPath).toBe(cwd);
  });

  it("handles dotfiles path via cwd", async () => {
    createSession("-home-dev--dotfiles", "s4", [
      makeUser("setup", "/home/dev/.dotfiles"),
      makeAssistant("ok"),
    ]);

    const sessions = await scanSessions(TEST_DIR);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].projectPath).toBe("/home/dev/.dotfiles");
    expect(sessions[0].project).toBe(".dotfiles");
  });

  it("handles underscores and special chars via cwd", async () => {
    const cwd = "/tmp/my_project.v2/sub-dir_test";
    createSession("-tmp-my_project.v2-sub-dir_test", "s5", [
      makeUser("test", cwd),
      makeAssistant("ok"),
    ]);

    const sessions = await scanSessions(TEST_DIR);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].projectPath).toBe(cwd);
  });

  it("handles deeply nested path via cwd", async () => {
    const cwd = "/a/b/c/d-e/f_g/h.i/j-k-l-m";
    createSession("-a-b-c-d-e-f_g-h.i-j-k-l-m", "s6", [
      makeUser("deep", cwd),
      makeAssistant("ok"),
    ]);

    const sessions = await scanSessions(TEST_DIR);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].projectPath).toBe(cwd);
    expect(sessions[0].project).toBe("j-k-l-m");
  });

  it("handles worktree-style path via cwd", async () => {
    const cwd = "/tmp/repo.com_fix-www-campaign-impression";
    createSession(
      "-tmp-repo.com_fix-www-campaign-impression",
      "s7",
      [makeUser("fix", cwd), makeAssistant("ok")],
    );

    const sessions = await scanSessions(TEST_DIR);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].projectPath).toBe(cwd);
    expect(sessions[0].projectPath).not.toContain("/fix/www/");
  });

  it("skips sessions without cwd", async () => {
    const dir = join(TEST_DIR, "-tmp-no-cwd");
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "s8.jsonl"),
      JSON.stringify({
        type: "user",
        message: { role: "user", content: "hello" },
        uuid: "u-1",
        timestamp: new Date().toISOString(),
      }),
    );

    const sessions = await scanSessions(TEST_DIR);
    expect(sessions).toHaveLength(0);
  });

  it("handles multiple projects", async () => {
    createSession("-tmp-proj-a", "s9", [
      makeUser("A", "/tmp/proj-a"),
      makeAssistant("ok"),
    ]);
    createSession("-tmp-proj-b", "s10", [
      makeUser("B", "/tmp/proj-b"),
      makeAssistant("ok"),
    ]);

    const sessions = await scanSessions(TEST_DIR);
    expect(sessions).toHaveLength(2);
    const paths = sessions.map((s) => s.projectPath).sort();
    expect(paths).toEqual(["/tmp/proj-a", "/tmp/proj-b"]);
  });

  it("skips empty sessions", async () => {
    const dir = join(TEST_DIR, "-tmp-empty");
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "s11.jsonl"),
      JSON.stringify({
        type: "file-history-snapshot",
        messageId: "m-1",
        snapshot: {},
      }),
    );

    const sessions = await scanSessions(TEST_DIR);
    expect(sessions).toHaveLength(0);
  });
});

describe("getSessionPreview", () => {
  beforeEach(() => freshDir());
  afterEach(() => rmSync(TEST_DIR, { recursive: true, force: true }));

  it("returns messages and tool stats", async () => {
    createSession("-tmp-app", "sp1", [
      makeUser("fix", "/tmp/app"),
      makeToolUse("Bash"),
      makeToolUse("Bash"),
      makeToolUse("Edit"),
      makeAssistant("done"),
    ]);

    const preview = await getSessionPreview("sp1", "app", TEST_DIR);
    expect(preview.messages.length).toBeGreaterThan(0);
    expect(preview.toolStats).toEqual({ Bash: 2, Edit: 1 });
    expect(preview.model).toBe("claude-opus-4-6");
  });

  it("finds session by ID across directories", async () => {
    createSession("-tmp-proj-x", "target", [
      makeUser("found me", "/tmp/proj-x"),
      makeAssistant("hi"),
    ]);
    createSession("-tmp-proj-y", "other", [
      makeUser("not me", "/tmp/proj-y"),
      makeAssistant("hi"),
    ]);

    const preview = await getSessionPreview("target", "anything", TEST_DIR);
    expect(preview.messages).toHaveLength(2);
    expect(preview.messages[0].text).toBe("found me");
  });

  it("returns empty for non-existent session", async () => {
    createSession("-tmp-app", "exists", [
      makeUser("hi", "/tmp/app"),
      makeAssistant("hello"),
    ]);

    const preview = await getSessionPreview("ghost", "app", TEST_DIR);
    expect(preview.messages).toHaveLength(0);
  });
});

describe("deleteSession", () => {
  beforeEach(() => freshDir());
  afterEach(() => rmSync(TEST_DIR, { recursive: true, force: true }));

  it("deletes session by ID", async () => {
    createSession("-tmp-app", "sd1", [
      makeUser("delete me", "/tmp/app"),
      makeAssistant("ok"),
    ]);

    const filePath = join(TEST_DIR, "-tmp-app", "sd1.jsonl");
    expect(existsSync(filePath)).toBe(true);

    const result = await deleteSession(
      {
        id: "sd1",
        project: "app",
        projectPath: "/tmp/app",
        firstMessage: "delete me",
        messageCount: 2,
        lastModified: new Date(),
      },
      TEST_DIR,
    );

    expect(result).toBe(true);
    expect(existsSync(filePath)).toBe(false);
  });

  it("deletes from dashed directory by ID", async () => {
    const cwd = "/tmp/my-project.com_fix-bug";
    createSession("-tmp-my-project.com_fix-bug", "sd2", [
      makeUser("fix", cwd),
      makeAssistant("done"),
    ]);

    const filePath = join(TEST_DIR, "-tmp-my-project.com_fix-bug", "sd2.jsonl");
    expect(existsSync(filePath)).toBe(true);

    const result = await deleteSession(
      {
        id: "sd2",
        project: "my-project.com_fix-bug",
        projectPath: cwd,
        firstMessage: "fix",
        messageCount: 2,
        lastModified: new Date(),
      },
      TEST_DIR,
    );

    expect(result).toBe(true);
    expect(existsSync(filePath)).toBe(false);
  });
});

describe("session classification", () => {
  function classifySession(stats: Record<string, number>): string {
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

  it("empty → Conversation", () => {
    expect(classifySession({})).toBe("💬 Conversation");
  });

  it("few tools → Conversation", () => {
    expect(classifySession({ Bash: 2, Read: 1 })).toContain("💬 Conversation");
  });

  it("Edit-heavy → Code editing", () => {
    expect(classifySession({ Edit: 20, Read: 5, Bash: 3 })).toContain("🔨 Code editing");
  });

  it("Bash-heavy → Debugging", () => {
    expect(classifySession({ Bash: 30, Read: 5, Edit: 2 })).toContain("🐛 Debugging");
  });

  it("Read-heavy → Code exploration", () => {
    expect(classifySession({ Read: 25, Grep: 10, Bash: 3 })).toContain("🔍 Code exploration");
  });

  it("Agent → Agentic workflow", () => {
    expect(classifySession({ Agent: 5, Bash: 20, Edit: 10 })).toContain("🤖 Agentic");
  });

  it("WebFetch → Web research", () => {
    expect(classifySession({ WebFetch: 3, Read: 10, Bash: 5 })).toContain("🌐 Web research");
  });

  it("NotebookEdit → Notebook work", () => {
    expect(classifySession({ NotebookEdit: 5, Read: 3, Bash: 2 })).toContain("📓 Notebook");
  });

  it("Write > Edit → File creation", () => {
    expect(classifySession({ Write: 15, Edit: 3, Bash: 5 })).toContain("📝 File creation");
  });

  it("Skill-heavy → Skill execution", () => {
    expect(classifySession({ Skill: 5, Read: 3, Bash: 2 })).toContain("⚡ Skill");
  });

  it("shows top 3 tool counts", () => {
    const result = classifySession({ Bash: 30, Read: 10, Edit: 5, Write: 1 });
    expect(result).toContain("Bash:30");
    expect(result).toContain("Read:10");
    expect(result).toContain("Edit:5");
    expect(result).not.toContain("Write:1");
  });
});
