// @ts-nocheck
// objectSchema.mjs

export const objectSchema = {
  // ============================
  // QuantAnn — just creates numbers, no inputs
  // ============================
  QuantAnn: {
    impl: "QuantStart",
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
          default: 10,
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true,
            growth: false,     // you could turn this on if you want,
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
  // QuantAnnSeas — just creates numbers, no inputs, seasonal variation
  // ============================
  QuantAnnSeas: {
    impl: "QuantStart",
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
          default: 10,
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true,
            growth: false,     // you could turn this on if you want
            dateRange: true,
            seasonal: true
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
    channels: {
      val: { label: "Value" }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "factor",
          label: "Driver factor",
          baseType: "number",
          default: 2,
          isRate: true,  // Don't divide by 12 - this is a monthly rate/multiplier
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
          default: 1000,
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true,
            growth: false,     // you could turn this on if you want
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
          default: 100,
          supports: {
            single: true,
            annual: true,
            monthly: true,
            smoothing: true,
            growth: false,     // you could turn this on if you want
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
  // CostDrvDC — also a scaler
  // ============================
  CostDrvDC: {
    impl: "ScaleDrv",
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
          default: 1,
          isRate: true,  // Don't divide by 12 - this is a monthly rate/cost
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
          default: 1,
          isRate: true,  // Dont divide by 12 - this is a monthly rate
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
          default: 50,
          isRate: true,  // Dont divide by 12 - this is a monthly rate
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
          default: 50,
          isRate: true,  // Dont divide by 12 - this is a monthly rate
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
    channels: {
      val: { label: "Revenue" }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "factor",
          label: "Rate per hour",
          baseType: "number",
          default: 100,
          isRate: true,  // Dont divide by 12 - this is a monthly rate
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
    channels: {
      val: { label: "Revenue" }
    },
    assumptions: {
      object: [],
      output: [
        {
          name: "factor",
          label: "Rate per hour",
          baseType: "number",
          default: 100,
          isRate: true,  // Dont divide by 12 - this is a monthly rate
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
  // SubRetain — multi-channel
  // ============================
  SubRetain: {
    impl: "SubRetain",
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
          default: 0.08,
          isRate: true,  // Rate/percentage - don't divide by 12
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
          default: 2,
          isRate: true, // Don't divide by 12 - this is a scalar (months)
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
  // StaffRoles - delay revenue outputs to account for payment delays
  // ============================
  StaffRoles: {
    impl: "StaffRoles",
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
          default: 1,
          isRate: true, // Don't divide by 12 - this is a scalar count
          supports: {
            single: false,
            monthly: false,
            dateRange: true,
            annual: false,
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
    channels: {
      val: { label: "Total" }
    },
    assumptions: {
      object: [],
      output: []
    }
  }
};