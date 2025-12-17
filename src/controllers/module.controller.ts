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
import {
  createAgent,
  updateAgent,
  deleteAgent,
  ModuleAIFields,
  normalizeAIFields,
} from "../ai/createAgent";

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
    !data.aiFields ||
    !data.userFields ||
    !data.aiFields.role ||
    !data.aiFields.systemPrompt ||
    !data.aiFields.firstMessage ||
    !data.userFields.role ||
    !data.userFields.problemStatement
  ) {
    throw new BadRequestError("Please provide all required fields!");
  }

  const { title, topic, difficulty, aiFields, userFields, userEmails } = data;

  const normalizedAiFields = normalizeAIFields(aiFields as ModuleAIFields);

  let agentId: string | undefined;
  const module = new Module({
    title,
    createdBy: user._id,
    userEmails,
    topic,
    difficulty,
    aiFields: normalizedAiFields,
    userFields,
    agentId,
  });

  try {
    agentId = await createAgent(module.title, normalizedAiFields, {
      topic: module.topic,
      difficulty: module.difficulty,
    });
  } catch (error) {
    console.error("Failed to create Eleven Labs agent:", error);
    throw new BadRequestError("Failed to create AI agent. Please try again.");
  }

  module.agentId = agentId;
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
    "aiFields",
    "userFields",
    "userEmails",
    "active",
  ];

  const aiFieldsChanged = data.aiFields !== undefined;
  const titleChanged = data.title !== undefined;
  const topicChanged = data.topic !== undefined;
  const difficultyChanged = data.difficulty !== undefined;

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      if (field === "aiFields") {
        (module as any)[field] = {
          ...(module as any)[field],
          ...data[field],
          audioConfig: data[field].audioConfig
            ? {
                ...(module as any)[field]?.audioConfig,
                ...data[field].audioConfig,
              }
            : (module as any)[field]?.audioConfig,
        };
      } else if (field === "userFields") {
        (module as any)[field] = {
          ...(module as any)[field],
          ...data[field],
        };
      } else {
        (module as any)[field] = data[field];
      }
    }
  });

  if (aiFieldsChanged || topicChanged || difficultyChanged) {
    const updatedTitle = titleChanged ? data.title : module.title;
    const updatedTopic = topicChanged ? data.topic : module.topic;
    const updatedDifficulty = difficultyChanged
      ? data.difficulty
      : module.difficulty;
    const mergedAiFields = {
      ...module.aiFields,
      ...(data.aiFields || {}),
    };
    const normalizedAiFields = normalizeAIFields(
      mergedAiFields as ModuleAIFields,
    );
    try {
      if ((module as any).agentId) {
        await updateAgent(
          (module as any).agentId,
          updatedTitle,
          normalizedAiFields,
          {
            topic: updatedTopic,
            difficulty: updatedDifficulty,
          },
        );
      } else {
        const agentId = await createAgent(updatedTitle, normalizedAiFields, {
          topic: updatedTopic,
          difficulty: updatedDifficulty,
        });
        (module as any).agentId = agentId;
      }
    } catch (error) {
      console.error(
        `Failed to ${(module as any).agentId ? "update" : "create"} agent:`,
        error,
      );
      throw new BadRequestError(
        `Failed to ${(module as any).agentId ? "update" : "create"} AI agent. Please try again.`,
      );
    }
    (module as any).aiFields = normalizedAiFields;
  }

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

  if ((module as any).agentId) {
    try {
      await deleteAgent((module as any).agentId);
    } catch (error) {
      console.error(
        `Failed to delete agent ${(module as any).agentId}:`,
        error,
      );
    }
  }

  await AttemptReport.deleteMany({ attempt: { $in: attemptIds } });
  await Attempt.deleteMany({ module: moduleId });
  await Module.findByIdAndDelete(moduleId);

  return { message: "Module deleted successfully" };
};

// Generate a share URL for a module
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
  };
};

// Revoke a share URL for a module
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

// Get a module by email or share token
const getModuleByEmailOrShareToken = async ({
  shareToken,
  userEmail,
}: {
  shareToken: string;
  userEmail: string;
}) => {
  const module = await Module.findOne({
    $or: [{ shareToken }, { userEmails: { $in: [userEmail] } }],
    active: true,
  });

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
    userFields: module.userFields,
  };
};

// Get all modules by user email
const getAllModulesByUserEmail = async ({
  userEmail,
}: {
  userEmail: string;
}) => {
  const modules = await Module.find({
    userEmails: { $in: [userEmail] },
    active: true,
  }).select("_id title topic userFields");
  return modules;
};

export {
  createModule,
  getAllModules,
  generateShareURL,
  revokeShareURL,
  getModuleByEmailOrShareToken,
  getOneModule,
  updateModule,
  deleteModule,
  getAllModulesByUserEmail,
};
