const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyAbWrTm4FIN3pJVdhpEC6E5rK2Qy_ErsGM");
const app = express();

app.use(express.json());

app.post("/gemini", async(req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: "Question not found." });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent({
            contents: [{ role: "user", parts }],
            generationConfig,
            safetySettings,
        });
        res.json({ answer: result.response.text() });
    } catch (error) {
        res.status(500).json({ error: "An error occurred while generating content." });
    }
});

app.listen(5000, () => {
    console.log("Server is running on port 5000");
});