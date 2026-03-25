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

// Check for updates and notify
const notifier = updateNotifier({ pkg, updateCheckInterval: 0 });
if (!notifier.update) {
  await notifier.fetchInfo?.();
}
notifier.notify();

render(createElement(App));
