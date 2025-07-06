import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyC2kp4BWMkBwrZWNrYsY6MkdXcrW7-KesA");

export async function getQuestionHelp(questionText: string, options: string[], subject: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert tutor helping students prepare for ${subject} certification exams. 

A student is struggling with this question:

${questionText}

Options:
${options.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join('\n')}

Provide helpful guidance without directly revealing the answer. Focus on:
- Key concepts they should understand
- How to approach this type of question
- Common mistakes to avoid
- Study tips for this topic

Keep your response concise and educational (maximum 200 words).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text || "I'm sorry, I couldn't generate help for this question right now.";
  } catch (error) {
    console.error("Gemini API error:", error);
    return "AI help is currently unavailable. Please try again later.";
  }
}

export async function explainAnswer(
  questionText: string, 
  options: string[], 
  correctAnswer: number, 
  userAnswer: number,
  subject: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert ${subject} instructor explaining why an answer is correct or incorrect.

Question: ${questionText}

Options:
${options.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join('\n')}

Correct Answer: ${String.fromCharCode(65 + correctAnswer)}
Student's Answer: ${String.fromCharCode(65 + userAnswer)}

Provide a clear explanation of:
- Why the correct answer is right
- If the student was wrong, why their choice was incorrect
- Key learning points from this question

Keep it educational and supportive (maximum 250 words).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text || "I couldn't generate an explanation right now.";
  } catch (error) {
    console.error("Gemini API error:", error);
    return "AI explanation is currently unavailable.";
  }
}