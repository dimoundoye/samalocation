require('dotenv').config({ path: '../.env' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = "Bonjour, réponds 'OK' si tu me reçois.";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("Gemini Response:", text);
    } catch (error) {
        console.error("Gemini Test Error:", error);
    }
}

run();
