import React, { useState } from 'react';
import { objectSchema } from '@/lib/engine/objectSchema';
import { formatName } from '@/lib/formatters';

interface ObjectOutputsProps {
    aliases: string[];
    store: Map<string, Float64Array> | null;
    overrides: any;
    months: number;
    channelDefs?: Record<string, { label: string; hidden?: boolean }>;
    onOverride: (alias: string, channel: string, month: number, value: number | null) => void;
    objAss?: any; // assumptions for this object
    seasonalEnabled?: boolean;
    objName?: string;
    onAssumptionChange?: (objName: string, type: 'object' | 'output' | 'meta', aliasOrName: string, fieldName: string, value: any, subField?: string | null, index?: number | null) => void;
    showMonthlyAssumptions?: boolean;  // From schema
    uiMode?: 'single' | 'annual' | 'growth' | 'monthly';
    usedChannels?: Set<string>;
}

const months_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const safeParseFloat = (val: string): number => {
    if (val === '' || val === '-') return 0;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
};

export function ObjectOutputs({ aliases, store, overrides, months, channelDefs, onOverride, objAss, seasonalEnabled, objName, onAssumptionChange, showMonthlyAssumptions, uiMode, usedChannels }: ObjectOutputsProps) {
    const [optionsExpanded, setOptionsExpanded] = useState(false);
    const [showTotals, setShowTotals] = useState(true);
    const [showAssumptions, setShowAssumptions] = useState(true);
    const [showHidden, setShowHidden] = useState(false);

    // Only show totals if there are multiple aliases (otherwise it's just a duplicate row)
    const shouldShowTotals = aliases.length > 1 && showTotals;

    // Check if any output supports seasonal
    const supportsSeasonal = objAss?.outputs && Object.values(objAss.outputs).some((out: any) =>
        Object.values(out).some((field: any) => field?.supports?.seasonal)
    );

    // Check if the object type has the seasonal option available in schema
    const typeName = objAss?.type;
    const schema = typeName ? (objectSchema as any)[typeName] : null;
    const options = schema?.options || {};
    const seasonalOptionAvailable = options.seasonal !== undefined;

    const showSeasonalOption = seasonalEnabled !== undefined && onAssumptionChange && objName && supportsSeasonal && seasonalOptionAvailable;
    const showTotalsOption = aliases.length > 1;
    const showAssumptionsOption = showMonthlyAssumptions;
    const hasHiddenChannels = channelDefs && Object.values(channelDefs).some(c => c.hidden);
    const showHiddenOption = hasHiddenChannels;

    const hasOptions = showTotalsOption || showAssumptionsOption || showSeasonalOption || showHiddenOption;

    if (!store) return <div className="p-4 text-gray-400 italic">No results calculated.</div>;

    // Filter store for these aliases
    const byAlias: Record<string, Record<string, Float64Array>> = {};
    let hasData = false;

    // ... (omitted loop logic, unchanged) ...
    // Re-implementation:
    // We can't easily lookup by prefix in a Map.
    // But we can iterate the store.
    for (const [key, series] of store.entries()) {
        const [keyAlias, channel] = key.split('.');
        if (aliases.includes(keyAlias)) {
            if (!byAlias[keyAlias]) byAlias[keyAlias] = {};
            byAlias[keyAlias][channel] = series;
            hasData = true;
        }
    }

    if (!hasData) return <div className="p-4 text-gray-400 italic">No outputs for this object.</div>;

    // Restructure data: group by channel first, then by alias
    const byChannel: Record<string, Record<string, Float64Array>> = {};
    for (const alias of aliases) {
        const channels = byAlias[alias];
        if (channels) {
            for (const [channel, series] of Object.entries(channels)) {
                if (!byChannel[channel]) byChannel[channel] = {};
                byChannel[channel][alias] = series;
            }
        }
    }

    const channelNames = Object.keys(byChannel);
    const isSingleChannel = channelNames.length === 1;

    // Helper to handle cell changes
    const handleCellChange = (alias: string, channel: string, month: number, newVal: number | null) => {
        if (uiMode === 'monthly' && onAssumptionChange && objName) {
            // In monthly mode, we update the assumption directly
            // We need to find the field name. Usually 'amount' or 'factor'.
            // We can look at objAss.outputs[alias]
            const outAss = objAss?.outputs?.[alias];
            if (outAss) {
                // Find the primary value field (one that supports monthly?)
                // Or just pick the first one that isn't start/end?
                // Usually it's 'amount', 'factor', 'count', etc.
                // Let's look for one that supports monthly.
                const fieldName = Object.keys(outAss).find(k => outAss[k]?.supports?.monthly);

                if (fieldName) {
                    // Update the monthly array at this index
                    // We need to construct the full monthly array update?
                    // updateAssumption handles index update for 'monthly' subField?
                    // Let's check updateAssumption. It doesn't seem to have index support for monthly array yet?
                    // Wait, updateAssumption:
                    // } else if (subField === 'monthly' && index !== null) { ... } -> NO, it doesn't have this block!
                    // It has: if (subField === 'annual' && index !== null) ...
                    // We need to add monthly index support to updateAssumption too!

                    // Assuming updateAssumption supports it (I will add it), we call:
                    onAssumptionChange(objName, 'output', alias, fieldName, newVal, 'monthly', month);
                }
            }
        } else {
            // Normal override
            onOverride(alias, channel, month, newVal);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Options Panel */}
            <div className="border-b border-gray-200 p-3">
                <div className="flex items-center gap-4">
                    {/* Toggle Button */}
                    {hasOptions && (
                        <button
                            onClick={() => setOptionsExpanded(!optionsExpanded)}
                            className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-gray-600 text-xs font-bold transition-colors"
                            title={optionsExpanded ? "Hide options" : "Show options"}
                        >
                            {optionsExpanded ? '<' : '...'}
                        </button>
                    )}

                    {/* Collapsible Options */}
                    {optionsExpanded && (
                        <>
                            {aliases.length > 1 && (
                                <label className="flex items-center gap-1 text-xs font-medium text-gray-600 cursor-pointer select-none" title="Display row totals">
                                    <input
                                        type="checkbox"
                                        checked={showTotals}
                                        onChange={(e) => setShowTotals(e.target.checked)}
                                        className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    Totals
                                </label>
                            )}
                            {showMonthlyAssumptions && (
                                <label className="flex items-center gap-1 text-xs font-medium text-gray-600 cursor-pointer select-none" title="Display monthly assumption values">
                                    <input
                                        type="checkbox"
                                        checked={showAssumptions}
                                        onChange={(e) => setShowAssumptions(e.target.checked)}
                                        className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    Assumptions
                                </label>
                            )}
                            {/* Seasonal Toggle */}
                            {seasonalEnabled !== undefined && onAssumptionChange && objName && uiMode !== 'monthly' && (() => {
                                // Check if any output supports seasonal
                                const supportsSeasonal = objAss?.outputs && Object.values(objAss.outputs).some((out: any) =>
                                    Object.values(out).some((field: any) => field?.supports?.seasonal)
                                );
                                if (!supportsSeasonal) return null;
                                return (
                                    <label className="flex items-center gap-1 text-xs font-medium text-gray-600 cursor-pointer select-none" title="Add seasonality by scaling assumptions in each calendar month relative to the average">
                                        <input
                                            type="checkbox"
                                            checked={seasonalEnabled ?? false}
                                            onChange={(e) => onAssumptionChange(objName, 'meta', 'seasonalEnabled', 'seasonalEnabled', e.target.checked)}
                                            className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                        Seasonal
                                    </label>
                                );
                            })()}
                            {/* Show All Toggle */}
                            {showHiddenOption && (
                                <label className="flex items-center gap-1 text-xs font-medium text-gray-600 cursor-pointer select-none" title="Show hidden output channels">
                                    <input
                                        type="checkbox"
                                        checked={showHidden}
                                        onChange={(e) => setShowHidden(e.target.checked)}
                                        className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    Show All
                                </label>
                            )}
                        </>
                    )}
                </div>
            </div>

            <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                        <th className="p-1.5 sticky left-0 bg-gray-50 z-20 border-b border-r font-semibold text-gray-700 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] min-w-[150px]"></th>
                        {Array.from({ length: months }).map((_, i) => (
                            <th key={i} className="p-1.5 min-w-[80px] text-right border-b"></th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {/* Seasonal Input Rows */}
                    {seasonalEnabled && objAss && onAssumptionChange && objName && (
                        <>
                            {/* Seasonal section header */}
                            <tr className="bg-purple-50/50">
                                <td className="p-1.5 font-bold text-purple-800 sticky left-0 bg-purple-50 z-10 border-b border-purple-100 border-r shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] whitespace-nowrap">
                                    Seasonal %
                                </td>
                                {months_names.map((monthName, i) => (
                                    <td key={i} className="p-1.5 min-w-[60px] text-center border-b border-purple-100 text-xs uppercase tracking-wider font-semibold text-purple-600">
                                        {monthName}
                                    </td>
                                ))}
                                <td className="p-1.5 min-w-[60px] text-center border-b border-purple-100 text-xs uppercase tracking-wider font-semibold text-purple-700 bg-purple-100/70">
                                    AVG
                                </td>
                                {months > 12 && (
                                    Array.from({ length: months - 12 }).map((_, i) => (
                                        <td key={`extra-${i}`} className="border-b border-purple-100"></td>
                                    ))
                                )}
                            </tr>
                            {/* Seasonal input rows for each alias */}
                            {aliases.map(alias => {
                                const outAss = objAss?.outputs?.[alias];
                                if (!outAss) return null;

                                // Find the field that supports seasonal (usually 'amount' or 'factor')
                                const valueFieldName = Object.keys(outAss).find(k => k !== 'startMonth' && outAss[k]?.supports?.seasonal);
                                if (!valueFieldName) return null;

                                const valueField = outAss[valueFieldName];

                                return (
                                    <tr key={`seasonal-${alias}`} className="hover:bg-purple-50/30 group transition-colors">
                                        <td className="p-2 font-medium text-gray-600 sticky left-0 bg-white group-hover:bg-purple-50/30 z-10 border-r shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] whitespace-nowrap text-sm">
                                            {formatName(alias)}
                                        </td>
                                        {months_names.map((_, i) => (
                                            <td key={i} className="p-1 min-w-[60px] text-center">
                                                <div className="relative inline-block">
                                                    <input
                                                        type="number"
                                                        className="w-16 p-1.5 pr-4 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500 outline-none text-right"
                                                        value={valueField.raw.seasonal?.[i] ? +(valueField.raw.seasonal[i] * 100).toFixed(1) : ''}
                                                        onChange={(e) => onAssumptionChange(objName, 'output', alias, valueFieldName, safeParseFloat(e.target.value) / 100, 'seasonal', i)}
                                                    />
                                                    <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">%</span>
                                                </div>
                                            </td>
                                        ))}
                                        <td className="p-1 min-w-[60px] text-center bg-purple-100/50">
                                            <div className="relative inline-block">
                                                <div className="w-16 p-1.5 pr-4 border border-purple-300 rounded text-sm bg-purple-50 text-right font-semibold text-purple-700">
                                                    {(() => {
                                                        const seasonal = valueField.raw.seasonal || [];
                                                        const avg = seasonal.length > 0 ? seasonal.reduce((a: number, b: number) => a + b, 0) / seasonal.length : 0;
                                                        return (avg * 100).toFixed(1);
                                                    })()}
                                                </div>
                                                <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[10px] text-purple-500 pointer-events-none font-semibold">%</span>
                                            </div>
                                        </td>
                                        {months > 12 && (
                                            Array.from({ length: months - 12 }).map((_, i) => (
                                                <td key={`extra-${i}`}></td>
                                            ))
                                        )}
                                    </tr>
                                );
                            })}
                        </>
                    )}

                    {/* Spacer row between seasonal and outputs */}
                    {seasonalEnabled && objAss && (
                        <tr className="h-3">
                            <td colSpan={months + 1} className="p-0"></td>
                        </tr>
                    )}

                    {/* Monthly Assumptions Section */}
                    {showMonthlyAssumptions && showAssumptions && objAss && (
                        <>
                            {(() => {
                                // Build map of fieldName -> [[alias, field], ...]
                                const fieldGroups: Record<string, Array<[string, any]>> = {};

                                for (const alias of aliases) {
                                    const outAss = objAss?.outputs?.[alias];
                                    if (!outAss) continue;

                                    // Iterate ALL fields (not just first one)
                                    for (const [fieldName, field] of Object.entries(outAss)) {
                                        if (fieldName === 'startMonth' || fieldName === 'start' || fieldName === 'end') continue;
                                        if (!field || typeof field !== 'object' || !('value' in field) || !field.value) continue;

                                        if (!fieldGroups[fieldName]) fieldGroups[fieldName] = [];
                                        fieldGroups[fieldName].push([alias, field]);
                                    }
                                }

                                // Render each field group
                                return Object.entries(fieldGroups).map(([fieldName, aliasFields]) => {
                                    const firstField = aliasFields[0][1];

                                    return (
                                        <React.Fragment key={`field-${fieldName}`}>
                                            {/* Section header with field label */}
                                            <tr className="bg-green-50/50">
                                                <td className="p-1.5 font-bold text-green-800 sticky left-0 bg-green-50 z-10 border-b border-green-100 border-r shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] whitespace-nowrap">
                                                    {firstField.label}
                                                </td>
                                                <td colSpan={months} className="border-b border-green-100"></td>
                                            </tr>

                                            {/* Rows for each alias with this field */}
                                            {aliasFields.map(([alias, field]) => (
                                                <tr key={`${fieldName}-${alias}`} className="bg-green-50/30">
                                                    <td className="p-1.5 font-medium text-green-700 sticky left-0 bg-green-50/30 z-10 border-b border-green-100 border-r shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] whitespace-nowrap text-sm">
                                                        {formatName(alias)}
                                                    </td>
                                                    {Array.from({ length: months }).map((_, i) => (
                                                        <td key={i} className="p-1.5 min-w-[80px] text-right border-b border-green-100 text-xs text-green-600">
                                                            {field.value[i]?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0'}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                });
                            })()}
                            {/* Spacer row after assumptions */}
                            <tr className="h-3">
                                <td colSpan={months + 1} className="p-0"></td>
                            </tr>
                        </>
                    )}

                    {/* Month Header Row */}
                    <tr className="bg-gray-50">
                        <td className="p-1.5 font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10 border-t border-b border-r shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] whitespace-nowrap">
                            Month
                        </td>
                        {Array.from({ length: months }).map((_, i) => (
                            <td key={i} className="p-1.5 min-w-[80px] text-right border-t border-b text-xs uppercase tracking-wider font-semibold text-gray-400">
                                M{i + 1}
                            </td>
                        ))}
                    </tr>

                    {/* Regular output rows - grouped by channel, then alias */}
                    {isSingleChannel ? (
                        <>
                            {/* Single channel: just show aliases directly */}
                            {(() => {
                                // Calculate totals for single channel objects
                                const singleChannelTotals = new Float64Array(months);
                                const channel = channelNames[0];

                                return (
                                    <>
                                        {aliases.map(alias => {
                                            const channels = byAlias[alias];
                                            if (!channels) return null;
                                            const [channel, series] = Object.entries(channels)[0];

                                            // Add to totals
                                            for (let m = 0; m < months; m++) {
                                                singleChannelTotals[m] += series[m];
                                            }

                                            return (
                                                <tr key={`${alias}.${channel}`} className="hover:bg-gray-50 group transition-colors">
                                                    <td className="p-1.5 font-medium text-gray-600 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] whitespace-nowrap">
                                                        {formatName(alias)}
                                                    </td>
                                                    {Array.from(series).slice(0, months).map((val, m) => {
                                                        const overrideVal = overrides?.[alias]?.[channel]?.[m];
                                                        return (
                                                            <OverrideCell
                                                                key={m}
                                                                calculatedValue={val}
                                                                overrideValue={overrideVal}
                                                                onOverride={(newVal) => handleCellChange(alias, channel, m, newVal)}
                                                                isDirectEdit={uiMode === 'monthly'}
                                                            />
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                        {/* Totals row for single channel */}
                                        {shouldShowTotals && (
                                            <tr className="bg-gradient-to-r from-blue-100/80 to-blue-50/50 border-t-2 border-blue-300">
                                                <td className="p-1.5 font-bold text-blue-900 sticky left-0 bg-blue-100 z-10 border-r border-blue-200 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] whitespace-nowrap">
                                                    TOTAL
                                                </td>
                                                {Array.from(singleChannelTotals).slice(0, months).map((total, m) => (
                                                    <td key={m} className="p-1.5 text-right font-bold text-blue-900">
                                                        {Math.round(total).toLocaleString()}
                                                    </td>
                                                ))}
                                            </tr>
                                        )}
                                    </>
                                );
                            })()}
                        </>
                    ) : (
                        // Multiple channels: group by channel, show aliases within
                        channelNames.map(channel => {
                            // Check visibility for 'cum' channel
                            if (channel === 'cum') {
                                // Only show if at least one alias in this group has its 'cum' channel used
                                const isUsed = aliases.some(alias => usedChannels?.has(`${alias}.cum`));
                                if (!isUsed) return null;
                            }

                            // Check hidden property
                            if (channelDefs?.[channel]?.hidden && !showHidden) {
                                return null;
                            }

                            // Calculate totals for this channel
                            const channelTotals = new Float64Array(months);
                            for (const alias of aliases) {
                                const series = byChannel[channel]?.[alias];
                                if (series) {
                                    for (let m = 0; m < months; m++) {
                                        channelTotals[m] += series[m];
                                    }
                                }
                            }

                            const isReadOnly = channel === 'cum';

                            return (
                                <React.Fragment key={channel}>
                                    <tr className="bg-blue-50/30">
                                        <td className="p-1.5 font-bold text-blue-800 sticky left-0 bg-blue-50 z-10 border-b border-blue-100 border-r shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] whitespace-nowrap">
                                            {channelDefs?.[channel]?.label || formatName(channel)}
                                        </td>
                                        <td colSpan={months} className="border-b border-blue-100"></td>
                                    </tr>
                                    {aliases.map(alias => {
                                        const series = byChannel[channel]?.[alias];
                                        if (!series) return null;
                                        if (channel === 'cum') {
                                            console.log(`[ObjectOutputs] ${alias}.cum values:`, Array.from(series).slice(0, 5));
                                        }
                                        return (
                                            <tr key={`${alias}.${channel}`} className="hover:bg-gray-50 group transition-colors">
                                                <td className="p-1.5 font-medium text-gray-600 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] whitespace-nowrap">
                                                    {formatName(alias)}
                                                </td>
                                                {Array.from(series).slice(0, months).map((val, m) => {
                                                    if (isReadOnly) {
                                                        return (
                                                            <td key={m} className="p-1.5 text-right text-xs text-gray-500 bg-gray-50/50 cursor-default select-none">
                                                                {val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                            </td>
                                                        );
                                                    }
                                                    const overrideVal = overrides?.[alias]?.[channel]?.[m];
                                                    return (
                                                        <OverrideCell
                                                            key={m}
                                                            calculatedValue={val}
                                                            overrideValue={overrideVal}
                                                            onOverride={(newVal) => handleCellChange(alias, channel, m, newVal)}
                                                            isDirectEdit={uiMode === 'monthly'}
                                                        />
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                    {/* Totals row */}
                                    {shouldShowTotals && (
                                        <tr className="bg-gradient-to-r from-blue-100/80 to-blue-50/50 border-t-2 border-blue-300">
                                            <td className="p-1.5 font-bold text-blue-900 sticky left-0 bg-blue-100 z-10 border-r border-blue-200 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] whitespace-nowrap">
                                                TOTAL
                                            </td>
                                            {Array.from(channelTotals).slice(0, months).map((total, m) => (
                                                <td key={m} className="p-1.5 text-right font-bold text-blue-900">
                                                    {Math.round(total).toLocaleString()}
                                                </td>
                                            ))}
                                        </tr>
                                    )}
                                </React.Fragment>
                            )
                        })
                    )}
                </tbody>
            </table>
        </div >
    );
}

interface OverrideCellProps {
    calculatedValue: number;
    overrideValue: number | undefined;
    onOverride: (val: number | null) => void;
    isDirectEdit?: boolean;
}

function OverrideCell({ calculatedValue, overrideValue, onOverride, isDirectEdit }: OverrideCellProps) {
    const isOverridden = overrideValue !== undefined;
    const displayValue = isOverridden ? overrideValue : calculatedValue;

    // Local state for editing
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(displayValue.toString());

    // Update edit value when props change (if not editing)
    React.useEffect(() => {
        if (!isEditing) {
            setEditValue(displayValue.toString());
        }
    }, [displayValue, isEditing]);

    const handleCommit = () => {
        setIsEditing(false);
        if (editValue.trim() === '') {
            // Empty string -> remove override
            onOverride(null);
        } else {
            const num = parseFloat(editValue);
            if (!isNaN(num)) {
                onOverride(num);
            } else {
                // Invalid number -> revert to display value
                setEditValue(displayValue.toString());
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        }
    };

    // Style for direct edit mode (monthly mode)
    // It should look like a normal input, not an override
    if (isDirectEdit) {
        return (
            <td className="p-0 border-l border-transparent transition-all hover:bg-blue-50">
                <input
                    type="text"
                    className="w-full h-full p-1.5 text-right bg-transparent outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 text-gray-700"
                    value={isEditing ? editValue : displayValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    onFocus={() => {
                        setIsEditing(true);
                        setEditValue(displayValue.toString());
                    }}
                    onBlur={handleCommit}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
            </td>
        );
    }

    return (
        <td
            className={`p-0 border-l border-transparent transition-all ${isOverridden
                ? 'bg-yellow-50 ring-1 ring-inset ring-yellow-200'
                : 'hover:bg-blue-50'
                }`}
        >
            <input
                type="text"
                className={`w-full h-full p-1.5 text-right bg-transparent outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 ${isOverridden ? 'text-yellow-700 font-bold' : 'text-gray-700'
                    }`}
                value={isEditing ? editValue : displayValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                onFocus={() => {
                    setIsEditing(true);
                    setEditValue(isOverridden ? (overrideValue?.toString() ?? '') : calculatedValue.toString());
                }}
                onBlur={handleCommit}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
            />
        </td>
    );
}

