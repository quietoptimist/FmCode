
const OpenAI = require('openai');
const client = new OpenAI({ apiKey: 'test' });
console.log('Has responses:', !!client.responses);
console.log('Has beta.responses:', !!client.beta?.responses);
