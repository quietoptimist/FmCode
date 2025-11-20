import React, { useState } from 'react';

interface ObjectAssumptionsProps {
    objName: string;
    objAss: any;
    years: number;
    onChange: (objName: string, type: 'object' | 'output', aliasOrName: string, fieldName: string, value: any, subField?: string | null, index?: number | null) => void;
}

type InputMode = 'single' | 'annual' | 'growth';

export function ObjectAssumptions({ objName, objAss, years, onChange }: ObjectAssumptionsProps) {
    const [mode, setMode] = useState<InputMode>('single');

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6 h-fit">
            <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-lg font-bold text-blue-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    {objName}
                </h3>

                {/* Mode Switcher */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {(['single', 'annual', 'growth'] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-all ${mode === m
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {/* Object Level Assumptions */}
            {objAss.object && Object.keys(objAss.object).length > 0 && (
                <div className="space-y-3 pl-4 border-l-2 border-blue-100">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Global Settings</h4>
                    {Object.entries(objAss.object).map(([fieldName, field]: [string, any]) => (
                        <AssumptionInput
                            key={`obj-${fieldName}`}
                            label={field.label}
                            field={field}
                            mode={mode}
                            years={years}
                            onChange={(val, subField, index) => onChange(objName, 'object', fieldName, fieldName, val, subField, index)}
                        />
                    ))}
                </div>
            )}

            {/* Output Level Assumptions Table */}
            {objAss.outputs && Object.keys(objAss.outputs).length > 0 && (
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                            <tr>
                                <th className="px-2 py-2 font-medium">Output</th>
                                <th className="px-2 py-2 font-medium w-20">Start</th>
                                <th className="px-2 py-2 font-medium">
                                    {mode === 'single' ? 'Value' : mode === 'annual' ? 'Annual Values' : 'YoY Growth %'}
                                </th>
                                {mode !== 'single' && <th className="px-2 py-2 font-medium w-16">Smooth</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {Object.entries(objAss.outputs).map(([alias, outAss]: [string, any]) => {
                                // Find relevant fields
                                const startMonthField = outAss['startMonth'];
                                // Find the "main" value field (amount, factor, etc.) - usually the first one that isn't startMonth
                                const valueFieldName = Object.keys(outAss).find(k => k !== 'startMonth');
                                const valueField = valueFieldName ? outAss[valueFieldName] : null;

                                return (
                                    <tr key={alias} className="group hover:bg-gray-50">
                                        <td className="px-2 py-3 font-medium text-gray-700 align-top pt-4">{alias}</td>

                                        {/* Start Month */}
                                        <td className="px-2 py-3 align-top pt-4">
                                            {startMonthField && (
                                                <input
                                                    type="number"
                                                    className="w-16 p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                                    value={startMonthField.raw.single ?? 0}
                                                    onChange={(e) => onChange(objName, 'output', alias, 'startMonth', parseFloat(e.target.value))}
                                                />
                                            )}
                                        </td>

                                        {/* Value Inputs */}
                                        <td className="px-2 py-3">
                                            {valueField && (
                                                <ValueInput
                                                    field={valueField}
                                                    mode={mode}
                                                    years={years}
                                                    onChange={(val, subField, index) => onChange(objName, 'output', alias, valueFieldName!, val, subField, index)}
                                                />
                                            )}
                                        </td>

                                        {/* Options (Smoothing) */}
                                        {mode !== 'single' && (
                                            <td className="px-2 py-3 align-top pt-4 text-center">
                                                {valueField?.supports?.smoothing && (
                                                    <input
                                                        type="checkbox"
                                                        checked={valueField.raw.smoothing}
                                                        onChange={(e) => onChange(objName, 'output', alias, valueFieldName!, e.target.checked, 'smoothing')}
                                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                    />
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// Helper to safely parse input
const safeParseFloat = (val: string): number => {
    if (val === '' || val === '-') return 0;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
};

// Helper for Object Level inputs (legacy style, or adapted)
function AssumptionInput({ label, field, mode, years, onChange }: any) {
    // For object level, we might just stick to single inputs if they are simple flags
    // But if they are complex, we use ValueInput
    if (field.baseType === 'boolean') {
        return (
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={field.raw.single}
                    onChange={(e) => onChange(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label className="text-sm text-gray-600">{label}</label>
            </div>
        );
    }
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">{label}</label>
            <ValueInput field={field} mode={mode} years={years} onChange={onChange} />
        </div>
    );
}

function ValueInput({ field, mode, years, onChange }: { field: any, mode: InputMode, years: number, onChange: (val: any, subField?: string | null, index?: number | null) => void }) {
    // Local state for inputs to allow typing "0.5" (which starts with "0.") without it being forced to 0 immediately if we were strict.
    // However, for simplicity in this fix, we'll just rely on the fact that "0." parses to 0, but we need to preserve the string if possible?
    // Actually, controlled inputs with number type are tricky.
    // Let's stick to the safeParseFloat approach for the onChange, but we might need to handle the display value carefully.
    // If field.raw.single is 0, it shows "0".

    if (mode === 'single' || !field.supports?.annual) {
        return (
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                    value={field.raw.single ?? ''}
                    onChange={(e) => onChange(safeParseFloat(e.target.value))}
                    placeholder="Constant value..."
                />
            </div>
        );
    }

    if (mode === 'annual') {
        return (
            <div className="flex gap-2">
                {Array.from({ length: years }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-0.5 w-20">
                        <label className="text-[10px] text-gray-400 uppercase">Y{i + 1}</label>
                        <input
                            type="number"
                            className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                            value={field.raw.annual?.[i] ?? ''}
                            onChange={(e) => onChange(safeParseFloat(e.target.value), 'annual', i)}
                        />
                    </div>
                ))}
            </div>
        );
    }

    if (mode === 'growth') {
        return (
            <div className="flex gap-2">
                {/* Year 1 is Base Value */}
                <div className="flex flex-col gap-0.5 w-20">
                    <label className="text-[10px] text-gray-400 uppercase">Base (Y1)</label>
                    <input
                        type="number"
                        className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                        value={field.raw.annual?.[0] ?? ''}
                        onChange={(e) => onChange(safeParseFloat(e.target.value), 'annual', 0)}
                    />
                </div>
                {/* Subsequent years are Growth % */}
                {Array.from({ length: years - 1 }).map((_, i) => {
                    const yearIndex = i + 1;
                    const growthVal = field.raw.growth?.[yearIndex] ?? 0;
                    return (
                        <div key={yearIndex} className="flex flex-col gap-0.5 w-20">
                            <label className="text-[10px] text-gray-400 uppercase">Gr% (Y{yearIndex + 1})</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="w-full p-1.5 pr-4 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                    // Display as percentage (e.g. 0.05 -> 5)
                                    // We need to be careful here. If user types "5", we want 0.05.
                                    // But if we display (0.05 * 100).toFixed(1), it shows "5.0".
                                    // If user tries to delete "0", it might be weird.
                                    // For now, let's trust the value.
                                    value={growthVal !== null ? +(growthVal * 100).toFixed(2) : ''}
                                    onChange={(e) => onChange(safeParseFloat(e.target.value) / 100, 'growth', yearIndex)}
                                />
                                <span className="absolute right-1.5 top-1.5 text-gray-400 text-xs">%</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return null;
}
