'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { FinancialsPanel } from '@/components/FinancialsPanel';
import { buildFinancialsFromEngine } from '@/lib/engine/buildFinancialsHelper';
import { supabase } from '@/lib/supabaseClient';
import { fnRegistry } from '@/lib/engine/fnRegistry';
import { objectSchema } from '@/lib/engine/objectSchema';

export default function FinancialsPage() {
    const params = useParams();
    const modelId = params?.id as string;
    const router = useRouter();

    const [modelData, setModelData] = useState<any>(null);
    const [engineResult, setEngineResult] = useState<any>(null);
    const [engineIndex, setEngineIndex] = useState<any>(null);
    const [engineMonths, setEngineMonths] = useState<number>(60);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 1. Load model data (Session > DB)
    useEffect(() => {
        const loadModel = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }

                if (!modelId) return;

                // A. Check Local Session First (Unsaved changes)
                const sessionKey = `fm_session_${modelId}`;
                const sessionStr = localStorage.getItem(sessionKey);

                if (sessionStr) {
                    try {
                        const session = JSON.parse(sessionStr);
                        console.log('[FinancialsPage] Loaded session from localStorage');
                        setModelData({
                            fm_code: session.code,
                            assumptions: session.assumptions,
                            overrides: session.overrides,
                            modelYears: session.modelYears // Pass this through
                        });
                        setLoading(false);
                        return; // Skip DB fetch
                    } catch (e) {
                        console.error('Error parsing session:', e);
                    }
                }

                // B. Fallback to DB
                const { data, error } = await supabase
                    .from('models')
                    .select('fm_code, assumptions, overrides')
                    .eq('id', modelId)
                    .single();

                if (error) throw error;
                setModelData(data);
            } catch (err: any) {
                console.error('Error loading model:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadModel();
    }, [modelId, router]);

    // 2. Run engine when model data is loaded
    useEffect(() => {
        if (!modelData?.fm_code) return;

        const runEngine = async () => {
            try {
                // Dynamic imports for engine components
                const { parseAndLinkFM } = await import('@/lib/engine/parser');
                const { runEngine: executeEngine } = await import('@/lib/engine/engine');
                const { buildOutputGraph } = await import('@/lib/engine/buildGraph');
                const { buildModelAssumptions, recalculateAll } = await import('@/lib/engine/buildModelAssumptions');

                // A. Parse Code
                const { ast, index } = parseAndLinkFM(modelData.fm_code);

                // B. Build Graph & Context
                const graph = buildOutputGraph(ast, index);

                // C. Build & Calculate Assumptions
                console.log('[FinancialsPage] Model Data Assumptions:', modelData.assumptions);

                // Determine duration: Use session years if available, otherwise infer from assumptions
                let months = 24; // Default
                if (modelData.modelYears) {
                    months = modelData.modelYears * 12;
                    console.log('[FinancialsPage] Using session modelYears:', modelData.modelYears);
                } else if (modelData.assumptions) {
                    // Fallback inference
                    for (const objKey in modelData.assumptions) {
                        const obj = modelData.assumptions[objKey];
                        for (const fieldKey in obj) {
                            const val = obj[fieldKey]?.value;
                            if (Array.isArray(val) && val.length > 0) {
                                months = val.length;
                                break;
                            }
                            if (typeof val === 'object' && val !== null && !Array.isArray(val) && Object.keys(val).length > 0) {
                                months = Object.keys(val).length;
                                break;
                            }
                        }
                        if (months !== 24) break;
                    }
                    console.log('[FinancialsPage] Inferred months:', months);
                }

                const ctx = { months, years: Math.ceil(months / 12) };

                // Helper to ensure arrays are Float64Arrays (engine expects typed arrays for some ops)
                const ensureTypedArrays = (assumptions: any) => {
                    if (!assumptions) return {};
                    Object.keys(assumptions).forEach(objKey => {
                        const obj = assumptions[objKey];
                        if (!obj) return;
                        Object.keys(obj).forEach(fieldKey => {
                            const field = obj[fieldKey];
                            if (!field || !field.value) return;

                            let val = field.value;
                            if (Array.isArray(val)) {
                                field.value = new Float64Array(val);
                            } else if (typeof val === 'object' && !val.length && val !== null) {
                                // Handle object-like array
                                const len = Object.keys(val).length;
                                const arr = new Float64Array(len);
                                for (let i = 0; i < len; i++) arr[i] = val[i];
                                field.value = arr;
                            }
                        });
                    });
                    return assumptions;
                };

                // Merge code defaults with saved assumptions
                let initialAssumptions = buildModelAssumptions(ast, index, ctx, modelData.assumptions || {});

                // Ensure typed arrays (but DO NOT resize/extend)
                initialAssumptions = ensureTypedArrays(initialAssumptions);

                console.log('[FinancialsPage] Initial Assumptions (Typed):', initialAssumptions);

                const calculatedAssumptions = recalculateAll(initialAssumptions, ctx);
                console.log('[FinancialsPage] Calculated Assumptions:', calculatedAssumptions);

                // D. Run Engine
                const result = executeEngine({
                    ast,
                    index,
                    outGraph: graph,
                    assumptions: calculatedAssumptions,
                    ctx,
                    fnRegistry,
                    objectSchema,
                    overrides: modelData.overrides || {}
                });

                console.log('[FinancialsPage] Engine Result Store Size:', result.store.size);
                if (result.store.size > 0) {
                    const firstKey = result.store.keys().next().value;
                    console.log('[FinancialsPage] Sample Store Value:', firstKey, result.store.get(firstKey));
                }

                setEngineResult(result);
                setEngineIndex(index);
                setEngineMonths(months); // Save for buildFinancials
            } catch (error: any) {
                console.error('Engine error:', error);
                setError('Calculation failed: ' + error.message);
            }
        };

        runEngine();
    }, [modelData]);

    // 3. Build financial statements from engine result
    const financialData = useMemo(() => {
        if (!engineResult || !engineIndex) return null;
        return buildFinancialsFromEngine(engineResult, engineIndex, engineMonths);
    }, [engineResult, engineIndex, engineMonths]);

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="flex-none bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/editor/${modelId}`}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            ← Back to Editor
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900">Financial Statements</h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-600 font-medium">Loading financial data...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
                            <h3 className="text-red-800 font-bold mb-2">Error Loading Financials</h3>
                            <p className="text-red-600">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                ) : (
                    <FinancialsPanel financialData={financialData} />
                )}
            </div>
        </div>
    );
}
