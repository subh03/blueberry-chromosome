# Lumino Industries Ltd - pre-event research

Prepared 2026-11-20 for VCH3 (21 Nov). Lumino has ONE problem statement, revealed at 10:00. Hiring brief from HACKATHON.md: "making every company function faster". Notes only, no code.
Rule used here: every fact has a link. Anything marked **ASSUMPTION** is our guess. Where two sources give different numbers, both are shown.

---

## TL;DR (read this first)

1. **What they are:** A Kolkata company that both **makes** aluminium conductors, power cables and house wire (2 plants in Howrah, 40,000 MT aluminium/yr) and **builds** power-grid projects as an EPC contractor (substations, 33/11 kV lines, underground cabling, HTLS re-conductoring). Listed on NSE/BSE on **3 Sep 2026** (₹700 cr IPO). FY26 revenue ₹2,041 cr, PAT ₹160 cr, ~890 permanent staff.
2. **Who pays them:** Mostly **state power distribution companies** (WBSEDCL, Purvanchal VVNL, Assam, Kashmir, UGVCL) via **tenders**. Top 10 customers = 80% of FY25 revenue.
3. **Their #1 business pain is cash, not orders.** Order book ₹3,093 cr + ₹555 cr where they are L1. Debtor days went 92 → 112 → 145 (FY24 to FY26, company's own number; Screener says 120 → 137 → 160). The MD says distribution-job payments "were pretty delayed". Management: "our focus remains on cash flow from operations".
4. **Why cash is slow (our read):** government payment chains run on paper. Site measurements (MB/JMR), RA bills, utility pre-dispatch inspections, test certificates and aluminium price-variation claims all have to be prepared, matched and approved. Any mismatch = bill sent back.
5. **Tech today:** SAP Business One (+ SAP Ariba signal), hired an **SAP Program Manager** for "digital transformation", hiring **10 Site Engineers - Planning**. No public AI work found. So: data exists in SAP + Excel + WhatsApp; little automation on top.
6. **Most likely problem-statement areas (ranked):** (1) site progress → measurement → RA bill, (2) tender/bid document reading and eligibility, (3) receivables / bill follow-up with discoms, (4) quality inspection + test-certificate paperwork, (5) order-to-dispatch planning incl. aluminium price-variation.
7. **Judges and Lumino will like:** works on a phone at a site with weak network, Hindi/Bengali, plugs into SAP B1/Excel exports, shows a **₹ or days saved** number (debtor days, bill cycle days, bid hours).

---

## 1. Company snapshot

| Item | Value | Source |
|---|---|---|
| Legal / listing | Lumino Industries Ltd, CIN U14293WB2005PLC102556; NSE: LUMINO, BSE: 544894; listed 3 Sep 2026 at ₹82 issue price (₹700 cr IPO: ₹500 cr fresh + ₹200 cr OFS), listed at 34% premium | [Bajaj Broking DRHP note](https://www.bajajbroking.in/blog/lumino-industries-ipo), [Chittorgarh](https://www.chittorgarh.com/ipo/lumino-industries-ipo/2013), [Financial Express](https://www.financialexpress.com/market/ipo-news-lumino-industries-makes-strong-debut-lists-at-34-premium-4331066) |
| HQ | Unit 12/4, Merlin Acropolis, 1858/1 Rajdanga Main Road, Kolkata 700107 | [luminoindustries.com/epc](https://luminoindustries.com/epc) |
| Age | "Legacy of over 30 years"; CB Insights says founded 1989; current company incorporated 2005 | [LinkedIn](https://in.linkedin.com/company/lumino-industries-limited), [CB Insights](https://www.cbinsights.com/company/lumino-industries) |
| FY26 (Mar 2026) | Revenue from ops ₹2,041 cr, EBITDA ₹239 cr, PAT ₹160 cr, borrowings ₹384 cr | [Prospectus](https://luminoindustries.com/pdf/prospectus.pdf), [Chittorgarh](https://www.chittorgarh.com/ipo/lumino-industries-ipo/2013) |
| Q2 FY27 (Jul-Sep 2026) | Revenue ₹661 cr (+30% YoY), EBITDA ₹84 cr (12.8%), PAT ₹53 cr; H1 revenue ₹1,183 cr | [BSE press release 4 Nov 2026](https://www.bseindia.com/xml-data/corpfiling/AttachLive/f6e7760f-bc4b-417a-9742-aa70b665f2d1.pdf) |
| Order book | ₹2,885 cr on 30 Sep (₹922 cr mfg, ₹1,963 cr EPC); ₹3,093 cr in Oct; L1 in ₹555 cr more | [BSE press release](https://www.bseindia.com/xml-data/corpfiling/AttachLive/f6e7760f-bc4b-417a-9742-aa70b665f2d1.pdf), [Q2 concall](https://www.youtube.com/watch?v=QAmn9eLYyp8) |
| People | 890 permanent employees (31 Mar 2026); third-party headcount ~866 | [Chittorgarh citing RHP](https://www.chittorgarh.com/ipo/lumino-industries-ipo/2013), [Tavily company record](https://tavily.com/knowledge/company/oPfw7X5Qmi8m) |
| Leadership | Purushottam Dass Goel (Chairman, founder), Devendra Goel (MD: marketing, finance, admin), Jay Goel (Whole-time Director), Hemant Bhuwania (CFO), Vivek Jain (Company Secretary) | [Board page](https://luminoindustries.com/board-members), [LinkedIn post](https://in.linkedin.com/company/lumino-industries-limited), [BSE filing](https://www.bseindia.com/xml-data/corpfiling/AttachLive/f6e7760f-bc4b-417a-9742-aa70b665f2d1.pdf) |
| Reach | Operations in 26 states + 4 UTs; exports to 17 countries | [Reg 30 intimation, Sep 2026](https://luminoindustries.com/wp-content/uploads/2026/09/Reg30Intimation.pdf) |

---

## 2. Business model

**Two engines, one company** ([Chittorgarh](https://www.chittorgarh.com/ipo/lumino-industries-ipo/2013), [luminoindustries.com](https://luminoindustries.com))

| Segment | What | FY26 share (segment reporting) |
|---|---|---|
| Manufacturing | Aluminium conductors (AAAC, ACSR, HTLS, AL-59), HT/LT power cables, control & railway signalling cables, solar cables, house wire (brand "Lumicon") | **68.1%** (FY25: 64.0%) |
| EPC | Power distribution & transmission, EHV substations, HTLS re-conductoring, underground cabling, railway electrification, solar, water management | **29.6%** (FY25: 34.5%) |

Source: [Prospectus, segment note](https://luminoindustries.com/pdf/prospectus.pdf). Note: before re-allocation, "EPC projects & services" billing was ₹946 cr vs ₹1,091 cr product supply in FY26; in FY25 EPC billing was larger (₹1,342 cr vs ₹571 cr). Their own factory supplies cable/conductor into their own EPC jobs ("cross-feeding"), which they say makes bids cheaper and faster ([Prospectus](https://luminoindustries.com/pdf/prospectus.pdf)). Product list from [LinkedIn](https://in.linkedin.com/company/lumino-industries-limited).

**Clients** ([Prospectus, top-10 table](https://luminoindustries.com/pdf/prospectus.pdf))
- FY26 named: West Bengal SEDCL (7.3%), Kashmir PDCL; others not named (no consent).
- FY25: Customer-1 23.3%, WBSEDCL 18.2%, Purvanchal VVNL (UP) 13.2%, Assam PDCL 5.7%, Kashmir PDCL 3.1%, Uttar Gujarat Vij 2.0%. Top 10 = 80.3%.
- Also supplies other EPC players (e.g., Kalpataru Projects in FY24) and foreign utilities in Mali, Burkina Faso, Côte d'Ivoire, Nepal, Bangladesh, Kenya, Ghana, Rwanda, Ethiopia, USA ([Chittorgarh](https://www.chittorgarh.com/ipo/lumino-industries-ipo/2013)). Ongoing EPC project in **Rwanda** ([Bajaj Broking](https://www.bajajbroking.in/blog/lumino-industries-ipo)).
- New: EHV substation order from Haryana Vidyut Prasaran Nigam ([Reg 30](https://luminoindustries.com/wp-content/uploads/2026/09/Reg30Intimation.pdf)).

**How they win work**
- Public **tenders** from state discoms / transcos; "L1" = lowest bidder ([Q2 concall](https://www.youtube.com/watch?v=QAmn9eLYyp8)). Many under central schemes like **RDSS** ([luminoindustries.com/epc](https://luminoindustries.com/epc): "household connections under various Central and State Government Schemes").
- Strategy shift: less low-level distribution work (slow payers), more EHV substations and HTLS where "payment terms are much better" ([MD on ET Now](https://www.youtube.com/watch?v=1J6UL8JzPpQ)). Target: manufacturing ≥70% of revenue ([Wegro concall summary](https://x.com/wegro_app/status/2120596549470491015)).
- Contracts carry **price-variation clauses** that pass aluminium/copper/steel price moves to the client ([Prospectus](https://luminoindustries.com/pdf/prospectus.pdf)), computed with **IEEMA formulas** using LME aluminium prices ([IEEMA PV page](https://ieema.org/pv-clauses-prices-indices)).

**Growth project:** Ranihati (Howrah) plant adds 35,000 MT in 3 phases (10,000 MT H2 FY27, ~11,000 MT Q3 FY28, ~14,000 MT Q1 FY29) → 75,000 MT; HT cables up to 66 kV; CCV line, "IoT-enabled systems, SCADA integration" ([Reg 30](https://luminoindustries.com/wp-content/uploads/2026/09/Reg30Intimation.pdf), [Wire & Cable India interview](https://www.wirecable.in/lumino-industries-3)). Investment quoted as ₹180 cr ([ScanX](https://scanx.trade/stock-market-news/companies/lumino-industries-q2fy27-results-net-profit-rises-51-yoy-5-302-lakh/55352657)) and ₹200 cr ([WCI](https://www.wirecable.in/lumino-industries-3)).

---

## 3. How their teams work today

Mostly **ASSUMPTION** built from industry sources; Lumino-specific facts are linked.

| Team | What they do day to day | Evidence |
|---|---|---|
| **Sales / tendering** | Watch GeM/CPPP/state portals; read NIT, technical spec, BOQ, eligibility; prepare technical + financial bids, EMD/bank guarantees; track L1 positions. Manufacturing order book turns in ~5-6 months, so they rebid constantly. | [Q2 concall](https://www.youtube.com/watch?v=VoimYrCdTB4) ("order book is normally about 5 to 6 month"), [TenderKosh](https://tenderkosh.com/about) ("too much time reading documents, checking eligibility, interpreting BOQs") |
| **Production** | Melt aluminium → rod → wire drawing → stranding (conductors) or insulation/armouring (cables). Plan by order, size, drum length. Shared lines between external orders and own EPC jobs. | [Prospectus](https://luminoindustries.com/pdf/prospectus.pdf) (2 plants, cross-feeding, WIP-heavy inventory) |
| **Quality** | In-house **NABL** lab for finished-product tests; ISO 9001/14001/45001. Utility or its third-party agency (TPQMA) does **pre-dispatch inspection** of cables/conductors before shipping. Type-test validity rules from CEA. | [Prospectus](https://luminoindustries.com/pdf/prospectus.pdf), [RDSS QA manual](https://www.scribd.com/document/716284294/QAM-RDSS), [CEA guideline](https://cea.nic.in/whats-new/file?path=%2Fhome%2Fcea_website%2Freports%2Fgeneral%2Fen%2FGuidelines_on_Type_Testy_Validity_and_MQAP_for_Comments_04_01_2022.pdf&mode=view) ("100% pre-dispatch inspections of all materials") |
| **Projects / sites** | Survey, design, erection of lines/substations across many states; daily progress reports; **joint measurement** with the utility's engineer; Measurement Book; **RA (running account) bills**. Hiring 10 Site Engineers - Planning (6-10 yrs, power transmission). | [luminoindustries.com/epc](https://luminoindustries.com/epc), [Facebook job post](https://www.facebook.com/groups/1725595507757310/posts/3923133848003454), [BuilderXPro RA bill flow](https://builderxpro.com/blog/construction-billing-ra-bills-guide) |
| **Procurement** | Buy aluminium (main input), steel, copper, XLPE, PVC; plus traded items for EPC (transformers, towers, breakers). Prices swing; PV clauses pass most of it on. Procurement roles visible (Senior Manager Procurement, Procurement Engineer). | [Prospectus](https://luminoindustries.com/pdf/prospectus.pdf), [RocketReach (directory)](https://rocketreach.co/lumino-industries-limited-profile_b44d3f49fd2fb2d4) |
| **Finance / collections** | Chase government payments, staggered EPC milestones, retention, PV claims, bank guarantees, working-capital loans. Receivables ₹895 cr at FY26. | [Prospectus risk factor 28](https://luminoindustries.com/pdf/prospectus.pdf) |
| **HR** | ~890 permanent + site staff across 26 states; Mon-Sat is the norm (84% of reviews). Head of HR & Admin listed on directory. | [Chittorgarh](https://www.chittorgarh.com/ipo/lumino-industries-ipo/2013), [AmbitionBox](https://ambitionbox.com/reviews/lumino-industries-reviews) |

---

## 4. Known operational problems (with evidence)

| # | Problem | Evidence |
|---|---|---|
| 1 | **Slow collections from government clients** | Debtor days 92 (FY24) → 112 (FY25) → 145 (FY26) "attributed to … delay in realisation from the government clients and … staggered payment terms" ([Prospectus](https://luminoindustries.com/pdf/prospectus.pdf)). Screener series: 120 → 137 → 160 ([Screener](https://www.screener.in/company/LUMINO/)). H1 FY27 reported improving to 123 ([Multibagg](https://www.multibagg.ai/market-pulse/articles/lumino-h1-net-cash-shift-ppt-cmw3h1p1o00hb2mphvw6dvpx0)). ₹6.4 cr receivables older than 3 years ([Prospectus](https://luminoindustries.com/pdf/prospectus.pdf)). |
| 2 | **Customer concentration on cash-strapped discoms** | Top 10 = 80% (FY25), >47% in earlier periods ([Prospectus](https://luminoindustries.com/pdf/prospectus.pdf), [Bajaj](https://www.bajajbroking.in/blog/lumino-industries-ipo)). RDSS: tendering, approvals, contracts named by Ministry of Power as delay reasons ([LinkedIn summary of MoP replies](https://www.linkedin.com/posts/saurabh-barange_rdss-smartmeters-discom-activity-7508389838652616704-T53A)). |
| 3 | **Working capital tied up in WIP inventory** | "Our need to maintain substantial inventories, primarily consisting of work-in-progress goods, could stress our working capital borrowings" ([Prospectus](https://luminoindustries.com/pdf/prospectus.pdf)). |
| 4 | **Volume dip; growth is mix-led** | H1 FY27 tonnage down ~13% while revenue +25% (third-party call summary, [ALFAFINDER](https://www.youtube.com/watch?v=HacOXHsZaoc)). 11-33 kV cables face price competition (same). |
| 5 | **Execution risk on new plant + abroad** | Ranihati ramp and Rwanda EPC flagged as risks ([Bajaj](https://www.bajajbroking.in/blog/lumino-industries-ipo)). |
| 6 | **Site safety and site staff morale** | Site engineer rating 2.4/5 (7 reviews); site reviews cite safety and pressure ([AmbitionBox](https://ambitionbox.com/reviews/lumino-industries-reviews/site-incharge)). |
| 7 | **Billing paperwork as industry-wide bottleneck** | RA bill stalls at measurement, technical check, budget, bank/GST mismatch ([DesiMachines](https://desimachines.com/blog/contractor-payment-delay-government-work)). Vendor survey of 120 contractors: avg 42 days site-to-payment, main hold-up = measurement-sheet discrepancies (**vendor claim**, [VAYUXI](https://www.vayuxierp.com/blog/streamlining-cpwd-form-23-measurement-sheets)). |

---

## 5. Tech and AI today

| Signal | Detail | Source |
|---|---|---|
| ERP | **SAP Business One** (B1). Job post: "manage and support SAP Business One (B1) and related SAP modules … aligning SAP capabilities with organizational goals for digital transformation" | [Jobaaj: SAP Program Manager, closed 10 Oct 2025](https://www.jobaaj.com/job/lumino-industries-limited-sap-program-manager-kolkata-west-bengal-6-to-10-years-900038) |
| Other detected tools | SAP Ariba, SCADA, PVsyst (solar design), SketchUp, Microsoft Office, SQL | [Tavily company record (tech detection, not confirmed by Lumino)](https://tavily.com/knowledge/company/oPfw7X5Qmi8m) |
| Factory 4.0 | New Ranihati plant: IoT-enabled systems, SCADA integration, "smart manufacturing" | [Wire & Cable India](https://www.wirecable.in/lumino-industries-3) |
| Hiring | Site Engineer - Planning ×10 (power transmission); Executive Accounts (HO, 5-7 yrs); past "Engineer (IT)" role | [Facebook post](https://www.facebook.com/groups/1725595507757310/posts/3923133848003454), [Expertini](https://kolkata.in.expertini.com/jobs/in/structural-design-engineer-kolkata-lumino-industries-limited/amp?page-no=4), [Indeed](https://www.indeed.com/cmp/Lumino-Industries-Ltd) |
| AI | **No public AI initiative found.** Their VCH3 hiring brief ("making every company function faster", [HACKATHON.md](../HACKATHON.md)) is the first AI signal. |
| **ASSUMPTION** | Real workflow = SAP B1 for accounts/inventory + Excel for tenders, PV calc, MIS + WhatsApp/email between sites and HO + paper MB/JMR signed with utility engineers. |

---

## 6. Real voices

Review sites blocked direct page reads; quotes below come from search-result snippets of those pages (short fragments).

| # | Who | Quote | Source |
|---|---|---|---|
| 1 | Devendra Goel, MD | "there the payments were pretty delayed and we have realized that we have taken a corrective measures" (on distribution jobs) | [ET Now, 9 Nov 2026](https://www.youtube.com/watch?v=1J6UL8JzPpQ) |
| 2 | Management, Q2 concall | "order booking is not a challenge … our focus remains on cash flow from operations" | [Q2 FY27 call](https://www.youtube.com/watch?v=VoimYrCdTB4) |
| 3 | Lumino prospectus | "Timely collection of trade receivables, particularly from government agencies and public sector undertakings, could be delayed beyond agreed timelines." | [Prospectus](https://luminoindustries.com/pdf/prospectus.pdf) |
| 4 | Site-incharge, AmbitionBox | staff at site "should forget his family"; company "very poor in safety" | [AmbitionBox site-incharge reviews](https://ambitionbox.com/reviews/lumino-industries-reviews/site-incharge) |
| 5 | Site engineer, Kolkata, AmbitionBox | "safety management should be stronger specially for site execution" | [AmbitionBox reviews](https://ambitionbox.com/reviews/lumino-industries-reviews) |
| 6 | Employee, Indeed | "No increment provision. Toxic management." | [Indeed management reviews](https://in.indeed.com/cmp/Lumino-Industries-Ltd/reviews?fcountry=ALL&ftopic=mgmt) |
| 7 | Employee, AmbitionBox (positive) | "Salary is consistently paid on time each month" (mentioned in 14 reviews) | [AmbitionBox salary reviews](https://www.ambitionbox.com/reviews/lumino-industries-salary-reviews-291504?page=2) |
| 8 | Industry (EPC billing) | "Nobody available to take joint measurement; entries disputed weeks later" | [DesiMachines](https://desimachines.com/blog/contractor-payment-delay-government-work) |
| 9 | Industry (tendering) | "EPC teams still spend too much time reading documents, checking eligibility, interpreting BOQs" | [TenderKosh](https://tenderkosh.com/about) (vendor) |
| 10 | Industry (EPC PM, LinkedIn) | "Monthly Progress Reports Are MPRs just paperwork, or can they become real-time dashboards" | [Sanjiva Kumar K](https://www.linkedin.com/posts/sanjiva-kumar-k-24264430_highway-epc-projects-in-india-lets-talk-activity-7468527060529967106-7LY-) |

Ratings: AmbitionBox 3.7/5 (400+ reviews); junior engineers rate job security 2.4/5 ([AmbitionBox](https://www.ambitionbox.com/reviews/lumino-industries-reviews/junior-engineer)). Glassdoor snippet: 2.7 work-life balance ([Glassdoor](https://www.glassdoor.com/Reviews/Lumino-Industries-Reviews-E3106415.htm)).

---

## 7. Likely problem-statement areas (ranked for a 6-hour build)

Ranking = how well it fits "make every company function faster" + evidence of pain + can be shown working in 5h45m.

| Rank | Area | Pain in one line | Evidence | Why it fits 6 hrs |
|---|---|---|---|---|
| **1** | **Site progress → measurement → RA bill** | Bills come back because site records and measurements don't match; cash waits weeks | Debtor days 145-160; "staggered payment terms against the supply in the EPC projects" ([Prospectus](https://luminoindustries.com/pdf/prospectus.pdf)); 10 planning site engineers being hired; RA stall table ([DesiMachines](https://desimachines.com/blog/contractor-payment-delay-government-work)) | Phone-first input (photo, voice) → structured record → bill draft. Easy to demo with fake BOQ. |
| **2** | **Tender / bid reading and eligibility** | Bid team reads 100s of pages of NIT, specs and BOQ per tender, often under deadline | Manufacturing book rolls every 5-6 months ([concall](https://www.youtube.com/watch?v=VoimYrCdTB4)); public tenders on GeM/state portals ([Tenderkart RDSS list](https://tenderkart.in/category/rdss-grid-epc/result)) | Public tender PDFs = ready dataset; LLM document Q&A is very demoable. Likely the "safest" statement. |
| **3** | **Receivables / bill follow-up with discoms** | Nobody sees, per bill, where it is stuck (which office, which document missing) | Receivables ₹895 cr; debtor-days story above; MD quote | Needs only a ledger CSV + document checklist; strong ₹ story for judges. |
| **4** | **Quality inspection + test-certificate paperwork** | Every lot needs inspection calls, routine test records and drum-level traceability before the utility releases it | NABL lab + utility pre-dispatch inspection ([Prospectus](https://luminoindustries.com/pdf/prospectus.pdf), [CEA](https://cea.nic.in/whats-new/file?path=%2Fhome%2Fcea_website%2Freports%2Fgeneral%2Fen%2FGuidelines_on_Type_Testy_Validity_and_MQAP_for_Comments_04_01_2022.pdf&mode=view)); traceability needs ([ECI](https://www.eci-wires.com/post/how-to-verify-cable-quality-before-your-order)) | Doc generation + checklist; good if they give sample test reports. |
| **5** | **Order-to-dispatch planning incl. aluminium price-variation (PV) bills** | Planning many sizes/drums across shared lines; monthly PV claims recomputed by hand from LME prices | WIP-heavy inventory risk; PV clauses in most contracts ([Prospectus](https://luminoindustries.com/pdf/prospectus.pdf)); IEEMA formula detail ([IEEMA](https://ieema.org/wp-content/uploads/2020/07/Cir_21_Amended-Aerial-Bunch-Cable-PVC.pdf)); Ranihati ramp | Harder to demo deeply without real data; PV calculator alone is small. |

Also possible but less likely: procurement (they already have SAP Ariba), HR/site safety reporting, export documentation.

**Root-cause note (product-brainstorming):** areas 1, 3 and 4 are the same chain. Cash is the symptom; the cause is that the evidence a government payer needs (measurement, inspection, test certificate, PV calc) is created in one place (site/factory) and checked in another (utility office), on paper, late. If the statement is vague ("make X faster"), aim at the hand-off where a document waits for someone.

---

## 8. Users and job titles who'd use a solution

| Area | Users | Notes |
|---|---|---|
| Sites | Site Engineer, Site Engineer - Planning, Site In-charge, Project Manager | Field, phone, Hindi/Bengali/local language, patchy network ([job post](https://www.facebook.com/groups/1725595507757310/posts/3923133848003454)) |
| Tendering | Tender Executive, Bid Manager, Estimation Engineer, Assistant Manager - Sales | **ASSUMPTION** on exact titles; "Assistant Manager - Sales" seen on [Naukri listing](https://www.naukri.com/lumino-industries-limited-jobs-571) |
| Finance | Executive (Accounts), CFO Hemant Bhuwania, billing/collections staff | [Expertini](https://kolkata.in.expertini.com/jobs/in/structural-design-engineer-kolkata-lumino-industries-limited/amp?page-no=4) |
| Plant | GM Works, Lab Manager, Supervisor, QA engineers, Asst. Store | Titles from [RocketReach](https://rocketreach.co/lumino-industries-limited-profile_b44d3f49fd2fb2d4) and [AmbitionBox role pages](https://ambitionbox.com/reviews/lumino-industries-reviews/lab-manager) |
| Procurement | Senior Manager Procurement, Procurement Engineer | [RocketReach](https://rocketreach.co/lumino-industries-limited-profile_b44d3f49fd2fb2d4) |
| Leadership | MD Devendra Goel ("responsible for increasing efficiency of operations") | [Board page](https://luminoindustries.com/board-members) |

---

## 9. Data they probably have (and what a dataset might look like)

All **ASSUMPTION** unless linked. If Lumino gives a dataset at 10:00, it is likely one of these.

| Data | Where it lives | Likely columns |
|---|---|---|
| Tender documents | Portal PDFs (NIT, technical spec, BOQ, GCC) | tender_id, utility, scheme (RDSS), item, qty, unit, eligibility (turnover, past work), EMD, due date |
| BOQ + site progress | Excel, WhatsApp photos, DPRs | project, package, location/feeder, BOQ item (e.g., 11 kV line km, DT installed), planned qty, executed qty, date, photo, engineer |
| Measurement Book / JMR | Paper signed by both sides | item, location, L/B/D or count, previous/current/cumulative, signatures |
| RA bills & receivables | SAP B1 + Excel | bill_no, project, client office, bill date, amount, retention, deductions, status, days pending |
| Production orders | SAP B1 | order_no, customer, product (ACSR "Dog", AAAC, XLPE 3C×300 mm² …), qty km/MT, drum lengths, line, due date |
| Test reports | NABL lab | drum_no, batch, conductor resistance, insulation resistance, HV test, dimensions, pass/fail |
| Inspection calls | Email/letters to utility/TPQMA | PO ref, lot, call date, inspector, inspection date, MDCC/release date |
| PV inputs | IEEMA circulars, LME prices | base price, base date, aluminium price (LME, Rs/MT), delivery month, factor ([IEEMA](https://ieema.org/pv-clauses-prices-indices)) |

Public stand-ins if no dataset: tender PDFs from state portals, IEEMA PV circulars, Lumino's own prospectus tables (top customers, receivables ageing).

---

## 10. Hidden expectations

- **Works for engineers on sites:** mobile, offline/low-bandwidth, photo + voice input, few taps. Site staff are stretched ([AmbitionBox](https://ambitionbox.com/reviews/lumino-industries-reviews/site-incharge)).
- **Government paperwork is the real "customer":** outputs must match utility formats (MB, JMR, RA bill, inspection call, MDCC). Fancy dashboards alone won't impress.
- **Cost / cash savings:** speak in **debtor days, ₹ cr unlocked, bill cycle days, bid hours**. With ₹895 cr receivables, even a few days matter (do the maths live, don't invent it here).
- **Indian languages:** sites in UP, Assam, Kashmir, Gujarat, Bengal + Africa (French/English). Hindi and Bengali at minimum; Sarvam credits available (HACKATHON.md).
- **Fits SAP B1 + Excel:** read an export, don't replace the ERP. They just invested in an SAP program manager.
- **Audit-safe:** listed company since Sep 2026; outputs need traceability (who entered what, when).
- **Multi-state, multi-client:** each discom has different formats and rules.

---

## 11. Five questions for the Lumino table (10:00-11:00)

1. "Which team loses the most hours each week to this problem, and who is the one person we should design for (site engineer, bid team, accounts)?"
2. "What does the data look like today: SAP B1 export, Excel, PDFs, WhatsApp? Can you share a sample or the column names?"
3. "Where exactly does a bill or bid get stuck today, and what is the one metric you'd use to say it's faster (days, hours, ₹)?"
4. "Should it work on a phone at a site with weak network, and in which languages (Hindi, Bengali, other)?"
5. "What would make you actually use this next week: plug into SAP, a WhatsApp flow, or a web tool for HO?"

---

## 12. Skills used

| Skill | Used? | What for |
|---|---|---|
| tavily-entity | Used | Identified the entity (luminoindustries.com + CIN + NSE: LUMINO); filled profile from prospectus, board page, Chittorgarh |
| tavily-research | Used (on my own, no subagents) | Industry ops: RDSS tenders, pre-dispatch inspection, RA bills/MB, IEEMA PV, bid prep |
| tavily-search | Used | Q2 FY27 results, Ranihati news, job posts (SAP PM, site engineers), reviews |
| last30days | Used, thin | Engine ran (Reddit, HN, Polymarket, GitHub); no item passed relevance, the 3 Reddit hits were off-topic. Fell back to tavily-search + WebSearch for AmbitionBox/Glassdoor/Indeed. No SSL errors; no browser login read. |
| WebSearch | Used, 3 queries | Gaps: AmbitionBox site-engineer reviews, Glassdoor, debtor-day numbers after Q2 |
| product-brainstorming | Used (problem-space only) | Ranked pains and 5 problem areas; root-cause chain in section 7. No solutions. |
| Skipped | - | None. Review pages (AmbitionBox, Glassdoor, Indeed) could not be read in full (fetch blocked), so quotes are snippet fragments. |
