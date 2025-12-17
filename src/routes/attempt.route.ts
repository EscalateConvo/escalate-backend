import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { AppResponse } from "../middlewares/error.middleware";

const router = Router();

// router.post("/create", authMiddleware, async (req, res) => {
//   try {
//     const attempt = await createAttempt({ userId: user, module: module });
//     return AppResponse(res, 201, "Attempt created successfully", attempt);
//   } catch (error) {
//     next(error);
//   }
// });

export default router;
