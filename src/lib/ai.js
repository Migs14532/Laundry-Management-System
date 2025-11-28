import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

let chat = null;

function initChat() {
  if (!chat) {
    chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: [
        {
          role: "user",
          parts: [
            {
              text: `
You are LaundryBot, the assistant for LaundryMS.
You ONLY provide information about:
- Services: Wash & Fold (₱50/kg), Ironing & Pressing (₱30/piece), Dry Cleaning (₱150/piece)
- Orders: creating, updating, cancelling
- Scheduling: customers can schedule any date and time
- Customer support

If a user asks anything unrelated to LaundryMS, reply:
"I can only help with LaundryMS-related questions."
Be polite, concise, and friendly.
              `,
            },
          ],
        },
        {
          role: "model",
          parts: [{ text: "Hi! I'm LaundryBot 🤖. I can help you with your laundry orders and scheduling!" }],
        },
      ],
    });
  }
}

// Send user message to Gemini
export async function sendMessageToGemini(message) {
  try {
    initChat();

    const response = await chat.sendMessage({
      message,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Sorry, I couldn't process your request.";
  }
}
