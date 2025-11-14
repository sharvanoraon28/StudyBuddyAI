
import { GoogleGenAI, Modality } from "@google/genai";
import { StudyAidAction, ChatMessage } from "../types";
import { getPromptForAction } from "../constants";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateStudyAid = async (
  inputValue: string,
  imageData: { mimeType: string; data: string } | null,
  action: StudyAidAction,
  isThinkingMode: boolean,
  educationLevel: string
): Promise<string> => {

  if (action === StudyAidAction.IMAGE) {
    try {
      const imageGenPrompt = `Generate a single, clear, and visually appealing image that represents the core concept of the following topic, suitable for a '${educationLevel}' student: "${inputValue}"`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: imageGenPrompt }] },
        config: { responseModalities: [Modality.IMAGE] },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
      throw new Error("API did not return an image.");
    } catch (error) {
       console.error("Gemini Image Generation failed:", error);
       throw new Error("Failed to generate an image. The model may not have been able to create a visual for this topic.");
    }
  }

  if (action === StudyAidAction.AUDIO) {
    try {
        // Step 1: Generate a summary script using a text model.
        const hasImage = !!imageData;
        const scriptPrompt = getPromptForAction(inputValue, hasImage, StudyAidAction.AUDIO, educationLevel);

        let scriptText: string;
        
        if (hasImage) {
            const imagePart = { inlineData: { mimeType: imageData!.mimeType, data: imageData!.data } };
            const textPart = { text: scriptPrompt };
            const scriptResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] }
            });
            scriptText = scriptResponse.text.trim();
        } else {
            const modelName = isThinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
            const config: any = isThinkingMode ? { thinkingConfig: { thinkingBudget: 32768 } } : {};
            const scriptResponse = await ai.models.generateContent({
                model: modelName,
                contents: scriptPrompt,
                config: Object.keys(config).length > 0 ? config : undefined,
            });
            scriptText = scriptResponse.text.trim();
        }

        if (!scriptText) {
            throw new Error("The AI failed to generate a script for the audio summary.");
        }

        // Step 2: Convert the generated script to speech.
        const ttsPrompt = `Read the following script in a friendly and engaging host persona for a ${educationLevel} student. Ignore any text in brackets, like sound effect cues.`;
        const textToSpeak = `${ttsPrompt}\n\n---\n\n${scriptText}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: textToSpeak }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("API did not return audio data after generating the script.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Gemini Audio Summary Generation failed:", error);
        throw new Error("Failed to generate an audio summary. Please try again.");
    }
  }


  const isJsonAction = action === StudyAidAction.FLASHCARDS || action === StudyAidAction.QUIZ;
  try {
    const hasImage = !!imageData;
    
    const prompt = getPromptForAction(inputValue, hasImage, action, educationLevel);

    if (hasImage) {
      // Image analysis uses flash model regardless of thinking mode
      const imagePart = {
        inlineData: {
          mimeType: imageData!.mimeType,
          data: imageData!.data,
        },
      };
      const textPart = { text: prompt };

      const config = isJsonAction ? { responseMimeType: "application/json" as const } : undefined;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config,
      });
      return response.text.trim();

    } else { // Text only
      const modelName = isThinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
      
      const config: any = {};
      if (isThinkingMode) {
        config.thinkingConfig = { thinkingBudget: 32768 };
      }
      if (isJsonAction) {
        config.responseMimeType = "application/json";
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: Object.keys(config).length > 0 ? config : undefined,
      });
      return response.text.trim();
    }
  } catch (error) {
    console.error("Gemini API call failed:", error);
    if (isJsonAction) {
        throw new Error("The AI failed to generate valid JSON. This can happen with very complex or long source material. Please try again or simplify the input.");
    }
    throw new Error("Failed to generate content from Gemini API.");
  }
};

export const generateChatResponse = async (
  history: ChatMessage[],
  newMessage: string,
  educationLevel: string,
  useGoogleSearch: boolean
): Promise<{ text: string; sources: any[] | null }> => {
  try {
    const modelName = useGoogleSearch ? 'gemini-2.5-flash' : 'gemini-2.5-flash-lite';
    const config = useGoogleSearch ? { tools: [{ googleSearch: {} }] } : undefined;

    let systemInstruction: string;
    if (useGoogleSearch) {
        systemInstruction = `You are "StudyBuddy," an AI educational assistant. Your task is to answer the student's questions. Use Google Search for up-to-date, factual information. If you use search results, synthesize the information clearly. Always tailor your language and complexity for a '${educationLevel}' student.`;
    } else {
        systemInstruction = `You are "StudyBuddy," an AI educational assistant. Your task is to answer the student's questions. Do not use external knowledge unless asked. Tailor your language and complexity for a '${educationLevel}' student.`;
    }

    // Convert app's simple history to API format
    const apiHistory = history.map(msg => ({
      role: msg.role as 'user' | 'model',
      parts: [{ text: msg.text }]
    }));

    const contents = [
      ...apiHistory,
      { role: 'user' as const, parts: [{ text: newMessage }] },
    ];

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        ...config,
        systemInstruction: systemInstruction,
      },
    });
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? null;

    return { text: response.text.trim(), sources };
  } catch (error) {
    console.error("Gemini Chat API call failed:", error);
    throw new Error("Failed to get chat response from Gemini API.");
  }
};

export const generateVisualFromText = async (
  textContent: string,
  educationLevel: string
): Promise<string> => {
  try {
    // 1. Create a concise topic from the text content for better image generation.
    const topicPrompt = `From the text below, identify the central subject. Respond with only a short, descriptive title (5 words or less) suitable for generating an image.\n\nText:\n"""${textContent.substring(0, 1500)}"""`;
    
    const topicResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: topicPrompt,
    });
    const conciseTopic = topicResponse.text.trim();

    if (!conciseTopic) {
        throw new Error("Could not determine a topic for visualization.");
    }
    
    // 2. Generate an image based on the extracted concise topic.
    // Re-use the existing study aid function for image generation.
    const imageBase64 = await generateStudyAid(conciseTopic, null, StudyAidAction.IMAGE, false, educationLevel);
    return imageBase64;

  } catch (error) {
    console.error("Visual generation failed:", error);
    throw new Error("Failed to generate a visual for this topic.");
  }
};
