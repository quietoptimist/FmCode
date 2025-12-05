import React, { useState, useMemo } from 'react';
import { formatName } from '@/lib/formatters';

// ... existing code ...

const getFriendlyName = (objName: string) => {
    const nameMap: Record<string, string> = {
        'StaffTeams': 'Staff Teams',
        'StaffRoles': 'Staff Roles',
        'StaffDriven': 'Staff Driven',
        'RevDrvNew': 'New Revenue',
        'RevDrvRecur': 'Recurring Revenue',
        'CostDrvDC': 'Direct Costs',
        'CostAnnSM': 'Sales & Marketing',
        'CostAnnGA': 'General & Admin',
        'CostAnnRD': 'Research & Dev',
        'OneTimeCost': 'One-Time Costs',
    };
    return nameMap[objName] || formatName(objName);
};
import { defaultFinancialTemplate, FinancialStatement, FinancialLineItem } from '@/lib/engine/financialSchema';
import { FinancialData } from '@/lib/engine/buildFinancials';

interface FinancialsPanelProps {
    financialData: FinancialData | null;
    startMonth?: number;
}

export function FinancialsPanel({ financialData, startMonth = 0 }: FinancialsPanelProps) {
    const [viewMode, setViewMode] = useState<'monthly' | 'annual'>('annual');
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    if (!financialData) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500">
                <p>No financial data available</p>
            </div>
        );
    }

    const toggleSection = (code: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(code)) {
            newExpanded.delete(code);
        } else {
            newExpanded.add(code);
        }
        setExpandedSections(newExpanded);
    };

    const periods = viewMode === 'monthly' ? financialData.months : Math.ceil(financialData.months / 12);
    const periodLabels = viewMode === 'monthly'
        ? Array.from({ length: periods }, (_, i) => `M${i + 1}`)
        : Array.from({ length: periods }, (_, i) => `Y${i + 1}`);

    // Get the active statement


    const isItemVisible = (item: FinancialLineItem) => {
        if (item.level === 0) return true;
        const parts = item.code.split('.');
        for (let i = parts.length - 1; i > 0; i--) {
            const parentCode = parts.slice(0, i).join('.');
            if (financialData.lineItems.has(parentCode) && !expandedSections.has(parentCode)) {
                return false;
            }
        }
        return true;
    };

    return (
        <div className="h-full flex flex-col bg-white border-l border-gray-200">
            {/* Header */}
            <div className="flex-none p-4 border-b border-gray-200 flex justify-start gap-8 items-center">
                <h2 className="text-xl font-bold text-gray-900">Financial Statements</h2>

                {/* View Mode Toggle */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('monthly')}
                        className={`px-3 py-1.5 text-sm font-medium rounded ${viewMode === 'monthly'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setViewMode('annual')}
                        className={`px-3 py-1.5 text-sm font-medium rounded ${viewMode === 'annual'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Annual
                    </button>
                </div>
            </div>

            {/* Statements List */}
            <div className="flex-1 overflow-auto p-4 space-y-20">
                {(['pnl', 'cash', 'balance', 'memo'] as const).map((stmtKey) => {
                    const statement = defaultFinancialTemplate.statements[stmtKey];
                    return (
                        <div key={stmtKey} className="space-y-2">
                            <h3 className="text-lg font-semibold text-gray-800 sticky left-0">{statement.name}</h3>
                            <table className="text-sm border-collapse w-auto">
                                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-20">
                                    <tr>
                                        <th className="text-left p-2 font-semibold text-gray-700 sticky left-0 bg-gray-50 z-30 border-r border-gray-200 min-w-[250px]">
                                            Line Item
                                        </th>
                                        {periodLabels.map((label, i) => (
                                            <th key={i} className="text-right p-2 font-semibold text-gray-700 min-w-[100px] w-[120px]">
                                                {label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {statement.lineItems.map((item) => (
                                        <React.Fragment key={item.code}>
                                            <FinancialLineRow
                                                item={item}
                                                financialData={financialData}
                                                viewMode={viewMode}
                                                periods={periods}
                                                expandedSections={expandedSections}
                                                toggleSection={toggleSection}
                                            />
                                            {/* Contributor rows - show when parent is expanded */}
                                            {expandedSections.has(item.code) && isItemVisible(item) && financialData.contributors.has(item.code) && (() => {
                                                const contributors = financialData.contributors.get(item.code)!;

                                                // Group contributors by objectName (object type)
                                                const groupedByObject = new Map<string, typeof contributors>();
                                                contributors.forEach(contrib => {
                                                    if (!groupedByObject.has(contrib.objectName)) {
                                                        groupedByObject.set(contrib.objectName, []);
                                                    }
                                                    groupedByObject.get(contrib.objectName)!.push(contrib);
                                                });

                                                const objectGroups = Array.from(groupedByObject.entries());

                                                return objectGroups.map(([objectName, objContributors], groupIdx) => {
                                                    const hasMultipleOutputs = objContributors.length > 1;
                                                    const groupKey = `${item.code}-${objectName}`;
                                                    const isGroupExpanded = expandedSections.has(groupKey);

                                                    return (
                                                        <React.Fragment key={groupKey}>
                                                            {/* Spacing between groups */}
                                                            {groupIdx > 0 && (
                                                                <tr className="h-2">
                                                                    <td colSpan={periods + 1} className="bg-white"></td>
                                                                </tr>
                                                            )}

                                                            {/* Multiple outputs: collapsible group header */}
                                                            {hasMultipleOutputs ? (
                                                                <>
                                                                    <ObjectGroupHeader
                                                                        objectName={objectName}
                                                                        contributors={objContributors}
                                                                        parentLevel={item.level}
                                                                        viewMode={viewMode}
                                                                        periods={periods}
                                                                        isExpanded={isGroupExpanded}
                                                                        onToggle={() => toggleSection(groupKey)}
                                                                    />
                                                                    {/* Individual outputs when expanded */}
                                                                    {isGroupExpanded && objContributors.map((contributor, idx) => (
                                                                        <ContributorRow
                                                                            key={`${groupKey}-${idx}`}
                                                                            contributor={contributor}
                                                                            parentLevel={item.level + 1}
                                                                            viewMode={viewMode}
                                                                            periods={periods}
                                                                        />
                                                                    ))}
                                                                </>
                                                            ) : (
                                                                /* Single output: show directly */
                                                                <ContributorRow
                                                                    key={`${groupKey}-0`}
                                                                    contributor={objContributors[0]}
                                                                    parentLevel={item.level}
                                                                    viewMode={viewMode}
                                                                    periods={periods}
                                                                />
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                });
                                            })()}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

interface FinancialLineRowProps {
    item: FinancialLineItem;
    financialData: FinancialData;
    viewMode: 'monthly' | 'annual';
    periods: number;
    expandedSections: Set<string>;
    toggleSection: (code: string) => void;
}

function FinancialLineRow({
    item,
    financialData,
    viewMode,
    periods,
    expandedSections,
    toggleSection
}: FinancialLineRowProps) {
    const values = financialData.lineItems.get(item.code);

    // Get period values (Always call hook)
    const periodValues = useMemo(() => {
        if (!values) return []; // Handle missing values inside hook
        if (viewMode === 'monthly') {
            return Array.from(values);
        } else {
            const years = Math.ceil(values.length / 12);
            const annualValues: number[] = [];
            for (let y = 0; y < years; y++) {
                let total = 0;
                const monthStart = y * 12;
                const monthEnd = Math.min(monthStart + 12, values.length);
                for (let m = monthStart; m < monthEnd; m++) {
                    total += values[m];
                }
                annualValues.push(total);
            }
            return annualValues;
        }
    }, [values, viewMode]);

    // Check if hidden by collapsed parent (Always call hook)
    const shouldHide = useMemo(() => {
        if (item.level === 0) return false;
        const parts = item.code.split('.');
        // Check all parent levels
        for (let i = 1; i < parts.length; i++) {
            const parentCode = parts.slice(0, i).join('.');
            // If a parent is NOT in expandedSections, then we are hidden
            // But wait, expandedSections tracks what is OPEN.
            // If parent is NOT in expandedSections, it is CLOSED.
            // So if parent is closed, child is hidden.
            // We need to check if the parent actually exists in the map though?
            // The original logic was:
            // const parentItem = Array.from(financialData.lineItems.keys()).find(code => code === parentCode);
            // if (parentItem && !expandedSections.has(parentCode)) return true;

            // Optimization: We don't need to scan keys. We can just check if parentCode is a valid section?
            // But let's stick to original logic for safety, just optimized.
            // Actually, checking keys() every time is slow. 
            // But for now let's just preserve logic.

            // Original logic used find on keys array which is O(N). Inside a loop.
            // We can just check if financialData.lineItems.has(parentCode).
            if (financialData.lineItems.has(parentCode) && !expandedSections.has(parentCode)) {
                return true;
            }
        }
        return false;
    }, [item.code, item.level, expandedSections, financialData]);

    if (!values) return null;

    // Hide empty rows
    const hasNonZeroValue = periodValues.some(v => Math.abs(v) > 0.01);
    const hasContributors = financialData.contributors.has(item.code);
    if (!hasNonZeroValue && !item.formula && !item.children && !hasContributors) {
        return null;
    }

    if (shouldHide) return null;

    const isCollapsible = item.collapsible || hasContributors;
    const isExpanded = expandedSections.has(item.code);

    const getLevelStyle = (level: number) => {
        const indent = level * 20;
        const fontWeight = level === 0 ? 'font-bold' : level === 1 ? 'font-semibold' : 'font-normal';
        const bgColor = level === 0 ? 'bg-blue-50' : level === 1 ? 'bg-gray-50' : 'bg-white';
        return { indent, fontWeight, bgColor };
    };

    const { indent, fontWeight, bgColor } = getLevelStyle(item.level);

    const formatValue = (val: number) => {
        const absVal = Math.abs(val);
        const sign = val < 0 ? '-' : '';
        if (absVal >= 1000000) {
            return `${sign}${(absVal / 1000000).toFixed(1)}M`;
        } else if (absVal >= 1000) {
            return `${sign}${(absVal / 1000).toFixed(0)}K`;
        } else {
            return `${sign}${absVal.toFixed(0)}`;
        }
    };

    return (
        <tr className={`${bgColor} border-b border-gray-100 hover:bg-blue-50/30`}>
            <td
                className={`p-2 ${fontWeight} sticky left-0 ${bgColor} z-10 ${isCollapsible ? 'cursor-pointer' : ''} border-r border-gray-200`}
                style={{ paddingLeft: `${8 + indent}px` }}
                onClick={() => isCollapsible && toggleSection(item.code)}
            >
                <div className="flex items-center gap-1">
                    {isCollapsible && (
                        <span className="text-gray-500 text-xs">
                            {isExpanded ? '▼' : '▶'}
                        </span>
                    )}
                    <span className={item.sign === -1 ? 'text-red-700' : ''}>
                        {item.label}
                    </span>
                </div>
            </td>
            {periodValues.slice(0, periods).map((val, i) => {
                const shouldShowValue = !isCollapsible || !isExpanded;
                return (
                    <td key={i} className={`p-2 text-right ${fontWeight} ${val < 0 ? 'text-red-600' : ''}`}>
                        {shouldShowValue ? formatValue(val) : ''}
                    </td>
                );
            })}
        </tr>
    );
}

interface ContributorRowProps {
    contributor: any;
    parentLevel: number;
    viewMode: 'monthly' | 'annual';
    periods: number;
}

function ContributorRow({ contributor, parentLevel, viewMode, periods }: ContributorRowProps) {
    const periodValues = useMemo(() => {
        if (viewMode === 'monthly') {
            return Array.from<number>(contributor.values);
        } else {
            const years = Math.ceil(contributor.values.length / 12);
            const annualValues: number[] = [];
            for (let y = 0; y < years; y++) {
                let total = 0;
                const monthStart = y * 12;
                const monthEnd = Math.min(monthStart + 12, contributor.values.length);
                for (let m = monthStart; m < monthEnd; m++) {
                    total += contributor.values[m];
                }
                annualValues.push(total);
            }
            return annualValues;
        }
    }, [contributor.values, viewMode]);

    const indent = (parentLevel + 1) * 20;

    const formatValue = (val: number) => {
        const absVal = Math.abs(val);
        const sign = val < 0 ? '-' : '';
        if (absVal >= 1000000) {
            return `${sign}${(absVal / 1000000).toFixed(1)}M`;
        } else if (absVal >= 1000) {
            return `${sign}${(absVal / 1000).toFixed(0)}K`;
        } else {
            return `${sign}${absVal.toFixed(0)}`;
        }
    };

    return (
        <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs">
            <td className="p-2 sticky left-0 bg-gray-50 z-10 italic border-r border-gray-200" style={{ paddingLeft: `${8 + indent}px` }}>
                {contributor.label}
            </td>
            {periodValues.slice(0, periods).map((val, i) => (
                <td key={i} className="p-2 text-right">
                    {formatValue(val)}
                </td>
            ))}
        </tr>
    );
}

interface ObjectGroupHeaderProps {
    objectName: string;
    contributors: any[];
    parentLevel: number;
    viewMode: 'monthly' | 'annual';
    periods: number;
    isExpanded: boolean;
    onToggle: () => void;
}

function ObjectGroupHeader({ objectName, contributors, parentLevel, viewMode, periods, isExpanded, onToggle }: ObjectGroupHeaderProps) {
    const subtotals = useMemo(() => {
        const months = contributors[0].values.length;
        const totals = new Float64Array(months);

        contributors.forEach(contrib => {
            for (let m = 0; m < months; m++) {
                totals[m] += contrib.values[m];
            }
        });

        if (viewMode === 'monthly') {
            return Array.from(totals);
        } else {
            const years = Math.ceil(months / 12);
            const annualValues: number[] = [];
            for (let y = 0; y < years; y++) {
                let total = 0;
                const monthStart = y * 12;
                const monthEnd = Math.min(monthStart + 12, months);
                for (let m = monthStart; m < monthEnd; m++) {
                    total += totals[m];
                }
                annualValues.push(total);
            }
            return annualValues;
        }
    }, [contributors, viewMode]);

    const indent = (parentLevel + 1) * 20;

    const formatValue = (val: number) => {
        const absVal = Math.abs(val);
        const sign = val < 0 ? '-' : '';
        if (absVal >= 1000000) {
            return `${sign}${(absVal / 1000000).toFixed(1)}M`;
        } else if (absVal >= 1000) {
            return `${sign}${(absVal / 1000).toFixed(0)}K`;
        } else {
            return `${sign}${absVal.toFixed(0)}`;
        }
    };



    return (
        <tr className="bg-blue-100 border-b border-gray-200 text-gray-700 text-xs font-semibold cursor-pointer hover:bg-blue-200" onClick={onToggle}>
            <td className="p-2 sticky left-0 bg-blue-100 hover:bg-blue-200 z-10 border-r border-gray-200" style={{ paddingLeft: `${8 + indent}px` }}>
                <div className="flex items-center gap-1">
                    <span className="text-gray-500 text-xs">
                        {isExpanded ? '▼' : '▶'}
                    </span>
                    <span>{getFriendlyName(objectName)} Total</span>
                </div>
            </td>
            {subtotals.slice(0, periods).map((val, i) => (
                <td key={i} className="p-2 text-right">
                    {formatValue(val)}
                </td>
            ))}
        </tr>
    );
}
