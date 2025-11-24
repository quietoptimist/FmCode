/**
 * Financial Statements Schema
 * Defines the structure for P&L, Cash Flow, and Balance Sheet
 */

export interface FinancialLineItem {
    code: string;           // Unique identifier (e.g., "pnl.revenue.product")
    label: string;          // Display name
    level: number;          // Hierarchy depth (0=statement, 1=section, 2=subsection, 3=detail)
    sign: 1 | -1;          // Whether to add (1) or subtract (-1) when aggregating
    formula?: string;       // Optional calculation formula (e.g., "revenue.total - cogs.total")
    cumulative?: boolean;   // For balance sheet items - show running total
    collapsible?: boolean;  // Can this section be expanded/collapsed
    children?: string[];    // Codes of child items (for hierarchy)
}

export interface FinancialStatement {
    code: string;
    name: string;
    description: string;
    lineItems: FinancialLineItem[];
}

export interface FinancialTemplate {
    name: string;
    statements: {
        pnl: FinancialStatement;
        cash: FinancialStatement;
        balance: FinancialStatement;
        memo: FinancialStatement;     // For tracking items like payroll by team
    };
}

// =============================================================================
// Default Financial Template
// =============================================================================

export const defaultFinancialTemplate: FinancialTemplate = {
    name: "Standard",
    statements: {
        // =========================================================================
        // PROFIT & LOSS STATEMENT
        // =========================================================================
        pnl: {
            code: "pnl",
            name: "Profit & Loss",
            description: "Revenue and expenses",
            lineItems: [
                // Revenue Section
                { code: "pnl.revenue", label: "Revenue", level: 1, sign: 1, collapsible: true, children: ["pnl.revenue.new", "pnl.revenue.recur"] },
                { code: "pnl.revenue.new", label: "New Revenue", level: 2, sign: 1 },
                { code: "pnl.revenue.recur", label: "Recurring Revenue", level: 2, sign: 1 },
                { code: "pnl.revenue.total", label: "Total Revenue", level: 1, sign: 1, formula: "sum(pnl.revenue.*)" },

                // COGS Section
                { code: "pnl.cogs", label: "Cost of Goods Sold", level: 1, sign: -1, collapsible: true, children: ["pnl.cogs.direct"] },
                { code: "pnl.cogs.direct", label: "Direct Costs", level: 2, sign: 1 },
                { code: "pnl.cogs.total", label: "Total COGS", level: 1, sign: 1, formula: "sum(pnl.cogs.*)" },

                // Gross Profit
                { code: "pnl.grossProfit", label: "Gross Profit", level: 0, sign: 1, formula: "pnl.revenue.total - pnl.cogs.total" },

                // Operating Expenses
                { code: "pnl.opex", label: "Operating Expenses", level: 1, sign: -1, collapsible: true, children: ["pnl.opex.sm", "pnl.opex.ga", "pnl.opex.rd"] },
                { code: "pnl.opex.sm", label: "Sales & Marketing", level: 2, sign: 1 },
                { code: "pnl.opex.ga", label: "General & Administrative", level: 2, sign: 1 },
                { code: "pnl.opex.rd", label: "Research & Development", level: 2, sign: 1 },
                { code: "pnl.opex.total", label: "Total Operating Expenses", level: 1, sign: 1, formula: "sum(pnl.opex.*)" },

                // EBITDA
                { code: "pnl.ebitda", label: "EBITDA", level: 0, sign: 1, formula: "pnl.grossProfit - pnl.opex.total" },

                // Depreciation & Amortization
                { code: "pnl.da", label: "Depreciation & Amortization", level: 1, sign: -1 },

                // EBIT
                { code: "pnl.ebit", label: "EBIT", level: 0, sign: 1, formula: "pnl.ebitda - pnl.da" },

                // Other Income/Expenses
                { code: "pnl.otherIncome", label: "Other Income", level: 1, sign: 1 },
                { code: "pnl.otherExpenses", label: "Other Expenses", level: 1, sign: -1 },

                // Interest & Tax
                { code: "pnl.interest", label: "Interest Expense", level: 1, sign: -1 },
                { code: "pnl.tax", label: "Tax", level: 1, sign: -1 },

                // Net Income
                { code: "pnl.netIncome", label: "Net Income", level: 0, sign: 1, formula: "pnl.ebit + pnl.otherIncome - pnl.otherExpenses - pnl.interest - pnl.tax" }
            ]
        },

        // =========================================================================
        // CASH FLOW STATEMENT
        // =========================================================================
        cash: {
            code: "cash",
            name: "Cash Flow",
            description: "Cash movements",
            lineItems: [
                // Operating Activities
                { code: "cash.ops", label: "Operating Activities", level: 1, sign: 1, collapsible: true, children: ["cash.ops.in", "cash.ops.out"] },
                { code: "cash.ops.in", label: "Cash In", level: 2, sign: 1, collapsible: true, children: ["cash.ops.in.sales", "cash.ops.in.other"] },
                { code: "cash.ops.in.sales", label: "Sales Collections", level: 3, sign: 1 },
                { code: "cash.ops.in.other", label: "Other Operating Cash In", level: 3, sign: 1 },
                { code: "cash.ops.in.total", label: "Total Cash In", level: 2, sign: 1, formula: "sum(cash.ops.in.*)" },

                { code: "cash.ops.out", label: "Cash Out", level: 2, sign: -1, collapsible: true, children: ["cash.ops.out.cogs", "cash.ops.out.opex", "cash.ops.out.other"] },
                { code: "cash.ops.out.cogs", label: "COGS Payments", level: 3, sign: 1 },
                { code: "cash.ops.out.opex", label: "Operating Expense Payments", level: 3, sign: 1 },
                { code: "cash.ops.out.other", label: "Other Operating Cash Out", level: 3, sign: 1 },
                { code: "cash.ops.out.total", label: "Total Cash Out", level: 2, sign: 1, formula: "sum(cash.ops.out.*)" },

                { code: "cash.ops.total", label: "Net Operating Cash Flow", level: 1, sign: 1, formula: "cash.ops.in.total - cash.ops.out.total" },

                // Investing Activities
                { code: "cash.invest", label: "Investing Activities", level: 1, sign: 1, collapsible: true, children: ["cash.invest.in", "cash.invest.out"] },
                { code: "cash.invest.in", label: "Investment Cash In", level: 2, sign: 1, collapsible: true, children: ["cash.invest.in.assetSale"] },
                { code: "cash.invest.in.assetSale", label: "Asset Sales", level: 3, sign: 1 },
                { code: "cash.invest.in.total", label: "Total Investment Cash In", level: 2, sign: 1, formula: "sum(cash.invest.in.*)" },

                { code: "cash.invest.out", label: "Investment Cash Out", level: 2, sign: -1, collapsible: true, children: ["cash.invest.out.capex"] },
                { code: "cash.invest.out.capex", label: "Capital Expenditure", level: 3, sign: 1 },
                { code: "cash.invest.out.total", label: "Total Investment Cash Out", level: 2, sign: 1, formula: "sum(cash.invest.out.*)" },

                { code: "cash.invest.total", label: "Net Investing Cash Flow", level: 1, sign: 1, formula: "cash.invest.in.total - cash.invest.out.total" },

                // Financing Activities
                { code: "cash.finance", label: "Financing Activities", level: 1, sign: 1, collapsible: true, children: ["cash.finance.in", "cash.finance.out"] },
                { code: "cash.finance.in", label: "Financing Cash In", level: 2, sign: 1, collapsible: true, children: ["cash.finance.in.equity", "cash.finance.in.debt"] },
                { code: "cash.finance.in.equity", label: "Equity Raised", level: 3, sign: 1 },
                { code: "cash.finance.in.debt", label: "Debt Raised", level: 3, sign: 1 },
                { code: "cash.finance.in.total", label: "Total Financing Cash In", level: 2, sign: 1, formula: "sum(cash.finance.in.*)" },

                { code: "cash.finance.out", label: "Financing Cash Out", level: 2, sign: -1, collapsible: true, children: ["cash.finance.out.dividends", "cash.finance.out.debtRepay"] },
                { code: "cash.finance.out.dividends", label: "Dividends Paid", level: 3, sign: 1 },
                { code: "cash.finance.out.debtRepay", label: "Debt Repayment", level: 3, sign: 1 },
                { code: "cash.finance.out.total", label: "Total Financing Cash Out", level: 2, sign: 1, formula: "sum(cash.finance.out.*)" },

                { code: "cash.finance.total", label: "Net Financing Cash Flow", level: 1, sign: 1, formula: "cash.finance.in.total - cash.finance.out.total" },

                // Net Change in Cash
                { code: "cash.netChange", label: "Net Change in Cash", level: 0, sign: 1, formula: "cash.ops.total + cash.invest.total + cash.finance.total" },
                { code: "cash.balance", label: "Cash Balance", level: 0, sign: 1, cumulative: true, formula: "cash.netChange" }
            ]
        },

        // =========================================================================
        // BALANCE SHEET
        // =========================================================================
        balance: {
            code: "balance",
            name: "Balance Sheet",
            description: "Assets, liabilities, and equity",
            lineItems: [
                // Assets
                { code: "balance.assets", label: "Assets", level: 0, sign: 1, collapsible: true, children: ["balance.assets.current", "balance.assets.fixed"] },

                // Current Assets
                { code: "balance.assets.current", label: "Current Assets", level: 1, sign: 1, collapsible: true, children: ["balance.assets.current.cash", "balance.assets.current.ar", "balance.assets.current.inventory", "balance.assets.current.other"] },
                { code: "balance.assets.current.cash", label: "Cash", level: 2, sign: 1, cumulative: true },
                { code: "balance.assets.current.ar", label: "Accounts Receivable", level: 2, sign: 1, cumulative: true },
                { code: "balance.assets.current.inventory", label: "Inventory", level: 2, sign: 1, cumulative: true },
                { code: "balance.assets.current.other", label: "Other Current Assets", level: 2, sign: 1, cumulative: true },
                { code: "balance.assets.current.total", label: "Total Current Assets", level: 1, sign: 1, formula: "sum(balance.assets.current.*)", cumulative: true },

                // Fixed Assets
                { code: "balance.assets.fixed", label: "Fixed Assets", level: 1, sign: 1, collapsible: true, children: ["balance.assets.fixed.ppe", "balance.assets.fixed.intangible"] },
                { code: "balance.assets.fixed.ppe", label: "Property, Plant & Equipment", level: 2, sign: 1, cumulative: true },
                { code: "balance.assets.fixed.intangible", label: "Intangible Assets", level: 2, sign: 1, cumulative: true },
                { code: "balance.assets.fixed.total", label: "Total Fixed Assets", level: 1, sign: 1, formula: "sum(balance.assets.fixed.*)", cumulative: true },

                { code: "balance.assets.total", label: "Total Assets", level: 0, sign: 1, formula: "sum(balance.assets.*)", cumulative: true },

                // Liabilities
                { code: "balance.liabilities", label: "Liabilities", level: 0, sign: 1, collapsible: true, children: ["balance.liabilities.current", "balance.liabilities.longTerm"] },

                // Current Liabilities
                { code: "balance.liabilities.current", label: "Current Liabilities", level: 1, sign: 1, collapsible: true, children: ["balance.liabilities.current.ap", "balance.liabilities.current.accrued", "balance.liabilities.current.debtShort"] },
                { code: "balance.liabilities.current.ap", label: "Accounts Payable", level: 2, sign: 1, cumulative: true },
                { code: "balance.liabilities.current.accrued", label: "Accrued Expenses", level: 2, sign: 1, cumulative: true },
                { code: "balance.liabilities.current.debtShort", label: "Short-term Debt", level: 2, sign: 1, cumulative: true },
                { code: "balance.liabilities.current.total", label: "Total Current Liabilities", level: 1, sign: 1, formula: "sum(balance.liabilities.current.*)", cumulative: true },

                // Long-term Liabilities
                { code: "balance.liabilities.longTerm", label: "Long-term Liabilities", level: 1, sign: 1, collapsible: true, children: ["balance.liabilities.longTerm.debt"] },
                { code: "balance.liabilities.longTerm.debt", label: "Long-term Debt", level: 2, sign: 1, cumulative: true },
                { code: "balance.liabilities.longTerm.total", label: "Total Long-term Liabilities", level: 1, sign: 1, formula: "sum(balance.liabilities.longTerm.*)", cumulative: true },

                { code: "balance.liabilities.total", label: "Total Liabilities", level: 0, sign: 1, formula: "sum(balance.liabilities.*)", cumulative: true },

                // Equity
                { code: "balance.equity", label: "Equity", level: 0, sign: 1, collapsible: true, children: ["balance.equity.share", "balance.equity.retained"] },
                { code: "balance.equity.share", label: "Share Capital", level: 1, sign: 1, cumulative: true },
                { code: "balance.equity.retained", label: "Retained Earnings", level: 1, sign: 1, cumulative: true },
                { code: "balance.equity.total", label: "Total Equity", level: 0, sign: 1, formula: "sum(balance.equity.*)", cumulative: true },

                // Total Liabilities + Equity
                { code: "balance.total", label: "Total Liabilities & Equity", level: 0, sign: 1, formula: "balance.liabilities.total + balance.equity.total", cumulative: true }
            ]
        },

        // =========================================================================
        // MEMO ITEMS (Not part of financial statements but tracked separately)
        // =========================================================================
        memo: {
            code: "memo",
            name: "Memo Items",
            description: "Items tracked for reporting but not shown in main statements",
            lineItems: [
                // Payroll by Team
                { code: "memo.payroll", label: "Payroll Costs", level: 0, sign: 1, collapsible: true, children: ["memo.payroll.cogs", "memo.payroll.sm", "memo.payroll.ga", "memo.payroll.rd"] },
                { code: "memo.payroll.cogs", label: "COGS Team Payroll", level: 1, sign: 1 },
                { code: "memo.payroll.sm", label: "Sales & Marketing Team Payroll", level: 1, sign: 1 },
                { code: "memo.payroll.ga", label: "G&A Team Payroll", level: 1, sign: 1 },
                { code: "memo.payroll.rd", label: "R&D Team Payroll", level: 1, sign: 1 },
                { code: "memo.payroll.total", label: "Total Payroll", level: 0, sign: 1, formula: "sum(memo.payroll.*)" },

                // Headcount by Team
                { code: "memo.headcount", label: "Headcount", level: 0, sign: 1, collapsible: true, children: ["memo.headcount.cogs", "memo.headcount.sm", "memo.headcount.ga", "memo.headcount.rd"] },
                { code: "memo.headcount.cogs", label: "COGS Team Headcount", level: 1, sign: 1 },
                { code: "memo.headcount.sm", label: "Sales & Marketing Team Headcount", level: 1, sign: 1 },
                { code: "memo.headcount.ga", label: "G&A Team Headcount", level: 1, sign: 1 },
                { code: "memo.headcount.rd", label: "R&D Team Headcount", level: 1, sign: 1 },
                { code: "memo.headcount.total", label: "Total Headcount", level: 0, sign: 1, formula: "sum(memo.headcount.*)" }
            ]
        }
    }
};

// Helper function to find a line item by code
export function findLineItem(code: string, template: FinancialTemplate = defaultFinancialTemplate): FinancialLineItem | undefined {
    const [statement] = code.split('.');
    if (statement === 'pnl') return template.statements.pnl.lineItems.find(item => item.code === code);
    if (statement === 'cash') return template.statements.cash.lineItems.find(item => item.code === code);
    if (statement === 'balance') return template.statements.balance.lineItems.find(item => item.code === code);
    if (statement === 'memo') return template.statements.memo.lineItems.find(item => item.code === code);
    return undefined;
}

// Helper to get all leaf nodes (items that can receive data from model outputs)
export function getLeafLineItems(template: FinancialTemplate = defaultFinancialTemplate): FinancialLineItem[] {
    const allItems = [
        ...template.statements.pnl.lineItems,
        ...template.statements.cash.lineItems,
        ...template.statements.balance.lineItems,
        ...template.statements.memo.lineItems
    ];
    // Leaf items are those without formulas and without children
    return allItems.filter(item => !item.formula && !item.children);
}
