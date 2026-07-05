const express = require('express');
const paymentRouter = express.Router();
const userMiddleware = require('../middleware/userMiddleware');
const { createCheckoutSession, verifyPayment } = require('../controllers/paymentController');

// All payment routes require the user to be logged in
paymentRouter.post('/create-checkout-session', userMiddleware, createCheckoutSession);
paymentRouter.get('/verify/:sessionId', userMiddleware, verifyPayment);

module.exports = paymentRouter;
