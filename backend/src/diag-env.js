const path = require('path');
const result = require('dotenv').config({
    path: path.join(__dirname, '../.env'),
    debug: true
});

const { GoogleGenerativeAI } = require("@google/generative-ai");
const key = process.env.GEMINI_API_KEY;
console.log("GEMINI_API_KEY found. Length:", key ? key.length : "NOT FOUND");

const genAI = new GoogleGenerativeAI(key || "");

async function test() {
    const modelsToTest = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-flash-latest", "gemini-pro-latest"];

    for (const modelName of modelsToTest) {
        try {
            console.log(`Testing model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const res = await model.generateContent("Test");
            console.log(`✅ Success with ${modelName}!`);
        } catch (e) {
            console.log(`❌ Error with ${modelName}:`, e.message);
        }
    }
}

test();
