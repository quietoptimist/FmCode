const { GoogleGenerativeAI } = require("@google/generative-ai");
async function list() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).listModels(); // This is not the right method call for listModels
  // correction: genAI has no listModels, it's on the client or something? 
  // actually simpler to just try a known good one or search web.
}
