import { NextFunction, Request, Response } from "express";
import { admin } from "../lib/firebaseAdmin";
import User from "../models/user.model";

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Unauthorized: No token" });
      return;
    }

    const idToken = authHeader.split(" ")[1];

    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const user = await User.findOne({ firebaseId: decodedToken.uid })
      .select("_id")
      .lean();

    if (!user) {
      res.status(401).json({ message: "Unauthorized: User not found" });
      return;
    }

    req.headers["firebase-id"] = decodedToken.uid;
    req.headers["authorized"] = "true";
    req.headers["user-id"] = user._id.toString();

    (req as any).user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      userId: user._id.toString(),
    };

    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

export { authMiddleware };
