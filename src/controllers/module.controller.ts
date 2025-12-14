import { UnauthorizedError } from "../middlewares/error.middleware";
import Module from "../models/module.model";
import User from "../models/user.model";

const createModule = async ({
  userId,
  data,
}: {
  userId: string;
  data: any;
}) => {
  const user = await User.findById(userId);
  if (!user || user.type !== "ORGANIZATION") {
    throw new UnauthorizedError("User not found or is not an organization");
  }

  const module = new Module({ ...data, createdBy: user._id });
  await module.save();

  return module;
};

const getAllModules = async ({ userId }: { userId: string }) => {
  const user = await User.findById(userId);
  if (!user || user.type !== "ORGANIZATION") {
    throw new UnauthorizedError("User not found or is not an organization");
  }
  const modules = await Module.find({ createdBy: user._id }).select(
    "title _id active",
  );
  return modules;
};

export { createModule, getAllModules };
