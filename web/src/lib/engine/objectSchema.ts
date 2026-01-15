// @ts-nocheck
// objectSchema.mjs

export const objectSchema = {
  // ============================
  // Setup & Funding (Boilerplate)
  // ============================
  FundEquity: {
    impl: "QuantStart",
    options: { single: true, monthly: true },
    channels: { val: { label: "Value", format: "currency" }, cum: { label: "Total Equity", format: "currency" } },
    assumptions: {
      object: [],
      output: [{ name: "value", label: "Equity Raised", baseType: "number", format: "price", default: 0, supports: { monthly: true, single: true } }]
    }
  },

  // ============================
  // Quant — just creates numbers, no inputs
  // ============================
  Quant: {
    impl: "QuantStart",
    showMonthlyAssumptions: false,  // Assumptions = outputs, no need to show both
    options: {
      // modes in dropdown menu with one of them set to true to indicate inital state when model is created
      single: true,
      monthly: false,
      annual: false,
      growth: false,
      // these control the option menu check boxes existence and initial state
      dateRange: false,
      smoothing: false,
      integers: true,
      seasonal: false
    },
    channels: {
      val: {
        label: "Value",
        format: "number",
        destinations: []  // Initial setup value
      },
      cum: {
        label: "Cumulative Value",
        format: "number",
        destinations: []  // Initial setup value
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "value",
          label: "Monthly Quantity",
          baseType: "number",
          format: "integer",
          default: 0,
          supports: {
            // modes in dropdown menu with one of them set to true to indicate inital state when model is created
            single: true,
            annual: true,
            monthly: true,
            growth: true,
            // if true, then this assumption will have the option of applying the adjustment when calculating monthly assumptions
            dateRange: true,
            smoothing: true,
            seasonal: true,
            integers: true
          }
        },
        {
          name: "start",
          label: "Start Month",
          baseType: "number",
          format: "integer",
          default: 1,
          supports: {
            single: true
          }
        },
        {
          name: "end",
          label: "End Month",
          baseType: "number",
          format: "integer",
          default: null,
          supports: {
            single: true
          }
        }
      ]
    }
  },





  // ============================
  // QuantMul → Multiply impl
  // ============================
  QuantMul: {
    impl: "Multiply",
    showMonthlyAssumptions: true,  // Has driver inputs, show monthly assumptions
    options: {
      single: true,
      annual: false,
      growth: false,
      monthly: false,
      seasonal: false,
      dateRange: false,
      smoothing: false
    },
    channels: {
      val: {
        label: "Quantity",
        format: "number",
        destinations: []  // Generic driver - mapping depends on usage context
      },
      cum: {
        label: "Cum Value",
        format: "number",
        destinations: []  // Initial setup value
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "factor",
          label: "Multiplier",
          baseType: "number",
          format: "decimal",
          default: 2,
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true,
            seasonal: true,
            growth: true
          },
          ui: {
            defaultMode: "annual"
          }
        },
        {
          name: "start",
          label: "Start Month",
          baseType: "number",
          format: "integer",
          default: 1,
          supports: {
            single: true
          }
        },
        {
          name: "end",
          label: "End Month",
          baseType: "number",
          format: "integer",
          default: null,
          supports: {
            single: true
          }
        }
      ]
    }
  },


  // ============================
  // QuantDiv → Divide input by assumption
  // ============================
  QuantDiv: {
    impl: "Divide",
    showMonthlyAssumptions: true,  // Has driver inputs, show monthly assumptions
    options: {
      single: true,
      annual: false,
      growth: false,
      monthly: false,
      seasonal: false,
      dateRange: false,
      smoothing: false
    },
    channels: {
      val: {
        label: "Quantity",
        format: "number",
        destinations: []  // Generic driver - mapping depends on usage context
      },
      cum: {
        label: "Cum Value",
        format: "number",
        destinations: []  // Initial setup value
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "factor",
          label: "Divisor",
          baseType: "number",
          format: "decimal",
          default: 2,
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true,
            seasonal: true,
            growth: true
          },
          ui: {
            defaultMode: "annual"
          }
        },
        {
          name: "start",
          label: "Start Month",
          baseType: "number",
          format: "integer",
          default: 1,
          supports: {
            single: true
          }
        },
        {
          name: "end",
          label: "End Month",
          baseType: "number",
          format: "integer",
          default: null,
          supports: {
            single: true
          }
        }
      ]
    }
  },

  // ============================
  // Cost — Creates recurring monthly costs (Base for variants)
  // ============================
  Cost: {
    impl: "QuantStart",
    showMonthlyAssumptions: false,
    options: {
      single: true,
      annual: false,
      growth: false,
      monthly: false,
      seasonal: false,
      dateRange: false,
      smoothing: false
    },
    channels: {
      cost: {
        label: "Value",
        format: "currency",
        destinations: ["pnl.opex.ga", "cash.ops.out.opex"] // Default to GA
      },
      cum: {
        label: "Cum Cost",
        format: "currency",
        destinations: []
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "cost",
          label: "Monthly amount",
          baseType: "number",
          format: "price",
          default: 100,
          supports: {
            single: true,
            annual: true,
            monthly: true,
            seasonal: true,
            smoothing: true,
            growth: true
          },
          ui: {
            defaultMode: "annual"
          }
        },
        {
          name: "start",
          label: "Start Month",
          baseType: "number",
          format: "integer",
          default: 1,
          supports: {
            single: true
          }
        },
        {
          name: "end",
          label: "End Month",
          baseType: "number",
          format: "integer",
          default: null,
          supports: {
            single: true
          }
        }
      ]
    }
  },

  // ============================
  // CostMul — Multiplies input by unit cost (Base for variants)
  // ============================
  CostMul: {
    impl: "Multiply",
    showMonthlyAssumptions: true,
    options: {
      single: true,
      annual: false,
      growth: false,
      monthly: false,
      dateRange: false,
      smoothing: true
    },
    channels: {
      cost: {
        label: "Cost",
        format: "currency",
        destinations: ["pnl.cogs.direct", "cash.ops.out.cogs"]  // Default to DC
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "cost",
          label: "Cost per unit",
          baseType: "number",
          format: "price",
          default: 5,
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true,
            growth: true
          },
          ui: {
            defaultMode: "single"
          }
        },
        {
          name: "start",
          label: "Start Month",
          baseType: "number",
          format: "integer",
          default: 1,
          supports: {
            single: true
          }
        },
        {
          name: "end",
          label: "End Month",
          baseType: "number",
          format: "integer",
          default: null,
          supports: {
            single: true
          }
        }
      ]
    }
  },

  // ============================
  // RevMul — recurring revenues
  // ============================
  RevMul: {
    impl: "Multiply",
    showMonthlyAssumptions: true,
    options: {
      single: true,
      annual: false,
      growth: false,
      monthly: false,
      seasonal: false,
      dateRange: false,
      smoothing: false
    },
    channels: {
      rev: {
        label: "Revenue",
        format: "currency",
        destinations: ["pnl.revenue.recur", "cash.ops.in.sales"]
      },
      cum: {
        label: "Cum Revenue",
        format: "currency",
        destinations: []
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "price",
          label: "Unit Price",
          baseType: "number",
          format: "price",
          default: 10,
          supports: {
            single: true,
            annual: true,
            growth: true,
            monthly: true,
            dateRange: true,
            seasonal: true,
            smoothing: true,
          },
          ui: {
            defaultMode: "annual"
          }
        },
        {
          name: "start",
          label: "Start Month",
          baseType: "number",
          format: "integer",
          default: 1,
          supports: {
            single: true
          }
        },
        {
          name: "end",
          label: "End Month",
          baseType: "number",
          format: "integer",
          default: null,
          supports: {
            single: true
          }
        }
      ]
    }
  },



  // ============================
  // SubRetain — multi-channel
  // ============================
  SubRetain: {
    impl: "SubRetain",
    showMonthlyAssumptions: true,
    options: {
      single: true,
      annual: false,
      monthly: false,
      dateRange: false,
      smoothing: true
    },
    channels: {
      act: {
        label: "Active Users",
        format: "integer",
        destinations: []
      },
      chu: {
        label: "Churned Users",
        format: "integer",
        destinations: []
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "churn",
          label: "Monthly churn rate",
          baseType: "number",
          format: "percent",
          default: 0.05,
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true
          },
          ui: {
            defaultMode: "single"
          }
        },
        {
          name: "start",
          label: "Start Month",
          baseType: "number",
          format: "integer",
          default: 1,
          supports: {
            single: true
          }
        },
        {
          name: "end",
          label: "End Month",
          baseType: "number",
          format: "integer",
          default: null,
          supports: {
            single: true
          }
        }
      ]
    }
  },

  // ============================
  // SubMth — subscribers with monthly recurring revenue
  // ============================
  SubMth: {
    impl: "SubMth",
    showMonthlyAssumptions: true,
    options: {
      single: true,
      annual: false,
      monthly: false,
      dateRange: false,
      smoothing: true
    },
    channels: {
      act: {
        label: "Active Users",
        format: "integer",
        destinations: []
      },
      chu: {
        label: "Churned Users",
        format: "integer",
        destinations: []
      },
      rev: {
        label: "Revenue",
        format: "currency",
        destinations: ["pnl.revenue.recur", "cash.ops.in.sales"]
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "price",
          label: "Monthly Price",
          baseType: "number",
          format: "price",
          default: 10,
          supports: {
            single: true,
            annual: true,
            monthly: true,
            dateRange: true,
            smoothing: true
          },
          ui: {
            defaultMode: "single"
          }
        },
        {
          name: "churn",
          label: "Monthly churn rate",
          baseType: "number",
          format: "percent",
          default: 0.05,
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true
          },
          ui: {
            defaultMode: "single"
          }
        },
        {
          name: "start",
          label: "Start Month",
          baseType: "number",
          format: "integer",
          default: 1,
          supports: {
            single: true
          }
        },
        {
          name: "end",
          label: "End Month",
          baseType: "number",
          format: "integer",
          default: null,
          supports: {
            single: true
          }
        }
      ]
    }
  },


  // ============================
  // SubTerm - Term subscriptions
  // ============================
  SubTerm: {
    impl: "SubTerm",
    showMonthlyAssumptions: false,
    options: {
      single: true,
      annual: false,
      monthly: false,
      dateRange: false,
      smoothing: true,
      integers: true
    },
    inputs: {
      newUsers: {
        label: "New Users",
        type: "series",
        description: "Number of new users acquired per month"
      }
    },
    channels: {
      rev: {
        label: "Revenue",
        format: "currency",
        description: "Recognised revenue (P&L)",
        destinations: ["pnl.revenue.recur"]
      },
      act: {
        label: "Active Contracts",
        format: "number",
        description: "Active contracts in month",
        destinations: []
      },
      chu: {
        label: "Churned Contracts",
        format: "number",
        description: "Non-renewing contracts at term end",
        destinations: []
      },
      invoice: {
        label: "Invoice Value",
        format: "currency",
        description: "Invoice value raised in the month",
        destinations: ["cash.ops.in.sales"]
      },
      defer: {
        label: "Deferred Revenue",
        format: "currency",
        description: "Deferred revenue balance at month end",
        destinations: ["balance.liabilities.current.accrued"]
      },
      billnum: {
        label: "Invoiced Count",
        format: "number",
        description: "Number of contracts invoiced in the month",
        destinations: []
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "price",
          label: "Monthly Price",
          baseType: "price",
          default: 10,
          description: "Revenue per user per month",
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true
          }
        },
        {
          name: "churn",
          label: "Term Churn %",
          baseType: "percentage",
          default: 0.2,
          description: "Churn rate applied at end of term",
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true
          }
        },
        {
          name: "term",
          label: "Term (Months)",
          baseType: "number",
          default: 12,
          description: "Contract term length (months)",
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true
          }
        },
        {
          name: "pay",
          label: "Pay Interval (Months)",
          baseType: "number",
          default: 1,
          description: "Payment interval in months",
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true
          }
        }
      ]
    }
  },

  // ============================
  // Del - delay outputs
  // ============================
  Del: {
    impl: "Delay",
    showMonthlyAssumptions: true,
    options: {
      single: true
    },
    channels: {
      val: {
        label: "Delayed value",
        format: "number",
        destinations: []
      },
      cum: {
        label: "Cum Value",
        format: "number",
        destinations: []  // Initial setup value
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "months",
          label: "Delay (months)",
          baseType: "number",
          format: "integer",
          default: 1,
          supports: {
            single: true
          },
          ui: {
            defaultMode: "single"
          }
        }
      ]
    }
  },

  // ============================
  // Adv - advance outputs (shift forward in time)
  // ============================
  Adv: {
    impl: "Advance",
    showMonthlyAssumptions: true,
    options: {
      single: true
    },
    channels: {
      val: {
        label: "Advanced value",
        format: "number",
        destinations: []
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "months",
          label: "Advance (months)",
          baseType: "number",
          format: "integer",
          default: 1,
          supports: {
            single: true
          },
          ui: {
            defaultMode: "single"
          }
        }
      ]
    }
  },

  // ============================
  // Ramp - ramp up values over time
  // ============================
  Ramp: {
    impl: "Ramp",
    showMonthlyAssumptions: true,
    options: {
      single: true,
      annual: false,
      monthly: false,
      smoothing: false
    },
    channels: {
      val: {
        label: "Ramped value",
        format: "number",
        destinations: []
      },
      mom: {
        label: "MoM Change",
        format: "percent",
        destinations: []
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "months",
          label: "Ramp Months",
          baseType: "number",
          format: "integer",
          default: 6,
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true
          },
          ui: {
            defaultMode: "single"
          }
        },
        {
          name: "startPerc",
          label: "Start %",
          baseType: "number",
          format: "percent",
          default: 0,
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true
          },
          ui: {
            defaultMode: "single"
          }
        }
      ]
    }
  },

  // ============================
  // StaffDiv - teams of people driven by input activity and their productivity
  // ============================
  StaffDiv: {
    impl: "StaffDiv",
    showMonthlyAssumptions: true,
    options: {
      single: true,
      annual: false,
      monthly: false,
      dateRange: false,
      smoothing: true,
      integers: true
    },
    channels: {
      heads: {
        label: "Staff Heads",
        format: "number",
        destinations: ["memo.headcount.cogs"]  // Map to appropriate team
      },
      cost: {
        label: "Staff Cost",
        format: "currency",
        destinations: ["pnl.cogs.direct", "cash.ops.out.cogs"]  // Map to appropriate category
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "productivity",
          label: "Productivity",
          baseType: "number",
          format: "number",
          default: 1000,
          supports: {
            single: true,
            monthly: true,
            annual: true,
            dateRange: true,
            smoothing: true,
            integers: true
          },
          ui: {
            defaultMode: "single"
          }
        },
        {
          name: "salary",
          label: "Average Salary",
          baseType: "number",
          format: "currency",
          default: 3000,
          supports: {
            single: true,
            monthly: true,
            annual: true,
            smoothing: true
          },
          ui: {
            defaultMode: "single"
          }
        },
        {
          name: "start",
          label: "Start Month",
          baseType: "number",
          format: "integer",
          default: 1,
          supports: {
            single: true
          }
        },
        {
          name: "end",
          label: "End Month",
          baseType: "number",
          format: "integer",
          default: null,
          supports: {
            single: true
          }
        }
      ]
    }
  },


  // ============================
  // StaffMul - teams of people driven by heads per location
  // ============================
  StaffMul: {
    impl: "StaffMul",
    showMonthlyAssumptions: true,
    options: {
      single: true,
      annual: false,
      monthly: false,
      dateRange: false,
      smoothing: true,
      integers: true
    },
    channels: {
      heads: {
        label: "Staff Heads",
        format: "number",
        destinations: ["memo.headcount.cogs"]  // Map to appropriate team
      },
      cost: {
        label: "Staff Cost",
        format: "currency",
        destinations: ["pnl.cogs.direct", "cash.ops.out.cogs"]  // Map to appropriate category
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "heads",
          label: "Heads per location",
          baseType: "number",
          format: "number",
          default: 1,
          supports: {
            single: true,
            monthly: true,
            annual: true,
            dateRange: true,
            smoothing: true,
            integers: true
          },
          ui: {
            defaultMode: "single"
          }
        },
        {
          name: "salary",
          label: "Average Salary",
          baseType: "number",
          format: "currency",
          default: 3000,
          supports: {
            single: true,
            monthly: true,
            annual: true,
            smoothing: true
          },
          ui: {
            defaultMode: "single"
          }
        },
        {
          name: "start",
          label: "Start Month",
          baseType: "number",
          format: "integer",
          default: 1,
          supports: {
            single: true
          }
        },
        {
          name: "end",
          label: "End Month",
          baseType: "number",
          format: "integer",
          default: null,
          supports: {
            single: true
          }
        }
      ]
    }
  },

  // ============================
  // StaffTeam - teams of people driven by heads per location
  // ============================
  StaffTeam: {
    impl: "StaffTeam",
    showMonthlyAssumptions: true,
    options: {
      single: true,
      annual: false,
      monthly: false,
      dateRange: false,
      smoothing: true,
      integers: true,
      seasonal: true
    },
    channels: {
      heads: {
        label: "Staff Heads",
        format: "number",
        destinations: ["memo.headcount.ga"]  // Map to appropriate team
      },
      cost: {
        label: "Staff Cost",
        format: "currency",
        destinations: ["pnl.opex.ga", "cash.ops.out.opex"]  // Map to appropriate category
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "headCount",
          label: "Staff Heads",
          baseType: "number",
          format: "number",
          default: 1,
          supports: {
            single: true,
            monthly: true,
            annual: true,
            dateRange: true,
            smoothing: true,
            integers: true,
            seasonal: true
          },
          ui: {
            defaultMode: "single"
          }
        },
        {
          name: "salary",
          label: "Average Salary",
          baseType: "number",
          format: "currency",
          default: 3000,
          supports: {
            single: true,
            monthly: true,
            annual: true,
            smoothing: true
          },
          ui: {
            defaultMode: "single"
          }
        },
        {
          name: "start",
          label: "Start Month",
          baseType: "number",
          format: "integer",
          default: 1,
          supports: {
            single: true
          }
        },
        {
          name: "end",
          label: "End Month",
          baseType: "number",
          format: "integer",
          default: null,
          supports: {
            single: true
          }
        }
      ]
    }
  },

  // ============================
  // StaffRole - individual roles with manually entered headcount and salary
  // ============================
  StaffRole: {
    impl: "StaffRole",
    showMonthlyAssumptions: false,
    options: {
      single: true,
      annual: false,
      monthly: false,
      dateRange: false,
      smoothing: true,
      integers: true
    },
    channels: {
      cost: {
        label: "Staff Cost",
        format: "currency",
        destinations: ["pnl.opex.ga", "cash.ops.out.opex"]
      },
      heads: {
        label: "Staff Heads",
        format: "number",
        destinations: ["memo.headcount.ga"]
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "salary",
          label: "Staff Salary",
          baseType: "number",
          format: "currency",
          default: 3000,
          supports: {
            single: true,
            monthly: true,
            annual: true,
            dateRange: true,
            smoothing: true,
            integers: true
          },
          ui: {
            defaultMode: "single"
          }
        },
        {
          name: "start",
          label: "Start Month",
          baseType: "number",
          format: "integer",
          default: 1,
          supports: {
            single: true
          }
        },
        {
          name: "end",
          label: "End Month",
          baseType: "number",
          format: "integer",
          default: null,
          supports: {
            single: true
          }
        }
      ]
    }
  },

  // ============================
  // FundEquity - Equity funding rounds
  // ============================
  FundEquity: {
    impl: "QuantStart",
    showMonthlyAssumptions: false,
    options: {
      monthly: true
    },
    channels: {
      val: {
        label: "Amount",
        format: "currency",
        destinations: ["cash.finance.in.equity"]
      },
      cum: {
        label: "Cumulative Amount",
        format: "currency",
        destinations: ["balance.equity.share"]
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "value",
          label: "Amount",
          baseType: "number",
          format: "currency",
          default: 0,
          supports: {
            monthly: true
          },
          ui: {
            defaultMode: "monthly"
          }
        }
      ]
    }
  },

  // ============================
  // FundDebt - Interest only debt funding
  // ============================
  FundDebt: {
    impl: "FundDebt",
    showMonthlyAssumptions: false,
    options: {
      single: true,
    },
    channels: {
      int: {
        label: "Interest Expense",
        format: "currency",
        destinations: ["pnl.interest"]
      },
      raised: {
        label: "Debt Raised",
        format: "currency",
        destinations: ["cash.finance.in.debt"]
      },
      repaid: {
        label: "Debt Repaid",
        format: "currency",
        destinations: ["cash.finance.out.debtRepay"]
      },
      bal: {
        label: "Debt Balance",
        format: "currency",
        destinations: []
      },
      debtMove: {
        label: "Net Debt Movement",
        format: "currency",
        destinations: ["balance.liabilities.longTerm.debt"]
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "startMonth",
          label: "Start Month",
          baseType: "number",
          format: "integer",
          default: 1,
          supports: {
            single: true
          },
          ui: {
            defaultMode: "single"
          }
        },
        {
          name: "amount",
          label: "Amount Borrowed",
          baseType: "number",
          format: "currency",
          default: 0,
          supports: {
            single: true
          },
          ui: {
            defaultMode: "single"
          }
        },
        {
          name: "rate",
          label: "Interest Rate (Monthly)",
          baseType: "number",
          format: "percent",
          default: 0.01,
          supports: {
            single: true
          },
          ui: {
            defaultMode: "single"
          }
        },
        {
          name: "term",
          label: "Term (Months)",
          baseType: "number",
          format: "integer",
          default: 24,
          supports: {
            single: true
          },
          ui: {
            defaultMode: "single"
          }
        }
      ]
    }
  },


  // ============================
  // CapexMth - Monthly Capex Spend
  // ============================
  CapexMth: {
    impl: "CapexMth",
    showMonthlyAssumptions: false,
    options: {
      single: true,
      annual: false,
      monthly: false,
      dateRange: false,
      smoothing: false,
      integers: false
    },
    channels: {
      val: {
        label: "Capex Spend",
        format: "currency",
        description: "Monthly capital expenditure",
        destinations: ["cash.invest.out.capex", "balance.assets.fixed.ppe"]
      },
      depr: {
        label: "Depreciation",
        format: "currency",
        description: "Monthly depreciation expense",
        destinations: ["pnl.da"]
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "capex",
          label: "Monthly Capex",
          baseType: "currency",
          default: 0,
          description: "Capital expenditure in this month",
          supports: {
            single: true,
            annual: true,
            dateRange: true,
            smoothing: true,
            integers: true
          }
        },
        {
          name: "life",
          label: "Useful Life (Months)",
          baseType: "number",
          default: 36,
          description: "Useful life for depreciation",
          supports: {
            single: true,
            annual: true,
            smoothing: true,
            integers: true
          }
        }
      ]
    }
  },


  // ============================
  // CapexProj - Project-based Capex
  // ============================
  CapexProj: {
    impl: "CapexProj",
    showMonthlyAssumptions: false,
    options: {
      single: true,
      annual: false,
      monthly: false,
      dateRange: false,
      smoothing: false,
      integers: true
    },
    inputs: {
      projects: {
        label: "New Projects",
        type: "series",
        description: "Number of new projects starting per month"
      }
    },
    channels: {
      val: {
        label: "Capex Spend",
        format: "currency",
        description: "Monthly capital expenditure",
        destinations: ["cash.invest.out.capex", "balance.assets.fixed.ppe"]
      },
      depr: {
        label: "Depreciation",
        format: "currency",
        description: "Monthly depreciation expense",
        destinations: ["pnl.da"]
      },
      proj: {
        label: "Committed Value",
        format: "currency",
        description: "Total committed capex per project start month",
        destinations: []
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "capex",
          label: "Total Capex",
          baseType: "currency",
          default: 10000,
          description: "Total capex per project",
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true
          }
        },
        {
          name: "delay",
          label: "Delay (Months)",
          baseType: "number",
          default: 0,
          description: "Spend start delay relative to project start",
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true
          }
        },
        {
          name: "span",
          label: "Span (Months)",
          baseType: "number",
          default: 1,
          description: "Duration of spend spreading (>= 1)",
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true
          }
        },
        {
          name: "life",
          label: "Useful Life (Months)",
          baseType: "number",
          default: 36,
          description: "Useful life for depreciation",
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true
          }
        }
      ]
    }
  },

  // ============================
  // CapexEquip - Equipment purchase based on demand
  // ============================
  CapexEquip: {
    impl: "CapexEquip",
    options: {
      single: true,
      annual: true,
      monthly: false,
      smoothing: true
    },
    channels: {
      val: {
        label: "Capex Spend",
        format: "currency",
        destinations: ["cash.invest.out.capex", "balance.assets.fixed.gross"]
      },
      depr: {
        label: "Depreciation",
        format: "currency",
        destinations: ["pnl.da", "balance.assets.fixed.accumDepreciation"]
      },
      nbuy: {
        label: "Units Purchased",
        format: "integer",
        destinations: []
      },
      nown: {
        label: "Units Owned",
        format: "integer",
        destinations: []
      },
      nsell: {
        label: "Units Retired",
        format: "integer",
        destinations: []
      },
      res: {
        label: "Residual Value",
        format: "currency",
        destinations: ["cash.invest.in.assetSale"]
      },
      writeOff: {
        label: "Asset Disposal (Cost)",
        format: "currency",
        destinations: ["balance.assets.fixed.gross"],
        hidden: true
      },
      accumWriteOff: {
        label: "Asset Disposal (Accum Depr)",
        format: "currency",
        destinations: ["balance.assets.fixed.accumDepreciation"],
        hidden: true
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "productivity",
          label: "Productivity (Units/Machine/Month)",
          baseType: "number",
          format: "integer",
          default: 100,
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true
          }
        },
        {
          name: "price",
          label: "Purchase Price",
          baseType: "number",
          format: "currency",
          default: 1000,
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true
          }
        },
        {
          name: "life",
          label: "Useful Life (Months)",
          baseType: "number",
          format: "integer",
          default: 36,
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true
          }
        },
        {
          name: "residual",
          label: "Residual Value",
          baseType: "number",
          format: "currency",
          default: 0,
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true
          }
        }
      ]
    }
  },

  // ============================
  // Spread - spread input over time
  // ============================
  Spread: {
    impl: "Spread",
    showMonthlyAssumptions: true,
    options: {
      single: true,
      annual: true,
      monthly: true,
      smoothing: true
    },
    channels: {
      val: {
        label: "Value",
        format: "number",
        destinations: []
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "months",
          label: "Duration (Months)",
          baseType: "number",
          format: "integer",
          default: 6,
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true
          },
          ui: {
            defaultMode: "single"
          }
        }
      ]
    }
  },

  // ============================
  // Split - split input across multiple outputs
  // ============================
  Split: {
    impl: "Multiply",
    showMonthlyAssumptions: true,
    options: {
      single: true,
      annual: true,
      smoothing: true
    },
    channels: {
      val: {
        label: "Value",
        format: "number",
        destinations: []
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "mix",
          label: "Mix %",
          baseType: "number",
          format: "percent",
          default: 1,
          supports: {
            single: true,
            annual: true,
            smoothing: true,
            totals: true
          },
          ui: {
            defaultMode: "single"
          }
        }
      ]
    }
  },


  // SupplyMths - Supply Chain with Lead Times and MOQs
  SupplyMths: {
    impl: "SupplyMths",
    showMonthlyAssumptions: false,
    options: {
      single: true,
      annual: false,
      monthly: false,
      dateRange: false,
      smoothing: false,
      integers: true
    },
    inputs: {
      demand: {
        label: "Monthly Demand",
        type: "series",
        description: "Monthly demand for the item (units)"
      }
    },
    channels: {
      cogs: {
        label: "COGS",
        format: "currency",
        description: "Cost of Goods Sold",
        destinations: ["pnl.cogs.direct"]
      },
      cost: {
        label: "Cash Outflow",
        format: "currency",
        description: "Cash outflow for purchases",
        destinations: ["cash.ops.out.cogs"]
      },
      nsell: {
        label: "Units Sold",
        format: "number",
        description: "Units sold (capped by inventory)",
        destinations: []
      },
      nbuy: {
        label: "Units Ordered",
        format: "number",
        description: "Units ordered",
        destinations: []
      },
      nrec: {
        label: "Units Received",
        format: "number",
        description: "Units received into inventory",
        destinations: []
      },
      ninvent: {
        label: "Ending Inventory (Units)",
        format: "number",
        description: "Units in inventory at month end",
        destinations: []
      },
      prepay: {
        label: "Prepayments",
        format: "currency",
        description: "Value of orders placed but not yet received",
        destinations: ["balance.assets.current.other"]
      },
      invent: {
        label: "Inventory Value",
        format: "currency",
        description: "Value of inventory at month end",
        destinations: ["balance.assets.current.inventory"]
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "inventory",
          label: "Target Inv (Months)",
          baseType: "percentage",
          default: 0.5,
          description: "Target inventory level as months of forward demand coverage",
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true
          }
        },
        {
          name: "cost",
          label: "Unit Cost",
          baseType: "price",
          default: 5,
          description: "Cost per unit",
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true
          }
        },
        {
          name: "leadTime",
          label: "Lead Time (Months)",
          baseType: "number",
          default: 1,
          description: "Lead time in months (>= 1)",
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true
          }
        },
        {
          name: "moq",
          label: "MOQ",
          baseType: "number",
          default: 10,
          description: "Minimum Order Quantity",
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true
          }
        },
        {
          name: "case",
          label: "Case Size",
          baseType: "number",
          default: 5,
          description: "Order multiple (step size)",
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true
          }
        }
      ]
    }

  },


  // ============================
  // Sum
  // ============================
  Sum: {
    impl: "Sum",
    showMonthlyAssumptions: false,  // Just sums inputs, no unique assumptions
    options: {
      single: true
    },
    channels: {
      val: {
        label: "Total",
        format: "number",
        destinations: []  // Aggregator
      }
    },
    assumptions: {
      object: [],
      output: []
    }
  }
};

// ==========================================
// Helper to create variants of existing objects
// ==========================================
function createVariant(base: any, overrides: any) {
  const merged = JSON.parse(JSON.stringify(base)); // Deep clone base

  // Helper to deep merge overrides
  function deepMerge(target: any, source: any) {
    for (const key in source) {
      if (source[key] instanceof Object && key in target && !Array.isArray(source[key])) {
        Object.assign(source[key], deepMerge(target[key], source[key]));
      }
    }
    Object.assign(target || {}, source);
    return target;
  }

  return deepMerge(merged, overrides);
}

// ==========================================
// Define Variants
// ==========================================

// QuantMth - Monthly Quant
(objectSchema as any).QuantMth = createVariant(objectSchema.Quant, {
  options: {
    single: false,
    monthly: true
  }
});

// QuantSeas - Seasonal Quant
(objectSchema as any).QuantSeas = createVariant(objectSchema.Quant, {
  options: {
    seasonal: true,
    smoothing: true
  }
});

// QuantMulSeas - Seasonal QuantMul
(objectSchema as any).QuantMulSeas = createVariant(objectSchema.QuantMul, {
  options: {
    seasonal: true
  }
});



// RevMulSeas - Seasonal Revenue
(objectSchema as any).RevMulSeas = createVariant(objectSchema.RevMul, {
  options: {
    seasonal: true
  }
});

// RevMulNew - New Revenue
(objectSchema as any).RevMulNew = createVariant(objectSchema.RevMul, {
  channels: {
    rev: { destinations: ["pnl.revenue.new", "cash.ops.in.sales"] }
  }
});

// RevMulDel - Delayed Revenue
(objectSchema as any).RevMulDel = createVariant(objectSchema.RevMul, {
  channels: {
    rev: { destinations: ["pnl.revenue.recur", "balance.assets.current.ar"] }
  }
});

// RevMulSeasDel - Seasonal Delayed Revenue
(objectSchema as any).RevMulSeasDel = createVariant(objectSchema.RevMul, {
  options: {
    seasonal: true
  },
  channels: {
    rev: { destinations: ["pnl.revenue.recur", "balance.assets.current.ar"] }
  }
});

// RevMulNewDel - New Delayed Revenue
(objectSchema as any).RevMulNewDel = createVariant(objectSchema.RevMul, {
  channels: {
    rev: { destinations: ["pnl.revenue.new", "balance.assets.current.ar"] }
  }
});



// CostMthGA - Monthly G&A Costs
(objectSchema as any).CostMthGA = createVariant(objectSchema.Cost, {
  options: {
    single: false,
    monthly: true
  },
  channels: {
    cost: { destinations: ["pnl.opex.ga", "cash.ops.out.opex"] }
  }
});

// CostMthSM - Monthly S&M Costs
(objectSchema as any).CostMthSM = createVariant(objectSchema.Cost, {
  options: {
    single: false,
    monthly: true
  },
  channels: {
    cost: { destinations: ["pnl.opex.sm", "cash.ops.out.opex"] }
  }
});

// CostMthRD - Monthly R&D Costs
(objectSchema as any).CostMthRD = createVariant(objectSchema.Cost, {
  options: {
    single: false,
    monthly: true
  },
  channels: {
    cost: { destinations: ["pnl.opex.rd", "cash.ops.out.opex"] }
  }
});

// CostMthOE - Monthly Other Expenses
(objectSchema as any).CostMthOE = createVariant(objectSchema.Cost, {
  options: {
    single: false,
    monthly: true
  },
  channels: {
    cost: { destinations: ["pnl.otherExpenses", "cash.ops.out.opex"] }
  }
});



// CostDC - Direct Costs
(objectSchema as any).CostDC = createVariant(objectSchema.Cost, {
  channels: {
    cost: { destinations: ["pnl.cogs.direct", "cash.ops.out.cogs"] }
  }
});

// CostSM - S&M Costs
(objectSchema as any).CostSM = createVariant(objectSchema.Cost, {
  channels: {
    cost: { destinations: ["pnl.opex.sm", "cash.ops.out.opex"] }
  }
});

// CostGA - G&A Costs
(objectSchema as any).CostGA = createVariant(objectSchema.Cost, {
  channels: {
    cost: { destinations: ["pnl.opex.ga", "cash.ops.out.opex"] }
  }
});

// CostRD - R&D Costs
(objectSchema as any).CostRD = createVariant(objectSchema.Cost, {
  channels: {
    cost: { destinations: ["pnl.opex.rd", "cash.ops.out.opex"] }
  }
});

// CostOE - Other Expenses
(objectSchema as any).CostOE = createVariant(objectSchema.Cost, {
  channels: {
    cost: { destinations: ["pnl.otherExpenses", "cash.ops.out.opex"] }
  }
});



// CostMulDC - Direct Costs (same as base)
(objectSchema as any).CostMulDC = createVariant(objectSchema.CostMul, {
  channels: {
    cost: { destinations: ["pnl.cogs.direct", "cash.ops.out.cogs"] }
  }
});

// CostMulSM - S&M Costs
(objectSchema as any).CostMulSM = createVariant(objectSchema.CostMul, {
  channels: {
    cost: { destinations: ["pnl.opex.sm", "cash.ops.out.opex"] }
  }
});

// CostMulGA - G&A Costs
(objectSchema as any).CostMulGA = createVariant(objectSchema.CostMul, {
  channels: {
    cost: { destinations: ["pnl.opex.ga", "cash.ops.out.opex"] }
  }
});

// CostMulRD - R&D Costs
(objectSchema as any).CostMulRD = createVariant(objectSchema.CostMul, {
  channels: {
    cost: { destinations: ["pnl.opex.rd", "cash.ops.out.opex"] }
  }
});



// StaffRoleDC - Direct Staff
(objectSchema as any).StaffRoleDC = createVariant(objectSchema.StaffRole, {
  channels: {
    cost: { destinations: ["pnl.cogs.direct", "cash.ops.out.cogs"] },
    heads: { destinations: ["memo.headcount.cogs"] }
  }
});

// StaffRoleGA - G&A roles
(objectSchema as any).StaffRoleGA = createVariant(objectSchema.StaffRole, {
  channels: {
    cost: { destinations: ["pnl.opex.ga", "cash.ops.out.opex"] },
    heads: { destinations: ["memo.headcount.ga"] }
  }
});

// StaffRoleSM - S&M roles
(objectSchema as any).StaffRoleSM = createVariant(objectSchema.StaffRole, {
  channels: {
    cost: { destinations: ["pnl.opex.sm", "cash.ops.out.opex"] },
    heads: { destinations: ["memo.headcount.sm"] }
  }
});

// StaffRoleRD - R&D roles
(objectSchema as any).StaffRoleRD = createVariant(objectSchema.StaffRole, {
  channels: {
    cost: { destinations: ["pnl.opex.rd", "cash.ops.out.opex"] },
    heads: { destinations: ["memo.headcount.rd"] }
  }
});



// StaffTeamDC - Direct Staff
(objectSchema as any).StaffTeamDC = createVariant(objectSchema.StaffTeam, {
  channels: {
    heads: { destinations: ["memo.headcount.cogs"] },
    cost: { destinations: ["pnl.cogs.direct", "cash.ops.out.cogs"] }
  }
});

// StaffTeamSM - S&M Staff
(objectSchema as any).StaffTeamSM = createVariant(objectSchema.StaffTeam, {
  channels: {
    heads: { destinations: ["memo.headcount.sm"] },
    cost: { destinations: ["pnl.opex.sm", "cash.ops.out.opex"] }
  }
});

// StaffTeamGA - G&A Staff
(objectSchema as any).StaffTeamGA = createVariant(objectSchema.StaffTeam, {
  channels: {
    heads: { destinations: ["memo.headcount.ga"] },
    cost: { destinations: ["pnl.opex.ga", "cash.ops.out.opex"] }
  }
});

// StaffTeamRD - R&D Staff
(objectSchema as any).StaffTeamRD = createVariant(objectSchema.StaffTeam, {
  channels: {
    heads: { destinations: ["memo.headcount.rd"] },
    cost: { destinations: ["pnl.opex.rd", "cash.ops.out.opex"] }
  }
});



// StaffMulDC - Direct Staff
(objectSchema as any).StaffMulDC = createVariant(objectSchema.StaffMul, {
  channels: {
    heads: { destinations: ["memo.headcount.cogs"] },
    cost: { destinations: ["pnl.cogs.direct", "cash.ops.out.cogs"] }
  }
});

// StaffMulSM - S&M Staff
(objectSchema as any).StaffMulSM = createVariant(objectSchema.StaffMul, {
  channels: {
    heads: { destinations: ["memo.headcount.sm"] },
    cost: { destinations: ["pnl.opex.sm", "cash.ops.out.opex"] }
  }
});

// StaffMulGA - G&A Staff
(objectSchema as any).StaffMulGA = createVariant(objectSchema.StaffMul, {
  channels: {
    heads: { destinations: ["memo.headcount.ga"] },
    cost: { destinations: ["pnl.opex.ga", "cash.ops.out.opex"] }
  }
});

// StaffMulRD - R&D Staff
(objectSchema as any).StaffMulRD = createVariant(objectSchema.StaffMul, {
  channels: {
    heads: { destinations: ["memo.headcount.rd"] },
    cost: { destinations: ["pnl.opex.rd", "cash.ops.out.opex"] }
  }
});



// StaffDivDC - Direct Staff
(objectSchema as any).StaffDivDC = createVariant(objectSchema.StaffDiv, {
  channels: {
    heads: { destinations: ["memo.headcount.cogs"] },
    cost: { destinations: ["pnl.cogs.direct", "cash.ops.out.cogs"] }
  }
});

// StaffDivSM - S&M Staff
(objectSchema as any).StaffDivSM = createVariant(objectSchema.StaffDiv, {
  channels: {
    heads: { destinations: ["memo.headcount.sm"] },
    cost: { destinations: ["pnl.opex.sm", "cash.ops.out.opex"] }
  }
});

// StaffDivGA - G&A Staff
(objectSchema as any).StaffDivGA = createVariant(objectSchema.StaffDiv, {
  channels: {
    heads: { destinations: ["memo.headcount.ga"] },
    cost: { destinations: ["pnl.opex.ga", "cash.ops.out.opex"] }
  }
});

// StaffDivRD - R&D Staff
(objectSchema as any).StaffDivRD = createVariant(objectSchema.StaffDiv, {
  channels: {
    heads: { destinations: ["memo.headcount.rd"] },
    cost: { destinations: ["pnl.opex.rd", "cash.ops.out.opex"] }
  }
});



// DelQuant - Delay Quantity (synonym for Del)
(objectSchema as any).DelQuant = createVariant(objectSchema.Del, {
  channels: {
    val: { destinations: [] }
  }
});

// DelRev - Delay Revenue
(objectSchema as any).DelRev = createVariant(objectSchema.Del, {
  channels: {
    val: { destinations: ["balance.assets.current.ar", "cash.ops.in.sales"] }
  }
});

// DelCost - Delay Cost
(objectSchema as any).DelCost = createVariant(objectSchema.Del, {
  channels: {
    val: { destinations: ["balance.liabilities.current.ap", "cash.ops.out.opex"] }
  }
});




// SubTermDel - Term subscriptions with delayed payment
(objectSchema as any).SubTermDel = createVariant(objectSchema.SubTerm, {
  channels: {
    invoice: {
      destinations: ["balance.assets.current.ar"]
    }
  }
});
