const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/user');

// 1. Generate Stripe Checkout Session URL
const createCheckoutSession = async (req, res) => {
    try {
        const user = req.result; // Comes from userMiddleware (logged in user)

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            customer_email: user.emailId,
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: 'CodeArena PRO Membership',
                            description: 'Unlimited AI coding assistant, video solutions, and premium badges.',
                        },
                        unit_amount: 49900, // Amount in paise (49900 paise = ₹499 INR)
                    },
                    quantity: 1,
                },
            ],
            // Where Stripe sends the user after successful payment
            success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            // Where Stripe sends the user if they click cancel
            cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/problems`,
        });

        res.status(200).json({ url: session.url });
    } catch (err) {
        console.error("Stripe Session Error:", err.message);
        res.status(500).json({ error: "Failed to create payment session" });
    }
};

// 2. Verify payment after redirect and upgrade user in MongoDB
const verifyPayment = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const user = req.result;

        // Retrieve session details from Stripe servers
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            // Upgrade user to Premium in MongoDB
            await User.findByIdAndUpdate(user._id, { isPremium: true });
            return res.status(200).json({ success: true, message: "Welcome to CodeArena PRO!" });
        } else {
            return res.status(400).json({ success: false, message: "Payment not completed." });
        }
    } catch (err) {
        console.error("Payment Verification Error:", err.message);
        res.status(500).json({ error: "Failed to verify payment" });
    }
};

module.exports = { createCheckoutSession, verifyPayment };
