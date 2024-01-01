const { z } = require('zod');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const { client_email, private_key } = require('../secret.json');
const bcrypt = require('bcrypt');
const axios = require('axios');
const cors = require('cors');
const dayjs = require('dayjs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();
const port = process.env.PORT || 5500;
const router = express.Router();

const genAI = new GoogleGenerativeAI(atob('QUl6YVN5RFR4dkpFZEhNRzVhOGI5ejhTQ3V1czRqZ25MOTFfeWk0'));
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
app.use(router);

mongoose.connect(
    "mongodb+srv://slowey:tlvptlvp@projectx.3vv2dfv.mongodb.net/ProjectX", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
);

const UserSchema = new mongoose.Schema({
    username: String,
    useraccountname: { type: String, default: null },
    zaloapi: String,
    fptapi: String,
    email: { type: String, unique: true, required: true },
    password: String,
    created_at: { type: Date, default: Date.now },
    last_used_at: { type: Date, default: Date.now },
    premium: { type: Boolean, default: false },
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
        const { username, useraccountname, zaloapi, fptapi, email, password } = req.body;

        if (!username || useraccountname || !zaloapi || !fptapi || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(409).json({ error: "User already exists" });
        }

        if (!(await isValidZaloApiKey(zaloapi))) {
            return res.status(401).json({ error: "Invalid Zalo API key" });
        }

        if (!(await isValidFptApiKey(fptapi))) {
            return res.status(401).json({ error: "Invalid FPT API key" });
        }

        const newUser = new User({ username, zaloapi, fptapi, email, password, premium: false });

        await newUser.save();

        newUser.last_used_at = Date.now();
        await newUser.save();

        res.json({ message: "Registration successful" });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Registration failed" });
        res.status(400).json({ error: "All fields are required" });

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
                maxOutputTokens: 5000,
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



const spreadsheetId = '1HA42o3I_RfxeHLao2CG995kIuU4cdY-sGoK6K6316n4';



app.post('/send-message', async(req, res) => {
    try {
        const { name, email, subject, comment } = req.body;

        // Create client instance for auth
        const client = new google.auth.JWT(client_email, undefined, private_key, ['https://www.googleapis.com/auth/spreadsheets']);

        const range = 'A2:E2'; // Replace this with the appropriate range for your spreadsheet
        const googleSheets = google.sheets({ version: 'v4', auth: client });
        const now = dayjs().format('DD/MM/YYYY HH:mm:ss');

        await googleSheets.spreadsheets.values.append({
            auth: client,
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [
                    [now, name, email, subject, comment]
                ],
            },
        });

        res.json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error handling the /send-message endpoint:', error);

        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});



const corsOptions = {
    origin: "*", // Allow requests from any origin during development
    optionsSuccessStatus: 200,
};


app.use(cors(corsOptions));