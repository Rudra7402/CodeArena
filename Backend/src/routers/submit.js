const express = require('express');
const userMiddleware = require('../middleware/userMiddleware');
const { submitCode, runCode, runPlayground } = require('../controllers/userSubmission');
const submitRouter = express.Router();


submitRouter.post("/submit/:id", userMiddleware, submitCode);
submitRouter.post("/run/:id", userMiddleware, runCode);
submitRouter.post("/playground", runPlayground);

module.exports = submitRouter;