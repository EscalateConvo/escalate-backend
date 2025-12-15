import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../middlewares/error.middleware";
import Module from "../models/module.model";
import User from "../models/user.model";
import Attempt from "../models/attempt.model";
import AttemptReport from "../models/attemptReport.model";
import environments from "../environments";

const createModule = async ({
  userId,
  data,
}: {
  userId: string;
  data: any;
}) => {
  const user = await User.findById(userId);
  if (!user || user.type !== "ORGANIZATION") {
    throw new ConflictError("User not found or is not an organization");
  }

  if (
    !data.title ||
    !data.topic ||
    !data.difficulty ||
    !data.role ||
    !data.systemPrompt ||
    !data.firstMessage
  ) {
    throw new BadRequestError("Please provide all required fields!");
  }

  const {
    title,
    topic,
    difficulty,
    role,
    systemPrompt,
    initialEmotion,
    audioConfig,
    firstMessage,
    userEmails,
  } = data;

  const module = new Module({
    title,
    createdBy: user._id,
    userEmails,
    topic,
    difficulty,
    role,
    systemPrompt,
    initialEmotion,
    audioConfig,
    firstMessage,
  });
  await module.save();
  const moduleObject = module.toObject();
  return moduleObject;
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

const generateShareURL = async ({
  userId,
  moduleId,
  expiryDays,
}: {
  userId: string;
  moduleId: string;
  expiryDays?: number;
}) => {
  const user = await User.findById(userId);
  if (!user || user.type !== "ORGANIZATION") {
    throw new UnauthorizedError("User not found or is not an organization");
  }

  const module = await Module.findOne({ _id: moduleId, createdBy: user._id });
  if (!module) {
    throw new NotFoundError("Module not found or you don't have access");
  }

  const token = (module as any).generateShareToken(expiryDays);
  const shareURL = `${environments.ORIGIN_URL}/share/${token}`;
  module.shareURL = shareURL;
  await module.save();

  return {
    shareURL,
    shareToken: token,
    expiresAt: module.shareTokenExpiry,
    isShareable: module.isShareable,
  };
};

const revokeShareURL = async ({
  userId,
  moduleId,
}: {
  userId: string;
  moduleId: string;
}) => {
  const user = await User.findById(userId);
  if (!user || user.type !== "ORGANIZATION") {
    throw new UnauthorizedError("User not found or is not an organization");
  }

  const module = await Module.findOne({ _id: moduleId, createdBy: user._id });
  if (!module) {
    throw new NotFoundError("Module not found or you don't have access");
  }

  (module as any).revokeShareToken();
  await module.save();

  return { message: "Share URL revoked successfully" };
};

const getModuleByShareToken = async ({
  shareToken,
}: {
  shareToken: string;
}) => {
  const module = await Module.findOne({ shareToken });

  if (!module) {
    throw new NotFoundError("Invalid or expired share link");
  }

  if (!(module as any).isShareTokenValid()) {
    throw new UnauthorizedError("Share link has expired or been revoked");
  }

  return {
    _id: module._id,
    title: module.title,
    topic: module.topic,
    difficulty: module.difficulty,
    role: module.role,
    systemPrompt: module.systemPrompt,
    initialEmotion: module.initialEmotion,
    audioConfig: module.audioConfig,
    firstMessage: module.firstMessage,
  };
};

const getOneModule = async ({
  userId,
  moduleId,
}: {
  userId: string;
  moduleId: string;
}) => {
  const user = await User.findById(userId);
  if (!user || user.type !== "ORGANIZATION") {
    throw new UnauthorizedError("User not found or is not an organization");
  }

  const module = await Module.findOne({ _id: moduleId, createdBy: user._id });
  if (!module) {
    throw new NotFoundError("Module not found or you don't have access");
  }

  return module;
};

const updateModule = async ({
  userId,
  moduleId,
  data,
}: {
  userId: string;
  moduleId: string;
  data: any;
}) => {
  const user = await User.findById(userId);
  if (!user || user.type !== "ORGANIZATION") {
    throw new UnauthorizedError("User not found or is not an organization");
  }

  if (!data || Object.keys(data).length === 0) {
    throw new BadRequestError("No update data provided");
  }

  const module = await Module.findOne({ _id: moduleId, createdBy: user._id });
  if (!module) {
    throw new NotFoundError("Module not found or you don't have access");
  }

  const allowedFields = [
    "title",
    "topic",
    "difficulty",
    "role",
    "systemPrompt",
    "initialEmotion",
    "audioConfig",
    "firstMessage",
    "userEmails",
    "active",
  ];

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      (module as any)[field] = data[field];
    }
  });

  await module.save();
  return module;
};

const deleteModule = async ({
  userId,
  moduleId,
}: {
  userId: string;
  moduleId: string;
}) => {
  const user = await User.findById(userId);
  if (!user || user.type !== "ORGANIZATION") {
    throw new UnauthorizedError("User not found or is not an organization");
  }

  const module = await Module.findOne({
    _id: moduleId,
    createdBy: user._id,
  });

  if (!module) {
    throw new NotFoundError("Module not found or you don't have access");
  }

  const attempts = await Attempt.find({ module: moduleId });
  const attemptIds = attempts.map((attempt) => attempt._id);

  await AttemptReport.deleteMany({ attempt: { $in: attemptIds } });
  await Attempt.deleteMany({ module: moduleId });
  await Module.findByIdAndDelete(moduleId);

  return { message: "Module deleted successfully" };
};

export {
  createModule,
  getAllModules,
  generateShareURL,
  revokeShareURL,
  getModuleByShareToken,
  getOneModule,
  updateModule,
  deleteModule,
};
