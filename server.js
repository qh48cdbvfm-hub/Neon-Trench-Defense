const express = require("express");
const path = require("path");

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log('Express app initializing...');

  // Add middleware to parse JSON requests
  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Backend is running!" });
  });

  // Example API route for you to expand upon
  app.get("/api/example", (req, res) => {
    res.json({ data: "This is some data from your new backend!" });
  });

  // Static file serving for production
  const distPath = path.join(__dirname, "dist");
  console.log('Serving static files from:', distPath);
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
