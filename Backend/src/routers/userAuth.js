const express = require('express');
const authRouter = express.Router();
const { register, login, logout, adminRegister, getProfile, updateProfile, getPublicProfile, getLeaderboard, forgotPassword, resetPassword, googleAuth, googleAuthCallback } = require('../controllers/userAuthent');
const userMiddleware = require("../middleware/userMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { deleteProfile } = require("../controllers/userProblem");

//Register
/***** Leaderboard *****/
authRouter.get('/leaderboard', getLeaderboard);

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', userMiddleware, logout);
authRouter.post('/admin/register', adminMiddleware, adminRegister);

// Profile Management
authRouter.get('/profile', userMiddleware, getProfile);
authRouter.get('/profile/:userId', getPublicProfile); // Public shareable stats view
authRouter.put('/profile', userMiddleware, updateProfile);
authRouter.delete('/profile', userMiddleware, deleteProfile);
authRouter.get('/check', userMiddleware, (req, res) => {

    const reply = {
        firstName: req.result.firstName,
        emailId: req.result.emailId,
        _id: req.result._id,
        role: req.result.role, // Include role to keep Admin panel links active on refresh
        currentStreak: req.result.currentStreak || 0,
        maxStreak: req.result.maxStreak || 0,
        isPremium: req.result.isPremium || false,
        aiQueries: req.result.aiQueries || {}
    }

    res.status(200).json({
        user: reply,
        message: "Valid User"
    })
})
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password/:token', resetPassword);
// Google OAuth Routes
authRouter.get('/auth/google', googleAuth);
authRouter.get('/auth/google/callback', googleAuthCallback);



module.exports = authRouter;