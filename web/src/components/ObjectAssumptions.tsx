import React, { useState } from 'react';
import { objectSchema } from '@/lib/engine/objectSchema';
import { formatName } from '@/lib/formatters';

interface ObjectAssumptionsProps {
    objName: string;
    objAss: any;
    years: number;
    uiMode?: InputMode;
    onChange: (objName: string, type: 'object' | 'output' | 'meta', aliasOrName: string, fieldName: string, value: any, subField?: string | null, index?: number | null) => void;
}

type InputMode = 'single' | 'annual' | 'growth' | 'monthly';

export function ObjectAssumptions({ objName, objAss, years, uiMode = 'single', onChange }: ObjectAssumptionsProps) {
    const mode = uiMode;
    const seasonalEnabled = objAss?.seasonalEnabled ?? false;
    const [optionsExpanded, setOptionsExpanded] = useState(false);

    if (!objAss) return null;

    // Check if any output supports seasonal
    const supportsSeasonal = objAss.outputs && Object.values(objAss.outputs).some((out: any) =>
        Object.values(out).some((field: any) => field.supports?.seasonal)
    );

    const typeName = objAss.type;
    const schema = typeName ? (objectSchema as any)[typeName] : null;
    const options = schema?.options || {};
    // Derive available modes from boolean keys
    const allModes: InputMode[] = ['single', 'annual', 'growth', 'monthly'];
    let availableModes = allModes.filter(m => options[m] !== undefined); // If key exists (true or false), it's available

    if (availableModes.length === 0) availableModes = ['single'];

    const hasSmoothing = options.smoothing !== undefined; // Check existence
    const hasDateRange = options.dateRange !== undefined;
    const hasIntegers = options.integers !== undefined;
    const hasMultipleModes = availableModes.length > 1;
    const hasOptions = hasSmoothing || hasDateRange || hasIntegers || hasMultipleModes;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Helper for visibility logic
    const showDateRange = objAss.dateRangeEnabled && mode !== 'monthly';
    const showSmoothing = (objAss.smoothingEnabled ?? true) && mode !== 'single';

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3 h-fit">
            <div className="border-b pb-2">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-blue-700 flex items-center gap-2">
                        {formatName(objName)}
                    </h3>

                    <div className="flex items-center gap-4">
                        {/* Collapsible Options */}
                        {optionsExpanded && (() => {
                            return (
                                <>
                                    {/* Smoothing Toggle - only show in multi-year modes and not monthly */}
                                    {hasSmoothing && mode !== 'single' && mode !== 'monthly' && (
                                        <label className="flex items-center gap-1 text-xs font-medium text-gray-600 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={objAss.smoothingEnabled ?? true}
                                                onChange={(e) => onChange(objName, 'meta', 'smoothingEnabled', 'smoothingEnabled', e.target.checked)}
                                                className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            />
                                            Smooth
                                        </label>
                                    )}

                                    {/* Date Range Toggle - hide in monthly mode */}
                                    {hasDateRange && mode !== 'monthly' && (
                                        <label className="flex items-center gap-1 text-xs font-medium text-gray-600 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={objAss.dateRangeEnabled ?? true}
                                                onChange={(e) => onChange(objName, 'meta', 'dateRangeEnabled', 'dateRangeEnabled', e.target.checked)}
                                                className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            />
                                            Fr-To
                                        </label>
                                    )}

                                    {/* Integers Toggle - hide in monthly mode */}
                                    {hasIntegers && mode !== 'monthly' && (
                                        <label className="flex items-center gap-1 text-xs font-medium text-gray-600 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={objAss.integersEnabled ?? false}
                                                onChange={(e) => onChange(objName, 'meta', 'integersEnabled', 'integersEnabled', e.target.checked)}
                                                className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            />
                                            Whole
                                        </label>
                                    )}

                                    {/* Mode Switcher */}
                                    {(() => {
                                        if (availableModes.length <= 1) return null;

                                        return (
                                            <div className="relative">
                                                <select
                                                    value={mode}
                                                    onChange={(e) => onChange(objName, 'meta', 'uiMode', 'uiMode', e.target.value)}
                                                    className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium py-1 pl-3 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                                                    title="Ways to enter assumptions"
                                                >
                                                    {availableModes.map((m) => (
                                                        <option key={m} value={m} className="capitalize">
                                                            {m === 'annual' ? 'yearly' : m}
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
                                </>
                            );
                        })()}

                        {/* Toggle Button */}
                        {hasOptions && (
                            <button
                                onClick={() => setOptionsExpanded(!optionsExpanded)}
                                className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-gray-600 text-xs font-bold transition-colors"
                                title={optionsExpanded ? "Hide options" : "Show options"}
                            >
                                {optionsExpanded ? '>' : '...'}
                            </button>
                        )}
                    </div>
                </div>
                {objAss.comment && (
                    <div className="text-xs text-gray-400 mt-1 w-full break-words">
                        {objAss.comment}
                    </div>
                )}
            </div>

            {/* Object Level Assumptions */}
            {mode !== 'monthly' && objAss.object && Object.keys(objAss.object).length > 0 && (
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
            {mode !== 'monthly' && objAss.outputs && Object.keys(objAss.outputs).length > 0 && (
                <div className="mt-2 overflow-x-auto">
                    <table className="text-sm text-left w-full">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                            <tr>
                                <th className="px-2 py-1 font-medium min-w-[140px]">Output</th>
                                <th className="px-2 py-1 font-medium">
                                    {mode === 'single' ? (
                                        'Value'
                                    ) : mode === 'annual' ? (
                                        <div className="flex gap-2">
                                            {Array.from({ length: years }).map((_, i) => (
                                                <div key={i} className="w-[76px] flex-shrink-0 text-[10px] text-gray-500 uppercase text-center flex justify-center">
                                                    Y{i + 1}
                                                </div>
                                            ))}
                                        </div>
                                    ) : mode === 'growth' ? (
                                        <div className="flex gap-2">
                                            <div className="w-20 text-[10px] text-gray-500 uppercase text-center flex justify-center">Base (Y1)</div>
                                            {Array.from({ length: years - 1 }).map((_, i) => (
                                                <div key={i} className="w-[76px] flex-shrink-0 text-[10px] text-gray-500 uppercase text-center flex justify-center">
                                                    Gr% (Y{i + 2})
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        // Monthly mode - no value header needed if we hide the column, or empty
                                        <span className="text-gray-400 italic font-normal">Monthly Inputs</span>
                                    )}
                                </th>
                                {showSmoothing && <th className="px-2 py-1 font-medium w-16">Smooth</th>}
                                {showDateRange && <th className="px-2 py-1 font-medium w-32">From-To Month</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                // Build map of fieldName -> [[alias, field], ...]
                                const fieldGroups: Record<string, Array<[string, any]>> = {};

                                for (const [alias, outAss] of Object.entries(objAss.outputs)) {
                                    for (const [fieldName, field] of Object.entries(outAss as any)) {
                                        // Skip start/end assumptions from main rows - they appear in the date range column
                                        if (fieldName === 'start' || fieldName === 'end') continue;
                                        if (!field || typeof field !== 'object') continue;

                                        if (!fieldGroups[fieldName]) fieldGroups[fieldName] = [];
                                        fieldGroups[fieldName].push([alias, field]);
                                    }
                                }

                                // Render each field group
                                return Object.entries(fieldGroups).map(([fieldName, aliasFields]) => {
                                    const firstField = aliasFields[0][1];

                                    // Calculate colSpan based on visibility
                                    const baseCols = 2; // Output + Value
                                    const extraCols = (showSmoothing ? 1 : 0) + (showDateRange ? 1 : 0);
                                    const totalCols = baseCols + extraCols;

                                    return (
                                        <React.Fragment key={`field-${fieldName}`}>
                                            {/* Section header with field label */}
                                            <tr className="bg-blue-50">
                                                <td colSpan={totalCols} className="px-2 py-1 font-semibold text-blue-800 text-xs uppercase tracking-wide">
                                                    {firstField?.label || fieldName}
                                                </td>
                                            </tr>

                                            {/* Rows for each alias with this field */}
                                            {aliasFields.map(([alias, field]) => (
                                                <React.Fragment key={`${fieldName}-${alias}`}>
                                                    <tr className="group hover:bg-gray-50">
                                                        <td className="px-2 py-0.5 font-medium text-gray-700 align-middle pl-6 min-w-[140px] whitespace-nowrap">
                                                            {formatName(alias)}
                                                        </td>

                                                        {/* Value Inputs */}
                                                        <td className="px-2 py-0.5 align-middle">
                                                            {field && (
                                                                <ValueInput
                                                                    field={field}
                                                                    mode={mode}
                                                                    years={years}
                                                                    showLabels={false}
                                                                    onChange={(val, subField, index) => onChange(objName, 'output', alias, fieldName, val, subField, index)}
                                                                />
                                                            )}
                                                        </td>

                                                        {/* Smoothing Checkbox */}
                                                        {showSmoothing && (
                                                            <td className="px-2 py-0.5 text-center align-middle">
                                                                {field?.supports?.smoothing && (
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={field.raw.smoothing ?? true}
                                                                        onChange={(e) => onChange(objName, 'output', alias, fieldName, e.target.checked, 'smoothing')}
                                                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                                    />
                                                                )}
                                                            </td>
                                                        )}

                                                        {/* Date Range */}
                                                        {showDateRange && (
                                                            <td className="px-2 py-0.5 align-middle">
                                                                {field?.supports?.dateRange && (
                                                                    <div className="flex items-center gap-1 text-xs">
                                                                        <input
                                                                            type="number"
                                                                            className="w-14 p-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-center"
                                                                            placeholder="1"
                                                                            value={objAss.outputs[alias]?.start?.raw?.single ?? 1}
                                                                            onChange={(e) => {
                                                                                const val = safeParseFloat(e.target.value);
                                                                                onChange(objName, 'output', alias, 'start', val, 'single');
                                                                            }}
                                                                        />
                                                                        <span className="text-gray-400">-</span>
                                                                        <input
                                                                            type="number"
                                                                            className="w-14 p-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-center"
                                                                            placeholder="End"
                                                                            value={objAss.outputs[alias]?.end?.raw?.single ?? ''}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value === '' ? null : safeParseFloat(e.target.value);
                                                                                onChange(objName, 'output', alias, 'end', val, 'single');
                                                                            }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </td>
                                                        )}
                                                    </tr>
                                                </React.Fragment>
                                            ))}

                                            {/* Totals Row */}
                                            {firstField?.supports?.totals && (
                                                <tr className="border-t border-gray-200 bg-gray-50">
                                                    <td className="px-2 py-1 font-bold text-gray-600 text-xs text-right pr-6 align-middle">
                                                        TOTAL:
                                                    </td>
                                                    <td className="px-2 py-1 align-middle">
                                                        {mode === 'single' ? (
                                                            <div className={`w-24 text-right pr-4 font-bold text-sm ${Math.abs(aliasFields.reduce((sum, [_, f]) => sum + (Number(f.raw?.single) || 0), 0) - 1) < 0.001 ? 'text-green-600' : 'text-red-500'}`}>
                                                                {Math.round(aliasFields.reduce((sum, [_, f]) => sum + (Number(f.raw?.single) || 0), 0) * 100)}%
                                                            </div>
                                                        ) : mode === 'annual' ? (
                                                            <div className="flex gap-2">
                                                                {Array.from({ length: years }).map((_, i) => {
                                                                    const total = aliasFields.reduce((sum, [_, f]) => sum + (Number(f.raw?.annual?.[i]) || 0), 0);
                                                                    return (
                                                                        <div key={i} className={`w-24 text-right pr-4 font-bold text-sm ${Math.abs(total - 1) < 0.001 ? 'text-green-600' : 'text-red-500'}`}>
                                                                            {Math.round(total * 100)}%
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : mode === 'growth' ? (
                                                            <div className="flex gap-2">
                                                                {/* Base Year */}
                                                                <div className={`w-24 text-right pr-4 font-bold text-sm ${Math.abs(aliasFields.reduce((sum, [_, f]) => sum + (Number(f.raw?.annual?.[0]) || 0), 0) - 1) < 0.001 ? 'text-green-600' : 'text-red-500'}`}>
                                                                    {Math.round(aliasFields.reduce((sum, [_, f]) => sum + (Number(f.raw?.annual?.[0]) || 0), 0) * 100)}%
                                                                </div>
                                                                {/* Growth Years */}
                                                                {Array.from({ length: years - 1 }).map((_, i) => {
                                                                    const total = aliasFields.reduce((sum, [_, f]) => sum + (Number(f.raw?.growth?.[i + 1]) || 0), 0);
                                                                    return (
                                                                        <div key={i} className="w-24 text-right pr-4 font-bold text-sm text-gray-600">
                                                                            {Math.round(total * 100)}%
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : null}
                                                    </td>
                                                    {showSmoothing && <td></td>}
                                                    {showDateRange && <td></td>}
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                });
                            })()}
                        </tbody>
                    </table>
                </div>
            )}
            {mode === 'monthly' && (
                <div className="text-xs text-gray-500 italic p-2">
                    Edit monthly values directly in the outputs panel.
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

interface SingleValueInputProps {
    value: number | null;
    onChange: (val: number) => void;
    format?: string;
    placeholder?: string;
    showLabel?: boolean;
    label?: string;
}

function SingleValueInput({ value, onChange, format, placeholder, showLabel, label }: SingleValueInputProps) {
    const isPercent = format === 'percent';
    const isCurrency = format === 'currency';
    const isInteger = format === 'integer';

    // Initialize local state
    const [localValue, setLocalValue] = useState<string>('');
    const [isFocused, setIsFocused] = useState(false);

    // Sync local value with prop when not focused
    React.useEffect(() => {
        if (!isFocused) {
            if (value === null || value === undefined) {
                setLocalValue('');
            } else if (isPercent) {
                setLocalValue((value * 100).toFixed(2));
            } else if (isCurrency) {
                setLocalValue(value.toFixed(2));
            } else {
                setLocalValue(value.toString());
            }
        }
    }, [value, isFocused, isPercent, isCurrency]);

    const handleBlur = () => {
        setIsFocused(false);
        // On blur, re-format the valid number
        if (localValue === '' || localValue === '-') {
            onChange(0);
            return;
        }

        const parsed = parseFloat(localValue);
        if (!isNaN(parsed)) {
            // If it's a valid number, we update the parent
            // The useEffect will then re-format it nicely
            if (isPercent) {
                onChange(parsed / 100);
            } else {
                onChange(parsed);
            }
        } else {
            // Invalid, revert
            if (value !== null) {
                if (isPercent) setLocalValue((value * 100).toFixed(2));
                else if (isCurrency) setLocalValue(value.toFixed(2));
                else setLocalValue(value.toString());
            } else {
                setLocalValue('');
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalValue(e.target.value);
        // We also update parent immediately to keep state in sync, 
        // but we parse carefully.
        // Actually, for "10." case, parseFloat("10.") is 10.
        // If we update parent 10, parent passes back 10.
        // If useEffect runs, it formats 10 -> "10.00" (if currency).
        // So we MUST NOT update localValue from prop if focused.
        // That is handled by the useEffect condition (!isFocused).

        const val = e.target.value;
        if (val === '' || val === '-') {
            onChange(0);
            return;
        }
        const parsed = parseFloat(val);
        if (!isNaN(parsed)) {
            if (isPercent) onChange(parsed / 100);
            else onChange(parsed);
        }
    };

    const input = (
        <input
            type="text"
            inputMode={isInteger ? "numeric" : "decimal"}
            className={`w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none text-right ${isCurrency ? 'pl-4' : ''} ${isPercent ? 'pr-4' : ''}`}
            value={localValue}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            placeholder={placeholder || "Value"}
        />
    );

    const wrappedInput = (
        <div className="relative w-full">
            {isCurrency && <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>}
            {input}
            {isPercent && <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>}
        </div>
    );

    if (showLabel && label) {
        return (
            <div className="flex flex-col gap-0.5 w-full">
                <label className="text-[10px] text-gray-400 uppercase">{label}</label>
                {wrappedInput}
            </div>
        );
    }

    return <div className="w-full">{wrappedInput}</div>;
}

function ValueInput({ field, mode, years, showLabels = true, onChange }: { field: any, mode: InputMode, years: number, showLabels?: boolean, onChange: (val: any, subField?: string | null, index?: number | null) => void }) {
    const format = field.format;

    if (mode === 'single' || !field.supports?.annual) {
        return (
            <SingleValueInput
                value={field.raw.single ?? field.raw.annual?.[0] ?? null}
                onChange={(v) => onChange(v, 'single')}
                format={format}
            />
        );
    }

    if (mode === 'annual') {
        return (
            <div className="flex gap-2">
                {Array.from({ length: years }).map((_, i) => (
                    <div key={i} className="w-[76px] flex-shrink-0">
                        <SingleValueInput
                            value={field.raw.annual?.[i] ?? null}
                            onChange={(v) => onChange(v, 'annual', i)}
                            format={format}
                            showLabel={showLabels}
                            label={`Y${i + 1}`}
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
                <div className="w-[76px] flex-shrink-0">
                    <SingleValueInput
                        value={field.raw.annual?.[0] ?? null}
                        onChange={(v) => onChange(v, 'annual', 0)}
                        format={format}
                        showLabel={showLabels}
                        label="Base (Y1)"
                    />
                </div>
                {/* Subsequent years are Growth % */}
                {Array.from({ length: years - 1 }).map((_, i) => {
                    const yearIndex = i + 1;
                    const growthVal = field.raw.growth?.[yearIndex] ?? 0;
                    return (
                        <div key={yearIndex} className="w-[76px] flex-shrink-0">
                            <SingleValueInput
                                value={growthVal}
                                onChange={(v) => onChange(v, 'growth', yearIndex)}
                                format="percent" // Growth is always percent
                                showLabel={showLabels}
                                label={`Gr% (Y${yearIndex + 1})`}
                            />
                        </div>
                    );
                })}
            </div>
        );
    }

    return null;
}
