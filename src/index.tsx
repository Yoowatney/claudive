#!/usr/bin/env node
import { createElement } from "react";
import { render } from "ink";
import updateNotifier from "update-notifier";
import App from "./app.js";

// Check for updates (runs in background, notifies on next run)
const pkg = {
  name: "@yoyoyoyoo/claude-dash",
  version: process.env["npm_package_version"] || "0.0.0",
};

try {
  // Dynamic import of package.json at runtime
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  const pkgJson = require("../package.json") as { name: string; version: string };
  pkg.name = pkgJson.name;
  pkg.version = pkgJson.version;
} catch {
  // ignore
}

updateNotifier({ pkg }).notify();

render(createElement(App));
