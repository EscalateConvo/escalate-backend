import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { AppResponse } from "../middlewares/error.middleware";
import { createModule, getAllModules } from "../controllers/module.controller";

const router = Router();

router.post("/create", authMiddleware, async (req, res, next) => {
  try {
    const user = req.headers["user-id"] as string;
    const module = await createModule({ userId: user, data: req.body });
    return AppResponse(res, 201, "Module created successfully", module);
  } catch (error) {
    next(error);
  }
});

router.get("/getall", authMiddleware, async (req, res, next) => {
  try {
    const user = req.headers["user-id"] as string;
    const modules = await getAllModules({ userId: user });
    return AppResponse(res, 200, "Modules fetched successfully", modules);
  } catch (error) {
    next(error);
  }
});

export default router;
