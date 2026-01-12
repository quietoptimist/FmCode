
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
    try {
        const { description, model, reasoningEffort } = await req.json();

        if (!description) {
            return NextResponse.json({ error: 'Description is required' }, { status: 400 });
        }

        const promptPath = path.resolve(process.cwd(), '../Prompts/PromptFmCodeFromDesc_v3.txt');

        let systemPrompt = '';
        try {
            systemPrompt = fs.readFileSync(promptPath, 'utf-8');
        } catch (err) {
            console.error('Error reading prompt file:', err);
            return NextResponse.json({ error: 'Failed to read system prompt' }, { status: 500 });
        }

        // Detect if it's a Gemini model
        const isGemini = model?.toLowerCase().includes('gemini');

        if (isGemini) {
            const googleApiKey = process.env.GOOGLE_API_KEY;
            if (!googleApiKey) {
                return NextResponse.json({ error: 'Google API key not configured' }, { status: 500 });
            }

            const genAI = new GoogleGenerativeAI(googleApiKey);

            // Map common names or use the model string directly for Gemini
            let modelId = model;
            if (model === 'gemini-3-pro') modelId = 'gemini-3-pro-preview';
            if (model === 'gemini-3-flash') modelId = 'gemini-3-flash-preview';

            const geminiModel = genAI.getGenerativeModel({ model: modelId });

            const stream = await geminiModel.generateContentStream({
                contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nUser description: ${description}` }] }],
            });

            const readableStream = new ReadableStream({
                async start(controller) {
                    try {
                        for await (const chunk of stream.stream) {
                            const chunkText = chunk.text();
                            if (chunkText) {
                                controller.enqueue(new TextEncoder().encode(chunkText));
                            }
                        }
                    } catch (e) {
                        console.error('Gemini stream error:', e);
                        controller.error(e);
                    } finally {
                        controller.close();
                    }
                },
            });

            return new NextResponse(readableStream, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Cache-Control': 'no-cache, no-transform',
                    'X-Accel-Buffering': 'no',
                },
            });
        }

        // OpenAI logic
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
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
                    let isThinking = false;
                    console.log('Starting stream processing...');

                    // Immediate feedback for gpt-5.1 to prevent buffering/latency perception
                    if (modelId === 'gpt-5.1') {
                        controller.enqueue(new TextEncoder().encode('<thinking>'));
                        isThinking = true;
                    }

                    for await (const chunk of stream) {
                        let content = '';
                        let reasoning = '';

                        // Responses API stream format
                        if (chunk.type === 'response.output_text.delta' && chunk.delta) {
                            content = chunk.delta;
                        } else if (chunk.type === 'response.output_text.reasoning_delta' && chunk.delta) {
                            reasoning = chunk.delta;
                        }
                        // Fallback for Chat Completions API format (if used)
                        else if (chunk.choices?.[0]?.delta?.content) {
                            content = chunk.choices[0].delta.content;
                        }

                        // Check for 'reasoning' property in delta (User suggestion)
                        if (chunk.choices?.[0]?.delta?.reasoning) {
                            reasoning = chunk.choices[0].delta.reasoning;
                        }
                        // Also check reasoning_content as another potential property
                        else if (chunk.choices?.[0]?.delta?.reasoning_content) {
                            reasoning = chunk.choices[0].delta.reasoning_content;
                        }
                        // Fallback: Check top-level reasoning property (some API versions)
                        else if ((chunk as any).reasoning) {
                            reasoning = (chunk as any).reasoning;
                        }

                        // Handle reasoning stream
                        if (reasoning) {
                            if (!isThinking) {
                                controller.enqueue(new TextEncoder().encode('<thinking>'));
                                isThinking = true;
                            }
                            controller.enqueue(new TextEncoder().encode(reasoning));
                        }

                        // Handle content stream
                        if (content) {
                            if (isThinking) {
                                controller.enqueue(new TextEncoder().encode('</thinking>'));
                                isThinking = false;
                            }
                            controller.enqueue(new TextEncoder().encode(content));
                        }
                    }

                    // Close thinking tag if stream ends while thinking
                    if (isThinking) {
                        controller.enqueue(new TextEncoder().encode('</thinking>'));
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
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-cache, no-transform',
                'X-Accel-Buffering': 'no',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: any) {
        console.error('AI Generation Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate code' }, { status: 500 });
    }
}
