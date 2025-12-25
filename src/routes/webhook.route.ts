import Router from "express";
import { elevenLabsAuthMiddleware } from "../middlewares/auth.middleware";
import Attempt from "../models/attempt.model";

const router = Router();

router.post(
  "/elevenlabs/post-call",
  elevenLabsAuthMiddleware,
  async (req, res, next) => {
    try {
      const { data } = req.body;
      const { conversation_id, status } = data;

      if (status !== "done") {
        res.status(200).send();
        return;
      }

      await Attempt.findOneAndUpdate(
        { conversationId: conversation_id },
        { attemptStatus: "COMPLETED" },
      );

      res.status(200).send();
    } catch (error) {
      next(error);
    }
  },
);

export default router;
