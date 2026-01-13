import { NextResponse } from 'next/server';
// @ts-ignore
import { parseAndLinkFM } from '@/lib/engine/parser';

export async function POST(request: Request) {
    try {
        const { fmCode } = await request.json();
        if (!fmCode) {
            return NextResponse.json({ error: 'fmCode is required' }, { status: 400 });
        }

        const { ast, index, warnings } = parseAndLinkFM(fmCode);

        // Convert Maps to plain objects for JSON serialization
        const serializedIndex = {
            ...index,
            objectsByName: Object.fromEntries(index.objectsByName),
            aliases: Object.fromEntries(index.aliases),
            outputsByObject: Object.fromEntries(index.outputsByObject)
        };

        return NextResponse.json({ ast, index: serializedIndex, warnings });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
