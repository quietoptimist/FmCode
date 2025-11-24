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

        // CRITICAL: Use fnName (object type) not objectName (instance name)
        const objectType = aliasInfo.node.fnName;

        console.log('[buildFinancialsHelper] Found:', alias, channel, '→', objectType);

        modelOutputs.push({
            objectName: objectType,  // This should be the type like "RevDrvNew", not instance like "ProductRevenue"
            alias,
            channel,
            values: values as Float64Array
        });
    }

    console.log('[buildFinancialsHelper] Built', modelOutputs.length, 'model outputs');
    return buildFinancials(modelOutputs, months);
}
