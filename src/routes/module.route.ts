import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { AppResponse } from "../middlewares/error.middleware";
import {
  createModule,
  getAllModules,
  generateShareURL,
  revokeShareURL,
  getModuleByShareToken,
  getOneModule,
  updateModule,
  deleteModule,
} from "../controllers/module.controller";

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

router.post("/:moduleId/share", authMiddleware, async (req, res, next) => {
  try {
    const user = req.headers["user-id"] as string;
    const { moduleId } = req.params;
    const { expiryDays } = req.body || {};
    const shareData = await generateShareURL({
      userId: user,
      moduleId,
      expiryDays,
    });
    return AppResponse(res, 200, "Share URL generated successfully", shareData);
  } catch (error) {
    next(error);
  }
});

router.delete("/:moduleId/share", authMiddleware, async (req, res, next) => {
  try {
    const user = req.headers["user-id"] as string;
    const { moduleId } = req.params;
    const result = await revokeShareURL({ userId: user, moduleId });
    return AppResponse(res, 200, result.message);
  } catch (error) {
    next(error);
  }
});

// Session should be created here instead of get module with shared token not module
// To be removed in future
router.get("/shared/:shareToken", async (req, res, next) => {
  try {
    const { shareToken } = req.params;
    const module = await getModuleByShareToken({ shareToken });
    return AppResponse(res, 200, "Module fetched successfully", module);
  } catch (error) {
    next(error);
  }
});

router.get("/:moduleId", authMiddleware, async (req, res, next) => {
  try {
    const user = req.headers["user-id"] as string;
    const { moduleId } = req.params;
    const module = await getOneModule({ userId: user, moduleId });
    return AppResponse(res, 200, "Module fetched successfully", module);
  } catch (error) {
    next(error);
  }
});

router.put("/:moduleId", authMiddleware, async (req, res, next) => {
  try {
    const user = req.headers["user-id"] as string;
    const { moduleId } = req.params;
    const module = await updateModule({
      userId: user,
      moduleId,
      data: req.body,
    });
    return AppResponse(res, 200, "Module updated successfully", module);
  } catch (error) {
    next(error);
  }
});

router.delete("/:moduleId", authMiddleware, async (req, res, next) => {
  try {
    const user = req.headers["user-id"] as string;
    const { moduleId } = req.params;
    const result = await deleteModule({ userId: user, moduleId });
    return AppResponse(res, 200, result.message);
  } catch (error) {
    next(error);
  }
});

export default router;
