import express, { Request, Response, NextFunction } from "express";
import environments from "../environments";
import cors from "cors";
import auth from "./auth.route";
import { errorMiddleware } from "../middlewares/error.middleware";

const apiLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = performance.now();

  res.on("finish", () => {
    const duration = performance.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration.toFixed(
        2,
      )} ms`,
    );
  });

  next();
};

export = (app: express.Application) => {
  // Middlewares
  app.use(
    cors({
      origin: environments.ORIGIN_URL,
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(apiLogger);

  // Routes

  app.get("/", (_req, res) => {
    res.send({ message: "Escalate backend is live!" });
  });

  // Authentication routes
  app.use("/api/auth", auth);

  // Error handling middleware
  app.use(errorMiddleware);
};
