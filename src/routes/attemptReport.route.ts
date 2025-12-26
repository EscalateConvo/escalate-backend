import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { AppResponse } from "../middlewares/error.middleware";
import { getAttemptReport } from "../controllers/attemptReport.controller";

const router = Router();

router.get("/get/:attemptReportId", authMiddleware, async (req, res, next) => {
  try {
    const user = req.headers["user-id"] as string;
    const attemptReport = await getAttemptReport({
      userId: user,
      attemptReportId: req.params.attemptReportId,
    });
    return AppResponse(
      res,
      201,
      "Attempt report fetched successfully",
      attemptReport,
    );
  } catch (error) {
    next(error);
  }
});

export default router;
