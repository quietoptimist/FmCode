import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local manually
try {
    const envPath = path.resolve('.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf-8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
    }
} catch (e) {
    console.error('Error loading .env.local', e);
}

import fetch, { Headers } from 'node-fetch';
import FormData from 'form-data';

if (!global.Headers) {
    global.Headers = Headers;
}
if (!global.FormData) {
    global.FormData = FormData;
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    fetch: fetch,
});

async function main() {
    console.log('Starting stream debug...');

    try {
        const stream = await openai.chat.completions.create({
            model: 'gpt-5.1',
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: 'Explain quantum computing briefly.' }
            ],
            stream: true,
            reasoning_effort: 'low'
        });

        for await (const chunk of stream) {
            console.log(JSON.stringify(chunk, null, 2));
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
