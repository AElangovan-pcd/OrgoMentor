import { GoogleGenAI } from "@google/genai";
import { ChatMessage, MessagePart } from "../types";
import { SYSTEM_PROMPT } from "../constants";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async sendMessage(history: ChatMessage[], newMessage: MessagePart[]): Promise<string> {
    const model = "gemini-3.1-pro-preview";
    
    // Format history for Gemini API
    const contents = history.map(msg => ({
      role: msg.role === 'system' ? 'user' : msg.role,
      parts: msg.parts
    }));

    // Add new message
    contents.push({
      role: 'user',
      parts: newMessage
    });

    const response = await this.ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
      }
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  }

  async *sendMessageStream(history: ChatMessage[], newMessage: MessagePart[]) {
    const model = "gemini-3.1-pro-preview";
    
    const contents = history.map(msg => ({
      role: msg.role === 'system' ? 'user' : msg.role,
      parts: msg.parts
    }));

    contents.push({
      role: 'user',
      parts: newMessage
    });

    const result = await this.ai.models.generateContentStream({
      model,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
      }
    });

    for await (const chunk of result) {
      yield chunk.text;
    }
  }
}

export const geminiService = new GeminiService();
