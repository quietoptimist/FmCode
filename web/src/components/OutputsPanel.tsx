import React from 'react';

interface OutputsPanelProps {
    store: Map<string, Float64Array> | null;
    overrides: any;
    onOverride: (alias: string, channel: string, month: number, value: number) => void;
}

export function OutputsPanel({ store, overrides, onOverride }: OutputsPanelProps) {
    if (!store) return <div className="p-4 text-gray-400">No results calculated.</div>;

    // Group by Alias
    const byAlias: Record<string, Record<string, Float64Array>> = {};
    for (const [key, series] of store.entries()) {
        const [alias, channel] = key.split('.');
        if (!alias || !channel) continue;
        if (!byAlias[alias]) byAlias[alias] = {};
        byAlias[alias][channel] = series;
    }

    const months = 24; // TODO: Get from context

    return (
        <div className="flex-1 overflow-auto p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-6">Outputs</h2>
            <div className="overflow-x-auto pb-4">
                <table className="min-w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="p-3 sticky left-0 bg-gray-50 z-20 border-b border-r font-semibold text-gray-700 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">Metric</th>
                            {Array.from({ length: months }).map((_, i) => (
                                <th key={i} className="p-3 min-w-[80px] text-right border-b text-xs uppercase tracking-wider font-semibold text-gray-400">
                                    M{i + 1}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {Object.entries(byAlias).map(([alias, channels]) => (
                            <React.Fragment key={alias}>
                                <tr className="bg-blue-50/30">
                                    <td colSpan={months + 1} className="p-3 font-bold text-blue-800 sticky left-0 bg-blue-50 z-10 border-b border-blue-100">
                                        {alias}
                                    </td>
                                </tr>
                                {Object.entries(channels).map(([channel, series]) => (
                                    <tr key={`${alias}.${channel}`} className="hover:bg-gray-50 group transition-colors">
                                        <td className="p-3 font-medium text-gray-600 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] whitespace-nowrap">
                                            {channel}
                                        </td>
                                        {Array.from(series).slice(0, months).map((val, m) => {
                                            const isOverridden = overrides?.[alias]?.[channel]?.[m] !== undefined;
                                            return (
                                                <td
                                                    key={m}
                                                    className={`p-3 text-right cursor-pointer transition-all border-l border-transparent hover:border-blue-200 ${isOverridden
                                                        ? 'bg-yellow-50 text-yellow-700 font-bold ring-1 ring-inset ring-yellow-200'
                                                        : 'text-gray-700 hover:bg-blue-50'
                                                        }`}
                                                    onClick={() => {
                                                        const currentVal = isOverridden ? overrides[alias][channel][m] : val;
                                                        const newVal = prompt(`Override ${alias}.${channel} Month ${m + 1}`, currentVal.toString());
                                                        if (newVal !== null && !isNaN(parseFloat(newVal))) {
                                                            onOverride(alias, channel, m, parseFloat(newVal));
                                                        }
                                                    }}
                                                    title={isOverridden ? `Overridden: ${val}` : `Calculated: ${val}`}
                                                >
                                                    {val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
