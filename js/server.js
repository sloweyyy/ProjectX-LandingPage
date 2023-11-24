const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5500;

// MongoDB connection setup (replace 'your_mongodb_uri' and 'yourdbname')
mongoose.connect('mongodb+srv://slowey:tlvptlvp@projectx.3vv2dfv.mongodb.net/ProjectX', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

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

const User = mongoose.model('Users', UserSchema);

// Middleware setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files (CSS, JS, etc.)
app.use(express.static('public'));

// Define a route for handling the registration form submission
app.post('/sign-up', async(req, res) => {
    try {
        // Retrieve data from the form
        const { username, apikey, password } = req.body;

        // Create a new user document
        const newUser = new User({ username, apikey, password });

        // Save the user to the database
        await newUser.save();

        res.send('Registration successful');
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).send('Registration failed');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});