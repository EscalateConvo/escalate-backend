import { Router } from "express";
import { AppResponse } from "../middlewares/error.middleware";
import { admin } from "../lib/firebaseAdmin";
import {
  getUser,
  register,
  upgradeToOrg,
  setUserType,
} from "../controllers/auth.controller";
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

router.get("/get-user", authMiddleware, async (req, res, next) => {
  try {
    const user = await getUser({ userId: req.headers["user-id"] as string });
    AppResponse(res, 200, "User fetched successfully", user);
  } catch (error) {
    next(error);
  }
});

router.post("/set-user-type", authMiddleware, async (req, res, next) => {
  try {
    const { type } = req.body;
    
    // Validate type
    if (!type || !["USER", "ORGANIZATION"].includes(type)) {
      AppResponse(res, 400, "Invalid user type");
      return;
    }
    
    const user = await setUserType({ 
      userId: req.headers["user-id"] as string,
      type: type as "USER" | "ORGANIZATION" 
    });
    
    AppResponse(res, 200, "User type set successfully", user);
  } catch (error) {
    next(error);
  }
});

export default router;
