import express, { Request, Response, NextFunction } from "express";
import environments from "../environments";
import cors from "cors";
import { errorMiddleware } from "../middlewares/error.middleware";
import authRoutes from "./auth.route";
import moduleRoutes from "./module.route";
import attemptRoutes from "./attempt.route";
import webhookRoutes from "./webhook.route";
import attemptReportRoutes from "./attemptReport.route";

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
  app.use(apiLogger);
  app.use(
    "/webhook",
    express.json({
      verify: (req, _res, buf) => {
        (req as any).rawBody = buf.toString();
      },
    }),
  );
  app.use("/webhook", webhookRoutes);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes

  app.get("/", (_req, res) => {
    res.send({ message: "Escalate backend is live!" });
  });

  // Authentication routes
  app.use("/api/auth", authRoutes);
  app.use("/api/modules", moduleRoutes);
  app.use("/api/attempts", attemptRoutes);
  app.use("/api/attemptreports", attemptReportRoutes);

  // Error handling middleware
  app.use(errorMiddleware);
};
