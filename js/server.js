const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const axios = require("axios");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5500;
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyAbWrTm4FIN3pJVdhpEC6E5rK2Qy_ErsGM");

mongoose.connect(
    "mongodb+srv://slowey:tlvptlvp@projectx.3vv2dfv.mongodb.net/ProjectX", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
);

const UserSchema = new mongoose.Schema({
    username: String,
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

// Middleware setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
// Serve static files (CSS, JS, etc.)
app.use(express.static("public"));

// Define a route for handling the registration form submission
// Define a route for handling the registration form submission
app.post("/sign-up", async(req, res) => {
    try {
        const { username, zaloapi, fptapi, password } = req.body;

        // Check for missing fields
        if (!username || !zaloapi || !fptapi || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ error: "User already exists" });
        }

        // Validate Zalo API key
        if (!(await isValidZaloApiKey(zaloapi))) {
            return res.status(401).json({ error: "Invalid Zalo API key" });
        }

        // Validate FPT API key
        if (!(await isValidFptApiKey(fptapi))) {
            return res.status(401).json({ error: "Invalid FPT API key" });
        }

        // Create a new user document
        const newUser = new User({ username, zaloapi, fptapi, password });

        // Save the user to the database
        await newUser.save();

        // Update last_used_at field
        newUser.last_used_at = Date.now();
        await newUser.save();

        res.json({ message: "Registration successful" });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Registration failed" });
    }
});

app.post("/gemini", async(req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: "Question not found." });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(question);
        res.json({ answer: result.response.text() });
    } catch (error) {
        console.log(error);
        res
            .status(500)
            .json({ error: "An error occurred while generating content." });
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

// Start the server
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
    origin: "https://slowey-project-x.vercel.app/", // Thay thế bằng domain của bạn
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));