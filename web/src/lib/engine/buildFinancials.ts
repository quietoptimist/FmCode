/**
 * Financial Aggregation Engine
 * Collects model outputs and calculates financial statements
 */

import { defaultFinancialTemplate, FinancialTemplate, FinancialLineItem } from './financialSchema';
import { objectSchema } from './objectSchema';
import { formatName } from '../formatters';

export interface ModelOutputContributor {
    objectName: string;  // Object type (e.g., "StaffTeams", "StaffRoles")
    alias: string;
    channel: string;
    label: string;  // Human-readable label for display
    values: Float64Array;
}

export interface FinancialData {
    // Map of line item code → monthly values
    lineItems: Map<string, Float64Array>;
    // Map of line item code → list of model outputs that contribute to it
    contributors: Map<string, ModelOutputContributor[]>;
    months: number;
}

export interface ModelOutput {
    objectType: string; // Object type for schema lookup (e.g. "StaffDivDC")
    objectName: string; // Object instance name for grouping (e.g. "CustomerSupportTeam")
    alias: string;
    channel: string;
    values: Float64Array;
}

/**
 * Build financial statements from model outputs
 */
export function buildFinancials(
    modelOutputs: ModelOutput[],
    months: number,
    template: FinancialTemplate = defaultFinancialTemplate
): FinancialData {
    const lineItems = new Map<string, Float64Array>();
    const contributors = new Map<string, ModelOutputContributor[]>();

    // Step 1: Initialize all line items with zeros
    initializeLineItems(lineItems, months, template);

    // Step 2: Aggregate model outputs to destination line items (and track contributors)
    aggregateOutputs(modelOutputs, lineItems, contributors, months);

    // Step 3: Calculate formulas (P&L first, then Cash, then Balance)
    calculateStatement(template.statements.pnl.lineItems, lineItems, months);
    calculateStatement(template.statements.cash.lineItems, lineItems, months);
    calculateStatement(template.statements.balance.lineItems, lineItems, months);
    calculateStatement(template.statements.memo.lineItems, lineItems, months);

    return { lineItems, contributors, months };
}

/**
 * Initialize all line items with zero arrays
 */
function initializeLineItems(
    lineItems: Map<string, Float64Array>,
    months: number,
    template: FinancialTemplate
): void {
    const allItems = [
        ...template.statements.pnl.lineItems,
        ...template.statements.cash.lineItems,
        ...template.statements.balance.lineItems,
        ...template.statements.memo.lineItems
    ];

    for (const item of allItems) {
        lineItems.set(item.code, new Float64Array(months));
    }
}

/**
 * Aggregate model outputs to their destination line items
 */
function aggregateOutputs(
    modelOutputs: ModelOutput[],
    lineItems: Map<string, Float64Array>,
    contributors: Map<string, ModelOutputContributor[]>,
    months: number
): void {
    console.log('[buildFinancials] Aggregating', modelOutputs.length, 'outputs');

    for (const output of modelOutputs) {
        // Get destinations from schema
        const objDef = (objectSchema as any)[output.objectType];
        if (!objDef?.channels?.[output.channel]?.destinations) {
            console.log('[buildFinancials] No destinations for', output.objectType, output.channel);
            continue;
        }

        const destinations = objDef.channels[output.channel].destinations;
        const channelLabel = objDef.channels[output.channel].label || output.channel;
        console.log('[buildFinancials]', output.alias, output.channel, '→', destinations);

        // Add output values to each destination
        for (const dest of destinations) {
            const destArray = lineItems.get(dest);
            if (destArray) {
                for (let m = 0; m < months; m++) {
                    destArray[m] += output.values[m];
                }

                // Track this output as a contributor to this line item
                if (!contributors.has(dest)) {
                    contributors.set(dest, []);
                }
                contributors.get(dest)!.push({
                    objectName: output.objectName,  // Object type for grouping
                    alias: output.alias,
                    channel: output.channel,
                    label: `${formatName(output.alias)} - ${channelLabel}`,
                    values: output.values
                });

                console.log('[buildFinancials] Added to', dest, '- sample value:', output.values[0]);
            } else {
                console.warn('[buildFinancials] Destination not found:', dest);
            }
        }
    }
}

/**
 * Calculate formulas for a statement's line items
 */
function calculateStatement(
    items: FinancialLineItem[],
    lineItems: Map<string, Float64Array>,
    months: number
): void {
    console.log('[calculateStatement] Processing', items.length, 'line items');

    // Sort items by depth (level) to ensure children are calculated before parents
    // This is critical for nested parent items like cash.ops.in which has children
    const sortedItems = [...items].sort((a, b) => {
        const aDepth = a.code.split('.').length;
        const bDepth = b.code.split('.').length;
        return bDepth - aDepth; // Deeper items first (reverse order)
    });

    for (const item of sortedItems) {
        const result = lineItems.get(item.code);
        if (!result) continue;

        // If item has children but no formula, automatically sum children
        if (!item.formula && item.children && item.children.length > 0) {
            console.log('[calculateStatement] Auto-summing children for:', item.code, '→', item.children);
            result.fill(0);

            // Get all items to look up sign property
            const allItems = [
                ...defaultFinancialTemplate.statements.pnl.lineItems,
                ...defaultFinancialTemplate.statements.cash.lineItems,
                ...defaultFinancialTemplate.statements.balance.lineItems,
                ...defaultFinancialTemplate.statements.memo.lineItems
            ];

            for (const childCode of item.children) {
                const childArray = lineItems.get(childCode);
                if (childArray) {
                    // Apply child's sign when summing
                    const childDef = allItems.find(i => i.code === childCode);
                    const childSign = childDef?.sign ?? 1;

                    console.log('[calculateStatement] Adding child:', childCode, 'sign:', childSign);
                    for (let m = 0; m < months; m++) {
                        result[m] += childSign * childArray[m];
                    }
                }
            }
            console.log('[calculateStatement] Result:', item.code, 'sample:', result[0]);
            continue;
        }

        if (!item.formula) continue;

        console.log('[calculateStatement] Processing formula for:', item.code, '→', item.formula);

        // Parse and execute formula
        if (item.formula.startsWith('sum(')) {
            // sum(pnl.revenue.*) → sum all matching items
            const pattern = item.formula.slice(4, -1); // Remove 'sum(' and ')'
            calculateSum(pattern, lineItems, result, months);
        } else if (item.formula.startsWith('cumsum(')) {
            // cumsum(pnl.netIncome) → cumulative sum
            const sourceCode = item.formula.slice(7, -1);
            calculateCumSum(sourceCode, lineItems, result, months);
        } else if (item.formula.includes('+') || item.formula.includes('-')) {
            // pnl.revenue.total - pnl.cogs.total
            calculateExpression(item.formula, lineItems, result, months);
        } else {
            // Direct reference: cash.balance
            const source = lineItems.get(item.formula);
            if (source) {
                result.set(source);
            }
        }

        // Apply cumulative if needed
        if (item.cumulative && !item.formula.startsWith('cumsum(')) {
            applyCumulative(result, months);
        }
    }
}

/**
 * Calculate sum with wildcard pattern matching
 */
function calculateSum(
    pattern: string,
    lineItems: Map<string, Float64Array>,
    result: Float64Array,
    months: number
): void {
    result.fill(0);

    console.log('[calculateSum] Pattern:', pattern);

    // Convert pattern like "pnl.revenue.*" to match child items
    const isWildcard = pattern.endsWith('.*');

    if (isWildcard) {
        const prefix = pattern.slice(0, -2); // Remove '.*'  e.g., "pnl.revenue"
        const prefixLevel = prefix.split('.').length; // e.g., 2 for "pnl.revenue"

        console.log('[calculateSum] Wildcard pattern, prefix:', prefix, 'prefix level:', prefixLevel);

        // Get the schema to check which items have children (to exclude them)
        const allItems = [
            ...defaultFinancialTemplate.statements.pnl.lineItems,
            ...defaultFinancialTemplate.statements.cash.lineItems,
            ...defaultFinancialTemplate.statements.balance.lineItems,
            ...defaultFinancialTemplate.statements.memo.lineItems
        ];

        for (const [code, values] of lineItems.entries()) {
            // Skip the pattern prefix itself (e.g., skip "pnl.revenue" when summing "pnl.revenue.*")
            if (code === prefix) {
                console.log('[calculateSum] Skipping prefix itself:', code);
                continue;
            }

            // Check if this code matches the pattern
            if (code.startsWith(prefix + '.')) {
                const codeLevel = code.split('.').length;

                // Only match items exactly one level deeper
                // e.g., for "pnl.revenue.*", match "pnl.revenue.new" (level 3) but not "pnl.revenue.new.subsection" (level 4)
                if (codeLevel === prefixLevel + 1) {
                    // IMPORTANT: Exclude items that have children (parent items) or have formulas (totals)
                    // Only sum true leaf items to avoid double-counting
                    const itemDef = allItems.find(item => item.code === code);
                    const hasChildren = itemDef?.children && itemDef.children.length > 0;
                    const hasFormula = itemDef?.formula;

                    if (!hasChildren && !hasFormula) {
                        console.log('[calculateSum] Matching leaf:', code, 'Sample value:', values[0]);
                        for (let m = 0; m < months; m++) {
                            result[m] += values[m];
                        }
                    } else {
                        console.log('[calculateSum] Skipping:', code, hasChildren ? '(has children)' : '(has formula)');
                    }
                }
            }
        }
    } else {
        // Direct reference, just copy
        const source = lineItems.get(pattern);
        if (source) {
            result.set(source);
        }
    }

    console.log('[calculateSum] Result sample:', result[0]);
}

/**
 * Calculate cumulative sum
 */
function calculateCumSum(
    sourceCode: string,
    lineItems: Map<string, Float64Array>,
    result: Float64Array,
    months: number
): void {
    const source = lineItems.get(sourceCode);
    if (!source) return;

    let cumulative = 0;
    for (let m = 0; m < months; m++) {
        cumulative += source[m];
        result[m] = cumulative;
    }
}

/**
 * Calculate arithmetic expression
 */
function calculateExpression(
    formula: string,
    lineItems: Map<string, Float64Array>,
    result: Float64Array,
    months: number
): void {
    result.fill(0);

    // Simple parser for expressions like "a + b - c"
    const tokens = formula.split(/([+\-])/).map(t => t.trim()).filter(t => t);

    let currentSign = 1;
    for (const token of tokens) {
        if (token === '+') {
            currentSign = 1;
        } else if (token === '-') {
            currentSign = -1;
        } else {
            const source = lineItems.get(token);
            if (source) {
                for (let m = 0; m < months; m++) {
                    result[m] += currentSign * source[m];
                }
            }
        }
    }
}

/**
 * Apply cumulative transformation
 */
function applyCumulative(values: Float64Array, months: number): void {
    let cumulative = 0;
    for (let m = 0; m < months; m++) {
        cumulative += values[m];
        values[m] = cumulative;
    }
}

/**
 * Get annual totals from monthly values
 */
export function getAnnualTotals(
    financialData: FinancialData,
    startMonth: number = 0
): FinancialData {
    const annualLineItems = new Map<string, Float64Array>();
    const years = Math.ceil(financialData.months / 12);

    for (const [code, monthlyValues] of financialData.lineItems) {
        const annualValues = new Float64Array(years);

        for (let y = 0; y < years; y++) {
            let total = 0;
            const monthStart = y * 12;
            const monthEnd = Math.min(monthStart + 12, financialData.months);

            for (let m = monthStart; m < monthEnd; m++) {
                total += monthlyValues[m];
            }

            annualValues[y] = total;
        }

        annualLineItems.set(code, annualValues);
    }

    return { lineItems: annualLineItems, contributors: financialData.contributors, months: years };
}
