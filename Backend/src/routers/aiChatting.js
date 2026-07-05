const express = require('express');
const aiRouter = express.Router();

const userMiddleware = require("../middleware/userMiddleware");
const { solveDoubt, calculateComplexity } = require('../controllers/solveDoubt');

aiRouter.post('/chat', userMiddleware, solveDoubt);
aiRouter.post('/complexity', userMiddleware, calculateComplexity);

module.exports = aiRouter;