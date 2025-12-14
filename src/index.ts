import express from "express";
import { connectDB } from "./lib/connectdb";

const app = express();
const port = 8000;

connectDB();

app.get("/", (req, res) => {
  res.send("Hello from Express Backend");
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
