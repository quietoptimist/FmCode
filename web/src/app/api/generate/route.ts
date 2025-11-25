
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

export async function POST(req: Request) {
    try {
        const { description, model, reasoningEffort } = await req.json();

        if (!description) {
            return NextResponse.json({ error: 'Description is required' }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
        }

        const promptPath = path.resolve(process.cwd(), '../Prompts/PromptFmCodeFromDesc_v3.txt');

        let systemPrompt = '';
        try {
            systemPrompt = fs.readFileSync(promptPath, 'utf-8');
        } catch (err) {
            console.error('Error reading prompt file:', err);
            return NextResponse.json({ error: 'Failed to read system prompt' }, { status: 500 });
        }

        const openai = new OpenAI({ apiKey });

        // Map user model selection to actual OpenAI model ID
        let modelId = 'gpt-4o';
        if (model === 'gpt-4o') {
            modelId = 'gpt-4o';
        } else if (model === 'gpt-5.1' || model === 'GPT-5.1') {
            modelId = 'gpt-5.1';
        }

        const completionOptions: any = {
            input: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: description }
            ],
            model: modelId,
            stream: true,
        };

        // Only pass reasoning_effort if the model supports it
        if (reasoningEffort && modelId === 'gpt-5.1') {
            completionOptions.reasoning = { effort: reasoningEffort };
        }

        // Use the new Responses API
        const stream = await openai.responses.create(completionOptions) as any;

        // Create a ReadableStream from the OpenAI stream
        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        let content = '';

                        // Responses API stream format
                        if (chunk.type === 'response.output_text.delta' && chunk.delta) {
                            content = chunk.delta;
                        }
                        // Fallback for Chat Completions API format (if used)
                        else if (chunk.choices?.[0]?.delta?.content) {
                            content = chunk.choices[0].delta.content;
                        }

                        if (content) {
                            controller.enqueue(new TextEncoder().encode(content));
                        }
                    }
                } catch (e) {
                    console.error('Stream error:', e);
                    controller.error(e);
                } finally {
                    controller.close();
                }
            },
        });

        return new NextResponse(readableStream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
            },
        });

    } catch (error: any) {
        console.error('AI Generation Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate code' }, { status: 500 });
    }
}
