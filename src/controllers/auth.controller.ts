import User from "../models/user.model";
import Org from "../models/org.model";
import { admin } from "../lib/firebaseAdmin";
import {
  BadRequestError,
  NotFoundError,
} from "../middlewares/error.middleware";

const register = async ({ firebaseId }: { firebaseId: string }) => {
  const user = await User.findOne({ firebaseId });
  if (user) {
    return { ...user, newUser: false };
  }
  const userData = await admin.auth().getUser(firebaseId);
  const newUser = new User({
    firebaseId,
    name: userData.displayName || "",
    email: userData.email,
    photoURL: userData.photoURL,
    type: "USER",
    org: null,
  });
  await newUser.save();
  return { ...newUser, newUser: true };
};

const upgradeToOrg = async ({
  userId,
  orgDescription,
  orgType,
  name,
}: {
  userId: string;
  orgDescription?: string;
  orgType?: string;
  name?: string;
}) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.type === "ORGANIZATION") {
    throw new BadRequestError("User is already an organization");
  }

  if (name) {
    user.name = name;
    await user.save();
  }

  const newOrg = new Org({
    user: user._id,
    orgDescription: orgDescription,
    orgType: orgType || "OTHER",
  });
  await newOrg.save();

  user.type = "ORGANIZATION";
  user.org = newOrg._id;
  await user.save();
  const userObject = user.toObject();
  return { ...userObject, org: newOrg.toObject() };
};

const getUser = async ({ userId }: { userId: string }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
};

export { register, upgradeToOrg, getUser };
