const { getLanguageById, submitBatch, submitToken } = require("../utils/problemUtility");
const Problem = require("../models/problem");
const User = require("../models/user");
const Submission = require("../models/submission");
const solutionVideo = require("../models/solutionVideo");


const createProblem = async (req, res) => {

    const { title, description, difficulty, tags, visibleTestCases,
        hiddenTestCases, startCode, referenceSolution } = req.body;

    try {

        for (const element of referenceSolution) {

            const { language, initialCode } = element;


            const languageId = getLanguageById(language);


            const submissions = visibleTestCases.map((ele) => {

                return {
                    source_code: initialCode,
                    language_id: languageId,
                    stdin: ele.input,
                    expected_output: ele.output
                };
            });

            const submitResult = await submitBatch(submissions);

            const resultToken = submitResult.map((val) => val.token);

            const testResult = await submitToken(resultToken);


            // console.log(JSON.stringify(testResult,null,2));

            for (const test of testResult) {
                if (test.status.id != 3) {
                    return res.status(400).send({
                        status: test.status.description,
                        stdout: test.stdout || test.compile_output || test.stderr || "No output",
                        expected: test.expected_output,
                        token: test.token
                    });
                }
            }

        }

        const userProblem = await Problem.create({
            ...req.body,
            problemCreator: req.result._id
        });
        res.status(201).send("Problem Saved Successfully");
    }
    catch (err) {

        res.status(400).send("Error: " + err.message);
    }

}

const updateProblem = async (req, res) => {

    const { id } = req.params;

    const { title, description, difficulty, tags, visibleTestCases,
        hiddenTestCases, startCode, referenceSolution } = req.body;

    try {

        if (!id) {
            return res.status(400).send("Missing ID Field");
        }

        const DSAproblem = await Problem.findById(id);
        if (!DSAproblem) {
            return res.status(404).send("ID is not present in server");
        }

        for (const element of referenceSolution) {

            const { language, initialCode } = element;


            const languageId = getLanguageById(language);

            const submissions = visibleTestCases.map((ele) => {

                return {
                    source_code: initialCode,
                    language_id: languageId,
                    stdin: ele.input,
                    expected_output: ele.output
                };
            });

            const submitResult = await submitBatch(submissions);

            const resultToken = submitResult.map((val) => val.token);

            const testResult = await submitToken(resultToken);


            for (const test of testResult) {
                if (test.status.id != 3) {
                    return res.status(400).send({
                        status: test.status.description,
                        stdout: test.stdout || test.compile_output || test.stderr || "No output",
                        expected: test.expected_output,
                        token: test.token
                    });
                }
            }
        }

        const newProblem = await Problem.findByIdAndUpdate(id, { ...req.body }, { runValidators: true, new: true });

        res.status(200).send(newProblem);
    }
    catch (err) {
        res.status(404).send("Error: " + err.message);
    }

}

const deleteProblem = async (req, res) => {

    const { id } = req.params;
    try {

        if (!id) {
            return res.status(400).send("ID is missing");
        }

        // Delete all submissions related to this problem
        await Submission.deleteMany({ problemId: id });

        // Pull this problem ID from users' problemSolved arrays
        await User.updateMany(
            { problemSolved: id },
            { $pull: { problemSolved: id } }
        );

        const deletedProblem = await Problem.findByIdAndDelete(id);

        if (!deletedProblem) {
            return res.status(404).send("Problem is missing");
        }

        res.status(200).send("Problem deleted Successfully");
    }
    catch (err) {
        res.status(500).send("Error: " + err.message);
    }
}

const getProblemById = async (req, res) => {

    const { id } = req.params;
    try {

        if (!id) {
            return res.status(400).send("ID is missing");
        }

        const getProblem = await Problem.findById(id).select(' _id title description difficulty tags visibleTestCases startCode referenceSolution');

        if (!getProblem) {
            return res.status(404).send("Problem is missing");
        }



        const video = await solutionVideo.findOne({ problemId: id });

        if (video) {

            const responseData = {
                ...getProblem.toObject(),
                secureUrl: video.secureUrl,
                cloudinaryPublicId: video.cloudinaryPublicId,
                thumbnailUrl: video.thumbnailUrl,
                duration: video.duration
            }
            return res.status(200).send(responseData);
        }

        res.status(200).send(getProblem);
    }
    catch (err) {
        res.status(500).send("Error: " + err.message);
    }
}

const getAdminProblemById = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id) {
            return res.status(400).send("ID is missing");
        }
        const getProblem = await Problem.findById(id);
        if (!getProblem) {
            return res.status(404).send("Problem is missing");
        }
        res.status(200).send(getProblem);
    }
    catch (err) {
        res.status(500).send("Error: " + err.message);
    }
};


const getAllProblems = async (req, res) => {

    try {
        const getProblem = await Problem.find({}).select('_id title difficulty tags');

        if (getProblem.length == 0) {
            return res.status(404).send("Problem is missing");
        }

        res.status(200).send(getProblem);
    }
    catch (err) {
        res.status(500).send("Error: " + err);
    }
}

const solvedAllProblemByUser = async (req, res) => {

    try {
        const userId = req.result._id;

        const user = await User.findById(userId).populate({
            path: "problemSolved",
            select: "_id title difficulty tags"
        });

        res.status(200).send(user.problemSolved);
    }
    catch (err) {
        res.status(500).send("Server Error");
    }
}

const deleteProfile = async (req, res) => {

    try {
        const userId = req.result._id;

        // Delete user from User collection
        await User.findByIdAndDelete(userId);

        // Delete all submissions associated with the user
        await Submission.deleteMany({ userId: userId });

        res.status(200).send("Deleted Successfully");
    }
    catch (err) {
        res.status(500).send("Internal  Server Error");
    }
}

const submittedProblem = async (req, res) => {

    try {

        const userId = req.result._id;
        const problemId = req.params.pid;

        const ans = await Submission.find({ userId, problemId });
        res.status(200).send(ans);
    }
    catch (err) {
        res.status(400).send("Internal Server Error");
    }
}

const getRecommendations = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id) {
            return res.status(400).send("Problem ID is required");
        }

        const currentProblem = await Problem.findById(id);
        if (!currentProblem) {
            return res.status(404).send("Problem not found");
        }

        // Find up to 4 recommendations matching tags or difficulty, excluding the current one
        let recommendations = await Problem.find({
            _id: { $ne: id },
            $or: [
                { tags: { $in: currentProblem.tags || [] } },
                { difficulty: currentProblem.difficulty }
            ]
        })
        .select('_id title difficulty tags')
        .limit(4);

        // If we have fewer than 4, fill the rest with random problems
        if (recommendations.length < 4) {
            const excludeIds = [id, ...recommendations.map(r => r._id.toString())];
            const additional = await Problem.find({
                _id: { $nin: excludeIds }
            })
            .select('_id title difficulty tags')
            .limit(4 - recommendations.length);

            recommendations = recommendations.concat(additional);
        }

        res.status(200).json(recommendations);
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
}

module.exports = { createProblem, updateProblem, deleteProblem, getProblemById, getAdminProblemById, getAllProblems, solvedAllProblemByUser, deleteProfile, submittedProblem, getRecommendations };




