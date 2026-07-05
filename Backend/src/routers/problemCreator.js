const express = require('express');
const problemRouter = express.Router();
const adminMiddleware = require("../middleware/adminMiddleware");
const { createProblem, updateProblem, deleteProblem, getProblemById, getAdminProblemById, getAllProblems, solvedAllProblemByUser, submittedProblem } = require("../controllers/userProblem");
const userMiddleware = require("../middleware/userMiddleware");


problemRouter.post("/create", adminMiddleware, createProblem);
problemRouter.put("/update/:id", adminMiddleware, updateProblem);
problemRouter.delete("/delete/:id", adminMiddleware, deleteProblem);
problemRouter.get("/admin/problemById/:id", adminMiddleware, getAdminProblemById);


problemRouter.get("/problemById/:id", getProblemById);
problemRouter.get("/getAllProblems", getAllProblems);
problemRouter.get("/problemsSolvedByUser", userMiddleware, solvedAllProblemByUser);
problemRouter.get("/submittedProblem/:pid", userMiddleware, submittedProblem);


module.exports = problemRouter;