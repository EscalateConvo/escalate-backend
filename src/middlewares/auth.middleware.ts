import { NextFunction, Request, Response } from "express";
import { admin } from "../lib/firebaseAdmin";
import User from "../models/user.model";
import environments from "../environments";
import crypto from "crypto";

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
      .select("_id email")
      .lean();

    if (!user) {
      res.status(401).json({ message: "Unauthorized: User not found" });
      return;
    }

    req.headers["firebase-id"] = decodedToken.uid;
    req.headers["authorized"] = "true";
    req.headers["user-id"] = user._id.toString();
    req.headers["user-email"] = user.email;

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

const elevenLabsAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const signatureHeader = req.headers["elevenlabs-signature"];
    if (!signatureHeader || typeof signatureHeader !== "string") {
      res.status(401).send("Missing signature header");
      return;
    }
    const headers = signatureHeader.split(",");
    const timestampEntry = headers.find((e: string) => e.startsWith("t="));
    if (!timestampEntry) {
      res.status(401).send("Invalid signature format");
      return;
    }
    const timestamp = timestampEntry.substring(2);
    const signature = headers.find((e: string) => e.startsWith("v0="));
    // Validate timestamp
    const reqTimestamp = Number(timestamp) * 1000;
    const tolerance = Date.now() - 30 * 60 * 1000;
    if (reqTimestamp < tolerance) {
      res.status(403).send("Request expired");
      return;
    } else {
      // Validate hash
      const rawBody = (req as any).rawBody || "";
      const message = `${timestamp}.${rawBody}`;
      const digest =
        "v0=" +
        crypto
          .createHmac("sha256", environments.ELEVEN_LABS_WEBHOOK_SECRET)
          .update(message)
          .digest("hex");
      if (signature !== digest) {
        res.status(401).send("Request unauthorized");
        return;
      }
    }
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

export { authMiddleware, elevenLabsAuthMiddleware };
