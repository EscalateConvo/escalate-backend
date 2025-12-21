import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { AppResponse } from "../middlewares/error.middleware";
import { startAttempt } from "../controllers/attempt.controller";

const router = Router();

router.post("/start", authMiddleware, async (req, res, next) => {
  try {
    const userEmail = req.headers["user-email"] as string;
    const userId = req.headers["user-id"] as string;
    const moduleId = req.body.moduleId;
    const attempt = await startAttempt({
      userEmail,
      userId,
      moduleId,
    });
    AppResponse(res, 201, "Attempt started successfully", attempt);
  } catch (error) {
    next(error);
  }
});

export default router;
