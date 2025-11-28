// @ts-nocheck
// objectSchema.mjs

export const objectSchema = {
  // ============================
  // Quant — just creates numbers, no inputs
  // ============================
  Quant: {
    impl: "QuantStart",
    showMonthlyAssumptions: false,  // Assumptions = outputs, no need to show both
    options: {
      single: true,
      monthly: false,
      annual: false,
      growth: false,
      dateRange: false,
      smoothing: false,
      integers: true,
      seasonal: false
    },
    channels: {
      val: {
        label: "Value",
        destinations: []  // Initial setup value
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "amount",
          label: "Monthly Quantity",
          baseType: "number",
          format: "integer",
          default: 10,
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true,
            growth: true,
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
  // QuantMth — just creates numbers, no inputs
  // ============================
  QuantMth: {
    impl: "QuantStart",
    showMonthlyAssumptions: false,  // Assumptions = outputs, no need to show both
    options: {
      single: false,
      monthly: true,
      annual: false,
      growth: false,
      dateRange: false,
      smoothing: false,
      integers: true,
      seasonal: false
    },
    channels: {
      val: {
        label: "Value",
        destinations: []  // Initial setup value
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "amount",
          label: "Monthly Quantity",
          baseType: "number",
          format: "integer",
          default: 10,
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true,
            growth: true,
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
  // QuantSeas — just creates numbers, no inputs, seasonal variation
  // ============================
  QuantSeas: {
    impl: "QuantStart",
    showMonthlyAssumptions: false,  // Assumptions = outputs, no need to show both
    options: {
      single: true,
      annual: false,
      monthly: true,
      growth: false,
      dateRange: false,
      smoothing: true,
      integers: true,
      seasonal: true
    },
    channels: {
      val: {
        label: "Monthly Quantity",
        destinations: []  // KPI or custom mapping
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "amount",
          label: "Monthly Quantity",
          baseType: "number",
          format: "integer",
          default: 10,
          supports: {
            single: false,
            annual: true,
            monthly: true,
            smoothing: true,
            growth: false,
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
        label: "Value",
        destinations: []  // Generic driver - mapping depends on usage context
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "factor",
          label: "# per input",
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
        label: "Value",
        destinations: []  // Generic driver - mapping depends on usage context
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "factor",
          label: "# per input",
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
  // CostSM — Creates costs, same as quantAnn
  // ============================
  CostSM: {
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
      val: {
        label: "Value",
        destinations: ["pnl.opex.sm", "cash.ops.out.opex"]  // Sales & marketing cost
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "amount",
          label: "Monthly Cost",
          baseType: "number",
          format: "currency",
          default: 1000,
          supports: {
            single: true,
            annual: true,
            monthly: true,
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
  // CostGA — Creates costs, same as quantAnn
  // ============================
  CostGA: {
    impl: "QuantStart",
    showMonthlyAssumptions: false,
    options: {
      single: true,
      annual: false,
      growth: false,
      seasonal: false,
      monthly: false,
      dateRange: false,
      smoothing: false
    },
    channels: {
      val: {
        label: "Value",
        destinations: ["pnl.opex.ga", "cash.ops.out.opex"]
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "amount",
          label: "Monthly amount",
          baseType: "number",
          format: "currency",
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
  // CostMulDC — also a scaler
  // ============================
  CostMulDC: {
    impl: "Multiply",
    showMonthlyAssumptions: true,
    options: {
      single: true,
      annual: false,
      growth: false,
      monthly: false,
      dateRange: true,
      smoothing: true
    },
    channels: {
      val: {
        label: "Cost",
        destinations: ["pnl.cogs.direct", "cash.ops.out.cogs"]  // KPI or custom mapping
      }
    },
    assumptions: {
      object: [],               // leave empty for now
      output: [
        {
          name: "factor",
          label: "Cost per unit",
          baseType: "number",
          format: "currency",
          default: 1,
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
  // CostMulSM — scalar with different financial destination
  // ============================
  CostMulSM: {
    impl: "ScaleDrv",
    showMonthlyAssumptions: true,
    options: {
      single: true,
      annual: false,
      growth: false,
      monthly: false,
      dateRange: true,
      smoothing: true
    },
    channels: {
      val: {
        label: "Cost",
        destinations: ["pnl.opex.sm", "cash.ops.out.opex"]  // KPI or custom mapping
      }
    },
    assumptions: {
      object: [],               // leave empty for now
      output: [
        {
          name: "factor",
          label: "Cost per unit",
          baseType: "number",
          format: "currency",
          default: 1,
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
  // RevMulNew — same scaling idea
  // ============================
  RevMulNew: {
    impl: "ScaleDrv",
    showMonthlyAssumptions: true,
    options: {
      single: true,
      annual: false,
      growth: false,
      monthly: false,
      dateRange: true,
      smoothing: true
    },
    channels: {
      val: {
        label: "Revenue",
        destinations: ["pnl.revenue.new", "cash.ops.in.sales"]
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "factor",
          label: "Price or fee",
          baseType: "number",
          format: "currency",
          default: 50,
          supports: {
            single: true,
            annual: true,
            monthly: true,
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
  // RevMulNewDel — same as revMul but will have different destinations
  // ============================
  RevMulNewDel: {
    impl: "ScaleDrv",
    showMonthlyAssumptions: true,
    options: {
      single: true,
      annual: false,
      growth: false,
      monthly: false,
      dateRange: true,
      smoothing: true
    },
    channels: {
      val: {
        label: "Revenue",
        destinations: ["pnl.revenue.new", "balance.assets.current.ar"]
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "factor",
          label: "Price or fee",
          baseType: "number",
          format: "currency",
          default: 50,
          supports: {
            single: true,
            annual: true,
            monthly: true,
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
  // RevMul — recurring revenues
  // ============================
  RevMul: {
    impl: "ScaleDrv",
    showMonthlyAssumptions: true,
    options: {
      single: true,
      annual: false,
      growth: false,
      monthly: false,
      dateRange: true,
      smoothing: true
    },
    channels: {
      val: {
        label: "Revenue",
        destinations: ["pnl.revenue.recur", "cash.ops.in.sales"]
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "factor",
          label: "Unit Price",
          baseType: "number",
          format: "currency",
          default: 100,
          supports: {
            single: true,
            annual: true,
            monthly: true,
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
  // RevMulDel — recurring revenues with a delay before cash in
  // ============================
  RevMulDel: {
    impl: "ScaleDrv",
    showMonthlyAssumptions: true,
    options: {
      single: true,
      annual: false,
      growth: false,
      monthly: false,
      dateRange: true,
      smoothing: true
    },
    channels: {
      val: {
        label: "Revenue",
        destinations: ["pnl.revenue.recur", "balance.assets.current.ar"]
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "factor",
          label: "Unit Price",
          baseType: "number",
          format: "currency",
          default: 100,
          supports: {
            single: true,
            annual: true,
            monthly: true,
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
  // SubRetain — multi-channel
  // ============================
  SubRetain: {
    impl: "SubRetain",
    showMonthlyAssumptions: true,
    options: {
      single: true,
      annual: false,
      monthly: false,
      dateRange: true,
      smoothing: true
    },
    channels: {
      act: {
        label: "Active Users",
        destinations: []
      },
      chu: {
        label: "Churned Users",
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
          default: 0.08,
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
  // DelRev - delay revenue outputs to account for payment delays
  // ============================
  DelRev: {
    impl: "Delay",
    showMonthlyAssumptions: true,
    options: {
      single: true
    },
    channels: {
      val: {
        label: "Delayed value",
        destinations: ["balance.assets.current.ar", "cash.ops.in.sales"]
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "delayMonths",
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
  // StaffDiv - teams of people driven by input activity and their productivity
  // ============================
  StaffDiv: {
    impl: "StaffDiv",
    showMonthlyAssumptions: true,
    options: {
      single: true,
      annual: false,
      monthly: false,
      dateRange: true,
      smoothing: true,
      integers: true
    },
    channels: {
      heads: {
        label: "Staff Heads",
        destinations: ["memo.headcount.cogs"]  // Map to appropriate team
      },
      cost: {
        label: "Staff Cost",
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
      dateRange: true,
      smoothing: true,
      integers: true,
      seasonal: true
    },
    channels: {
      heads: {
        label: "Staff Heads",
        destinations: ["memo.headcount.ga"]  // Map to appropriate team
      },
      cost: {
        label: "Staff Cost",
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
      dateRange: true,
      smoothing: true,
      integers: true
    },
    channels: {
      cost: {
        label: "Staff Cost",
        destinations: ["pnl.opex.ga", "cash.ops.out.opex"]
      },
      heads: {
        label: "Staff Heads",
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
    impl: "QuantPulse",
    showMonthlyAssumptions: false,
    options: {
      single: true,
      dateRange: false,
      smoothing: false,
      integers: false
    },
    channels: {
      val: {
        label: "Amount",
        destinations: ["cash.finance.in.equity"]
      },
      cum: {
        label: "Cumulative Amount",
        destinations: ["balance.equity.share"]
      }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "amount",
          label: "Amount",
          baseType: "number",
          format: "currency",
          default: 100000,
          supports: {
            single: true
          },
          ui: {
            defaultMode: "single"
          }
        },
        {
          name: "month",
          label: "Month",
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
        destinations: []  // Aggregator
      }
    },
    assumptions: {
      object: [],
      output: []
    }
  }
};