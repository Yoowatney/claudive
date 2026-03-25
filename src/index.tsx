#!/usr/bin/env node
import { createElement } from "react";
import { render } from "ink";
import updateNotifier from "update-notifier";
import App from "./app.js";

const ISSUES_URL = "https://github.com/Yoowatney/claude-dash/issues";

process.on("uncaughtException", (err) => {
  console.error(`\n\x1b[31m claude-dash crashed:\x1b[0m ${err.message}\n`);
  console.error(`  Please report this issue:`);
  console.error(`  \x1b[36m${ISSUES_URL}/new?title=${encodeURIComponent(`Crash: ${err.message}`)}\x1b[0m\n`);
  console.error(`  ${err.stack}\n`);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  console.error(`\n\x1b[31m claude-dash error:\x1b[0m ${msg}\n`);
  console.error(`  Please report this issue:`);
  console.error(`  \x1b[36m${ISSUES_URL}/new?title=${encodeURIComponent(`Error: ${msg}`)}\x1b[0m\n`);
  process.exit(1);
});

// Read package version
let pkg = { name: "@yoyoyoyoo/claude-dash", version: "0.0.0" };
try {
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  pkg = require("../package.json") as typeof pkg;
} catch {
  // ignore
}

// Check for updates
const notifier = updateNotifier({ pkg, updateCheckInterval: 0 });
if (!notifier.update) {
  await notifier.fetchInfo();
}

const updateInfo =
  notifier.update && notifier.update.latest !== pkg.version
    ? { current: pkg.version, latest: notifier.update.latest }
    : null;

render(
  createElement(App, {
    version: pkg.version,
    updateInfo,
  }),
);
