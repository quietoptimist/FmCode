'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { runEngine } from '@/lib/engine/engine';
import { buildOutputGraph } from '@/lib/engine/buildGraph';
import { buildModelAssumptions, updateAssumption } from '@/lib/engine/buildModelAssumptions';
import { objectSchema } from '@/lib/engine/objectSchema';
import { fnRegistry } from '@/lib/engine/fnRegistry';
import { ObjectAssumptions } from '@/components/ObjectAssumptions';
import { ObjectOutputs } from '@/components/ObjectOutputs';

const SAMPLE_CODE = `
SetupAndFunding:
    Setup = Setup()
    EquityFunding = FundEquity() => startingCash
`;

export default function Editor({ params }: { params: { id: string } }) {
    const [code, setCode] = useState(SAMPLE_CODE);
    const [result, setResult] = useState<any>(null);
    const [engineResult, setEngineResult] = useState<any>(null);
    const [assumptions, setAssumptions] = useState<any>(null);
    const [overrides, setOverrides] = useState<any>({});
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState('Untitled Model');
    const router = useRouter();

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

                    // We'll trigger a parse after setting code.
                    // But we need to handle the async nature.

                    // Let's fetch parse result here.
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

                        setOverrides(data.overrides || {});

                        // Load assumptions if they exist
                        if (data.assumptions) {
                            const restored = JSON.parse(JSON.stringify(data.assumptions), (key, value) => {
                                return value;
                            });
                            const restoreArrays = (obj: any) => {
                                if (!obj) return;
                                if (obj.value && Array.isArray(obj.value)) {
                                    obj.value = Float64Array.from(obj.value);
                                }
                                if (typeof obj === 'object') {
                                    for (const k in obj) {
                                        restoreArrays(obj[k]);
                                    }
                                }
                            };
                            restoreArrays(restored);
                            setAssumptions(restored);
                        }
                    } catch (e: any) {
                        console.error("Auto-parse on load failed", e);
                        setError("Failed to re-parse loaded model: " + e.message);
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
            const ctx = { months: 60, years: 5 };
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
                            def.raw = existing.raw;
                            // We should re-materialize value to be safe, but if we copy value it might be stale if logic changed?
                            // But logic is in engine.
                            // Let's copy value too.
                            if (existing.value !== undefined) def.value = existing.value;
                            return def;
                        }

                        for (const key in def) {
                            if (existing[key] !== undefined) {
                                def[key] = smartMerge(def[key], existing[key]);
                            }
                        }
                    }
                    return def;
                };

                // Create a deep copy of defaults to merge into, as buildModelAssumptions returns objects with Float64Arrays
                // which JSON.parse(JSON.stringify) would not handle correctly.
                // We need a custom deep copy that preserves Float64Arrays.
                const deepCopy = (obj: any): any => {
                    if (obj === null || typeof obj !== 'object') {
                        return obj;
                    }
                    if (obj instanceof Float64Array) {
                        return new Float64Array(obj);
                    }
                    if (Array.isArray(obj)) {
                        return obj.map(item => deepCopy(item));
                    }
                    const copy: { [key: string]: any } = {};
                    for (const key in obj) {
                        if (Object.prototype.hasOwnProperty.call(obj, key)) {
                            copy[key] = deepCopy(obj[key]);
                        }
                    }
                    return copy;
                };

                const mergedDefaults = deepCopy(defaults);
                return smartMerge(mergedDefaults, prev);
            }

            return defaults;
        });
    }, [result]);

    // Run Engine on Client
    const runClientEngine = useCallback(() => {
        if (!result?.ast || !result?.index || !assumptions) return;

        try {
            console.log("Running engine with assumptions:", assumptions);
            const graph = buildOutputGraph(result.ast, result.index);
            const ctx = { months: 60, years: 5 };

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
        } catch (e: any) {
            console.error("Engine error:", e);
            setError("Engine Error: " + e.message);
        }
    }, [result, assumptions, overrides]);

    // Debounce engine run? For now, just run on effect
    useEffect(() => {
        runClientEngine();
    }, [runClientEngine]);

    const handleParse = async () => {
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
            setResult(rehydrated);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Serialize assumptions: Convert Float64Array to Array
            const serializableAssumptions = JSON.parse(JSON.stringify(assumptions, (key, value) => {
                if (value && value.constructor === Float64Array) {
                    return Array.from(value);
                }
                return value;
            }));

            const modelData = {
                user_id: user.id,
                name: name,
                fm_code: code,
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

    const handleAssumptionChange = (objName: string, type: 'object' | 'output', aliasOrName: string, fieldName: string, value: any) => {
        if (!assumptions) return;
        const ctx = { months: 60, years: 5 };
        const newAssumptions = updateAssumption(assumptions, objName, type, aliasOrName, fieldName, value, ctx);
        setAssumptions(newAssumptions);
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

    return (
        <main className="flex min-h-screen flex-col items-center p-4 bg-gray-50 text-black">
            <div className="w-full max-w-[1600px] flex justify-between items-center mb-4">
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
                    {error && <div className="text-red-600 text-sm">{error}</div>}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 text-sm"
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="w-full max-w-[1600px] mb-4">
                <details className="mb-4 bg-white rounded border border-gray-200">
                    <summary className="p-2 cursor-pointer font-medium text-gray-600 hover:bg-gray-50">FM Code Editor</summary>
                    <div className="p-4 flex flex-col gap-2">
                        <textarea
                            className="w-full h-40 p-4 font-mono text-sm border rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            spellCheck={false}
                        />
                        <button
                            onClick={handleParse}
                            className="self-start px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors shadow-sm text-sm"
                        >
                            Parse & Build Graph
                        </button>
                    </div>
                </details>
            </div>

            <div className="w-full max-w-[1600px] flex flex-col gap-8 pb-20">
                {result?.index?.outputsByObject && assumptions ? (
                    (Array.from(result.index.outputsByObject.entries()) as [string, string[]][]).map(([objName, aliases]) => (
                        <div key={objName} className="grid grid-cols-1 lg:grid-cols-12 gap-6 border-b border-gray-200 pb-8">
                            <div className="lg:col-span-4">
                                <ObjectAssumptions
                                    objName={objName}
                                    objAss={assumptions[objName]}
                                    onChange={handleAssumptionChange}
                                />
                            </div>
                            <div className="lg:col-span-8 overflow-hidden">
                                <ObjectOutputs
                                    aliases={aliases}
                                    store={engineResult?.store}
                                    overrides={overrides}
                                    onOverride={handleOverride}
                                />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-500 py-10">
                        {result ? "Loading assumptions..." : "Parse the model to see assumptions and outputs."}
                    </div>
                )}
            </div>
        </main>
    );
}
