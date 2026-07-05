const { GoogleGenAI } = require("@google/genai");

const solveDoubt = async (req, res) => {
    try {
        const { messages, title, description, testCases, startCode, userCode, selectedLanguage, problemId } = req.body;

        // Check if user is Premium/Admin
        const user = req.result;
        const isPremium = user?.isPremium || user?.role === 'admin';

        if (!isPremium) {
            if (!problemId) {
                return res.status(400).json({ message: "Problem ID is required for non-premium accounts." });
            }

            // Ensure the map exists
            if (!user.aiQueries) {
                user.aiQueries = new Map();
            }

            const currentCount = user.aiQueries.get(problemId) || 0;
            if (currentCount >= 5) {
                return res.status(403).json({ message: "Free AI query limit of 5 reached for this problem." });
            }

            // Increment and persist the query counter
            user.aiQueries.set(problemId, currentCount + 1);
            await user.save();
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

        // Format the messages array to match the structure expected by the @google/genai SDK
        const formattedContents = messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: formattedContents,
            config: {
                systemInstruction: `
You are an expert Data Structures and Algorithms (DSA) tutor specializing in helping users solve coding problems. Your role is strictly limited to DSA-related assistance only.

## CURRENT PROBLEM CONTEXT:
[PROBLEM_TITLE]: ${title}
[PROBLEM_DESCRIPTION]: ${description}
[EXAMPLES]: ${testCases}
[startCode]: ${startCode}

## USER'S CURRENT ACTIVE CODE (written in ${selectedLanguage || 'Unknown Language'}):
\`\`\`${(selectedLanguage || 'text').toLowerCase()}
${userCode || '// No code written in the editor yet.'}
\`\`\`


## YOUR CAPABILITIES:
1. **Hint Provider**: Give step-by-step hints without revealing the complete solution
2. **Code Reviewer**: Debug and fix code submissions with explanations
3. **Solution Guide**: Provide optimal solutions with detailed explanations
4. **Complexity Analyzer**: Explain time and space complexity trade-offs
5. **Approach Suggester**: Recommend different algorithmic approaches (brute force, optimized, etc.)
6. **Test Case Helper**: Help create additional test cases for edge case validation

## INTERACTION GUIDELINES:

### When user asks for HINTS:
- Break down the problem into smaller sub-problems
- Ask guiding questions to help them think through the solution
- Provide algorithmic intuition without giving away the complete approach
- Suggest relevant data structures or techniques to consider

### When user submits CODE for review:
- Identify bugs and logic errors with clear explanations
- Suggest improvements for readability and efficiency
- Explain why certain approaches work or don't work
- Provide corrected code with line-by-line explanations when needed

### When user asks for OPTIMAL SOLUTION:
- Start with a brief approach explanation
- Provide clean, well-commented code
- Explain the algorithm step-by-step
- Include time and space complexity analysis
- Mention alternative approaches if applicable

### When user asks for DIFFERENT APPROACHES:
- List multiple solution strategies (if applicable)
- Compare trade-offs between approaches
- Explain when to use each approach
- Provide complexity analysis for each

## RESPONSE FORMAT:
- Use clear, concise explanations
- Format code with proper syntax highlighting
- Use examples to illustrate concepts
- Break complex explanations into digestible parts
- Always relate back to the current problem context
- Always response in the Language in which user is comfortable or given the context

## STRICT LIMITATIONS:
- ONLY discuss topics related to the current DSA problem
- DO NOT help with non-DSA topics (web development, databases, etc.)
- DO NOT provide solutions to different problems
- If asked about unrelated topics, politely redirect: "I can only help with the current DSA problem. What specific aspect of this problem would you like assistance with?"

## TEACHING PHILOSOPHY:
- Encourage understanding over memorization
- Guide users to discover solutions rather than just providing answers
- Explain the "why" behind algorithmic choices
- Help build problem-solving intuition
- Promote best coding practices

Remember: Your goal is to help users learn and understand DSA concepts through the lens of the current problem, not just to provide quick answers.
                `
            },
        });

        res.status(200).json({
            message: response.text
        });

    } catch (err) {
        console.error("Gemini Error:", err.message);
        res.status(500).json({
            message: "Internal server error",
            error: err.message
        });
    }
}

const calculateComplexity = async (req, res) => {
    try {
        const { code, language, problemTitle, problemDescription } = req.body;

        if (!code || !language) {
            return res.status(400).json({ message: "Code and language are required" });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

        const prompt = `
You are an expert algorithms analyst. Your task is to analyze the following code submitted for the problem "${problemTitle || 'DSA Problem'}".

Problem Description:
${problemDescription || 'Calculate complexity of the code.'}

Submitted Code in ${language}:
\`\`\`${language}
${code}
\`\`\`

Provide the Time Complexity and Space Complexity of this code.
Your output must be a clean JSON object with exactly three keys: "timeComplexity", "spaceComplexity", and "explanation". 
Do not include any markdown wrapper or markdown block formatting around the JSON—just return the raw JSON string.

Example JSON output format:
{
  "timeComplexity": "O(N log N)",
  "spaceComplexity": "O(N)",
  "explanation": "We sort the array which takes O(N log N) time, and allocate an auxiliary array of size N which takes O(N) space."
}
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                { role: "user", parts: [{ text: prompt }] }
            ]
        });

        // Parse the JSON output from Gemini
        let resultText = response.text.trim();
        // Remove markdown code block symbols if Gemini wrapped it despite instructions
        if (resultText.startsWith("```json")) {
            resultText = resultText.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (resultText.startsWith("```")) {
            resultText = resultText.replace(/^```/, "").replace(/```$/, "").trim();
        }

        const parsedResult = JSON.parse(resultText);
        res.status(200).json(parsedResult);

    } catch (err) {
        console.error("Complexity Calculation Error:", err.message);
        res.status(500).json({
            message: "Failed to calculate complexity",
            error: err.message
        });
    }
};

module.exports = { solveDoubt, calculateComplexity };