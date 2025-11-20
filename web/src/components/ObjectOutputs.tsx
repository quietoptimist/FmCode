import React from 'react';

interface ObjectOutputsProps {
    aliases: string[];
    store: Map<string, Float64Array> | null;
    overrides: any;
    months: number;
    channelDefs?: Record<string, { label: string }>;
    onOverride: (alias: string, channel: string, month: number, value: number | null) => void;
}

export function ObjectOutputs({ aliases, store, overrides, months, channelDefs, onOverride }: ObjectOutputsProps) {
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
                        <th className="p-3 sticky left-0 bg-gray-50 z-20 border-b border-r font-semibold text-gray-700 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] min-w-[150px]">Month</th>
                        {Array.from({ length: months }).map((_, i) => (
                            <th key={i} className="p-3 min-w-[80px] text-right border-b text-xs uppercase tracking-wider font-semibold text-gray-400">
                                M{i + 1}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {aliases.map(alias => {
                        const channels = byAlias[alias];
                        if (!channels) return null;

                        return (
                            <React.Fragment key={alias}>
                                <tr className="bg-blue-50/30">
                                    <td className="p-3 font-bold text-blue-800 sticky left-0 bg-blue-50 z-10 border-b border-blue-100 border-r shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] whitespace-nowrap">
                                        {alias}
                                    </td>
                                    <td colSpan={months} className="border-b border-blue-100"></td>
                                </tr>
                                {Object.entries(channels).map(([channel, series]) => (
                                    <tr key={`${alias}.${channel}`} className="hover:bg-gray-50 group transition-colors">
                                        <td className="p-3 font-medium text-gray-600 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] whitespace-nowrap">
                                            {channelDefs?.[channel]?.label || channel}
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

