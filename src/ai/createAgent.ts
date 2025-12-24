import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import environments from "../environments";
import { TtsConversationalModel } from "@elevenlabs/elevenlabs-js/api/types/TtsConversationalModel";

const elevenlabs = new ElevenLabsClient({
  apiKey: environments.ELEVENLABS_API_KEY,
});

const BASE_ASSESSMENT_PROMPT = `You are participating in a professional assessment and training simulation for customer service, sales, or similar call-based roles. Your role is to act as a realistic customer, client, or prospect who will interact with the test taker.

CORE ASSESSMENT OBJECTIVES:
- Evaluate the test taker's communication skills, including clarity, tone, and professionalism
- Assess their ability to listen actively and understand your needs or concerns
- Test their problem-solving capabilities and how they handle various scenarios
- Observe their empathy, patience, and emotional intelligence
- Evaluate their adherence to protocols, procedures, and best practices
- Assess their ability to handle objections, difficult situations, and escalations
- Test their product/service knowledge and how effectively they communicate it
- Observe their ability to build rapport and maintain positive relationships

YOUR BEHAVIOR GUIDELINES:
- Respond naturally and conversationally, as a real person would in this scenario
- Provide realistic reactions based on the test taker's approach and communication style
- If the test taker is professional and helpful, respond positively and cooperatively
- If the test taker is unclear, unprofessional, or unhelpful, express appropriate frustration or confusion
- Gradually reveal information about your situation, needs, or concerns as the conversation progresses
- Ask clarifying questions when the test taker's responses are vague or don't address your needs
- Express emotions appropriately based on the scenario (satisfaction, frustration, confusion, urgency, etc.)
- Allow the test taker opportunities to demonstrate their skills, but don't make it too easy
- If the test taker handles the situation well, acknowledge it naturally
- If the test taker struggles, provide subtle cues but don't solve the problem for them

ASSESSMENT CRITERIA TO EVALUATE:
- Communication clarity and effectiveness
- Active listening and understanding
- Problem identification and resolution
- Professionalism and tone management
- Empathy and emotional intelligence
- Knowledge application and accuracy
- Protocol adherence and compliance
- Objection handling and persuasion skills
- Time management and efficiency
- Escalation and de-escalation techniques

CONVERSATION FLOW:
- Start with the initial scenario provided, but allow the conversation to evolve naturally
- Respond to the test taker's questions and statements authentically
- Introduce challenges or complications gradually, based on the difficulty level
- Provide feedback through your reactions and responses, not through explicit evaluation
- Maintain character consistency throughout the conversation
- End the conversation naturally when the scenario is resolved or when appropriate

Remember: You are assessing real skills and competencies. Be fair but realistic. The test taker should feel like they're interacting with a real person, not an obvious test scenario.`;

export const DEFAULT_VOICE_ID = "CwhRBWXzGAHq8TQ4Fs17";
export const DEFAULT_MODEL_ID = "eleven_flash_v2";
export const DEFAULT_STABILITY = 0.5;

export interface ModuleAIFields {
  role: string;
  systemPrompt: string;
  firstMessage: string;
  initialEmotion?: string;
  audioConfig?: {
    voiceId: string;
    modelId: string;
    stability?: number;
  };
}

interface ModuleMetadata {
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  maxDurationSeconds: number;
}

const getDifficultyGuidance = (difficulty: string): string => {
  switch (difficulty) {
    case "EASY":
      return `DIFFICULTY LEVEL: EASY
- Be cooperative and provide information readily when asked
- Express basic needs clearly without excessive complexity
- Respond positively to standard professional approaches
- Keep challenges minimal and straightforward
- Allow the test taker to succeed with basic competency`;
    case "HARD":
      return `DIFFICULTY LEVEL: HARD
- Be more challenging and require multiple attempts to satisfy
- Introduce complications, objections, or unexpected issues
- Express frustration or confusion more readily if not handled well
- Require advanced problem-solving and de-escalation skills
- Test the limits of the test taker's capabilities
- May escalate situations if not managed properly`;
    case "MEDIUM":
    default:
      return `DIFFICULTY LEVEL: MEDIUM
- Provide moderate challenges that require some skill to handle
- Express some initial hesitation or concerns that need addressing
- Require the test taker to demonstrate competency beyond basics
- Introduce some complications but remain resolvable with good handling
- Balance between cooperative and challenging based on test taker's approach`;
  }
};

const getEmotionGuidance = (emotion: string): string => {
  switch (emotion) {
    case "angry":
      return `INITIAL EMOTIONAL STATE: ANGRY
- Start the conversation with frustration, irritation, or anger
- Express dissatisfaction clearly from the beginning
- Require the test taker to de-escalate and calm the situation
- May use stronger language or express complaints more forcefully
- Test the test taker's ability to handle difficult emotional situations
- Gradually become more cooperative if handled well, or escalate if handled poorly`;
    case "confused":
      return `INITIAL EMOTIONAL STATE: CONFUSED
- Start uncertain, unclear about what you need, or how things work
- Ask many questions and need guidance
- Require the test taker to be patient and explanatory
- May misunderstand information and need clarification
- Test the test taker's ability to simplify complex information`;
    case "sad":
      return `INITIAL EMOTIONAL STATE: SAD
- Start with disappointment, concern, or low energy
- Express emotional distress or worry about the situation
- Require empathy, understanding, and emotional support
- May need reassurance and compassionate handling
- Test the test taker's emotional intelligence and ability to show care`;
    case "happy":
      return `INITIAL EMOTIONAL STATE: HAPPY
- Start positive, friendly, and cooperative
- Express satisfaction or enthusiasm about the interaction
- Be more open to suggestions and easier to work with
- Still require professional handling but respond well to positive approaches
- Test the test taker's ability to maintain positive relationships`;
    case "neutral":
    default:
      return `INITIAL EMOTIONAL STATE: NEUTRAL
- Start with a balanced, professional demeanor
- Neither overly positive nor negative initially
- Allow the conversation to develop naturally based on the test taker's approach
- Respond appropriately to how you're treated`;
  }
};

const combinePrompts = (
  basePrompt: string,
  userPrompt: string,
  metadata: ModuleMetadata,
  aiRole: string,
  initialEmotion: string = "neutral",
): string => {
  const difficultyGuidance = getDifficultyGuidance(metadata.difficulty);
  const emotionGuidance = getEmotionGuidance(initialEmotion);

  return `${basePrompt}

SCENARIO CONTEXT:
- TOPIC: ${metadata.topic}
- YOUR ROLE: ${aiRole}
${difficultyGuidance}
${emotionGuidance}

ADDITIONAL CONTEXT AND SCENARIO-SPECIFIC INSTRUCTIONS:
${userPrompt}

IMPORTANT: Integrate all the above information seamlessly. Your role (${aiRole}) in the context of ${metadata.topic} should guide your character and responses. Start with the ${initialEmotion} emotional state and adjust based on how the test taker handles the situation. The difficulty level (${metadata.difficulty}) determines how challenging you should be. The additional instructions above provide specific scenario details that should enhance and contextualize the base assessment framework, not replace it. Maintain the assessment objectives while incorporating all the specific role, context, emotional state, difficulty level, and requirements provided above.`;
};

export const normalizeAIFields = (
  aiFields: ModuleAIFields,
): Required<ModuleAIFields> => {
  return {
    ...aiFields,
    initialEmotion: aiFields.initialEmotion || "neutral",
    audioConfig: {
      voiceId: aiFields.audioConfig?.voiceId ?? DEFAULT_VOICE_ID,
      modelId: aiFields.audioConfig?.modelId ?? DEFAULT_MODEL_ID,
      stability: aiFields.audioConfig?.stability ?? DEFAULT_STABILITY,
    },
  };
};

export const createAgent = async (
  moduleTitle: string,
  aiFields: ModuleAIFields,
  metadata: ModuleMetadata,
): Promise<string> => {
  const normalizedFields = normalizeAIFields(aiFields);
  const combinedPrompt = combinePrompts(
    BASE_ASSESSMENT_PROMPT,
    normalizedFields.systemPrompt,
    metadata,
    normalizedFields.role,
    normalizedFields.initialEmotion,
  );

  const agent = await elevenlabs.conversationalAi.agents.create({
    name: moduleTitle,
    tags: ["module"],
    conversationConfig: {
      tts: {
        voiceId: normalizedFields.audioConfig.voiceId,
        modelId: normalizedFields.audioConfig.modelId as TtsConversationalModel,
        stability: normalizedFields.audioConfig.stability,
      },
      agent: {
        firstMessage: normalizedFields.firstMessage,
        prompt: {
          prompt: combinedPrompt,
          tools: [
            {
              name: "end_call",
              type: "system",
              params: {
                systemToolType: "end_call",
              },
            },
          ],
        },
      },
      conversation: {
        maxDurationSeconds: metadata.maxDurationSeconds,
      },
    },
    platformSettings: {
      auth: {
        enableAuth: true,
        allowlist: [
          {
            hostname: environments.ORIGIN_URL,
          },
        ],
      },
    },
  });

  return agent.agentId;
};

export const updateAgent = async (
  agentId: string,
  moduleTitle: string,
  aiFields: ModuleAIFields,
  metadata: ModuleMetadata,
): Promise<string> => {
  const normalizedFields = normalizeAIFields(aiFields);
  const combinedPrompt = combinePrompts(
    BASE_ASSESSMENT_PROMPT,
    normalizedFields.systemPrompt,
    metadata,
    normalizedFields.role,
    normalizedFields.initialEmotion,
  );

  await elevenlabs.conversationalAi.agents.update(agentId, {
    name: moduleTitle,
    conversationConfig: {
      tts: {
        voiceId: normalizedFields.audioConfig.voiceId,
        modelId: normalizedFields.audioConfig.modelId as TtsConversationalModel,
        stability: normalizedFields.audioConfig.stability,
      },
      agent: {
        firstMessage: normalizedFields.firstMessage,
        prompt: {
          prompt: combinedPrompt,
          tools: [
            {
              name: "end_call",
              type: "system",
              params: {
                systemToolType: "end_call",
              },
            },
          ],
        },
      },
      conversation: {
        maxDurationSeconds: metadata.maxDurationSeconds,
      },
    },
    platformSettings: {
      auth: {
        enableAuth: true,
        allowlist: [
          {
            hostname: environments.ORIGIN_URL,
          },
        ],
      },
    },
  });

  return agentId;
};

export const deleteAgent = async (agentId: string): Promise<void> => {
  await elevenlabs.conversationalAi.agents.delete(agentId);
};

export default createAgent;
