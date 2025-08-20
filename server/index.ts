import "dotenv/config";
import express from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";

const app = express();
const port = parseInt(process.env.PORT || "3000", 10);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint (available immediately, no async dependencies)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register all routes and middleware
async function main() {
  const server = await registerRoutes(app);

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    // Serve static files
    app.use(express.static("dist/public"));
    
    // Fallback to index.html for client-side routing (SPA support)
    app.get('*', (req, res) => {
      // Don't serve index.html for API routes
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'API endpoint not found' });
      }
      
      res.sendFile(path.resolve(__dirname, '../dist/public/index.html'));
    });
  }
  
  server.listen(port, "0.0.0.0", () => {
    console.log(`[express] serving on port ${port} (listening on 0.0.0.0)`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
