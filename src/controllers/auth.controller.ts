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

const changeRole = async ({
  userId,
  role,
  orgDescription,
  orgType,
  name,
}: {
  userId: string;
  role: "USER" | "ORGANIZATION";
  orgDescription?: string;
  orgType?: string;
  name?: string;
}) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (role === "USER") {
    if (user.type === "ORGANIZATION") {
      throw new BadRequestError("User is already an organization");
    }
    if (name) {
      user.name = name;
      await user.save();
    }
    return user.toObject();
  }

  if (name) {
    user.name = name;
  }

  let org = null;

  if (user.type === "ORGANIZATION") {
    org = await Org.findById(user.org);
    if (!org) {
      throw new NotFoundError("Organization not found");
    }
    if (orgDescription !== undefined) {
      org.orgDescription = orgDescription;
    }
    org.orgType = orgType || org.orgType || "OTHER";
    await org.save();
  } else {
    org = new Org({
      user: user._id,
      orgDescription: orgDescription,
      orgType: orgType || "OTHER",
    });
    await org.save();
    user.type = "ORGANIZATION";
    user.org = org._id;
  }

  await user.save();
  const userObject = user.toObject();
  return { ...userObject, org: org.toObject() };
};

const getUser = async ({ userId }: { userId: string }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
};

export { register, changeRole, getUser };
