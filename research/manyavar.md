# Manyavar (Vedant Fashions Ltd) - pre-event research

Prepared 2026-11-20 for VCH3 (21 Nov). Statements "Store Coach" and "Stock Mover" are revealed at 10:00. Notes only, no code.
Rule used here: every fact has a link. Anything marked **ASSUMPTION** is our guess. Where two sources give different numbers, both are shown.

---

## 12. TL;DR (read this first)

1. Vedant Fashions (VFL) is India's biggest wedding and celebration wear company: brands Manyavar, Mohey, Twamev, Mebaz, Manthan; ~650-670 stores, almost all **franchisee-owned**, fed from **one central warehouse in Kolkata**.
2. Growth has stalled: Q2 FY27 same-store sales **-5.8%**, store count shrinking, market cap down ~49% since listing. Management says the fix is **more new customers buying more**, better conversion and better staff.
3. They are already data/AI-heavy: auto-replenishment since 2008, **70-75% of inventory decisions are algorithm-driven**, an MCP server with ~85-100 crore data points, "VFL Brahma" AI data layer, and **AI cameras in stores** that flag weak stores for training.
4. So "Store Coach" most likely = help store staff/managers sell better (conversion, upsell, training, fixing weak stores). "Stock Mover" most likely = the **25-30% of stock decisions the algorithm doesn't handle**: moving slow stock between stores, filling size gaps fast, and killing dead stock before it ages.
5. Judges will value: a real business number (conversion %, sell-through %, dead stock), fit with a franchise model, works at 650 stores, Hindi/regional language, and something that plugs into what they already have (ERP, POS, Claude/MCP).

---

## 1. Company snapshot

| Item | Value | Source |
|---|---|---|
| Legal name / ticker | Vedant Fashions Ltd, NSE: MANYAVAR, BSE: 543463 | [Screener](https://www.screener.in/company/MANYAVAR) |
| HQ | Kolkata (Paridhan Garment Park, Canal South Road) | [Tracxn](https://tracxn.com/d/legal-entities/india/vedant-fashions-limited/__yIxRKW3E36bsDedM4_9rnU6ZSQQZkzWubCVtEle6Gjk) |
| Started | Manyavar 1999 (predecessor), company 2002, first store 2008 (Bhubaneswar) | [VFL About](https://ftp.vedantfashions.com/about-us) |
| FY26 revenue / PAT | ₹1,435.48 cr / ₹375.54 cr | [LeadIQ citing FY26 audited results](https://leadiq.com/c/vedant-fashions-limited---manyavar-mohey/5a1d7da024000024005721e3), [FreePressJournal](https://www.freepressjournal.in/business/vedant-fashions-q4-profit-rises-13-to-114-crore-fy26-revenue-crosses-1435-crore) |
| FY26 retail sales (what end customers paid) | crossed ₹2,000 cr (+6.1%), SSSG +2.7%, gross margin 65.7% | [Investor presentation Q4 FY26](https://vedantfashions.com/wp-content/uploads/2026/05/IntimationofInvestorPresentation31032026-1.pdf) |
| Stores | FY26: 652 EBOs in 240 Indian cities (incl. 144 shop-in-shops) + 17 overseas; 1.79 mn sq ft. ET counts 497 EBOs in Sep 2026 vs 508 a year before (likely excludes SIS) | [Investor presentation](https://vedantfashions.com/wp-content/uploads/2026/05/IntimationofInvestorPresentation31032026-1.pdf), [ET](https://m.economictimes.com/industry/cons-products/fashion-/-cosmetics-/-jewellery/manyavar-maker-vedant-fashions-struggles-to-revive-growth-as-same-store-sales-drop-5-8-in-q2/articleshow/135719272.cms) |
| Latest quarter (Q2 FY27, Jul-Sep 2026) | Customer sales ₹351.5 cr (+0.6%), revenue ₹269.4 cr (+2.4%), SSSG -5.8% | [InvestyWise call summary](https://www.investywise.com/vedant-fashions-limited-earnings-conference-call-transcript-q2-fy27), [ScanX](https://scanx.trade/stock-market-news/companies/vedant-fashions-q2-results-net-profit-rises-562-2m-rupees-yoy/55426927), [ET](https://m.economictimes.com/industry/cons-products/fashion-/-cosmetics-/-jewellery/manyavar-maker-vedant-fashions-struggles-to-revive-growth-as-same-store-sales-drop-5-8-in-q2/articleshow/135719272.cms) |
| Leadership | Ravi Modi (Chairman & MD, founder), Shilpi Modi (Whole-time Director, product/design), Vedant Modi (Chief Revenue Officer, MSc Data Science UCL), Rahul Murarka (CFO), Aman Kumar Gupta (Chief Retail Officer, ex-Levi's) | [Board page](https://www.vedantfashions.com/investors-category/corporate-governance/board-of-directors), [Marwar](https://www.marwar.com/made-in-manyavar.php), [Investing.com Q1 FY27 call](https://www.investing.com/news/transcripts/earnings-call-transcript-vedant-fashions-posts-mixed-q1-2026-results-as-sales-beat-93CH-4813523), [LinkedIn / Images Group](https://www.linkedin.com/posts/r-s-roy_vedantfashions-manyavar-retailleadership-activity-7395825677981110272-6DQU) |
| Employees | ~2,770 (Revelio, Jun 2026). Tracxn says 482 (likely only company payroll; franchise store staff are not VFL employees - **ASSUMPTION**) | [Revelio](https://www.reveliolabs.com/companies/vedant-fashions/employees), [Tracxn](https://tracxn.com/d/legal-entities/india/vedant-fashions-limited/__yIxRKW3E36bsDedM4_9rnU6ZSQQZkzWubCVtEle6Gjk) |
| Market cap | ₹11,597 cr (Nov 2026), ~49% below listing | [ET](https://m.economictimes.com/industry/cons-products/fashion-/-cosmetics-/-jewellery/manyavar-maker-vedant-fashions-struggles-to-revive-growth-as-same-store-sales-drop-5-8-in-q2/articleshow/135719272.cms) |

---

## 2. Business model

**Brands** ([investor presentation](https://vedantfashions.com/wp-content/uploads/2026/05/IntimationofInvestorPresentation31032026-1.pdf), [2023 presentation](https://www.vedantfashions.com/wp-content/uploads/2024/04/VFLInvestorPresentation28012023.pdf))

| Brand | Who | Position |
|---|---|---|
| Manyavar | Men, boys | Mid-premium; category leader; kurta, sherwani, indo-western, jacket |
| Mohey | Women | Bridal/celebration; "largest brand by number of stores" in its space; now expanding beyond bridal ([ScanX](https://scanx.trade/stock-market-news/earnings/vedant-fashions-reports-4-6-growth-in-q2-despite-gst-transition-challenges/23993575)) |
| Twamev | Men | Premium, priced between Manyavar and luxury boutiques; own EBOs since FY25 |
| Mebaz | Family | South India (AP & Telangana) heritage brand, acquired 2017 |
| Manthan | Value | Mid-market weddings, value prices |
| Diwas | Festive | Newer celebration-wear label ([Diwas site](https://www.diwasfashion.com/en-in/exchange-policy.html)) |

**Franchise vs own stores**
- Converted to almost fully **FOFO (franchise-owned, franchise-operated)** by 2016-17. VFL does design, marketing and supply chain; franchisee runs the store ([Dhruva Pandey Substack quoting Ravi Modi](https://dhruva.substack.com/p/manyavar-vedant-fashion-ltd)).
- Franchisee gets a **commission on MRP: 29.5% for FOFO, 18.5% for COFO** (2017 term sheet) ([Scribd](https://www.scribd.com/document/450411129/Franchise-Terms-Manyavar-29-5-w-e-f-1st-July-2017), [Markhub24](https://www.markhub24.com/post/manyavar-s-premium-ethnic-wear-brand-positioning)).
- 300+ franchisees (Sep 2021); payback ~3-3.5 years; top 5 franchisees = 27-36% of customer sales (FY19-Q1FY22) ([Substack](https://dhruva.substack.com/p/manyavar-vedant-fashion-ltd), [DRHP](https://www.axiscapital.co.in/contents/Vedant-Fashions-Limited-DRHP.pdf)).
- Shop-in-shops (SIS) are being moved back to multi-brand outlets as part of a "footprint correction" ([Yahoo Q2 FY26 call](https://finance.yahoo.com/news/vedant-fashions-ltd-bom-543463-190029120.html)).

**How money is made**
- Two numbers: "retail sales / customer sales" (what shoppers pay in stores) and "revenue from operations" (what VFL books). Gap between them comes from inventory movement and dispatch timing ([Yahoo Q2 FY26 call](https://finance.yahoo.com/news/vedant-fashions-ltd-bom-543463-190029120.html)).
- **No discounts, no end-of-season sale** for Manyavar, same price online and offline ([investor presentation](https://vedantfashions.com/wp-content/uploads/2025/05/VFL_Investor-Presentation_Q4-and-FY25.pdf)). This is why dead stock hurts more: they cannot clear it with a sale.
- Channels: EBOs (>90% of customer sales in FY21), MBOs, large format stores, own site, marketplaces ([DRHP via tavily-research](https://www.bseindia.com/corporates/download/324807/DRHP_20210913151318.pdf)).

**Customer segments**: grooms and wedding families (group buying), festive buyers, women's bridal (Mohey), premium men (Twamev), value buyers (Manthan), NRIs (stores in USA, UAE, Canada, UK, Australia). Loyalty programme "Manyavar Celebration Club" just launched ([InvestyWise](https://www.investywise.com/vedant-fashions-limited-earnings-conference-call-transcript-q2-fy27)).

**Seasonality**
- Q3 (Oct-Dec: festive + wedding season) is the peak; Q4 FY26 revenue was ~19% below Q3 ([tavily-research summary of CNBC/FPJ](https://www.freepressjournal.in/business/vedant-fashions-q4-profit-rises-13-to-114-crore-fy26-revenue-crosses-1435-crore)).
- Wedding dates ("muhurat") drive demand **by region and by week**. Example: AP/Telangana had wedding dates in Q2 last year, none this year ([Multibagg concall](https://www.multibagg.ai/market-pulse/articles/vedant-fashions-rivals-begin-consolidating-concall-cmwdhhclp009a2dqp1a6nvyvd)).
- Navratri moved from Sep to Oct: "The best 10 days were replaced by almost the worst 10 days" ([ET](https://m.economictimes.com/industry/cons-products/fashion-/-cosmetics-/-jewellery/manyavar-maker-vedant-fashions-struggles-to-revive-growth-as-same-store-sales-drop-5-8-in-q2/articleshow/135719272.cms)).

---

## 3. Store operations today

**Who works in a store** (from salary data on [AmbitionBox](https://ambitionbox.com/reviews/manyavar-and-mohey-reviews))

| Role | Pay (AmbitionBox) |
|---|---|
| Store Manager | ₹3.4-5.1 L/yr |
| Branch / Retail Store Manager | ₹2.9-5.3 L/yr |
| Salesman / Sales Executive | ₹2.4-3.4 L/yr |
| Cashier | ₹1.9-2.2 L/yr |
| Tailor / alteration staff | Not found. **ASSUMPTION**: stores have alteration staff or a tie-up, since fitting is part of the pitch ([Manyavar sherwani guide](https://www.manyavar.com/en-in/blog-sherwani-shopping-guide-craftsmanship-fabric-fit.html)) |

- Above store level: Area/Regional managers (**ASSUMPTION**, standard for chains; not confirmed), new Chief Retail Officer for retail ops and franchising ([LinkedIn](https://www.linkedin.com/posts/r-s-roy_vedantfashions-manyavar-retailleadership-activity-7395825677981110272-6DQU)).
- Staff are hired by the **franchisee**, not VFL (**ASSUMPTION** from FOFO model; VFL "assists in-store development") ([Substack](https://dhruva.substack.com/p/manyavar-vedant-fashion-ltd)).
- Shifts: "6 days (Strict Timings)" ([AmbitionBox](https://ambitionbox.com/reviews/manyavar-and-mohey-reviews)).

**How staff are trained**
- No public curriculum. Calls mention "retail training", "store-level capabilities", "KPI monitoring" every quarter ([Q1 FY27 call](https://www.investing.com/news/transcripts/earnings-call-transcript-vedant-fashions-posts-mixed-q1-2026-results-as-sales-beat-93CH-4813523), [Q2 FY26 call](https://finance.yahoo.com/news/vedant-fashions-ltd-bom-543463-190029120.html)).
- Q2 FY27: "Strengthening retail teams through training and introducing **performance-linked incentive programs**" ([InvestyWise](https://www.investywise.com/vedant-fashions-limited-earnings-conference-call-transcript-q2-fy27)). Before this, an employee wrote the company "doesn't have any incentive benefits" ([AmbitionBox](https://ambitionbox.com/reviews/manyavar-and-mohey-reviews)).
- **AI camera tech** in stores identifies underperforming stores, which then get targeted training. Target: **+1 to 1.5% conversion per year** ([InvestyWise](https://www.investywise.com/vedant-fashions-limited-earnings-conference-call-transcript-q2-fy27)).
- Peers for comparison: ABFRL (Tasva, Jaypore) gives staff a "Single View of Customer" app with purchase history, recommendations and live stock; FabIndia trained 1,000+ frontline staff via Disprz ([ABFRL AR FY26](https://www.abfrl.com/wp-content/uploads/2026/07/ABFRL-Annual-Report-FY25-26.pdf), [Disprz case](https://disprz.ai/case-studies/building-retail-talent-at-scale-fabindia)).

**How selling works**
- Assisted selling, family-led journeys, appointment-led visits, pre-qualified shoppers from online discovery ([Inc42 D2C Summit agenda](https://thed2csummit.co)).
- Wedding shopping = high-stakes, multi-person, often multi-visit; fitting and alteration matter (**ASSUMPTION** + [sherwani guide](https://www.manyavar.com/en-in/blog-sherwani-shopping-guide-craftsmanship-fabric-fit.html)).
- Cross-sell is a stated strategy: "Up-selling and cross-selling initiatives"; Mohey/Twamev add higher ticket sizes without extra rent ([investor presentation](https://vedantfashions.com/wp-content/uploads/2026/05/IntimationofInvestorPresentation31032026-1.pdf), [ValuePickr](https://forum.valuepickr.com/t/vedant-fashions-manyavar-niche-branded-retail/91705?page=4)).

**KPIs they talk about**: retail sales, SSSG (same-store sales growth), conversion rate, new customers, retail area (sq ft), gross margin, sell-through (target 90% per store), store fleet growth ([ET](https://m.economictimes.com/industry/cons-products/fashion-/-cosmetics-/-jewellery/manyavar-maker-vedant-fashions-struggles-to-revive-growth-as-same-store-sales-drop-5-8-in-q2/articleshow/135719272.cms), [Inc42 via LinkedIn](https://www.linkedin.com/posts/inc42_trending-ai-retail-activity-7499435654045413376-Vg6l)). Long-term SSSG target: high single digit ([InvestyWise](https://www.investywise.com/vedant-fashions-limited-earnings-conference-call-transcript-q2-fy27)). VFL does not publish conversion, ATV (average bill), UPT (units per bill) or sales per sq ft; industry bands are conversion 20-30%, UPT 1.8-2.4 ([RetailOpsToolkit](https://www.retailopstoolkit.com/benchmarks/retail-kpi/apparel)).

---

## 4. Inventory and supply

**How stock moves today**
```
Vendors / artisans (SKU-coded production)
   -> Central warehouse, Kolkata (~2.6 lakh sq ft, WMS)
   -> Auto-replenishment (pin-code level) -> ~650 franchisee stores
   -> Store sells via POS -> real-time sale data back to VFL -> next refill
```
- Sources: [VFL About](https://ftp.vedantfashions.com/about-us) ("automated inventory replenishment system that functions effectively without the need for manual input"), [DRHP](https://www.axiscapital.co.in/contents/Vedant-Fashions-Limited-DRHP.pdf) (real-time view of stock at franchisee stores, minimise dead stock), [ValuePickr](https://forum.valuepickr.com/t/vedant-fashions-manyavar-niche-branded-retail/91705) (2.6 lakh sq ft warehouse), [investor presentation](https://vedantfashions.com/wp-content/uploads/2026/05/IntimationofInvestorPresentation31032026-1.pdf) ("Automated Replenishment System at pin code level", "Low level of obsolete & dead stock", "52 week design collection model").
- ERP: Ginesys since inception; replenishment system in every store since the first EBO in 2008 ([DRHP via tavily-research](https://www.bseindia.com/corporates/download/324807/DRHP_20210913151318.pdf)).
- **70-75% of inventory decisions are algorithm-driven; AI handles edge cases; products are automatically moved to stores where they sell better; target 90% sell-through per store** ([Inc42 on LinkedIn](https://www.linkedin.com/posts/inc42_trending-ai-retail-activity-7499435654045413376-Vg6l), [Inc42 Facebook](https://www.facebook.com/Inc42/posts/-manyavar-is-using-ai-and-data-to-take-the-guesswork-out-of-retail-ethnicwear-br/1630211862036263)).
- A kurta is broken into ~60 sub-types; regional taste data goes to designers and to the replenishment algorithm ([Inc42 LinkedIn post](https://www.linkedin.com/posts/inc42_trending-ai-retail-activity-7499435654045413376-Vg6l)).

**Known problems**
- **Dead stock is "a material challenge" in men's celebration wear**, may show only after 2-3 years; occasion stock stays unsold when wedding dates shift ([Multibagg concall](https://www.multibagg.ai/market-pulse/articles/vedant-fashions-rivals-begin-consolidating-concall-cmwdhhclp009a2dqp1a6nvyvd)).
- DRHP risk factor: under-stock hurts demand, over-stock causes ageing/obsolescence; products follow trends ([DRHP](https://www.axiscapital.co.in/contents/Vedant-Fashions-Limited-DRHP.pdf)).
- Q2 FY26: GST change disrupted dispatches for **15-20 days**; gap between primary sales and revenue blamed on inventory and dispatch delays ([Yahoo](https://finance.yahoo.com/news/vedant-fashions-ltd-bom-543463-190029120.html), [ScanX](https://scanx.trade/stock-market-news/earnings/vedant-fashions-reports-4-6-growth-in-q2-despite-gst-transition-challenges/23993575)).
- Franchisees are slow to stock Mohey/Twamev because they turn slower than Manyavar (opportunity cost for the franchisee) ([ValuePickr](https://forum.valuepickr.com/t/vedant-fashions-manyavar-niche-branded-retail/91705?page=4)).
- Inter-store transfers / size gaps: **no public VFL data found**. Industry practice: consolidate broken sizes into 1-2 stores via inter-branch transfer ([RetailDogma](https://www.retaildogma.com/broken-sizes), [RetailPOS](https://retailpos.co.in/dead-stock-apparel-chain-erp-india)).
- Who owns stock at the store? DRHP risk wording suggests franchisees **buy** inventory ("unable to pay for the quantity and price of inventory they have purchased from us"); exact return/buy-back terms are not public ([DRHP](https://www.axiscapital.co.in/contents/Vedant-Fashions-Limited-DRHP.pdf)). **Ask them** (see Q list).

**Numbers from reports**

| Metric | Value | Source |
|---|---|---|
| Inventory days (DRHP, COGS basis) | 41 / 48 / 65 / 68 days (FY19 / FY20 / FY21 / Q1FY22) | [DRHP](https://www.bseindia.com/corporates/download/324807/DRHP_20210913151318.pdf) |
| Inventory days (Screener, sales basis) | 139 (FY24), 210 (FY25), 131 (FY26) | [Screener](https://www.screener.in/company/MANYAVAR) |
| Peers | TCNS/W ~400 days, Biba 300-400 days, ABFRL ~280-300 days | [Screener TCNS](https://www.screener.in/company/TCNSBRANDS), [Biba/ICRA](https://www.icra.in/Rating/ShowRationalReportFilePdf/128224), [Screener ABFRL](https://www.screener.in/company/ABFRL/consolidated) |
| Sell-through target | 90% per store | [Inc42](https://www.linkedin.com/posts/inc42_trending-ai-retail-activity-7499435654045413376-Vg6l) |
| Algorithmic share of inventory decisions | 70-75% | same |
| OCF/PAT (cash conversion) | 98% FY26 vs 69% FY25 | [investor presentation](https://vedantfashions.com/wp-content/uploads/2026/05/IntimationofInvestorPresentation31032026-1.pdf) |

The two inventory-day series use different formulas; don't quote one without saying which.

---

## 5. Tech and AI today

| What | Detail | Source |
|---|---|---|
| ERP | Ginesys, since inception | [DRHP](https://www.bseindia.com/corporates/download/324807/DRHP_20210913151318.pdf) |
| Auto-replenishment | Since 2008, pin-code level, "without manual input" | [VFL About](https://ftp.vedantfashions.com/about-us) |
| WMS | Warehouse Management System | [VFL About](https://ftp.vedantfashions.com/about-us) |
| Custom POS, vendor & supplier systems, AI-led design | Listed as their "technology backbone behind 690 stores" | [D2C Summit agenda](https://thed2csummit.co) |
| MCP server | ~85 crore (Inc42) / ~100 crore data points from two decades, connected to AI systems | [Inc42 Vertical AI](https://inc42.com/features/the-vertical-turn-in-enterprise-ai), [LinkedIn](https://www.linkedin.com/posts/sushant-futureblink_manyavar-thinks-a-computer-can-guess-what-activity-7503414484783226880-ar7k) |
| VFL Brahma | Launched Q1 FY27: "direct connector of our entire company's data to our AI brain" for merchandising, replenishment, decisions | [Investing.com](https://www.investing.com/news/transcripts/earnings-call-transcript-vedant-fashions-posts-mixed-q1-2026-results-as-sales-beat-93CH-4813523) |
| AI cameras in stores | Find underperforming stores, trigger training, aim +1-1.5% conversion/yr | [InvestyWise](https://www.investywise.com/vedant-fashions-limited-earnings-conference-call-transcript-q2-fy27) |
| AI in digital marketing | "Efforts underway" | same |
| Loyalty / CRM | Manyavar Celebration Club (new) | same |
| Cloud / tools | AWS, Azure, iCIMS (hiring), Canva, Hootsuite (third-party scrape) | [LeadIQ](https://leadiq.com/c/vedant-fashions-limited---manyavar-mohey/5a1d7da024000024005721e3) |
| Claude | "Already works on Claude" is from the organiser's brief only; no public source found. MCP (Model Context Protocol) is Anthropic's standard, so the MCP server fits Claude use. **ASSUMPTION** | [HACKATHON.md](../HACKATHON.md) |

**Job posts (= where the pain is)**
- Very few public postings: Revelio says ~0 active postings in 2026, down from ~8/month in 2023 ([Revelio](https://www.reveliolabs.com/companies/vedant-fashions/employees)). Hiring is probably via referrals/the hackathon itself (**ASSUMPTION**).
- Seen: Sr Coordinator (Product Listing) Kolkata ([CareerFit](https://careerfit.ai/find-jobs/sr-coordinator-product-listing-vedant-fashions-164251)), Learning & Development Support ([iimjobs](https://www.iimjobs.com/vedant-fashions-careers)), Retail Analytics intern listing ([MyInternships](https://myinternships.in/internships/retail-analytics-intern-vedant-fashions-kolkata), not verified).
- Workforce split ~35% engineering, ~34% sales & marketing, ~31% finance & ops ([Revelio](https://www.reveliolabs.com/companies/vedant-fashions/employees)).
- Hackathon brief: they want "AI Generalist / Forward Deployed Engineer" to automate business teams' daily workflows ([HACKATHON.md](../HACKATHON.md)).

---

## 6. Real voices

Public, recent first-hand voices are thin. The last30days run (Reddit/HN, last 30 days) found only one on-topic thread, about wedding shopping at another brand. Below are the best available, labelled by who said it.

| # | Who | Quote | Link |
|---|---|---|---|
| 1 | Vedant Modi, CRO (earnings call, Nov 2026) | "The best 10 days were replaced by almost the worst 10 days in our business" | [ET](https://m.economictimes.com/industry/cons-products/fashion-/-cosmetics-/-jewellery/manyavar-maker-vedant-fashions-struggles-to-revive-growth-as-same-store-sales-drop-5-8-in-q2/articleshow/135719272.cms) |
| 2 | Vedant Modi, CRO | "The only thing that we need to do slightly better is newer customers making more buys." | [ET](https://m.economictimes.com/industry/cons-products/fashion-/-cosmetics-/-jewellery/manyavar-maker-vedant-fashions-struggles-to-revive-growth-as-same-store-sales-drop-5-8-in-q2/articleshow/135719272.cms) |
| 3 | Vedant Modi, Inc42 summit | "we break down a kurta into sixty types of kurta... the store replenishment teams algorithm automatically sends those kind of products" | [LinkedIn/Inc42](https://www.linkedin.com/posts/inc42_trending-ai-retail-activity-7499435654045413376-Vg6l) |
| 4 | Retail analyst (Third Eyesight founder) | "There are cases where brands have overextended and opened stores that are not going to be sustainable." | [ET](https://m.economictimes.com/industry/cons-products/fashion-/-cosmetics-/-jewellery/manyavar-maker-vedant-fashions-struggles-to-revive-growth-as-same-store-sales-drop-5-8-in-q2/articleshow/135719272.cms) |
| 5 | Store employee, AmbitionBox | "Company doesn't have any incentive benefits of employees." / "6 days (Strict Timings)" | [AmbitionBox](https://ambitionbox.com/reviews/manyavar-and-mohey-reviews) |
| 6 | Store employee, AmbitionBox | "The whole store feels like home" / "The salary does not come on time." | [AmbitionBox](https://ambitionbox.com/reviews/manyavar-and-mohey-reviews) |
| 7 | Sales Executive & Cashier, Kolkata (AmbitionBox) | "You know everything sale skill product knowledge and everything knowledge in this company" (rated company 2.0) | [AmbitionBox salesman reviews](https://ambitionbox.com/reviews/manyavar-and-mohey-reviews/salesman) |
| 8 | Customer, US store (Yelp via MapQuest) | "absolutely worst customer service. Whether it's the manager or staff members are not friendly" - while another says "Outstanding customer service! Goes above and beyond!" (same store: service quality depends on the staff) | [MapQuest](https://www.mapquest.com/us/texas/manyavar-425046965) |
| 9 | Customer, Quora | complains about "availability of clothes in different sizes" and slow complaint handling | [Quora](https://www.quora.com/How-are-clothing-brands-like-Manyavar-fooling-people) |
| 10 | Bride, r/IndianWeddings (Nov 2026, another brand) | "I had to scout for a lehenga 20 days before my wedding" - wedding shopping has hard deadlines; a missing piece is a crisis | [Reddit](https://www.reddit.com/r/IndianWeddings/comments/1xmwzds/chandini_chowk_experience_17_heritage/) |

Ratings: AmbitionBox ~3.7-4.1/5 (promotions and salary rated lowest), Glassdoor 3.3/5 ([AmbitionBox](https://ambitionbox.com/reviews/manyavar-and-mohey-reviews), [Glassdoor](https://www.glassdoor.com/Reviews/Manyavar-Reviews-E745853.htm)).

---

## 7. Likely meaning of the two statements

### "Store Coach" (3 readings)

| # | Reading | Evidence |
|---|---|---|
| A (most likely) | **A coach for store staff/managers to lift conversion**: tell each store what went wrong today/this week (footfall vs bills, missed upsell, weak category) and what to do tomorrow | AI cameras already find weak stores -> "targeted training"; goal +1-1.5% conversion/yr; SSSG -5.8%; "newer customers making more buys" ([InvestyWise](https://www.investywise.com/vedant-fashions-limited-earnings-conference-call-transcript-q2-fy27), [ET](https://m.economictimes.com/industry/cons-products/fashion-/-cosmetics-/-jewellery/manyavar-maker-vedant-fashions-struggles-to-revive-growth-as-same-store-sales-drop-5-8-in-q2/articleshow/135719272.cms)) |
| B | **Training / onboarding for new sales staff**: product knowledge (60 kurta types, 5+ brands), styling a groom + family, wedding rituals by region, in Hindi/regional language, on a phone | "retail training" every quarter; franchise staff turnover (**ASSUMPTION**); peers use frontline training apps ([Disprz/FabIndia](https://disprz.ai/case-studies/building-retail-talent-at-scale-fabindia)); L&D job post ([iimjobs](https://www.iimjobs.com/vedant-fashions-careers)) |
| C | **In-the-moment selling assistant** on the shop floor: what to show this customer, what to cross-sell (Mohey for the bride's side, Twamev upsell), what is in stock right now, incentive tracker | Up/cross-sell strategy; new performance-linked incentives; ABFRL's staff app does this ([investor presentation](https://vedantfashions.com/wp-content/uploads/2026/05/IntimationofInvestorPresentation31032026-1.pdf), [ABFRL AR](https://www.abfrl.com/wp-content/uploads/2026/07/ABFRL-Annual-Report-FY25-26.pdf)) |

### "Stock Mover" (3 readings)

| # | Reading | Evidence |
|---|---|---|
| A (most likely) | **Inter-store transfers of slow/dead stock**: find pieces aging in store X that would sell in store Y (different region / wedding calendar) and suggest who sends what to whom | "Products are automatically moved to stores where they can sell better"; 90% sell-through target; dead stock "material challenge"; no-discount policy so stock must move, not be marked down ([Inc42](https://www.linkedin.com/posts/inc42_trending-ai-retail-activity-7499435654045413376-Vg6l), [Multibagg](https://www.multibagg.ai/market-pulse/articles/vedant-fashions-rivals-begin-consolidating-concall-cmwdhhclp009a2dqp1a6nvyvd)) |
| B | **The 25-30% the algorithm doesn't decide**: edge cases like new stores, new collections with no history, festival date shifts, regional wedding muhurats, broken size sets | 70-75% algorithmic, "AI handles the remaining edge cases"; Navratri shift; AP/Telangana muhurat gap ([Inc42 FB](https://www.facebook.com/Inc42/posts/-manyavar-is-using-ai-and-data-to-take-the-guesswork-out-of-retail-ethnicwear-br/1630211862036263), [ET](https://m.economictimes.com/industry/cons-products/fashion-/-cosmetics-/-jewellery/manyavar-maker-vedant-fashions-struggles-to-revive-growth-as-same-store-sales-drop-5-8-in-q2/articleshow/135719272.cms)) |
| C | **Customer-facing "find it now"**: a groom wants size 42 in this sherwani, store doesn't have it; find nearest store/warehouse stock and get it moved before the wedding date | Size availability complaints; wedding deadlines; ABFRL staff can "order out-of-stock items" ([Quora](https://www.quora.com/How-are-clothing-brands-like-Manyavar-fooling-people), [ABFRL AR](https://www.abfrl.com/wp-content/uploads/2026/07/ABFRL-Annual-Report-FY25-26.pdf)) |

**Pains list (product-brainstorming, problem space only, no solutions)**
- Root cause chain for Store Coach: SSSG down -> fewer new customers convert -> staff quality varies store to store (franchise hires, low pay, no incentives until now) -> head office sees weak stores (cameras) but coaching 650 stores by hand doesn't scale.
- Root cause chain for Stock Mover: occasion wear + no discounts + wedding dates that move by region and year -> the right stock sits in the wrong store -> sell-through misses 90% -> dead stock after 2-3 years.
- Jobs-to-be-done:
  - Store staff: "When a wedding family walks in, I want to know what to show and what we have, so I close the sale and earn my incentive."
  - Store manager: "When my numbers dip, I want to know why and what to do this week, so the area manager stops calling."
  - Merchandiser / replenishment team: "When stock is aging in one store, I want to know where it would sell, so I hit sell-through without discounting."
  - Franchise owner: "I want less money stuck in slow stock and fewer lost sales."
- Open question that changes everything: who pays for moving stock between two franchisees' stores, and who owns the stock while it moves?

---

## 8. Users and job titles

| User | What they care about | Tech comfort (**ASSUMPTION**) |
|---|---|---|
| Sales executive / salesman | Closing sales, incentive, knowing the product, finding sizes | Smartphone, WhatsApp, Hindi/regional language |
| Cashier | Billing, returns, alterations tracking | POS only |
| Store manager | Daily target, conversion, staff, stock gaps, visual merchandising | Smartphone + POS reports |
| Area / Regional manager | 10-30 stores, which store is weak and why, visits, training | Dashboards, Excel, WhatsApp |
| Franchise owner | Profit, cash in stock, staff cost; often owns 2+ stores | Business owner, WhatsApp |
| Merchandiser / allocation / replenishment team (Kolkata HQ) | Sell-through, aging, size curves, transfers, new collection rollout | ERP (Ginesys), Excel, VFL Brahma |
| Chief Retail Officer / CRO | SSSG, conversion, fleet quality | Reports, AI tools |
| Training / L&D team | Content, reach across 650 stores, proof training worked | LMS (**ASSUMPTION**) |

---

## 9. Data they probably have + what a dataset might look like

All **ASSUMPTION** unless linked. Confirmed sources of data: POS sale data in real time, store/warehouse stock sync ([DRHP](https://www.axiscapital.co.in/contents/Vedant-Fashions-Limited-DRHP.pdf)), camera footfall/behaviour ([InvestyWise](https://www.investywise.com/vedant-fashions-limited-earnings-conference-call-transcript-q2-fy27)), loyalty/CRM ([same](https://www.investywise.com/vedant-fashions-limited-earnings-conference-call-transcript-q2-fy27)), ~85-100 crore historical data points ([Inc42](https://inc42.com/features/the-vertical-turn-in-enterprise-ai)).

Likely tables if they give us a dataset:

| Table | Likely columns |
|---|---|
| stores | store_id, brand (Manyavar/Mohey/...), city, state, region, format (EBO/SIS/flagship), sq_ft, franchisee_id, open_date |
| products / SKUs | sku, style_code, brand, category (kurta, sherwani, indo-western, lehenga...), sub_type (one of ~60), colour, fabric, size, MRP, collection, launch_date |
| sales (POS bills) | bill_id, store_id, date_time, sku, qty, MRP, staff_id, customer_id, alteration_flag, return_flag |
| inventory snapshot | date, store_id / warehouse, sku, size, qty_on_hand, days_in_store (age) |
| transfers / replenishment | transfer_id, from, to, sku, qty, created, dispatched, received, reason |
| footfall | store_id, date, hour, visitors, (camera) dwell / trial-room use |
| staff | staff_id, store_id, role, join_date, training done, bills, value, UPT |
| calendar | date, region, festival, wedding_muhurat flag |
| customers / loyalty | customer_id, city, visits, spend, occasion, family group |

Derived numbers they will expect to see: conversion = bills / footfall; ATV = value / bills; UPT = units / bills; sell-through = sold / (sold + on hand); stock age buckets (0-30, 31-90, 90-180, 180+ days); size-set completeness.

---

## 10. Hidden expectations (what Manyavar's people will value)

- **A business number**, not a demo. E.g. "conversion +1%" (their own target), "sell-through toward 90%", "₹ of aged stock moved". Use their words: SSSG, sell-through, conversion, new customers.
- **Fits the franchise model**: the store staff work for the franchisee, the stock may belong to the franchisee. Anything that moves stock or changes staff behaviour must work for the franchise owner too.
- **Works at 650+ stores, 240 cities**, from one HQ in Kolkata, on cheap phones, during peak wedding rush.
- **Indian languages**: Hindi first, then Bengali/Telugu/Tamil etc. Staff are not English-first (**ASSUMPTION**, supported by store pay bands).
- **Brand fit**: premium, "aristocratic" experience, no discounting. Do not propose markdowns/sales as the answer to dead stock.
- **Builds on what exists**: they already have replenishment, ERP, cameras, MCP server, VFL Brahma, Claude. Pitch as a layer on top, not a replacement. "We'd plug into your MCP" lands well (**ASSUMPTION**).
- **Seasonality-aware**: wedding muhurats by region, festival shifts. Showing you know "the best 10 days" matter is a strong signal.
- Hiring angle: they hire AI generalists to automate teams' daily workflows ([HACKATHON.md](../HACKATHON.md)). A clean, real workflow automation beats a flashy chatbot.

---

## 11. Five questions for the Manyavar table (10:00-11:00)

1. **Who is the user?** For Store Coach: the salesperson, the store manager, or the area manager? For Stock Mover: HQ merchandiser, store manager or franchise owner?
2. **Who owns the stock in a franchise store, and who pays when stock moves between two franchisees?** Is there a return/buy-back to the warehouse?
3. **Will there be a dataset, and what's in it?** (POS bills, stock by size and age, footfall/camera data, transfers, staff, wedding calendar?) Real or synthetic? How many stores and months?
4. **Which number would make you say "this works"?** Conversion, sell-through, aged-stock %, transfer lead time, training completion?
5. **What runs on Claude today, and can we use your MCP / VFL Brahma format?** Which language do store staff actually use day to day?

---

## Skills used / Skipped

| Skill | Used? | What it gave / why skipped |
|---|---|---|
| tavily-entity | Used | Company identity (vedantfashions.com, Kolkata), financials, stores, leadership, board |
| tavily-research | Used (Tavily deep research, pro) | Store ops and inventory practices for VFL and peers (ABFRL, TCNS/W, Biba, FabIndia); inventory-day tables; DRHP details |
| tavily-search | Used | Q2 FY27 call summary, Q1 FY27 transcript (VFL Brahma), Inc42 AI story (70-75%, 90% sell-through, MCP), dead-stock concall, job posts, leadership, AmbitionBox extract |
| last30days | Used (2 runs) | Run 1 failed on SSL certificate errors; run 2 (with system CA bundle) got 6 Reddit items, only 1 on-topic (r/IndianWeddings). X, YouTube, TikTok not set up; Reddit browser-session offer skipped (no cookie access without consent) |
| WebSearch | Used (2 queries) | AmbitionBox / Glassdoor / Indeed ratings and staff reviews; size-availability search (no customer threads found) |
| product-brainstorming | Used (problem-exploration mode only) | Root-cause chains, jobs-to-be-done, pains list in Section 7. No solutions, as asked |
| Glassdoor / Indeed full reviews | Skipped | Pages blocked extraction; only headline ratings used |
