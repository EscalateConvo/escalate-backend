import {
  BadRequestError,
  NotFoundError,
} from "../middlewares/error.middleware";
import Attempt from "../models/attempt.model";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import environments from "../environments";
import Module from "../models/module.model";

const elevenlabs = new ElevenLabsClient({
  apiKey: environments.ELEVENLABS_API_KEY,
});

const startAttempt = async ({
  userEmail,
  userId,
  moduleId,
}: {
  userEmail: string;
  userId: string;
  moduleId: string;
}) => {
  // Check if user is allowed to access the module
  const module = await Module.findOne({
    _id: moduleId,
    active: true,
    userEmails: { $in: [userEmail] },
  });

  if (!module) {
    throw new NotFoundError("Module not found or you don't have access");
  }

  const existingAttempt = await Attempt.findOne({
    user: userId,
    module: module._id,
  });

  if (existingAttempt?.attemptStatus === "COMPLETED") {
    throw new BadRequestError("You have already completed this module");
  }

  const elevenLabsSignedURL =
    await elevenlabs.conversationalAi.conversations.getSignedUrl({
      agentId: module.agentId as string,
      includeConversationId: true,
    });

  if (existingAttempt?.attemptStatus === "PENDING") {
    existingAttempt.elevenLabsSignedURL = elevenLabsSignedURL.signedUrl;
    await existingAttempt.save();
    return existingAttempt;
  }

  console.log("Elevenlabs signed URL", elevenLabsSignedURL);

  const attempt = await Attempt.create({
    user: userId,
    module: moduleId,
    elevenLabsSignedURL: elevenLabsSignedURL.signedUrl,
  });
  return attempt;
};

export { startAttempt };
