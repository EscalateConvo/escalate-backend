import Router from "express";
import { elevenLabsAuthMiddleware } from "../middlewares/auth.middleware";
import Attempt from "../models/attempt.model";
import { generateAttemptReport } from "../controllers/attemptReport.controller";
import { AppResponse, NotFoundError } from "../middlewares/error.middleware";

const router = Router();

router.post(
  "/elevenlabs/post-call",
  elevenLabsAuthMiddleware,
  async (req, res, next) => {
    try {
      const { data } = req.body;
      const { conversation_id, status, transcript, metadata } = data;

      if (status !== "done") {
        AppResponse(res, 200, "Attempt report not generated");
        return;
      }

      const attempt = await Attempt.findOneAndUpdate(
        { conversationId: conversation_id },
        { attemptStatus: "COMPLETED" },
      );

      if (!attempt) {
        throw new NotFoundError("Attempt not found");
      }

      await generateAttemptReport({
        attemptId: attempt._id.toString(),
        conversationData: {
          conversation_id,
          transcript,
          metadata: {
            call_duration_secs: metadata.call_duration_secs,
          },
        },
      });

      AppResponse(res, 200, "Attempt report generated successfully");
    } catch (error) {
      next(error);
    }
  },
);

export default router;
