import "dotenv/config";
import express from "express";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";

const app = express();
const port = parseInt(process.env.PORT || "3000", 10);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register all routes and middleware
async function main() {
  const server = await registerRoutes(app);

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    app.use(express.static("dist/public"));
  }
  
  server.listen(port, "localhost", () => {
    console.log(`[express] serving on port ${port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
