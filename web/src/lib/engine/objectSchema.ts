// @ts-nocheck
// objectSchema.mjs

export const objectSchema = {
  // ============================
  // QuantAnn — just creates numbers, no inputs
  // ============================
  QuantAnn: {
    impl: "QuantStart",
    showMonthlyAssumptions: false,  // Assumptions = outputs, no need to show both
    channels: {
      val: { label: "Value" }
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
            dateRange: true,
            seasonal: true,
            integers: true
          },
          ui: {
            defaultMode: "annual"
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
    channels: {
      val: { label: "Monthly Quantity" }
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
            dateRange: true,
            seasonal: true,
            integers: true
          },
          ui: {
            defaultMode: "annual"
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
    channels: {
      val: { label: "Value" }
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
            dateRange: true
          },
          ui: {
            defaultMode: "annual"
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
    channels: {
      val: { label: "Value" }
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
            dateRange: true
          },
          ui: {
            defaultMode: "annual"
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
    channels: {
      val: { label: "Value" }
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
            dateRange: true
          },
          ui: {
            defaultMode: "annual"
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
    channels: {
      val: { label: "Value" }
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
            dateRange: true
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
    channels: {
      val: { label: "Cost" }
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
            dateRange: true
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
    channels: {
      val: { label: "Cost" }
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
            dateRange: true
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
    channels: {
      val: { label: "Revenue" }
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
            dateRange: true
          },
          ui: {
            defaultMode: "annual"
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
    channels: {
      val: { label: "Revenue" }
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
            dateRange: true
          },
          ui: {
            defaultMode: "annual"
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
    channels: {
      val: { label: "Revenue" }
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
            dateRange: true
          },
          ui: {
            defaultMode: "annual"
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
    channels: {
      val: { label: "Revenue" }
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
            dateRange: true
          },
          ui: {
            defaultMode: "annual"
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
    channels: {
      val: { label: "Revenue" }
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
            dateRange: true
          },
          ui: {
            defaultMode: "annual"
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
    channels: {
      act: { label: "Active customers" },
      chu: { label: "Churned customers" }
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
            growth: false,       // churn growth is weird — leave off
            dateRange: true
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
    channels: {
      val: { label: "Delayed value" }
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
  // Staff - delay revenue outputs to account for payment delays
  // ============================
  StaffRoles: {
    impl: "StaffRoles",
    showMonthlyAssumptions: true,
    channels: {
      cost: { label: "Staff Cost" },
      heads: { label: "Staff Heads" }
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
            dateRange: true,
            annual: true,
            growth: false,
            smoothing: false,
            seasonal: false
          },
          ui: {
            defaultMode: "dateRange"
          }
        },
        {
          name: "salary",
          label: "Staff Salary",
          baseType: "number",
          format: "currency",
          default: 5000,
          supports: {
            single: true,
            monthly: true,
            dateRange: true,
            annual: true,
            growth: false,
            smoothing: false,
            seasonal: false
          },
          ui: {
            defaultMode: "dateRange"
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
    channels: {
      val: { label: "Total" }
    },
    assumptions: {
      object: [],
      output: []
    }
  }
};