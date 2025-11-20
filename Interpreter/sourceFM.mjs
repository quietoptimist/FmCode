/** =============================
 * Quick sanity test (forward refs + spreads)
 * ============================== */
export const fmCode = `
// BusinessName: Numberly
// BusinessType: B2B services — AI-assisted financial modelling (clients via Upwork & Google Ads)
// DateTime: 2025-10-30

CustomerAcquisition:
    NewClients          = QuantAnn() => upworkNew, gadsNew          // Annual new clients by source (Upwork vs Google Ads)
    GadsClicks          = QuantDrv(gadsNew.val) => gadsClicks       // Google Ads clicks needed per new client (visitors per client)
Retention:
    Retained            = SubRetain(upworkNew.val, gadsNew.val) => upworkClients, gadsClients   // Retain clients by source: active & churn each month
InitialModelWork:
    ModelHrs            = QuantDrv(NewClients.val) => designCheckHrs, buildModelHrs, followupCallHrs // Hours per new client for review, build, and follow-up (hrs per client)
    AIInterview         = CostDrvDC(NewClients.val) => aiInterviewCost                               // Small inference cost per new client (direct cost)
AdvisoryWork:
    AdviceBuyers        = QuantDrv(...Retained.act) => upworkAdviceBuyers, gadsAdviceBuyers         // % of active clients buying advice each month
    AdviceHours         = QuantDrv(...AdviceBuyers.val) => upworkAdviceHrs, gadsAdviceHrs           // Hours per advice buyer
Revenues:
    InitialModelFees    = RevDrvNewDel(upworkNew.val, gadsNew.val) => upworkModelRev, gadsModelRev  // One-off initial model fees (invoiced; payment delay)
    AdviceRevenues      = RevDrvDel(upworkAdviceHrs.val, gadsAdviceHrs.val) => upworkAdviceRev, gadsAdviceRev // Recurring advisory revenues per hour (invoiced; payment delay)
    Collections         = DelRev(...InitialModelFees.rev, ...AdviceRevenues.rev) => paidUpworkModel, paidGadsModel, paidUpworkAdvice, paidGadsAdvice // Cash collections after delay

People:
//    ModellingTeam       = StaffDrvDC(ModelHrs.val) => modellingTeam               // Modelling team sized by total modelling hours demanded
//    AdvisoryTeam        = StaffDrvDC(AdviceHours.val) => advisoryTeam             // Advisory team sized by advice hours demanded
//    Management          = StaffRole() => founder1, founder2, assistant, uwBidder  // Founders, assistant, dedicated Upwork bidder
//    CompanyHeads        = Sum(ModellingTeam.heads, AdvisoryTeam.heads, Management.heads)            // Total company headcount across roles & teams

Costs:
    UpworkRevenueTotal  = Sum(upworkModelRev.rev, upworkAdviceRev.rev)            // Total Upwork-sourced revenues (initial + advisory)
    UpworkFees          = CostDrvSM(UpworkRevenueTotal.val) => upworkFees         // Upwork platform fee as % of revenues (10%)
    GoogleAdsCost       = CostDrvSM(gadsClicks.val) => googleAdsCpc               // Google Ads CPC cost driven by clicks
    MarketingAgency     = CostAnnSM() => gadsAgencyFee                            // Fixed monthly agency fee for Google Ads management
    Overheads           = CostAnnGA() => bookkeeping, accounting, insurance, officeConsumables // Predictable overheads (G&A)
`;
