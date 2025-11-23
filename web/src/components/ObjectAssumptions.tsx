import React, { useState } from 'react';
import { formatName } from '@/lib/formatters';

interface ObjectAssumptionsProps {
    objName: string;
    objAss: any;
    years: number;
    uiMode?: InputMode;
    onChange: (objName: string, type: 'object' | 'output' | 'meta', aliasOrName: string, fieldName: string, value: any, subField?: string | null, index?: number | null) => void;
}

type InputMode = 'single' | 'annual' | 'growth';

export function ObjectAssumptions({ objName, objAss, years, uiMode = 'single', onChange }: ObjectAssumptionsProps) {
    const mode = uiMode;
    const seasonalEnabled = objAss?.seasonalEnabled ?? false;

    if (!objAss) return null;

    // Check if any output supports seasonal
    const supportsSeasonal = objAss.outputs && Object.values(objAss.outputs).some((out: any) =>
        Object.values(out).some((field: any) => field.supports?.seasonal)
    );

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3 h-fit">
            <div className="border-b pb-2">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-blue-700 flex items-center gap-2">
                        {formatName(objName)}
                    </h3>

                    <div className="flex items-center gap-4">
                        {/* Seasonal Toggle */}
                        {supportsSeasonal && (
                            <label className="flex items-center gap-1 text-xs font-medium text-gray-600 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={objAss.seasonalEnabled ?? false}
                                    onChange={(e) => onChange(objName, 'meta', 'seasonalEnabled', 'seasonalEnabled', e.target.checked)}
                                    className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                Seasonal
                            </label>
                        )}

                        {/* Date Range Toggle */}
                        {(() => {
                            const supportsDateRange = objAss.outputs && Object.values(objAss.outputs).some((out: any) =>
                                Object.values(out).some((field: any) => field.supports?.dateRange)
                            );
                            if (!supportsDateRange) return null;
                            return (
                                <label className="flex items-center gap-1 text-xs font-medium text-gray-600 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={objAss.dateRangeEnabled ?? false}
                                        onChange={(e) => onChange(objName, 'meta', 'dateRangeEnabled', 'dateRangeEnabled', e.target.checked)}
                                        className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    Fr-To Mth
                                </label>
                            );
                        })()}

                        {/* Mode Switcher */}
                        {(() => {
                            // Calculate supported modes
                            const supportsSingle = objAss.outputs && Object.values(objAss.outputs).some((out: any) =>
                                Object.values(out).some((field: any) => field.supports?.single)
                            );
                            const supportsAnnual = objAss.outputs && Object.values(objAss.outputs).some((out: any) =>
                                Object.values(out).some((field: any) => field.supports?.annual)
                            );
                            const supportsGrowth = objAss.outputs && Object.values(objAss.outputs).some((out: any) =>
                                Object.values(out).some((field: any) => field.supports?.growth)
                            );

                            const availableModes = [
                                supportsSingle ? 'single' : null,
                                supportsAnnual ? 'annual' : null,
                                supportsGrowth ? 'growth' : null
                            ].filter(Boolean) as InputMode[];

                            if (availableModes.length <= 1) return null;

                            return (
                                <div className="relative">
                                    <select
                                        value={mode}
                                        onChange={(e) => onChange(objName, 'meta', 'uiMode', 'uiMode', e.target.value)}
                                        className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium py-1 pl-3 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                                    >
                                        {availableModes.map((m) => (
                                            <option key={m} value={m} className="capitalize">
                                                {m}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                        <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                        </svg>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
                {objAss.comment && (
                    <div className="text-xs text-gray-400 mt-1 w-full break-words">
                        {objAss.comment}
                    </div>
                )}
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
                            onChange={(val: any, subField?: string | null, index?: number | null) => onChange(objName, 'object', fieldName, fieldName, val, subField, index)}
                        />
                    ))}
                </div>
            )}

            {/* Output Level Assumptions Table */}
            {objAss.outputs && Object.keys(objAss.outputs).length > 0 && (
                <div className="mt-2 overflow-x-auto">
                    <table className="text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                            <tr>
                                <th className="px-2 py-2 font-medium">Output</th>

                                <th className="px-2 py-2 font-medium">
                                    {mode === 'single' ? (
                                        'Value'
                                    ) : mode === 'annual' ? (
                                        <div className="flex gap-2">
                                            {Array.from({ length: years }).map((_, i) => (
                                                <div key={i} className="w-20 text-[10px] text-gray-500 uppercase">
                                                    Y{i + 1}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <div className="w-20 text-[10px] text-gray-500 uppercase">Base (Y1)</div>
                                            {Array.from({ length: years - 1 }).map((_, i) => (
                                                <div key={i} className="w-20 text-[10px] text-gray-500 uppercase">
                                                    Gr% (Y{i + 2})
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </th>
                                {mode !== 'single' && <th className="px-2 py-2 font-medium w-16">Smooth</th>}
                                {objAss.dateRangeEnabled && <th className="px-2 py-2 font-medium w-32">Fr-To Mth</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(objAss.outputs).map(([alias, outAss]: [string, any]) => {
                                // Find relevant fields
                                const startMonthField = outAss['startMonth'];
                                // Find the "main" value field (amount, factor, etc.) - usually the first one that isn't startMonth
                                const valueFieldName = Object.keys(outAss).find(k => k !== 'startMonth');
                                const valueField = valueFieldName ? outAss[valueFieldName] : null;

                                return (
                                    <tr key={alias} className="group hover:bg-gray-50">
                                        <td className="px-2 py-1 font-medium text-gray-700 align-top pt-1">{formatName(alias)}</td>

                                        {/* Start Month */}
                                        {/* Date Range */}


                                        {/* Value Inputs */}
                                        <td className="px-2 py-1">
                                            {valueField && (
                                                <ValueInput
                                                    field={valueField}
                                                    mode={mode}
                                                    years={years}
                                                    showLabels={false}
                                                    onChange={(val, subField, index) => onChange(objName, 'output', alias, valueFieldName!, val, subField, index)}
                                                />
                                            )}
                                        </td>

                                        {/* Options (Smoothing) */}
                                        {mode !== 'single' && (
                                            <td className="px-2 py-1 align-top pt-1 text-center">
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
                                        {/* Date Range */}
                                        <td className="px-2 py-1 align-top pt-1">
                                            {objAss.dateRangeEnabled && valueField?.supports?.dateRange && (
                                                <div className="flex items-center gap-1 text-xs">
                                                    <input
                                                        type="number"
                                                        className="w-10 p-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-center"
                                                        placeholder="1"
                                                        value={valueField.raw.dateRange?.start ?? 1}
                                                        onChange={(e) => onChange(objName, 'output', alias, valueFieldName!, { ...valueField.raw.dateRange, start: safeParseFloat(e.target.value) }, 'dateRange')}
                                                    />
                                                    <span className="text-gray-400">-</span>
                                                    <input
                                                        type="number"
                                                        className="w-10 p-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-center"
                                                        placeholder="End"
                                                        value={valueField.raw.dateRange?.end ?? (years * 12)}
                                                        onChange={(e) => onChange(objName, 'output', alias, valueFieldName!, { ...valueField.raw.dateRange, end: safeParseFloat(e.target.value) }, 'dateRange')}
                                                    />
                                                </div>
                                            )}
                                        </td>
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
                    checked={field.raw.annual?.[0] ?? false}
                    onChange={(e) => onChange(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label className="text-sm text-gray-600">{label}</label>
            </div>
        );
    }
    return (
        <div className="flex flex-col gap-1 items-start">
            <label className="text-xs font-medium text-gray-500">{label}</label>
            <ValueInput field={field} mode={mode} years={years} onChange={onChange} />
        </div>
    );
}

function ValueInput({ field, mode, years, showLabels = true, onChange }: { field: any, mode: InputMode, years: number, showLabels?: boolean, onChange: (val: any, subField?: string | null, index?: number | null) => void }) {
    // Local state for inputs to allow typing "0.5" (which starts with "0.") without it being forced to 0 immediately if we were strict.
    // However, for simplicity in this fix, we'll just rely on the fact that "0." parses to 0, but we need to preserve the string if possible?
    // Actually, controlled inputs with number type are tricky.
    // Let's stick to the safeParseFloat approach for the onChange, but we might need to handle the display value carefully.
    // If field.raw.single is 0, it shows "0".

    if (mode === 'single' || !field.supports?.annual) {
        return (
            <input
                type="number"
                className="w-20 p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                value={field.raw.annual?.[0] ?? ''}
                onChange={(e) => onChange(safeParseFloat(e.target.value), 'annual', 0)}
                placeholder="Value"
            />
        );
    }

    if (mode === 'annual') {
        return (
            <div className="flex gap-2">
                {Array.from({ length: years }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-0.5 w-20">
                        {showLabels && <label className="text-[10px] text-gray-400 uppercase">Y{i + 1}</label>}
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
                    {showLabels && <label className="text-[10px] text-gray-400 uppercase">Base (Y1)</label>}
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
                            {showLabels && <label className="text-[10px] text-gray-400 uppercase">Gr% (Y{yearIndex + 1})</label>}
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
