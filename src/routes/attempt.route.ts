import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { AppResponse } from "../middlewares/error.middleware";
import {
  startAttempt,
  getConversation,
  generateAttemptReport,
} from "../controllers/attempt.controller";

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

router.get("/conversation/:conversationId", authMiddleware, async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const conversation = await getConversation(conversationId);
    AppResponse(res, 200, "Conversation fetched successfully", conversation);
  } catch (error) {
    next(error);
  }
});

router.post("/report", authMiddleware, async (req, res, next) => {
  try {
    const { attemptId, conversationId } = req.body;
    const report = await generateAttemptReport({
      attemptId,
      conversationId,
    });
    AppResponse(res, 201, "Report generated successfully", report);
  } catch (error) {
    next(error);
  }
});

export default router;
