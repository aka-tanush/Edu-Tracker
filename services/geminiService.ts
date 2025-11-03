
import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse, Content } from "@google/genai";
import { ChatMode } from '../types';

let ai: GoogleGenAI;

const getAI = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
}

export const getGeminiChatResponse = async (
    history: Content[],
    newMessage: string,
    mode: ChatMode
): Promise<GenerateContentResponse> => {
    const aiInstance = getAI();
    let modelName: string;
    let config = {};

    switch (mode) {
        case ChatMode.FAST:
            modelName = 'gemini-2.5-flash-lite';
            break;
        case ChatMode.DEEP_THOUGHT:
            modelName = 'gemini-2.5-pro';
            config = { thinkingConfig: { thinkingBudget: 32768 } };
            break;
        case ChatMode.STANDARD:
        default:
            modelName = 'gemini-2.5-flash';
            break;
    }

    const contents: Content[] = [...history, { role: 'user', parts: [{ text: newMessage }] }];

    const response = await aiInstance.models.generateContent({
        model: modelName,
        contents,
        config,
    });
    return response;
};

export const getGeminiFlashResponse = async (prompt: string): Promise<string> => {
    const aiInstance = getAI();
    const response = await aiInstance.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};

export const getGeminiProResponse = async (prompt: string): Promise<string> => {
    const aiInstance = getAI();
    const response = await aiInstance.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
    });
    return response.text;
};


export const getGroundedResponse = async (
    prompt: string, 
    useMaps: boolean, 
    location: GeolocationPosition | null
): Promise<{ text: string; chunks: any[] }> => {
    const aiInstance = getAI();
    
    const tools: any[] = useMaps ? [{ googleMaps: {} }, { googleSearch: {} }] : [{ googleSearch: {} }];

    let toolConfig: any = {};
    if (useMaps && location) {
        toolConfig.retrievalConfig = {
            latLng: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            }
        };
    }

    const response = await aiInstance.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools,
        },
        toolConfig,
    });

    const text = response.text;
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { text, chunks };
};
