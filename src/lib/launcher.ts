import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

type LaunchMode = "tmux" | "iterm2-tab" | "print";

interface Config {
  launchMode: LaunchMode;
}

const CONFIG_PATH = join(homedir(), ".config", "claudash", "config.json");

function loadConfig(): Config {
  try {
    if (existsSync(CONFIG_PATH)) {
      return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
    }
  } catch {
    // ignore
  }

  // Auto-detect default
  const mode = detectMode();
  saveConfig({ launchMode: mode });
  return { launchMode: mode };
}

function detectMode(): LaunchMode {
  // If inside tmux, use tmux
  if (process.env["TMUX"]) return "tmux";
  // If on macOS and iTerm2 is available, use it
  if (process.platform === "darwin") return "iterm2-tab";
  return "print";
}

function saveConfig(config: Config): void {
  const dir = join(homedir(), ".config", "claudash");
  try {
    execSync(`mkdir -p "${dir}"`);
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch {
    // ignore
  }
}

function launchTmux(sessionId: string, projectPath: string): void {
  const shortId = sessionId.slice(0, 8);
  try {
    execSync(
      `tmux new-window -n "claude:${shortId}" -c "${projectPath}" 'claude --resume "${sessionId}"'`,
    );
  } catch {
    console.log(`\nFailed to open tmux window. Run manually:`);
    console.log(`  cd "${projectPath}" && claude --resume "${sessionId}"\n`);
  }
}

function launchIterm2Tab(sessionId: string, projectPath: string): void {
  const script = `
    tell application "iTerm"
      activate
      tell current window
        create tab with default profile
        tell current session
          write text "cd \\"${projectPath}\\" && claude --resume \\"${sessionId}\\""
        end tell
      end tell
    end tell
  `;
  try {
    execSync(`osascript -e '${script}'`);
  } catch {
    // Fallback to print
    console.log(`\nRun manually:`);
    console.log(`  cd "${projectPath}" && claude --resume "${sessionId}"\n`);
  }
}

export function resumeSession(sessionId: string, projectPath: string): void {
  const config = loadConfig();

  switch (config.launchMode) {
    case "tmux":
      launchTmux(sessionId, projectPath);
      break;
    case "iterm2-tab":
      launchIterm2Tab(sessionId, projectPath);
      break;
    case "print":
    default:
      console.log(`\n  cd "${projectPath}" && claude --resume "${sessionId}"\n`);
      break;
  }
}

export { type LaunchMode, type Config, CONFIG_PATH, loadConfig, saveConfig };
