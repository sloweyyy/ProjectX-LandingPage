const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const axios = require("axios");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5500;
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(atob('QUl6YVN5RFR4dkpFZEhNRzVhOGI5ejhTQ3V1czRqZ25MOTFfeWk0'));
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

mongoose.connect(
    "mongodb+srv://slowey:tlvptlvp@projectx.3vv2dfv.mongodb.net/ProjectX", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
);

const UserSchema = new mongoose.Schema({
    username: String,
    useraccountname: String,
    zaloapi: String,
    fptapi: String,
    password: String,
    created_at: { type: Date, default: Date.now },
    last_used_at: { type: Date, default: Date.now },
});

UserSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 12);

    next();
});

UserSchema.methods.correctPassword = async function(
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model("Users", UserSchema);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("public"));

app.post("/sign-up", async(req, res) => {
    try {
        const { username, useraccountname, zaloapi, fptapi, password } = req.body;

        if (!username || !useraccountname || !zaloapi || !fptapi || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ error: "User already exists" });
        }

        if (!(await isValidZaloApiKey(zaloapi))) {
            return res.status(401).json({ error: "Invalid Zalo API key" });
        }

        if (!(await isValidFptApiKey(fptapi))) {
            return res.status(401).json({ error: "Invalid FPT API key" });
        }

        const newUser = new User({ username, useraccountname, zaloapi, fptapi, password });

        await newUser.save();

        newUser.last_used_at = Date.now();
        await newUser.save();

        res.json({ message: "Registration successful" });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Registration failed" });
    }
});

const prompt = "Hello!"; // Replace with your prompt if any. This prompt is to tell the bot about the context or the role it must take

app.post('/gemini', async(req, res) => {
    try {
        const { question } = req.body;

        const chat = model.startChat({
            history: [{
                    role: 'user',
                    parts: prompt,
                },
                {
                    role: 'model',
                    parts: 'Hello, how can I help you?',
                },
            ],
            generationConfig: {
                maxOutputTokens: 200,
            },
        });

        const result = await chat.sendMessage(question);
        const response = await result.response;
        const text = response.text();

        res.json({ response: text });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


async function isValidFptApiKey(key) {
    try {
        const response = await axios.post(
            "https://api.fpt.ai/dmp/checklive/v2",
            null, {
                headers: {
                    "api-key": key,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );
        return response.status !== 401;
    } catch (error) {
        if (error.response && error.response.status === 401) {
            return false;
        }
        throw error;
    }
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

async function isValidZaloApiKey(key) {
    try {
        const response = await axios.post(
            "https://api.zalo.ai/v1/tts/synthesize",
            null, {
                headers: {
                    apikey: key,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );
        return response.status !== 401;
    } catch (error) {
        if (error.response && error.response.status === 401) {
            return false;
        }
        throw error;
    }
}

const corsOptions = {
    origin: "*", // Allow requests from any origin during development
    optionsSuccessStatus: 200,
};


app.use(cors(corsOptions));