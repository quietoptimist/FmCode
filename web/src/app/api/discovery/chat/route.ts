import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const { messages, currentSummary } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
        }

        const googleApiKey = process.env.GOOGLE_API_KEY;
        if (!googleApiKey) {
            return NextResponse.json({ error: 'Google API key not configured' }, { status: 500 });
        }

        const promptPath = path.resolve(process.cwd(), '../Prompts/PromptDiscovery_v1.txt');
        let systemPrompt = '';
        try {
            systemPrompt = fs.readFileSync(promptPath, 'utf-8');
        } catch (err) {
            console.error('Error reading discovery prompt:', err);
            return NextResponse.json({ error: 'Failed to read discovery prompt' }, { status: 500 });
        }

        // Add context about the current manually-edited summary
        if (currentSummary && currentSummary.trim()) {
            systemPrompt += `\n\n# CURRENT BUSINESS DESCRIPTION (MAY INCLUDE MANUAL USER EDITS):
The user has been refining the business description. Here is the current state of the document. YOU MUST RESPECT THESE EDITS and build upon them. If the user has manually entered details here, treat them as facts.

[CURRENT_STATE]
${currentSummary}
[/CURRENT_STATE]`;
        }

        const genAI = new GoogleGenerativeAI(googleApiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            systemInstruction: systemPrompt
        });

        // Convert messages to Gemini format
        // history should be everything except the last message
        // Gemini requires history to start with a 'user' message.
        let history = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'agent' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        // If the first message is from the model, remove it (it's the greeting)
        if (history.length > 0 && history[0].role === 'model') {
            history = history.slice(1);
        }

        const lastMessage = messages[messages.length - 1].content;

        const chat = model.startChat({
            history: history,
        });

        const result = await chat.sendMessageStream(lastMessage);

        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result.stream) {
                        const chunkText = chunk.text();
                        if (chunkText) {
                            controller.enqueue(encoder.encode(chunkText));
                        }
                    }
                } catch (e) {
                    console.error('Gemini Discovery stream error:', e);
                    controller.error(e);
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(readableStream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache, no-transform',
                'X-Accel-Buffering': 'no',
            },
        });

    } catch (error: any) {
        console.error('Discovery Chat Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to process chat' }, { status: 500 });
    }
}
