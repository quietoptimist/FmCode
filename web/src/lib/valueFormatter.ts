export function formatValue(value: number, format: string | undefined): string {
    if (value === undefined || value === null || isNaN(value)) return '';

    // Handle string format names
    switch (format) {
        case 'currency':
            // $ 2,345 (0 decimal places)
            return '$' + value.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        case 'price':
            // $ 9.99 (2 decimal places)
            return '$' + value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        case 'percent':
            // 12.3% (variable ? usually 0 or 1 is enough for display, but user usually wants to see precision if typed)
            // Let's stick to standard behavior: 
            return (value * 100).toFixed(1) + '%';
        case 'integer':
            return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
        default:
            // Generic number: clean simple display
            // If it's an integer, show no decimals. If float, show up to 2?
            return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
}
