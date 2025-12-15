import User from "../models/user.model";
import Org from "../models/org.model";
import { admin } from "../lib/firebaseAdmin";
import { NotFoundError } from "../middlewares/error.middleware";

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
    type: undefined,
    org: null,
  });
  await newUser.save();
  return { ...newUser, newUser: true };
};

const upgradeToOrg = async ({
  userId,
  orgDescription,
  orgType,
}: {
  userId: string;
  orgDescription?: string;
  orgType?: string;
}) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.type === "ORGANIZATION") {
    throw new Error("User is already an organization");
  }

  const newOrg = new Org({
    user: user._id,
    orgDescription: orgDescription || user.name,
    orgType: orgType || "OTHER",
  });
  await newOrg.save();

  user.type = "ORGANIZATION";
  user.org = newOrg._id;
  await user.save();

  return { user, org: newOrg };
};

const getUser = async ({ userId }: { userId: string }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
};

const setUserType = async ({ 
  userId, 
  type 
}: { 
  userId: string, 
  type: "USER" | "ORGANIZATION"  
}) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  
  if (user.type && user.type !== null) {
    throw new Error("User type already set");
  }
  
  user.type = type;
  await user.save();
  return user;
};


export { register, upgradeToOrg, getUser, setUserType };
