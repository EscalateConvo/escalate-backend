import { Router } from "express";
import { AppResponse } from "../middlewares/error.middleware";
import { admin } from "../lib/firebaseAdmin";
import { register, upgradeToOrg } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      AppResponse(res, 401, "Unauthorized: No token");
      return;
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const user = await register({ firebaseId: decodedToken.uid });
    AppResponse(res, 201, "User registered successfully", user);
  } catch (error) {
    next(error);
  }
});

router.post("/upgrade-to-org", authMiddleware, async (req, res, next) => {
  try {
    const { orgDescription, orgType } = req.body;

    const result = await upgradeToOrg({
      userId: req.headers["user-id"] as string,
      orgDescription,
      orgType,
    });

    AppResponse(res, 200, "Upgraded to organization successfully", result);
  } catch (error) {
    next(error);
  }
});

export default router;
