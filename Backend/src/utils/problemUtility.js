const axios = require('axios');

const getLanguageById = (lang) => {
    const l = lang.toLowerCase();
    const languageMap = {
        "c++": 54,
        "cpp": 54,
        "java": 62,
        "javascript": 63,
        "js": 63,
        "python": 113,
        "py": 113
    };
    return languageMap[l] || 63; // defaults to javascript if unknown
};


const submitBatch = async (submissions) => {

    const options = {
        method: 'POST',
        url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
        params: {
            base64_encoded: 'false'
        },
        headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
            'Content-Type': 'application/json'
        },
        data: {
            submissions
        }
    };

    async function fetchData() {
        try {
            const response = await axios.request(options);
            // console.log("Submit Batch:-");
            // console.log(response);
            return response.data;
        }
        catch (error) {
            console.error(error.message);
        }
    }
    return fetchData();
};

const waiting = (timer) => new Promise(resolve => setTimeout(resolve, timer));


const submitToken = async (resultToken) => {

    const options = {
        method: 'GET',
        url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
        params: {
            tokens: resultToken.join(","),
            base64_encoded: 'false',
            fields: '*'
        },
        headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
            'Content-Type': 'application/json'
        }
    };

    async function fetchData() {
        try {
            const response = await axios.request(options);

            return (response.data);
        }
        catch (error) {
            console.error("fetchData Error:", error.message);
            return null;
        }
    }

    let maxAttempts = 25;
    let attempts = 0;

    while (attempts < maxAttempts) {
        attempts++;
        const result = await fetchData();

        if (!result || !result.submissions) {
            await waiting(3000);
            continue;
        }

        const IsResultObtained = result.submissions.every((r) => r.status_id > 2);

        if (IsResultObtained) return result.submissions;

        await waiting(3000);
    }

    throw new Error("Execution timeout: Judge0 evaluation took too long.");

}
module.exports = { getLanguageById, submitBatch, submitToken };




