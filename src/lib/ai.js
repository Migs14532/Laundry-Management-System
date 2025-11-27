import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

let chatSession = null;

export async function sendMessageToGemini(message) {
  try {
    if (!chatSession) {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
      });

      chatSession = model.startChat({
        history: [],
      });
    }

    const result = await chatSession.sendMessage(message);
    return result.response.text();

  } catch (err) {
    console.error("Gemini API Error:", err.message);
    return "⚠️ Sorry, I couldn't respond. Check your API key or internet connection.";
  }
}
