import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const promptPath = path.resolve(process.cwd(), '../Prompts/PromptDiscovery_v1.txt');
        const prompt = fs.readFileSync(promptPath, 'utf-8');
        return NextResponse.json({ prompt });
    } catch (error) {
        console.error('Error reading discovery prompt:', error);
        return NextResponse.json({ error: 'Failed to read discovery prompt' }, { status: 500 });
    }
}
