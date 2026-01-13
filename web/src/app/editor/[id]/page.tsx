'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { formatName, reformatFmCode } from '@/lib/formatters';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useParams } from 'next/navigation';
import { runEngine } from '@/lib/engine/engine';
import { buildOutputGraph } from '@/lib/engine/buildGraph';
import { buildModelAssumptions, updateAssumption, recalculateAll } from '@/lib/engine/buildModelAssumptions';
import { objectSchema } from '@/lib/engine/objectSchema';
import { fnRegistry } from '@/lib/engine/fnRegistry';
import { ObjectAssumptions } from '@/components/ObjectAssumptions';
import { ObjectOutputs } from '@/components/ObjectOutputs';
import { FinancialsPanel } from '@/components/FinancialsPanel';
import { buildFinancialsFromEngine } from '@/lib/engine/buildFinancialsHelper';
import Link from 'next/link';
import { DiscoveryChat } from '@/components/DiscoveryChat';
import { Sparkles, X } from 'lucide-react';

const SAMPLE_CODE = ``;

export default function Editor() {
    const params = useParams();
    const id = params?.id as string;
    const [code, setCode] = useState(SAMPLE_CODE);
    const [result, setResult] = useState<any>(null);
    const [engineResult, setEngineResult] = useState<any>(null);
    const [assumptions, setAssumptions] = useState<any>(null);
    const [overrides, setOverrides] = useState<any>({});
    const [error, setError] = useState<string | null>(null);
    const [warnings, setWarnings] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const outputScrollRefs = useRef<(HTMLDivElement | null)[]>([]);
    const isScrolling = useRef(false);
    const [name, setName] = useState('Untitled Model');
    const [description, setDescription] = useState('');
    const [selectedModel, setSelectedModel] = useState('gpt-5.1');
    const [reasoningEffort, setReasoningEffort] = useState('medium');
    const [generating, setGenerating] = useState(false);
    const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
    const [thoughts, setThoughts] = useState('');
    const [modelYears, setModelYears] = useState(3);
    const [startYear, setStartYear] = useState(new Date().getFullYear());
    const [startMonth, setStartMonth] = useState(1);
    const [viewMode, setViewMode] = useState<'model' | 'code' | 'financials'>(id === 'new' ? 'code' : 'model');
    const [reformattedCode, setReformattedCode] = useState('');
    const router = useRouter();

    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleScroll = () => {
        if (lineNumbersRef.current && textareaRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const lineCount = code.split('\n').length;
    const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

    // Helper to rehydrate Maps from JSON
    const rehydrateParseResult = (data: any) => {
        if (data.index) {
            if (data.index.outputsByObject && !(data.index.outputsByObject instanceof Map)) {
                data.index.outputsByObject = new Map(Object.entries(data.index.outputsByObject));
            }
            if (data.index.aliases && !(data.index.aliases instanceof Map)) {
                data.index.aliases = new Map(Object.entries(data.index.aliases));
            }
            if (data.index.objectsByName && !(data.index.objectsByName instanceof Map)) {
                data.index.objectsByName = new Map(Object.entries(data.index.objectsByName));
            }
        }
        return data;
    };

    // Check auth and load model
    useEffect(() => {
        const loadModel = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            if (params.id !== 'new') {
                const { data, error } = await supabase
                    .from('models')
                    .select('*')
                    .eq('id', params.id)
                    .single();

                if (error) {
                    setError('Failed to load model: ' + error.message);
                } else if (data) {
                    setCode(data.fm_code || '');
                    setName(data.name || 'Untitled Model');
                    setDescription(data.description || '');

                    if (!data.fm_code) {
                        setViewMode('code');
                    }

                    // We'll trigger a parse after setting code.
                    // But we need to handle the async nature.

                    // Let's fetch parse result here.
                    if (data.fm_code && data.fm_code.trim()) {
                        try {
                            const res = await fetch('/api/parse', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ fmCode: data.fm_code }),
                            });
                            const parseData = await res.json();
                            if (!res.ok) throw new Error(parseData.error || 'Failed to parse');

                            // Rehydrate Maps
                            const rehydrated = rehydrateParseResult(parseData);
                            setResult(rehydrated);
                        } catch (e: any) {
                            console.error("Auto-parse on load failed", e);
                            setError("Failed to re-parse loaded model: " + e.message);
                        }
                    }

                    // Clean overrides: remove 'cum' channel overrides
                    const cleanOverrides = { ...(data.overrides || {}) };
                    for (const alias in cleanOverrides) {
                        if (cleanOverrides[alias]?.cum) {
                            const { cum, ...rest } = cleanOverrides[alias];
                            cleanOverrides[alias] = rest;
                        }
                    }
                    setOverrides(cleanOverrides);

                    // Load assumptions if they exist
                    if (data.assumptions) {
                        const restored = JSON.parse(JSON.stringify(data.assumptions));

                        // Restore settings
                        if (restored._settings && restored._settings.modelYears) setModelYears(restored._settings.modelYears);
                        if (restored._settings && restored._settings.startYear) setStartYear(restored._settings.startYear);
                        if (restored._settings && restored._settings.startMonth) setStartMonth(restored._settings.startMonth);

                        const restoreArrays = (obj: any) => {
                            if (!obj) return;
                            if (obj.value && Array.isArray(obj.value)) obj.value = Float64Array.from(obj.value);
                            if (typeof obj === 'object') {
                                for (const k in obj) restoreArrays(obj[k]);
                            }
                        };
                        restoreArrays(restored);
                        setAssumptions(restored);
                    }
                }
            }
        };
        loadModel();
    }, [params.id, router]);

    // Initialize Assumptions when AST changes
    useEffect(() => {
        if (!result?.ast || !result?.index) return;

        setAssumptions((prev: any) => {
            const ctx = { months: modelYears * 12, years: modelYears };
            const defaults = buildModelAssumptions(result.ast, result.index, objectSchema, ctx);

            // If we have previous assumptions, try to merge them
            if (prev) {
                // Let's do a smart merge.
                const smartMerge = (def: any, existing: any) => {
                    if (!existing) return def;

                    // If both are objects
                    if (typeof def === 'object' && typeof existing === 'object') {
                        // If it's a field (has 'raw'), copy 'raw' and 'value'
                        if (def.raw !== undefined && existing.raw !== undefined) {
                            // Copy raw data
                            // IMPORTANT: Handle resizing of arrays if years changed
                            // But here we are merging existing (old) into defaults (new size)
                            // So we should take existing and fit into def

                            // Actually, let's just copy raw properties. 
                            // buildModelAssumptions logic should handle resizing if we implement it there?
                            // Or we do it here.
                            // Let's copy raw, but we might need to ensure arrays are long enough?
                            // For now, simple copy. We'll rely on buildModelAssumptions to have created correct size defaults,
                            // and we overlay existing data. If existing is shorter, we keep it short? No, we want new size.

                            // Better strategy: Copy scalar values. For arrays, copy elements.
                            const newRaw = { ...def.raw };
                            const oldRaw = existing.raw;

                            if (oldRaw.smoothing !== undefined) newRaw.smoothing = oldRaw.smoothing;
                            if (oldRaw.dateRange !== undefined) newRaw.dateRange = oldRaw.dateRange;

                            // Arrays: Copy what we have, keep new length (which is correct for current modelYears)
                            if (Array.isArray(newRaw.annual) && Array.isArray(oldRaw.annual)) {
                                const oldLen = oldRaw.annual.length;
                                const newLen = newRaw.annual.length;
                                const lastVal = oldLen > 0 ? oldRaw.annual[oldLen - 1] : null;

                                for (let i = 0; i < newLen; i++) {
                                    if (i < oldLen) {
                                        newRaw.annual[i] = oldRaw.annual[i];
                                    } else if (lastVal !== null) {
                                        // Extend with last value to avoid step changes
                                        newRaw.annual[i] = lastVal;
                                    }
                                }
                            }
                            if (Array.isArray(newRaw.growth) && Array.isArray(oldRaw.growth)) {
                                for (let i = 0; i < Math.min(newRaw.growth.length, oldRaw.growth.length); i++) {
                                    newRaw.growth[i] = oldRaw.growth[i];
                                }
                            }
                            // Monthly?
                            if (Array.isArray(newRaw.monthly) && Array.isArray(oldRaw.monthly)) {
                                for (let i = 0; i < Math.min(newRaw.monthly.length, oldRaw.monthly.length); i++) {
                                    newRaw.monthly[i] = oldRaw.monthly[i];
                                }
                            }
                            // Seasonal? (always 12 months)
                            if (Array.isArray(newRaw.seasonal) && Array.isArray(oldRaw.seasonal)) {
                                for (let i = 0; i < 12; i++) {
                                    if (i < oldRaw.seasonal.length) {
                                        newRaw.seasonal[i] = oldRaw.seasonal[i];
                                    }
                                }
                            }

                            def.raw = newRaw;

                            // Don't copy old value arrays - let buildModelAssumptions recalculate them
                            // from the raw data using the current/correct logic

                            return def;
                        }

                        for (const key in def) {
                            // Always use these keys from the new definition (schema), not from saved data
                            if (key === 'comment' || key === 'supports' || key === 'type') continue;
                            if (existing[key] !== undefined) {
                                def[key] = smartMerge(def[key], existing[key]);
                            }
                        }
                        return def;
                    }
                    return existing;
                };

                // Create a deep copy of defaults to merge into
                const deepCopy = (obj: any): any => {
                    if (obj === null || typeof obj !== 'object') return obj;
                    if (obj instanceof Float64Array) return new Float64Array(obj);
                    if (Array.isArray(obj)) return obj.map(deepCopy);
                    const copy: { [key: string]: any } = {};
                    for (const key in obj) {
                        if (Object.prototype.hasOwnProperty.call(obj, key)) {
                            copy[key] = deepCopy(obj[key]);
                        }
                    }
                    return copy;
                };

                const mergedDefaults = deepCopy(defaults);
                const merged = smartMerge(mergedDefaults, prev);
                return recalculateAll(merged, ctx);
            }

            return defaults;
        });
    }, [result, modelYears]); // Re-run when modelYears changes

    // Run Engine on Client
    const runClientEngine = useCallback(() => {
        if (!result?.ast || !result?.index || !assumptions) return;

        try {
            console.log("Running engine with assumptions:", assumptions);
            const graph = buildOutputGraph(result.ast, result.index);
            const ctx = { months: modelYears * 12, years: modelYears };

            const engineOutput = runEngine({
                ast: result.ast,
                index: result.index,
                outGraph: graph,
                assumptions,
                ctx,
                fnRegistry,
                objectSchema,
                overrides
            });

            console.log("Engine output:", engineOutput);
            setEngineResult(engineOutput);
            // Append engine warnings to any existing parser warnings
            if (engineOutput.warnings) {
                setWarnings(prev => {
                    const existing = prev.filter(w => w.type !== 'engine_warning');
                    return [...existing, ...engineOutput.warnings];
                });
            }
        } catch (e: any) {
            console.error("Engine error:", e);
            setError("Engine Error: " + e.message);
        }
    }, [result, assumptions, overrides, modelYears]);

    // Debounce engine run? For now, just run on effect
    useEffect(() => {
        runClientEngine();
    }, [runClientEngine]);

    // Calculate used channels for conditional visibility
    const usedChannels = useMemo(() => {
        if (!result?.ast) return new Set<string>();
        const used = new Set<string>();

        for (const obj of result.ast.objects) {
            for (const arg of obj.args) {
                if (arg.kind === 'ref') {
                    // arg.name is object name or alias
                    // arg.field is the channel (e.g. 'val', 'cum')
                    // But wait, parser puts alias in arg.name?
                    // Let's check parser.ts:
                    // ref = token.match(/^([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)$/);
                    // return { kind: 'ref', name: ref[1], field: ref[2] ... }
                    // So name is the object/alias name, field is the channel.
                    // We want to track usage of "Alias.Channel".
                    used.add(`${arg.name}.${arg.field}`);
                }
            }
        }
        return used;
    }, [result?.ast]);

    // Build financial data
    const financialData = useMemo(() => {
        if (!engineResult || !result?.index) return null;
        return buildFinancialsFromEngine(engineResult, result.index, modelYears * 12);
    }, [engineResult, result, modelYears]);

    const handleParse = async () => {
        if (!code || !code.trim() || code.trim() === 'FM') {
            setError("Please write some FM Code first.");
            return;
        }
        setError(null);
        try {
            const res = await fetch('/api/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fmCode: code }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to parse');

            const rehydrated = rehydrateParseResult(data);
            setWarnings(data.warnings || []);

            // Validate that we can build assumptions from this result
            try {
                const testCtx = { months: modelYears * 12, years: modelYears };
                buildModelAssumptions(rehydrated.ast, rehydrated.index, objectSchema, testCtx);
            } catch (e: any) {
                throw new Error("Error building assumptions: " + e.message);
            }

            setResult(rehydrated);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleGenerate = async () => {
        if (!description.trim()) {
            setError("Please enter a business description first.");
            return;
        }
        setGenerating(true);
        setThoughts('');
        setError(null);

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description,
                    model: selectedModel,
                    reasoningEffort: selectedModel === 'gpt-5.1' ? reasoningEffort : undefined
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to generate code');
            }

            if (!res.body) throw new Error('No response body');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;

                // 1. Extract thoughts (look for the last complete block or an open block at the end)
                const thoughtsMatches = [...fullText.matchAll(/<thinking>([\s\S]*?)<\/thinking>/g)];
                if (thoughtsMatches.length > 0) {
                    setThoughts(thoughtsMatches[thoughtsMatches.length - 1][1].trim());
                } else {
                    // Check for partial open tag at the end
                    const openTagIndex = fullText.lastIndexOf('<thinking>');
                    if (openTagIndex !== -1 && !fullText.includes('</thinking>', openTagIndex)) {
                        setThoughts(fullText.slice(openTagIndex + 10).trim());
                    }
                }

                // 2. Remove all thinking blocks to get "clean" text for code extraction
                let cleanText = fullText.replace(/<thinking>[\s\S]*?<\/thinking>/g, '');
                // Also remove partial thinking tag at the end if present (to avoid showing it as code)
                cleanText = cleanText.replace(/<thinking>[\s\S]*$/, '').trim();

                // 3. Extract code from clean text
                // Try to find a markdown block first
                const codeBlockMatch = cleanText.match(/```(?:fm)?\s*([\s\S]*?)(?:```|$)/);
                if (codeBlockMatch && codeBlockMatch[1].trim()) {
                    setCode(codeBlockMatch[1]);
                } else if (cleanText) {
                    setCode(cleanText.replace(/^```(?:fm)?/, '').replace(/```$/, ''));
                }
            }

            // Final cleanup (same logic as loop to ensure consistency)
            let cleanText = fullText.replace(/<thinking>[\s\S]*?<\/thinking>/g, '');
            cleanText = cleanText.replace(/<thinking>[\s\S]*$/, '').trim();

            let finalCode = '';
            const codeBlockMatch = cleanText.match(/```(?:fm)?\s*([\s\S]*?)(?:```|$)/);
            if (codeBlockMatch && codeBlockMatch[1].trim()) {
                finalCode = codeBlockMatch[1];
            } else if (cleanText) {
                finalCode = cleanText.replace(/^```(?:fm)?/, '').replace(/```$/, '');
            }

            if (finalCode) {
                setCode(finalCode);
                // Trigger auto-save with the final code
                await handleSave(finalCode);
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setGenerating(false);
            setThoughts('');
        }
    };

    const handleSave = async (codeOverride?: string) => {
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Serialize assumptions: Convert Float64Array to Array
            let serializableAssumptions = JSON.parse(JSON.stringify(assumptions, (key, value) => {
                if (value && value.constructor === Float64Array) {
                    return Array.from(value);
                }
                return value;
            }));

            if (!serializableAssumptions) {
                serializableAssumptions = {};
            }

            // Save settings inside assumptions
            serializableAssumptions._settings = { modelYears, startYear, startMonth };

            const modelData = {
                user_id: user.id,
                name: name,
                description: description,
                fm_code: codeOverride !== undefined ? codeOverride : code,
                ast: result?.ast,
                assumptions: serializableAssumptions,
                overrides: overrides
            };

            if (params.id === 'new') {
                const { data, error } = await supabase
                    .from('models')
                    .insert([modelData])
                    .select()
                    .single();
                if (error) throw error;
                router.push(`/editor/${data.id}`);
            } else {
                const { error } = await supabase
                    .from('models')
                    .update(modelData)
                    .eq('id', params.id);
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAssumptionChange = (objName: string, type: 'object' | 'output' | 'meta', aliasOrName: string, fieldName: string, value: any, subField?: string | null, index?: number | null) => {
        try {
            if (!assumptions) return;
            const ctx = { months: modelYears * 12, years: modelYears };
            const newAssumptions = updateAssumption(assumptions, objName, type, aliasOrName, fieldName, value, ctx, subField ?? null, index ?? null);
            setAssumptions(newAssumptions);
        } catch (e) {
            console.error("Error updating assumption:", e);
            setError("Error updating assumption: " + (e as any).message);
        }
    };

    const handleOverride = (alias: string, channel: string, month: number, value: number | null) => {
        setOverrides((prev: any) => {
            const newOverrides = { ...prev };
            if (!newOverrides[alias]) newOverrides[alias] = {};
            if (!newOverrides[alias][channel]) newOverrides[alias][channel] = {};

            if (value === null) {
                delete newOverrides[alias][channel][month];
                // Cleanup empty objects if needed, but not strictly necessary
            } else {
                newOverrides[alias][channel][month] = value;
            }
            return newOverrides;
        });
    };

    // Calculate consistent width for assumptions panel to ensure alignment
    // We calculate the maximum width required by any object and apply it to all
    let assumptionsWidth = 0;
    if (result?.ast?.objects) {
        let maxNeeded = 0;
        result.ast.objects.forEach((obj: any) => {
            const typeName = obj.fnName;
            const def = (objectSchema as any)[typeName];

            // Check supported features
            const outputFields = def?.assumptions?.output || [];
            const supportsSmoothing = outputFields.some((f: any) => f.supports?.smoothing);
            const supportsDateRange = outputFields.some((f: any) => f.supports?.dateRange);

            // Calculate needed width
            // Label (160) + Value (Years * 88) + Smooth (80) + DateRange (150) + Padding (40)
            let needed = 160 + (modelYears * 88) + 40;
            if (supportsSmoothing) needed += 80;
            if (supportsDateRange) needed += 150;

            if (needed > maxNeeded) maxNeeded = needed;
        });
        assumptionsWidth = Math.max(maxNeeded, 300); // Minimum 300px
    }

    const handleFormat = () => {
        const formatted = reformatFmCode(code);
        setReformattedCode(formatted);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(reformattedCode);
        // Optional: Show a toast or feedback
    };



    return (
        <main className="flex min-h-screen flex-col bg-gray-50 text-black">
            <div className="w-full sticky top-0 z-50 bg-gray-50/95 backdrop-blur border-b border-gray-200 px-4 py-3 flex justify-start gap-8 items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="text-gray-500 hover:text-gray-700 font-bold text-xl"
                    >
                        &larr;
                    </button>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="text-2xl font-bold text-blue-800 bg-transparent border-b-2 border-transparent hover:border-blue-200 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                </div>
                <div className="flex gap-4 items-center">
                    {/* Model Years Control */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm">
                            <label className="text-xs font-medium text-gray-500 uppercase">Start</label>
                            <div className="flex items-center gap-1">
                                <select
                                    value={startMonth}
                                    onChange={(e) => setStartMonth(parseInt(e.target.value))}
                                    className="text-sm font-bold text-gray-700 outline-none bg-transparent cursor-pointer hover:text-blue-600"
                                >
                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                        <option key={i} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    min="2000"
                                    max="2100"
                                    value={startYear}
                                    onChange={(e) => setStartYear(Math.max(2000, Math.min(2100, parseInt(e.target.value) || 2024)))}
                                    className="w-14 text-center font-bold text-gray-700 outline-none border-b border-transparent focus:border-blue-500 bg-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm">
                            <label className="text-xs font-medium text-gray-500 uppercase">Years</label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={modelYears}
                                onChange={(e) => setModelYears(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                                className="w-12 text-center font-bold text-gray-700 outline-none border-b border-transparent focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {viewMode === 'model' && (
                        <>
                            <button
                                onClick={() => setViewMode('code')}
                                className="px-4 py-2 font-semibold rounded transition-colors shadow-sm text-sm bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Code Editor
                            </button>
                            <button
                                onClick={() => setViewMode('financials')}
                                className="px-4 py-2 font-semibold rounded transition-colors shadow-sm text-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
                            >
                                View Financials →
                            </button>
                        </>
                    )}

                    {viewMode === 'code' && (
                        <button
                            onClick={() => setViewMode('model')}
                            className="px-4 py-2 font-semibold rounded transition-colors shadow-sm text-sm bg-gray-600 text-white hover:bg-gray-700"
                        >
                            ← Back to Model
                        </button>
                    )}

                    {viewMode === 'financials' && (
                        <button
                            onClick={() => setViewMode('model')}
                            className="px-4 py-2 font-semibold rounded transition-colors shadow-sm text-sm bg-gray-600 text-white hover:bg-gray-700"
                        >
                            ← Back to Model
                        </button>
                    )}

                    <button
                        onClick={() => handleSave()}
                        disabled={saving}
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 text-sm"
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            {/* Error and Warning Messages Area */}
            {(error || (warnings && warnings.length > 0)) && (
                <div className="w-full px-4 mt-4 flex flex-col gap-2 max-h-48 overflow-y-auto">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md shadow-sm flex items-start gap-3">
                            <span className="text-red-600 font-bold">✕</span>
                            <div className="flex-1">
                                <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">Critical Error</h4>
                                <p className="text-sm text-red-700 leading-relaxed">{error}</p>
                            </div>
                        </div>
                    )}
                    {warnings.map((w, i) => (
                        <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-md shadow-sm flex items-start gap-3">
                            <span className="text-amber-600 font-bold">!</span>
                            <div className="flex-1">
                                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Warning</h4>
                                <p className="text-sm text-amber-700 leading-relaxed">{w.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="pt-4"></div>


            {viewMode === 'code' && (
                <div className="w-full px-4 mb-4">
                    <div className="bg-white rounded border border-gray-200 p-4 flex flex-col gap-4 h-[calc(100vh-100px)] overflow-y-auto">
                        {isDiscoveryOpen && (
                            <DiscoveryChat
                                onClose={() => setIsDiscoveryOpen(false)}
                                onSummaryUpdate={(summary) => setDescription(summary)}
                                currentSummary={description}
                            />
                        )}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-semibold text-gray-600">Business Description</label>
                                    {!isDiscoveryOpen && (
                                        <button
                                            onClick={() => setIsDiscoveryOpen(true)}
                                            className="px-2 py-1 bg-blue-50 text-blue-700 font-medium rounded hover:bg-blue-100 transition-colors text-[10px] border border-blue-200 flex items-center gap-1.5"
                                        >
                                            <Sparkles className="w-2.5 h-2.5" />
                                            AI Interview
                                        </button>
                                    )}
                                </div>
                                {isDiscoveryOpen && (
                                    <button
                                        onClick={() => setIsDiscoveryOpen(false)}
                                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        <X className="w-3 h-3" /> Close AI Assistant
                                    </button>
                                )}
                            </div>
                            <textarea
                                className={`w-full ${isDiscoveryOpen ? 'h-[400px]' : (code.trim() ? 'h-[200px]' : 'h-[500px]')} p-2 text-sm border rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all`}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the business logic..."
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className="px-3 py-1.5 bg-purple-100 text-purple-700 font-medium rounded hover:bg-purple-200 transition-colors text-xs border border-purple-200 disabled:opacity-50 flex items-center gap-1"
                                >
                                    {generating ? (
                                        <>
                                            <svg className="animate-spin h-3 w-3 text-purple-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Generating...
                                        </>
                                    ) : (
                                        <>✨ Generate Code</>
                                    )}
                                </button>

                                <select
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="px-2 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-700 outline-none focus:ring-1 focus:ring-purple-500"
                                >
                                    <option value="gpt-5.2">gpt-5.2</option>
                                    <option value="gpt-5.1">gpt-5.1</option>
                                    <option value="gpt-4o">gpt-4o</option>
                                    <optgroup label="Gemini 3 (Newest)">
                                        <option value="gemini-3-pro">Gemini 3 Pro</option>
                                        <option value="gemini-3-flash">Gemini 3 Flash</option>
                                    </optgroup>
                                    <optgroup label="Gemini 2.5">
                                        <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                    </optgroup>
                                    <optgroup label="Legacy">
                                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                        <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                    </optgroup>
                                </select>
                                {(selectedModel === 'gpt-5.1' || selectedModel === 'gpt-5.2') && (
                                    <select
                                        value={reasoningEffort}
                                        onChange={(e) => setReasoningEffort(e.target.value)}
                                        className="px-2 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-700 outline-none focus:ring-1 focus:ring-purple-500"
                                        title="Reasoning Effort"
                                    >
                                        <option value="low">Low Reasoning</option>
                                        <option value="medium">Medium Reasoning</option>
                                        <option value="high">High Reasoning</option>
                                    </select>
                                )}
                                {(selectedModel === 'gpt-5.1' || selectedModel === 'gpt-5.2') && generating && !thoughts && (
                                    <span className="text-xs text-gray-500 italic animate-pulse">
                                        Thinking...
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Reasoning Block */}
                        {thoughts && (
                            <div
                                className="w-full max-h-[5em] overflow-y-auto bg-gray-50 p-2 rounded text-xs font-mono text-gray-600 border border-gray-100"
                                ref={(el) => {
                                    if (el) {
                                        el.scrollTop = el.scrollHeight;
                                    }
                                }}
                            >
                                <div className="whitespace-pre-wrap">{thoughts}</div>
                            </div>
                        )}

                        {/* FM Code Panel - Hide if empty */}
                        {code.trim() && (
                            <div className="flex flex-col gap-1 flex-1 min-h-0">
                                <label className="text-sm font-semibold text-gray-600">FM Code</label>
                                <div className="flex w-full h-full border rounded shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 bg-white">
                                    <div
                                        ref={lineNumbersRef}
                                        className="bg-gray-50 text-gray-400 text-right pr-3 pt-4 font-mono text-sm select-none border-r border-gray-200 overflow-hidden min-w-[3rem]"
                                        style={{ lineHeight: '1.5rem' }}
                                    >
                                        {lines.map(n => (
                                            <div key={n} className="px-1">{n}</div>
                                        ))}
                                    </div>
                                    <textarea
                                        ref={textareaRef}
                                        className="flex-1 h-full p-4 font-mono text-sm outline-none resize-none border-none focus:ring-0 whitespace-pre overflow-x-auto leading-6"
                                        style={{ lineHeight: '1.5rem' }}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        onScroll={handleScroll}
                                        spellCheck={false}
                                    />
                                </div>
                            </div>
                        )}
                        {/* Code Actions - Hide if empty */}
                        {code.trim() && (
                            <div className="flex gap-4 items-center">
                                <button
                                    onClick={() => {
                                        handleParse();
                                        setViewMode('model');
                                    }}
                                    className="self-start px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors shadow-sm text-sm"
                                >
                                    Build model
                                </button>
                                <div className="w-4"></div>
                                <button
                                    onClick={handleFormat}
                                    className="self-start px-4 py-2 bg-gray-600 text-white font-semibold rounded hover:bg-gray-700 transition-colors shadow-sm text-sm"
                                >
                                    Format for Excel Tool
                                </button>
                                <div className="w-1"></div>
                                <button
                                    onClick={handleCopy}
                                    className="self-start px-4 py-2 bg-gray-600 text-white font-semibold rounded hover:bg-gray-700 transition-colors shadow-sm text-sm"
                                >
                                    Copy Reformatted code
                                </button>
                                <div className="flex items-center gap-2">
                                </div>
                            </div>
                        )}

                        {reformattedCode && (
                            <div className="flex flex-col gap-1 flex-1 min-h-0 mt-4">
                                <label className="text-sm font-semibold text-gray-600">Reformatted Code</label>
                                <textarea
                                    className="w-full h-[200px] p-4 font-mono text-sm outline-none resize-none border rounded shadow-sm focus:ring-2 focus:ring-blue-500 whitespace-pre overflow-x-auto leading-6"
                                    value={reformattedCode}
                                    readOnly
                                />
                            </div>
                        )}
                    </div>
                </div>
            )
            }

            {
                viewMode === 'model' && (
                    <>

                        <div className="w-full flex flex-col gap-4 pb-20 pl-8 pr-4 overflow-x-hidden">
                            <div className="flex gap-4">
                                {/* Main Content */}
                                <div className="flex-1 flex flex-col gap-4 min-w-0">
                                    {result?.ast?.objects && assumptions ? (
                                        result.ast.objects.map((obj: any, index: number) => {
                                            const objName = obj.name;
                                            const aliases = result.index.outputsByObject.get(objName) || [];
                                            const typeName = obj.fnName;
                                            const channelDefs = typeName ? (objectSchema as any)[typeName]?.channels : {};

                                            const prevObj = index > 0 ? result.ast.objects[index - 1] : null;
                                            const showSection = obj.section && (!prevObj || obj.section !== prevObj.section);

                                            return (
                                                <div key={objName} className="flex flex-col min-w-0">
                                                    {(!assumptions[objName]) ? null : (
                                                        <>
                                                            {showSection && (
                                                                <div className="w-full border-b-4 border-blue-600 mb-6 mt-8 pb-2">
                                                                    <h2 className="text-4xl font-bold text-blue-600">{formatName(obj.section)}</h2>
                                                                </div>
                                                            )}
                                                            <div className={`flex flex-row gap-3 border-b border-gray-200 pb-4 min-w-0 ${obj.section ? 'pl-8' : ''}`}>
                                                                <div
                                                                    className="flex-none pl-2 overflow-x-auto"
                                                                    style={{ width: `${assumptionsWidth}px`, maxWidth: '45vw' }}
                                                                >
                                                                    <ObjectAssumptions
                                                                        objName={objName}
                                                                        objAss={assumptions[objName]}
                                                                        years={modelYears}
                                                                        uiMode={assumptions[objName].uiMode as 'single' | 'annual' | 'growth'}
                                                                        onChange={handleAssumptionChange}
                                                                    />
                                                                </div>
                                                                <div
                                                                    ref={(el) => { outputScrollRefs.current[index] = el; }}
                                                                    className="flex-1 min-w-0 overflow-x-auto"
                                                                    onScroll={(e) => {
                                                                        if (isScrolling.current) return;
                                                                        isScrolling.current = true;
                                                                        const scrollLeft = e.currentTarget.scrollLeft;
                                                                        outputScrollRefs.current.forEach((ref, i) => {
                                                                            if (ref && i !== index) {
                                                                                ref.scrollLeft = scrollLeft;
                                                                            }
                                                                        });
                                                                        requestAnimationFrame(() => {
                                                                            isScrolling.current = false;
                                                                        });
                                                                    }}
                                                                >
                                                                    <ObjectOutputs
                                                                        aliases={aliases}
                                                                        store={engineResult?.store}
                                                                        overrides={overrides}
                                                                        months={modelYears * 12}
                                                                        channelDefs={channelDefs}
                                                                        onOverride={handleOverride}
                                                                        objAss={assumptions?.[objName]}
                                                                        seasonalEnabled={assumptions?.[objName]?.seasonalEnabled}
                                                                        objName={objName}
                                                                        onAssumptionChange={handleAssumptionChange}
                                                                        showMonthlyAssumptions={typeName ? (objectSchema as any)[typeName]?.showMonthlyAssumptions : false}
                                                                        uiMode={assumptions?.[objName]?.uiMode || (objectSchema as any)[typeName]?.options?.ui?.defaultMode || 'single'}
                                                                        usedChannels={usedChannels}
                                                                        startYear={startYear}
                                                                        startMonth={startMonth}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center text-gray-500 py-10">
                                            {result ? "Loading assumptions..." : "Parse the model to see assumptions and outputs."}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )
            }

            {
                viewMode === 'financials' && (
                    <div className="w-full h-[calc(100vh-100px)] overflow-hidden">
                        <FinancialsPanel financialData={financialData} />
                    </div>
                )
            }
            {/* DiscoveryChat is now inline in the code view */}
        </main>
    );
}
