import { GoogleGenAI, GenerateContentResponse, Chat, Part } from "@google/genai";
import { GEMINI_TEXT_MODEL, GEMINI_IMAGE_GEN_MODEL } from '../constants';

const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY_FALLBACK" }); // Fallback to prevent constructor error

function ensureApiKey(): void {
  if (!API_KEY) {
    const errorMessage = "API Key for Gemini is not configured. Please set the API_KEY environment variable.";
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}

export const generateImageFromText = async (prompt: string, numberOfImages: number = 1): Promise<string[]> => {
  ensureApiKey();
  try {
    const response = await ai.models.generateImages({
      model: GEMINI_IMAGE_GEN_MODEL,
      prompt: prompt,
      config: { numberOfImages: Math.max(1, Math.min(numberOfImages, 4)), outputMimeType: 'image/jpeg' }, // API might have its own max
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      return response.generatedImages.map(img => img.image.imageBytes); 
    }
    return [];
  } catch (error) {
    console.error("Error generating image:", error);
    // Check for specific error types if possible, e.g., API key errors, prompt issues
    if (error instanceof Error && error.message.includes("API_KEY")) {
         throw new Error("API Key is invalid or missing. Please check your configuration.");
    }
    throw error;
  }
};

export const getTextFromImage = async (imageBase64: string, mimeType: string, prompt: string): Promise<string> => {
  ensureApiKey();
  try {
    const imagePart: Part = { inlineData: { mimeType, data: imageBase64 } };
    const textPart: Part = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL, // This model supports multimodal inputs
      contents: { parts: [imagePart, textPart] },
    });
    
    return response.text;
  } catch (error) {
    console.error("Error getting text from image:", error);
    throw error;
  }
};

export const getTextFromVideo = async (videoBase64: string, mimeType: string, prompt: string): Promise<string> => {
  ensureApiKey();
  try {
    const videoPart: Part = { inlineData: { mimeType, data: videoBase64 } };
    const textPart: Part = { text: prompt };
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL, 
      contents: { parts: [videoPart, textPart] },
      // Consider thinkingConfig for potentially faster responses on simpler video queries if needed
      // config: { thinkingConfig: { thinkingBudget: 0 } } // Only for gemini-2.5-flash-preview-04-17
    });

    return response.text;
  } catch (error) {
    console.error("Error getting text from video:", error);
    throw error;
  }
};

export const createChat = (systemInstruction?: string): Chat => {
  ensureApiKey();
  return ai.chats.create({
    model: GEMINI_TEXT_MODEL,
    config: {
      ...(systemInstruction && { systemInstruction }),
      // Add other chat configs if needed: temperature, topK, topP
    },
  });
};

// This is a direct call, an alternative to using ai.chats.create for single turn or where history is managed externally
export const generateChatMessage = async (
  history: { role: "user" | "model"; parts: Part[] }[], 
  newMessage: string,
  systemInstruction?: string
): Promise<GenerateContentResponse> => {
  ensureApiKey();
  try {
    const contents = [...history, { role: "user", parts: [{text: newMessage}] }];
    const response = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: contents as any, // Type assertion might be needed depending on exact Part structure from history
      ...(systemInstruction && { config: { systemInstruction } }),
    });
    return response;
  } catch (error) {
    console.error("Error generating chat message:", error);
    throw error;
  }
};


export const generateContentWithGoogleSearch = async (prompt: string): Promise<GenerateContentResponse> => {
  ensureApiKey();
  try {
    const response = await ai.models.generateContent({
       model: GEMINI_TEXT_MODEL, // Ensure this model supports tools
       contents: prompt,
       config: {
         tools: [{googleSearch: {}}],
       },
    });
    // response.text will have the answer
    // response.candidates[0].groundingMetadata.groundingChunks will have sources
    return response;
  } catch (error)
  {
    console.error("Error generating content with Google Search:", error);
    if (error instanceof Error && error.message.includes("grounding")) {
        throw new Error("Failed to use Google Search grounding. The model may not support it or the query was problematic.");
    }
    throw error;
  }
};
