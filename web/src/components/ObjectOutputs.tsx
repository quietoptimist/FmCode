import React from 'react';
import { formatName } from '@/lib/formatters';

interface ObjectOutputsProps {
    aliases: string[];
    store: Map<string, Float64Array> | null;
    overrides: any;
    months: number;
    channelDefs?: Record<string, { label: string }>;
    onOverride: (alias: string, channel: string, month: number, value: number | null) => void;
    objAss?: any; // assumptions for this object
    seasonalEnabled?: boolean;
    objName?: string;
    onAssumptionChange?: (objName: string, type: 'object' | 'output' | 'meta', aliasOrName: string, fieldName: string, value: any, subField?: string | null, index?: number | null) => void;
}

const months_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const safeParseFloat = (val: string): number => {
    if (val === '' || val === '-') return 0;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
};

export function ObjectOutputs({ aliases, store, overrides, months, channelDefs, onOverride, objAss, seasonalEnabled, objName, onAssumptionChange }: ObjectOutputsProps) {
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

    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
            <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                        <th className="p-3 sticky left-0 bg-gray-50 z-20 border-b border-r font-semibold text-gray-700 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] min-w-[150px]"></th>
                        {Array.from({ length: months }).map((_, i) => (
                            <th key={i} className="p-3 min-w-[80px] text-right border-b"></th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {/* Seasonal Input Rows */}
                    {seasonalEnabled && objAss && onAssumptionChange && objName && (
                        <>
                            {/* Seasonal section header */}
                            <tr className="bg-purple-50/50">
                                <td className="p-3 font-bold text-purple-800 sticky left-0 bg-purple-50 z-10 border-b border-purple-100 border-r shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] whitespace-nowrap">
                                    Seasonal %
                                </td>
                                {months_names.map((monthName, i) => (
                                    <td key={i} className="p-3 min-w-[80px] text-center border-b border-purple-100 text-xs uppercase tracking-wider font-semibold text-purple-600">
                                        {monthName}
                                    </td>
                                ))}
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
                                            <td key={i} className="p-1 text-center">
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

                    {/* Month Header Row */}
                    <tr className="bg-gray-50">
                        <td className="p-3 font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10 border-t border-b border-r shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] whitespace-nowrap">
                            Month
                        </td>
                        {Array.from({ length: months }).map((_, i) => (
                            <td key={i} className="p-3 min-w-[80px] text-right border-t border-b text-xs uppercase tracking-wider font-semibold text-gray-400">
                                M{i + 1}
                            </td>
                        ))}
                    </tr>

                    {/* Regular output rows */}
                    {aliases.map(alias => {
                        const channels = byAlias[alias];
                        if (!channels) return null;

                        const channelEntries = Object.entries(channels);
                        const isSingleChannel = channelEntries.length === 1;

                        if (isSingleChannel) {
                            const [channel, series] = channelEntries[0];
                            return (
                                <tr key={`${alias}.${channel}`} className="hover:bg-gray-50 group transition-colors">
                                    <td className="p-3 font-medium text-gray-600 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] whitespace-nowrap">
                                        {formatName(alias)}
                                    </td>
                                    {Array.from(series).slice(0, months).map((val, m) => {
                                        const overrideVal = overrides?.[alias]?.[channel]?.[m];
                                        return (
                                            <OverrideCell
                                                key={m}
                                                calculatedValue={val}
                                                overrideValue={overrideVal}
                                                onOverride={(newVal) => onOverride(alias, channel, m, newVal)}
                                            />
                                        );
                                    })}
                                </tr>
                            );
                        }

                        return (
                            <React.Fragment key={alias}>
                                <tr className="bg-blue-50/30">
                                    <td className="p-3 font-bold text-blue-800 sticky left-0 bg-blue-50 z-10 border-b border-blue-100 border-r shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] whitespace-nowrap">
                                        {formatName(alias)}
                                    </td>
                                    <td colSpan={months} className="border-b border-blue-100"></td>
                                </tr>
                                {channelEntries.map(([channel, series]) => (
                                    <tr key={`${alias}.${channel}`} className="hover:bg-gray-50 group transition-colors">
                                        <td className="p-3 font-medium text-gray-600 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] whitespace-nowrap">
                                            {channelDefs?.[channel]?.label || formatName(channel)}
                                        </td>
                                        {Array.from(series).slice(0, months).map((val, m) => {
                                            const overrideVal = overrides?.[alias]?.[channel]?.[m];
                                            return (
                                                <OverrideCell
                                                    key={m}
                                                    calculatedValue={val}
                                                    overrideValue={overrideVal}
                                                    onOverride={(newVal) => onOverride(alias, channel, m, newVal)}
                                                />
                                            );
                                        })}
                                    </tr>
                                ))}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

interface OverrideCellProps {
    calculatedValue: number;
    overrideValue: number | undefined;
    onOverride: (val: number | null) => void;
}

function OverrideCell({ calculatedValue, overrideValue, onOverride }: OverrideCellProps) {
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

    return (
        <td
            className={`p-0 border-l border-transparent transition-all ${isOverridden
                ? 'bg-yellow-50 ring-1 ring-inset ring-yellow-200'
                : 'hover:bg-blue-50'
                }`}
        >
            <input
                type="text"
                className={`w-full h-full p-3 text-right bg-transparent outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 ${isOverridden ? 'text-yellow-700 font-bold' : 'text-gray-700'
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

