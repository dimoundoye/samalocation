const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getModel = (options = {}) => {
    const defaultModel = "gemini-flash-latest";
    return genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || defaultModel,
        ...options
    });
};

async function testChat(message, history = []) {
    try {
        const systemInstruction = "Tu es l'assistant de Samalocation.";
        const model = getModel({ systemInstruction });

        let validHistory = history.filter(h => h.role === "user" || h.role === "model");
        const firstUserIndex = validHistory.findIndex(h => h.role === "user");
        if (firstUserIndex !== -1) {
            validHistory = validHistory.slice(firstUserIndex);
        } else {
            validHistory = [];
        }

        console.log("Testing with history length:", validHistory.length);
        const chat = model.startChat({
            history: validHistory,
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        const result = await chat.sendMessage(message);
        console.log("Response:", result.response.text());
    } catch (error) {
        console.error("Test Failed:", error.message || error);
        if (error.stack) console.error("Stack:", error.stack);
    }
}

// Test case 3: Non-alternating roles (should FAIL if not handled)
console.log("\n--- Test Case 3: Non-alternating ---");
testChat("Et après ?", [
    { role: "user", parts: [{ text: "Salut" }] },
    { role: "user", parts: [{ text: "Je suis là ?" }] }
]);
