const express = require("express");
const { createServer: createViteServer } = require("vite");
const path = require("path");

async function startDevServer() {
  const app = express();
  const PORT = 3000;

  console.log('Starting development server...');

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Backend is running!" });
  });

  app.get("/api/example", (req, res) => {
    res.json({ data: "This is some data from your new backend!" });
  });

  // Vite dev middleware
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  app.use(vite.middlewares);

  return new Promise((resolve) => {
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Dev server running on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

startDevServer().catch(err => {
  console.error('Failed to start dev server:', err);
  process.exit(1);
});
