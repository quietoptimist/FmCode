// @ts-nocheck
// objectSchema.mjs

export const objectSchema = {
  // ============================
  // QuantAnn — just creates numbers, no inputs
  // ============================
  QuantAnn: {
    impl: "QuantStart",
    showMonthlyAssumptions: false,  // Assumptions = outputs, no need to show both
    options: {
      modes: ['single', 'annual', 'growth'],
      start: true,
      smoothing: true,
      integers: true
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
            dateRange: false,
            seasonal: true,
            integers: true
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
            single: true,
            monthly: false,
            dateRange: false,
            annual: false,
            growth: false,
            smoothing: false
          },
          ui: {
            defaultMode: "single"
          }
        }
      ]
    }
  },

  // ============================
  // QuantAnnSeas — just creates numbers, no inputs, seasonal variation
  // ============================
  QuantAnnSeas: {
    impl: "QuantStart",
    showMonthlyAssumptions: false,  // Assumptions = outputs, no need to show both
    options: {
      modes: ['single', 'annual', 'growth'],
      start: true,
      smoothing: true,
      integers: true
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
            single: true,
            annual: true,
            monthly: true,
            smoothing: true,
            growth: true,
            dateRange: false,
            seasonal: true,
            integers: true
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
            single: true,
            monthly: false,
            dateRange: false,
            annual: false,
            growth: false,
            smoothing: false
          },
          ui: {
            defaultMode: "single"
          }
        }
      ]
    }
  },

  // ============================
  // QuantDrv → ScaleDrv impl
  // ============================
  QuantDrv: {
    impl: "ScaleDrv",
    showMonthlyAssumptions: true,  // Has driver inputs, show monthly assumptions
    options: {
      modes: ['single', 'annual', 'growth'],
      start: true,
      smoothing: true
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
            growth: true,      // 👈 enable growth/inflation here
            dateRange: false
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
            single: true,
            monthly: false,
            dateRange: false,
            annual: false,
            growth: false,
            smoothing: false
          },
          ui: {
            defaultMode: "single"
          }
        }
      ]
    }
  },

  // ============================
  // CostAnnSM — Creates costs, same as quantAnn
  // ============================
  CostAnnSM: {
    impl: "QuantStart",
    showMonthlyAssumptions: false,
    options: {
      modes: ['single', 'annual', 'growth'],
      start: true,
      smoothing: true
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
            growth: true,
            dateRange: false
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
            single: true,
            monthly: false,
            dateRange: false,
            annual: false,
            growth: false,
            smoothing: false
          },
          ui: {
            defaultMode: "single"
          }
        }
      ]
    }
  },


  // ============================
  // CostAnnGA — Creates costs, same as quantAnn
  // ============================
  CostAnnGA: {
    impl: "QuantStart",
    showMonthlyAssumptions: false,
    options: {
      modes: ['single', 'annual', 'growth'],
      start: true,
      smoothing: true
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
            smoothing: true,
            growth: true,     // you could turn this on if you want
            dateRange: false
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
            single: true,
            monthly: false,
            dateRange: false,
            annual: false,
            growth: false,
            smoothing: false
          },
          ui: {
            defaultMode: "single"
          }
        }
      ]
    }
  },

  // ============================
  // ScaleDrv — also a scaler
  // ============================
  ScaleDrv: {
    impl: "ScaleDrv",
    showMonthlyAssumptions: true,
    options: {
      modes: ['single', 'annual', 'growth'],
      start: true,
      smoothing: true
    },
    channels: {
      val: {
        label: "Value",
        destinations: []  // KPI or custom mapping
      }
    },
    assumptions: {
      object: [],               // leave empty for now
      output: [
        {
          name: "factor",
          label: "number per input",
          baseType: "number",
          format: "number",
          default: 1,
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true,
            growth: true,
            dateRange: false
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
            single: true,
            monthly: false,
            dateRange: false,
            annual: false,
            growth: false,
            smoothing: false
          },
          ui: {
            defaultMode: "single"
          }
        }
      ]
    }
  },

  // ============================
  // CostDrvDC — also a scaler
  // ============================
  CostDrvDC: {
    impl: "ScaleDrv",
    showMonthlyAssumptions: true,
    options: {
      modes: ['single', 'annual', 'growth'],
      start: true,
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
            growth: true,
            dateRange: false
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
            single: true,
            monthly: false,
            dateRange: false,
            annual: false,
            growth: false,
            smoothing: false
          },
          ui: {
            defaultMode: "single"
          }
        }
      ]
    }
  },

  // ============================
  // CostDrvSM — scalar with different financial destination
  // ============================
  CostDrvSM: {
    impl: "ScaleDrv",
    showMonthlyAssumptions: true,
    options: {
      modes: ['single', 'annual', 'growth'],
      start: true,
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
            growth: true,
            dateRange: false
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
            single: true,
            monthly: false,
            dateRange: false,
            annual: false,
            growth: false,
            smoothing: false
          },
          ui: {
            defaultMode: "single"
          }
        }
      ]
    }
  },

  // ============================
  // RevDrvNew — same scaling idea
  // ============================
  RevDrvNew: {
    impl: "ScaleDrv",
    showMonthlyAssumptions: true,
    options: {
      modes: ['single', 'annual', 'growth'],
      start: true,
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
            growth: true,        // inflation-like
            dateRange: false
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
            single: true,
            monthly: false,
            dateRange: false,
            annual: false,
            growth: false,
            smoothing: false
          },
          ui: {
            defaultMode: "single"
          }
        }
      ]
    }
  },

  // ============================
  // RevDrvNewDel — same as revDrv but will have different destinations
  // ============================
  RevDrvNewDel: {
    impl: "ScaleDrv",
    showMonthlyAssumptions: true,
    options: {
      modes: ['single', 'annual', 'growth'],
      start: true,
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
            growth: true,        // inflation-like
            dateRange: false
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
            single: true,
            monthly: false,
            dateRange: false,
            annual: false,
            growth: false,
            smoothing: false
          },
          ui: {
            defaultMode: "single"
          }
        }
      ]
    }
  },

  // ============================
  // RevDrv — recurring revenues
  // ============================
  RevDrv: {
    impl: "ScaleDrv",
    showMonthlyAssumptions: true,
    options: {
      modes: ['single', 'annual', 'growth'],
      start: true,
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
            growth: true,
            dateRange: false
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
            single: true,
            monthly: false,
            dateRange: false,
            annual: false,
            growth: false,
            smoothing: false
          },
          ui: {
            defaultMode: "single"
          }
        }
      ]
    }
  },

  // ============================
  // RevDrvDel — recurring revenues with a delay before cash in
  // ============================
  RevDrvDel: {
    impl: "ScaleDrv",
    showMonthlyAssumptions: true,
    options: {
      modes: ['single', 'annual', 'growth'],
      start: true,
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
            growth: true,
            dateRange: false
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
            single: true,
            monthly: false,
            dateRange: false,
            annual: false,
            growth: false,
            smoothing: false
          },
          ui: {
            defaultMode: "single"
          }
        }
      ]
    }
  },

  // ============================
  // RevDrvDCPrem — same as revDrv but will have different destinations
  // ============================
  RevDrvDCPrem: {
    impl: "ScaleDrv",
    showMonthlyAssumptions: true,
    options: {
      modes: ['single', 'annual', 'growth'],
      start: true,
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
          label: "Price / fee",
          baseType: "number",
          format: "currency",
          default: 50,
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true,
            growth: true,        // inflation-like
            dateRange: false
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
            single: true,
            monthly: false,
            dateRange: false,
            annual: false,
            growth: false,
            smoothing: false
          },
          ui: {
            defaultMode: "single"
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
      modes: ['single', 'annual'],
      start: true,
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
          name: "churnRate",
          label: "Monthly churn rate",
          baseType: "number",
          format: "percent",
          default: 0.08,
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true,
            growth: false,
            dateRange: false
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
            single: true,
            monthly: false,
            dateRange: false,
            annual: false,
            growth: false,
            smoothing: false
          },
          ui: {
            defaultMode: "single"
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
      modes: ['single']
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
            single: true,
            monthly: true,     // let the user have per-month delays later
            dateRange: false,
            annual: false,
            growth: false,
            smoothing: false
          },
          ui: {
            defaultMode: "single"
          }
        }
      ]
    }
  },

  // ============================
  // StaffDriven - teams of people with manually entered headcount and salary
  // ============================
  StaffDriven: {
    impl: "StaffDriven",
    showMonthlyAssumptions: true,
    options: {
      modes: ['single', 'annual'],
      start: true,
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
            dateRange: false,
            annual: true,
            growth: false,
            smoothing: true,
            integers: true,
            seasonal: false
          },
          ui: {
            defaultMode: "dateRange"
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
            dateRange: false,
            annual: true,
            growth: false,
            smoothing: true,
            integers: false,
            seasonal: false
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
            single: true,
            monthly: false,
            dateRange: false,
            annual: false,
            growth: false,
            smoothing: false
          },
          ui: {
            defaultMode: "single"
          }
        }
      ]
    }
  },

  // ============================
  // StaffTeams - teams of people with manually entered headcount and salary
  // ============================
  StaffTeam: {
    impl: "StaffTeam",
    showMonthlyAssumptions: true,
    options: {
      modes: ['single', 'annual'],
      start: true,
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
            dateRange: false,
            annual: true,
            growth: false,
            smoothing: true,
            integers: true,
            seasonal: true
          },
          ui: {
            defaultMode: "dateRange"
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
            dateRange: false,
            annual: true,
            growth: false,
            smoothing: true,
            integers: false,
            seasonal: false
          },
          ui: {
            defaultMode: "dateRange"
          }
        },
        {
          name: "start",
          label: "Start Month",
          baseType: "number",
          format: "integer",
          default: 1,
          supports: {
            single: true,
            monthly: false,
            dateRange: false,
            annual: false,
            growth: false,
            smoothing: false
          },
          ui: {
            defaultMode: "single"
          }
        }
      ]
    }
  },

  // ============================
  // StaffRoles - teams of people with manually entered headcount and salary
  // ============================
  StaffRole: {
    impl: "StaffRole",
    showMonthlyAssumptions: false,
    options: {
      modes: ['single', 'annual'],
      start: true,
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
            dateRange: false,
            annual: true,
            growth: false,
            smoothing: true,
            integers: true,
            seasonal: false
          },
          ui: {
            defaultMode: "dateRange"
          }
        },
        {
          name: "start",
          label: "Start Month",
          baseType: "number",
          format: "integer",
          default: 1,
          supports: {
            single: true,
            monthly: false,
            dateRange: false,
            annual: false,
            growth: false,
            smoothing: false
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
      modes: ['single']
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