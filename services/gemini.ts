import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const GEMINI_MODEL = "gemini-3-flash-preview";

export const analyzeImage = async (base64Image: string): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please configure your environment.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Analyze this image of a payment terminal (POS) or ATM. 
    Look specifically for signs of card skimmers, such as:
    1. Bulky or misaligned card reader slots.
    2. Mismatched materials or colors on the card reader.
    3. Hidden cameras pointing at the keypad.
    4. Loose parts or glue residue.
    
    If the image is not of a payment terminal, return a low risk score.
    
    Return a structured JSON response.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSuspicious: { type: Type.BOOLEAN },
            riskScore: { type: Type.NUMBER, description: "0 to 100 integer representing risk level" },
            details: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of specific suspicious features observed"
            },
            deviceType: { 
              type: Type.STRING, 
              enum: ["ATM", "POS", "Other", "Unknown"] 
            },
          },
          required: ["isSuspicious", "riskScore", "details", "deviceType"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback in case of API error to avoid crashing the app
    return {
      isSuspicious: false,
      riskScore: 0,
      details: ["Error analyzing image. Please try again."],
      deviceType: "Unknown",
    };
  }
};
