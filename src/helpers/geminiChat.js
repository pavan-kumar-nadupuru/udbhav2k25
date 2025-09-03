import { GoogleGenerativeAI } from "@google/generative-ai";

// It's good practice to initialize the AI client once and reuse it.
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: import.meta.env.VITE_GEMINI_MODEL });

/**
 * Sends a prompt to the Gemini LLM and returns the response.
 * This function will not throw an error; it returns a fallback error message instead.
 * @param {string} prompt The prompt to send to the language model.
 * @returns {Promise<string>} The model's response text or an error message.
 */
export const chatWithLLM = async (prompt, juggad=0) => {
  if(juggad)  {
    if(juggad == 1){
      return "Juggad mode activated";
    } else if(juggad == 2){
      return "Juggad mode 2 activated";
    }
  }
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    console.error("chatWithLLM called with an invalid or empty prompt.");
    return "Error: Prompt cannot be empty.";
  }

  try {
    console.log("Sending prompt to LLM...");
    const result = await model.generateContent(prompt);
    
    // Check for a valid response and text function before calling it
    const response = result?.response;
    const text = response?.text;

    if (typeof text === 'function') {
      return text();
    } else {
       // This handles cases where the response was blocked or didn't contain text
      console.warn("LLM response was blocked or did not contain text.", response);
      return "I'm sorry, I couldn't generate a response for that prompt.";
    }

  } catch (error) {
    // Log the actual error for debugging purposes
    console.error("Error fetching LLM response:", error);
    
    // Return a user-friendly error message
    return "An error occurred while communicating with the AI. Please try again later.";
  }
};