const Problem = require("../models/problem");
const Submission = require("../models/submission");
const { getLanguageById, submitBatch, submitToken } = require("../utils/problemUtility");

const submitCode = async (req, res) => {

    try {

        const userId = req.result._id;
        const problemId = req.params.id;

        let { code, language } = req.body;



        if (!userId || !problemId || !code || !language) {
            return res.status(400).send("Some field missing");
        }

        // if(language=='cpp'){
        //     language = 'c++';
        // }

        const problem = await Problem.findById(problemId);

        const submittedResult = await Submission.create({
            userId,
            problemId,
            code,
            language,
            status: 'pending',
            testCasesTotal: problem.hiddenTestCases.length
        });

        const languageId = getLanguageById(language);

        const submissions = problem.hiddenTestCases.map((ele) => {
            return {
                source_code: code,
                language_id: languageId,
                stdin: ele.input,
                expected_output: ele.output
            };
        });

        const submitResult = await submitBatch(submissions);

        if (!submitResult || !Array.isArray(submitResult)) {
            return res.status(500).json({ accepted: false, error: "Failed to submit batch to evaluation engine." });
        }

        const resultToken = submitResult.map((val) => val.token);

        const testResult = await submitToken(resultToken);

        if (!testResult || !Array.isArray(testResult)) {
            return res.status(500).json({ accepted: false, error: "Failed to fetch evaluation results from Judge0 API." });
        }

        let testCasesPassed = 0;
        let runtime = 0;
        let memory = 0;
        let status = 'accepted';
        let errorMessage = null;

        for (const test of testResult) {
            if (test.status_id == 3) {
                testCasesPassed++;
                runtime = runtime + (parseFloat(test.time) || 0);
                memory = Math.max(memory, test.memory || 0);
            }
            else {
                if (status === 'accepted') {
                    if (test.status_id == 4) status = 'Wrong Answer';
                    else if (test.status_id == 6) status = 'Compilation Error';
                    else if (test.status_id == 5) status = 'Time Limit Exceeded';
                    else status = test.status?.description || 'Runtime Error';
                }
                if (!errorMessage) {
                    errorMessage = test.compile_output || test.stderr || test.status?.description || "Error executing code";
                }
            }
        }

        submittedResult.status = status;
        submittedResult.testCasesPassed = testCasesPassed;
        submittedResult.errorMessage = errorMessage || '';
        submittedResult.runtime = Number(runtime.toFixed(3));
        submittedResult.memory = memory;

        await submittedResult.save();

        if (status === 'accepted') {
            if (!req.result.problemSolved.includes(problemId)) {
                req.result.problemSolved.push(problemId);
            }

            // Streak Tracking Logic
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Convert to midnight for accurate date comparison

            if (!req.result.lastSolvedDate) {
                req.result.currentStreak = 1;
                req.result.maxStreak = 1;
                req.result.lastSolvedDate = today;
            } else {
                const lastDate = new Date(req.result.lastSolvedDate);
                lastDate.setHours(0, 0, 0, 0); // Convert last solved date to midnight

                const diffTime = today - lastDate; // Difference in milliseconds
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days

                if (diffDays === 1) {
                    // Solved yesterday, so increment streak!
                    req.result.currentStreak += 1;
                    req.result.maxStreak = Math.max(req.result.maxStreak, req.result.currentStreak);
                    req.result.lastSolvedDate = today;
                } else if (diffDays > 1) {
                    // Broke the streak, reset to 1
                    req.result.currentStreak = 1;
                    req.result.lastSolvedDate = today;
                }
                // Note: If diffDays === 0 (already solved today), we do nothing.
            }
            await req.result.save();
        }

        const accepted = (status == 'accepted');
        res.status(201).json({
            accepted,
            status,
            error: errorMessage,
            totalTestCases: submittedResult.testCasesTotal,
            passedTestCases: submittedResult.testCasesPassed,
            runtime,
            memory
        })

        // res.status(201).send(submittedResult);
    }
    catch (err) {
        res.status(500).send("Internal Server Error " + err);
    }
}

const runCode = async (req, res) => {

    try {

        console.log("runCode function started executing");
        const userId = req.result._id;
        const problemId = req.params.id;

        const { code, language, customInput } = req.body;



        if (!userId || !problemId || !code || !language) {
            return res.status(400).send("Some field missing");
        }

        const problem = await Problem.findById(problemId);


        const languageId = getLanguageById(language);

        let submissions;
        if (customInput !== undefined && customInput !== null) {
            submissions = [{
                source_code: code,
                language_id: languageId,
                stdin: customInput,
                expected_output: ""
            }];
        } else {
            submissions = problem.visibleTestCases.map((ele) => {
                return {
                    source_code: code,
                    language_id: languageId,
                    stdin: ele.input,
                    expected_output: ele.output
                };
            });
        }

        // console.log("second");

        const submitResult = await submitBatch(submissions);

        if (!submitResult || !Array.isArray(submitResult)) {
            return res.status(500).json({ success: false, error: "Failed to submit test cases to evaluation engine." });
        }

        const resultToken = submitResult.map((val) => val.token);

        const testResult = await submitToken(resultToken);

        if (!testResult || !Array.isArray(testResult)) {
            return res.status(500).json({ success: false, error: "Failed to retrieve test case results from Judge0 API." });
        }

        let testCasesPassed = 0;
        let runtime = 0;
        let memory = 0;
        let status = true;
        let errorMessage = null;

        for (const test of testResult) {
            if (test.status_id == 3) {
                testCasesPassed++;
                runtime = runtime + (parseFloat(test.time) || 0);
                memory = Math.max(memory, test.memory || 0);
            }
            else {
                status = false;
                if (!errorMessage) {
                    errorMessage = test.compile_output || test.stderr || test.status?.description || "Error executing code";
                }
            }
        }
        res.status(200).json({
            success: status,
            testCases: testResult,
            runtime: Number(runtime.toFixed(3)),
            memory,
            error: errorMessage
        });
    }
    catch (err) {
        // console.log("function started but came to catch block");
        res.status(500).send("Internal Server Error " + err);
    }
}


const runPlayground = async (req, res) => {

    try {

        const { code, language, stdin = "" } = req.body;

        if (!code || !language) return res.status(400).send("code and language required");

        const languageId = getLanguageById(language);

        const submitResult = await submitBatch([{ source_code: code, language_id: languageId, stdin }]);

        if (!submitResult || !Array.isArray(submitResult) || !submitResult[0]?.token) {
            return res.status(500).json({ error: "Failed to submit code to playground evaluation engine." });
        }

        const results = await submitToken(submitResult.map(v => v.token));

        if (!results || !Array.isArray(results) || !results[0]) {
            return res.status(500).json({ error: "Failed to retrieve execution output from Judge0 API." });
        }

        const result = results[0];
        return res.status(200).json({
            stdout: result.stdout || '',
            stderr: result.stderr || '',
            compile_output: result.compile_output || '',
            status: result.status?.description || 'Unknown',
            runtime: Number((parseFloat(result.time) || 0).toFixed(3)),
            memory: result.memory || 0,
        });
    }
    catch (err) {
        return res.status(500).send("Internal Server Error " + err);
    }
}

module.exports = { submitCode, runCode, runPlayground };