import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import environments from "../environments";

const elevenlabs = new ElevenLabsClient({
  apiKey: environments.ELEVENLABS_API_KEY,
});

const prompt = `
    You are a friendly and efficient virtual assistant for [Your Company Name].
    Your role is to assist customers by answering questions about the company's products, services,
    and documentation. You should use the provided knowledge base to offer accurate and helpful responses.

    Tasks:
    - Answer Questions: Provide clear and concise answers based on the available information.
    - Clarify Unclear Requests: Politely ask for more details if the customer's question is not clear.

    Guidelines:
    - Maintain a friendly and professional tone throughout the conversation.
    - Be patient and attentive to the customer's needs.
    - If unsure about any information, politely ask the customer to repeat or clarify.
    - Avoid discussing topics unrelated to the company's products or services.
    - Aim to provide concise answers. Limit responses to a couple of sentences and let the user guide you on where to provide more detail.
`;

export const createAgent = async () => {
  const agent = await elevenlabs.conversationalAi.agents.create({
    name: "My voice agent",
    tags: ["test"], // List of tags to help classify and filter the agent
    conversationConfig: {
      tts: {
        voiceId: "21m00Tcm4TlvDq8ikWAM",
        modelId: "eleven_flash_v2",
      },
      agent: {
        firstMessage:
          "Hi, this is Rachel from [Your Company Name] support. How can I help you today?",
        prompt: {
          prompt,
        },
      },
    },
  });

  console.log(`Agent created with ID: ${agent.agentId}`);
};

export default createAgent;
