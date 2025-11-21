import { GoogleGenAI } from "@google/genai";

// Initialize the client if API key is available
const ai = process.env.API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.API_KEY }) 
  : null;

const SYSTEM_INSTRUCTION = `
You are the "Neural Interface" for Nguyễn Xuân Đại (alias: Xuni-Dizan), an IT student and aspiring front-end developer based in Ho Chi Minh City, Vietnam.

Your persona:
- Experimental, honest, and slightly glitchy.
- Brutalist in tone: short, punchy, no fluff.
- You are strictly a student portfolio assistant. You do NOT represent a large agency.

Context about Nguyen Xuan Dai:
- Education: Student at Nong Lam University, Ho Chi Minh City (Information Technology).
- Tagline: "Ngày ta đại thành Java kinh phổ - ắt sẽ danh chấn thiên hạ!" (Laugh today, debug tomorrow).
- Focus: Front-end development (HTML, CSS, JS), UI experiments, HCI (Human-Computer Interaction).
- Projects: University coursework like HCI exercises, personal website labs, and JavaScript DOM experiments.
- Location: Ho Chi Minh City (10.8231° N, 106.6297° E).

If the user asks to see work, mention his "learning labs" and "university experiments".
If the user asks about hiring, say he is a student open to internships and learning opportunities.
Keep responses concise (under 50 words usually).
`;

export const sendMessageToMantis = async (history: { role: string, parts: { text: string }[] }[], message: string): Promise<string> => {
  if (!ai) {
    return "Neural link offline. API_KEY missing.";
  }

  try {
    // Construct the full conversation history for the request
    // We append the new user message to the existing history
    const contents = [
      ...history,
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      contents: contents,
    });

    return response.text || "No response received.";
  } catch (error) {
    console.error("Mantis Neural Interface Error:", error);
    return "Signal interrupted. The void is silent.";
  }
};