const User = require("../models/user");
const validate = require("../utils/validator");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const crypto = require('crypto');
const { sendResetEmail } = require('../utils/mailer');
const axios = require('axios');




const register = async (req, res) => {
    try {

        validate(req.body);

        const { firstName, emailId, password } = req.body;

        req.body.password = await bcrypt.hash(password, 10);
        req.body.role = 'user';
        const user = await User.create(req.body);

        const token = jwt.sign({ _id: user._id, emailId: emailId, role: 'user' }, process.env.JWT_KEY, { expiresIn: 60 * 60 });

        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role: user.role || 'user',
            isPremium: user.isPremium || false,
            aiQueries: user.aiQueries || {}
        }

        res.cookie('token', token, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });
        res.status(201).json({
            user: reply,
            message: "Logged in Successfully"
        });
    }
    catch (err) {
        console.log(err);
        res.status(400).send("Error: " + err);
    }
}

const login = async (req, res) => {

    try {


        const { emailId, password, rememberMe } = req.body;


        if (!emailId) {
            throw new Error("Invalid credentials");
        }
        if (!password) {
            throw new Error("Invalid credentials");
        }

        const user = await User.findOne({ emailId });

        if (!user) {
            throw new Error("Invalid credentials");
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            throw new Error("Invalid credentials");
        }

        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role: user.role,
            currentStreak: user.currentStreak || 0,
            maxStreak: user.maxStreak || 0,
            isPremium: user.isPremium || false,
            aiQueries: user.aiQueries || {}
        }

        // If rememberMe is true, token and cookie expire in 30 days, otherwise 1 hour
        const duration = rememberMe ? 30 * 24 * 60 * 60 : 60 * 60;
        const token = jwt.sign({ _id: user._id, emailId: emailId, role: user.role }, process.env.JWT_KEY, { expiresIn: duration });
        res.cookie('token', token, {
            maxAge: duration * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });
        res.status(200).json({
            user: reply,
            message: "Logged in Successfully"
        });
    }
    catch (err) {
        res.status(401).json({ message: err.message || 'Invalid credentials' });
    }
}

const logout = async (req, res) => {

    try {
        const { token } = req.cookies;
        const payload = jwt.decode(token);

        await redisClient.set(`token:${token}`, 'Blocked');
        await redisClient.expireAt(`token:${token}`, payload.exp);
        res.cookie('token', null, {
            expires: new Date(Date.now()),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });
        res.send("Logged out successfully");
    }
    catch (err) {
        res.status(503).send("Error: " + err);
    }
}

const adminRegister = async (req, res) => {
    try {

        validate(req.body);

        const { firstName, emailId, password } = req.body;

        req.body.password = await bcrypt.hash(password, 10);
        // req.body.role = 'admin';
        const user = await User.create(req.body);

        //const token = jwt.sign({_id:user._id , emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn:60*60});
        //res.cookies('token',token,{maxAge: 60*60*1000});
        res.status(201).send("Admin registered successfully");

    }
    catch (err) {
        res.status(400).send("Error: " + err);
    }
}

const getProfile = async (req, res) => {
    try {
        const userId = req.result._id;
        const user = await User.findById(userId).populate('problemSolved');
        if (!user) {
            return res.status(404).send("User not found");
        }

        const userProfile = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName || '',
            emailId: user.emailId,
            age: user.age || '',
            role: user.role,
            description: user.description || '',
            linkedinUrl: user.linkedinUrl || '',
            githubUrl: user.githubUrl || '',
            currentStreak: user.currentStreak || 0,
            maxStreak: user.maxStreak || 0,
            problemSolved: user.problemSolved,
            createdAt: user.createdAt
        };

        res.status(200).json(userProfile);
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.result._id;
        const { firstName, lastName, age, password, description, linkedinUrl, githubUrl } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send("User not found");
        }

        if (firstName) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (age !== undefined) user.age = age;
        if (description !== undefined) user.description = description;
        if (linkedinUrl !== undefined) user.linkedinUrl = linkedinUrl;
        if (githubUrl !== undefined) user.githubUrl = githubUrl;

        if (password) {
            if (password.length < 8) {
                return res.status(400).send("Password must be at least 8 characters");
            }
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        const reply = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            emailId: user.emailId,
            age: user.age,
            role: user.role,
            description: user.description,
            linkedinUrl: user.linkedinUrl,
            githubUrl: user.githubUrl,
            currentStreak: user.currentStreak,
            maxStreak: user.maxStreak
        };

        res.status(200).json({
            user: reply,
            message: "Profile updated successfully"
        });
    } catch (err) {
        res.status(400).send("Error: " + err.message);
    }
};

const getPublicProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).populate('problemSolved');
        if (!user) {
            return res.status(404).send("User not found");
        }

        // Return ONLY public data (hide email, age, password etc)
        const publicProfile = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName || '',
            role: user.role,
            description: user.description || '',
            linkedinUrl: user.linkedinUrl || '',
            githubUrl: user.githubUrl || '',
            currentStreak: user.currentStreak || 0,
            maxStreak: user.maxStreak || 0,
            problemSolved: user.problemSolved,
            createdAt: user.createdAt
        };

        res.status(200).json(publicProfile);
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
};

const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await User.aggregate([
            {
                $project: {
                    firstName: 1,
                    lastName: 1,
                    currentStreak: 1,
                    maxStreak: 1,
                    solvedCount: { $size: { $ifNull: ["$problemSolved", []] } }
                }
            },
            { $sort: { solvedCount: -1, currentStreak: -1 } },
            { $limit: 100 }
        ]);
        res.status(200).json(leaderboard);
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
};



// Request a password reset link
const forgotPassword = async (req, res) => {
    try {
        const { emailId } = req.body;

        if (!emailId) {
            return res.status(400).send("Email is required");
        }

        // 1. Check if user exists (case-insensitive & trimmed)
        const user = await User.findOne({ emailId: emailId.toLowerCase().trim() });
        if (!user) {
            // Explanatory response for development/debugging
            return res.status(404).send("User with this email does not exist");
        }

        // 2. Generate a secure random token (64 hex characters)
        const rawToken = crypto.randomBytes(32).toString('hex');

        // 3. Hash the token before storing it in MongoDB (Security best practice)
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        // 4. Save hashed token and its 15-minute expiration time to user document
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
        await user.save();

        // 5. Build reset URL (using REACT client URL config or local default)
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const resetLink = `${clientUrl}/reset-password/${rawToken}`;

        // 6. Trigger email send
        await sendResetEmail(user.emailId, resetLink);

        res.status(200).json({
            message: "Password reset link has been generated."
        });
    } catch (err) {
        console.error("Forgot Password Error: ", err);
        res.status(500).send("Error: " + err.message);
    }
};




// Reset password with a valid token
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password || password.length < 8) {
            return res.status(400).send("Password must be at least 8 characters long");
        }

        // 1. Hash the incoming raw token from the URL to compare it with DB
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // 2. Find user where token matches and has not expired yet
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).send("Password reset token is invalid or has expired");
        }

        // 3. Hash the new password with bcrypt
        user.password = await bcrypt.hash(password, 10);

        // 4. Clear token and expiration fields to prevent reuse
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.status(200).json({
            message: "Password updated successfully!"
        });
    } catch (err) {
        console.error("Reset Password Error: ", err);
        res.status(500).send("Error: " + err.message);
    }
};





// ---------------- GOOGLE OAUTH 2.0 CONTROLLERS ----------------

// // Step 1: Redirect user to Google's OAuth 2.0 consent screen
const googleAuth = (req, res) => {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/user/auth/google/callback',
        client_id: process.env.GOOGLE_CLIENT_ID,
        access_type: 'offline',
        response_type: 'code',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ].join(' '),
    };

    const qs = new URLSearchParams(options);
    res.redirect(`${rootUrl}?${qs.toString()}`);
};

// Step 2: Handle authorization code callback from Google
const googleAuthCallback = async (req, res) => {
    try {
        const code = req.query.code;
        if (!code) {
            return res.status(400).send("Authorization code not provided by Google");
        }

        // 1. Exchange authorization code for an Access Token
        const tokenResponse = await axios.post(
            'https://oauth2.googleapis.com/token',
            new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/user/auth/google/callback',
                grant_type: 'authorization_code',
            }).toString(),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            }
        );

        const { access_token } = tokenResponse.data;

        // 2. Fetch user's profile information using the access token
        const googleUserResponse = await axios.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            {
                headers: { Authorization: `Bearer ${access_token}` },
            }
        );

        const { email, name, given_name, family_name } = googleUserResponse.data;

        // 3. Check if user already exists in the database
        let user = await User.findOne({ emailId: email.toLowerCase().trim() });

        if (!user) {
            // Create user if not found, generating a random password since login is via Google OAuth
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            user = await User.create({
                firstName: given_name || name || 'Google User',
                lastName: family_name || '',
                emailId: email.toLowerCase().trim(),
                password: hashedPassword,
                role: 'user'
            });
        }

        // 4. Generate JWT Token and set cookie for session persistence
        const token = jwt.sign(
            { _id: user._id, emailId: user.emailId, role: user.role },
            process.env.JWT_KEY,
            { expiresIn: 60 * 60 } // 1 hour
        );

        res.cookie('token', token, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });

        // 5. Redirect user back to the application home/problems page
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        res.redirect(`${clientUrl}/problems`);
    } catch (err) {
        console.error("Google Auth Error: ", err.response?.data || err.message);
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        res.redirect(`${clientUrl}/login?error=GoogleAuthFailed`);
    }
};



module.exports = { register, login, logout, adminRegister, getProfile, updateProfile, getPublicProfile, getLeaderboard, forgotPassword, resetPassword, googleAuth, googleAuthCallback };



