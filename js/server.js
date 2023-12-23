const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const axios = require("axios");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5500;
const { GoogleGenerativeAI } = require("@google/generative-ai");
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
        const { username, useraccountname, zaloapi, fptapi, password } = req.body;

        if (!username || useraccountname || !zaloapi || !fptapi || !password) {
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

        const newUser = new User({ username, zaloapi, fptapi, password, premium: false });

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


router.post('/create_payment_url', function(req, res, next) {
    var ipAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    var config = require('config');
    var dateFormat = require('dateformat');


    var tmnCode = 'FKYPBU79';
    var secretKey = 'YHIPIEHSZJRXFMPMXZHICIHCLZDJRGUO';
    var vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    var returnUrl = config.get('vnp_ReturnUrl');

    var date = new Date();

    var createDate = dateFormat(date, 'yyyymmddHHmmss');
    var orderId = dateFormat(date, 'HHmmss');
    var amount = req.body.amount;
    var bankCode = req.body.bankCode;

    var orderInfo = req.body.orderDescription;
    var orderType = req.body.orderType;
    var locale = req.body.language;
    if (locale === null || locale === '') {
        locale = 'vn';
    }
    var currCode = 'VND';
    var vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    // vnp_Params['vnp_Merchant'] = ''
    vnp_Params['vnp_Locale'] = locale;
    vnp_Params['vnp_CurrCode'] = currCode;
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = orderType;
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    if (bankCode !== null && bankCode !== '') {
        vnp_Params['vnp_BankCode'] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    var querystring = require('qs');
    var signData = querystring.stringify(vnp_Params, { encode: false });
    var crypto = require("crypto");
    var hmac = crypto.createHmac("sha512", secretKey);
    var signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");
    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

    res.redirect(vnpUrl)
        // console
    console.log(vnpUrl);
});

const corsOptions = {
    origin: "*", // Allow requests from any origin during development
    optionsSuccessStatus: 200,
};


app.use(cors(corsOptions));