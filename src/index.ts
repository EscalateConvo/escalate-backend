import express from "express";
import { connectDB } from "./lib/db";
import environments from "./environments";
import routes from "./routes/index.route";

const app = express();
const port = environments.PORT;

const startServer = async () => {
  try {
    await connectDB();

    routes(app);
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("🔴 Error starting server", error);
    process.exit(1);
  }
};

startServer();
