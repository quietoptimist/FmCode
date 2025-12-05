/**
 * Helper to convert engine results to financial data
 */

import { buildFinancials, ModelOutput } from './buildFinancials';

export function buildFinancialsFromEngine(engineResult: any, index: any, months: number) {
    if (!engineResult?.store) {
        console.log('[buildFinancialsHelper] No store in engine result');
        return null;
    }

    console.log('[buildFinancialsHelper] Processing', engineResult.store.size, 'store entries');

    // Convert engine store to ModelOutput array
    const modelOutputs: ModelOutput[] = [];

    for (const [key, values] of engineResult.store.entries()) {
        // Parse key format: "alias.channel"
        const [alias, channel] = key.split('.');
        if (!alias || !channel || !(values instanceof Float64Array)) {
            console.log('[buildFinancialsHelper] Skipping', key, '- not valid format');
            continue;
        }

        // Get object info from index.aliases
        const aliasInfo = index.aliases.get(alias);
        if (!aliasInfo?.node?.fnName) {
            console.log('[buildFinancialsHelper] No fnName for alias:', alias);
            continue;
        }

        // CRITICAL: Use object instance name (e.g. "CustomerSupportTeam") not object type (e.g. "StaffDivDC")
        // This ensures grouping by the actual object the user created
        const objectName = aliasInfo.node.name || aliasInfo.node.fnName;
        const objectType = aliasInfo.node.fnName;

        console.log('[buildFinancialsHelper] Found:', alias, channel, 'Instance:', objectName, 'Type:', objectType);

        modelOutputs.push({
            objectType: objectType,
            objectName: objectName,  // Use instance name for grouping
            alias,
            channel,
            values: values as Float64Array
        });
    }

    console.log('[buildFinancialsHelper] Built', modelOutputs.length, 'model outputs');
    return buildFinancials(modelOutputs, months);
}
