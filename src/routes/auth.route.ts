import { Router } from "express";
import { AppResponse } from "../middlewares/error.middleware";
import { admin } from "../lib/firebaseAdmin";
import { getUser, register, changeRole } from "../controllers/auth.controller";
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

router.post("/change-role", authMiddleware, async (req, res, next) => {
  try {
    const { role, orgDescription, orgType, name } = req.body;

    const result = await changeRole({
      userId: req.headers["user-id"] as string,
      role,
      orgDescription,
      orgType,
      name,
    });

    AppResponse(res, 200, "Upgraded to organization successfully", result);
  } catch (error) {
    next(error);
  }
});

router.get("/get-user", authMiddleware, async (req, res, next) => {
  try {
    const user = await getUser({ userId: req.headers["user-id"] as string });
    AppResponse(res, 200, "User fetched successfully", user);
  } catch (error) {
    next(error);
  }
});

export default router;
