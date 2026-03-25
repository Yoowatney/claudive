#!/usr/bin/env node
import { createElement } from "react";
import { render } from "ink";
import updateNotifier from "update-notifier";
import App from "./app.js";

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

// Show update status
if (notifier.update && notifier.update.latest !== pkg.version) {
  console.log(
    `\x1b[33m Update available: ${pkg.version} → ${notifier.update.latest}\x1b[0m`,
  );
  console.log(
    `\x1b[33m Run: npm i -g @yoyoyoyoo/claude-dash\x1b[0m\n`,
  );
} else {
  console.log(`\x1b[32m claude-dash v${pkg.version} (latest)\x1b[0m\n`);
}

render(createElement(App));
