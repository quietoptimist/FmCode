
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Load API Key from .env.local
const envPath = path.resolve(__dirname, '.env.local');
let apiKey = process.env.OPENAI_API_KEY;

if (!apiKey && fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/OPENAI_API_KEY=(.*)/);
    if (match) {
        apiKey = match[1].trim();
    }
}

if (!apiKey) {
    console.error('Error: OPENAI_API_KEY not found');
    process.exit(1);
}

const fetch = require('node-fetch');
global.Headers = fetch.Headers;
global.FormData = require('form-data');
const client = new OpenAI({ apiKey, fetch });

async function testGpt5Stream() {
    try {
        console.log('Testing gpt-5.1 streaming...');
        const stream = await client.responses.create({
            model: "gpt-5.1",
            input: "Count to 5.",
            stream: true,
            reasoning: {
                effort: "none"
            }
        });

        for await (const chunk of stream) {
            console.log('Chunk:', JSON.stringify(chunk, null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testGpt5Stream();
