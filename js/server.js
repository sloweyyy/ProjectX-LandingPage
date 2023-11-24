const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const axios = require("axios");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;

// MongoDB connection setup (replace 'your_mongodb_uri' and 'yourdbname')
mongoose.connect(
  "mongodb+srv://slowey:tlvptlvp@projectx.3vv2dfv.mongodb.net/ProjectX",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// Create a schema and model for the Users table
/**
 * Represents the user schema.
 * @typedef {Object} UserSchema
 * @property {string} username - The username of the user.
 * @property {string} apikey - The API key of the user.
 * @property {string} password - The password of the user.
 */
const UserSchema = new mongoose.Schema({
  username: String,
  apikey: String,
  password: String,
});

UserSchema.pre("save", async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  next();
});

UserSchema.methods.correctPassword = async function (
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
app.post("/sign-up", async (req, res) => {
  try {
    const { username, apikey, password } = req.body;

    // Check for missing fields
    if (!username || !apikey || !password) {
      return res.status(400).send("All fields are required");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).send("User already exists");
    }

    // Validate API key
    if (!(await isValidApiKey(apikey))) {
      return res.status(401).send("Invalid API key");
    }

    // Create a new user document
    const newUser = new User({ username, apikey, password });

    // Save the user to the database
    await newUser.save();

    res.send("Registration successful");
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).send("Registration failed");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

async function isValidApiKey(key) {
  try {
    const response = await axios.post(
      "https://api.zalo.ai/v1/tts/synthesize",
      null,
      {
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
