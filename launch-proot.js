const os = require("node:os");
const path = require("node:path");

// Polyfill for environments where os.networkInterfaces is not available
try {
  os.networkInterfaces();
} catch {
  os.networkInterfaces = () => ({});
}

// Environment setup
require("dotenv").config();
process.env.NODE_ENV = "production";
process.chdir(path.join(process.cwd(), "apps", "server"));

require("./apps/server/dist/main.js");
