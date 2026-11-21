# Vinayak Group (Kolkata) - pre-event research

Prepared 2026-11-20 for VCH3 (21 Nov). Vinayak has ONE problem statement, revealed at 10:00. Hiring brief (from [calaiclub.com/vch3](https://calaiclub.com/vch3)): *"Vinayak wants to run as an AI-first company. You bring AI tools into daily work across the business, including the civil and construction side."* Role: AI Generalist / Forward Deployed Engineer, ₹5-8 LPA, Kolkata, on-site, all experience levels.
Rules: notes only, no code. Every fact has a link. **ASSUMPTION** = our guess. No invented numbers.

---

## TL;DR (read this first)

1. **Who they are:** a family-run **residential real-estate developer** in Kolkata (Kyal family, founded 1987/88), legal entity **Kyal Developers Pvt Ltd** (CIN U70109WB1995PTC076151). Tagline "Soch Apnepan Ki". **Not** a civil contractor or infra company: we found no infrastructure or third-party construction division. "Civil and construction" in the brief means **their own building sites**.
2. **Scale:** 45+ projects delivered, ~3M sq ft delivered, **5.7M sq ft under construction** across ~7 live projects (Newtown, Laketown, New Alipore, Joka), ~165 staff on LinkedIn. That is a lot of construction for a small team.
3. **Hot right now:** **Vinayak 21 Acres** (Newtown AA-III), launched May 2026: 750+ flats in phase 1-2 (2,000+ planned), ~₹2,000 cr revenue potential, **650+ homes sold in 4 months**, completion March 2032. So they now have hundreds of new buyers, many demand letters and home loans, and a long build ahead.
4. **How they sell:** mainly through **channel partners** (brokers): they hold a yearly partner meet and give awards. They also run a sales desk, a WhatsApp chat and an award-winning "Customer Experience Centre". They publish **construction updates** for each project on the website.
5. **Tech today:** almost nothing public. No ERP, CRM or AI tool named anywhere. Only AutoCAD was detected. No tech job posts. The hiring brief itself says they want to *start* being AI-first. ASSUMPTION: Excel, WhatsApp, Tally or a real-estate ERP, and paper DPRs.
6. **Likely problem areas (ranked):** (1) site progress → DPR / plan-vs-actual / RERA quarterly update from photos and voice; (2) buyer communication after the sale (construction-linked demand letters, payment follow-up, "where is my flat" questions); (3) material indent / stock / wastage across sites; (4) contractor work measurement and RA-bill checking; (5) channel-partner leads → site visit → booking.
7. **What will win with them:** a phone-first tool that site staff actually use (Bengali/Hindi voice, photos, weak network), and a clear **hours or ₹ saved** number. It should feed the owners' view: Anurag Kyal runs day-to-day ops, Rishi Kyal runs purchase.

---

## 1. Company snapshot + identity check

| Item | Value | Source |
|---|---|---|
| Brand / website | Vinayak Group, [vinayakgroup.org](https://vinayakgroup.org), tagline "Soch Apnepan Ki" | [Home](https://vinayakgroup.org) |
| Legal entity | **Kyal Developers Pvt Ltd**, CIN **U70109WB1995PTC076151**, incorporated 22 Dec 1995; website footer says "© 2026 KYAL DEVELOPERS PRIVATE LIMITED" | [Contact page](https://vinayakgroup.org/contact-us), [Tofler](https://www.tofler.in/kyal-developers-pvt-ltd/company/U70109WB1995PTC076151), [Filesure](https://www.filesure.in/company/kyal-developers-pvt-ltd/U70109WB1995PTC076151) |
| Address | Vinayak Corporate House, 122/1R Satyendranath Majumdar Sarani (Manoharpukur Rd), Kolkata 700026 (same as registered office) | [Contact page](https://vinayakgroup.org/contact-us), [Finanvo](https://finanvo.in/company/U70109WB1995PTC076151/kyal-developers-pvt-ltd) |
| Founded | 1987 per press and FB; 1988 per their milestones page. Founders: brothers Balkrishan Kyal and Umesh Kyal | [Moneycontrol](https://www.moneycontrol.com/news/business/press-release/vinayak-group-launches-rs-2-000-crore-residential-township-project-in-kolkata-s-newtown-13930409.html), [About](https://vinayakgroup.org/about) |
| Leadership | Balkrishan Kyal (co-founder, acquisitions/BD), Umesh Kyal (co-founder, finance), **Rishi Kyal (purchasing)**, **Anurag Kyal (day-to-day operations)**, **Rahul Kyal (MD; legal, marketing, brand; ex-CREDAI Bengal Youth Wing head, Chairman ICC Young Leaders Forum)**, Unnath Kyal (3rd generation) | [About](https://vinayakgroup.org/about), [Rahul Kyal LinkedIn](https://in.linkedin.com/in/rahul-kyal-bb9671313) |
| People | ~165 employees on LinkedIn (~168, +39% YoY per Tavily); "100+ associates" in 2022 | [LinkedIn](https://in.linkedin.com/company/vinayakgroup), [Tavily record](https://tavily.com/knowledge/company/uuEzK5GIdQnR), [About](https://vinayakgroup.org/about) |
| Revenue | Not public. Tracxn bands Kyal Developers at ₹50-100 cr (FY25). Projects sit in many SPVs/LLPs (e.g. Vinayak Villa LLP), so group revenue is higher (ASSUMPTION) | [Tracxn](https://tracxn.com/d/companies/vinayak-group/__UrPzYAQjZrUrxC44FxXda6vaSH1gOI9Wf9lcQnJivcE), [Planetexim](https://www.planetexim.net/director/rahul-kyal/did/D0000209699.html) |
| Track record | 45+ projects, ~3M sq ft delivered, 7,000+ residents; 5.7M sq ft under construction | [News page](https://vinayakgroup.org/news-updates), [Moneycontrol](https://www.moneycontrol.com/news/business/press-release/vinayak-group-launches-rs-2-000-crore-residential-township-project-in-kolkata-s-newtown-13930409.html) |

**How we confirmed it's the right Vinayak Group**
- The VCH3 page's partner logo (`/sponsors/vch3/vinayak-group-400.png`) reads **"VINAYAK - SOCH APNEPAN KI"**. That is the tagline used on vinayakgroup.org ([home](https://vinayakgroup.org), [about](https://vinayakgroup.org/about)).
- The website footer names **Kyal Developers Pvt Ltd**. Its registered office and CIN match the company registries. MD Rahul Kyal's ICC profile uses an @vinayakgroup.org email ([ICC YLF](https://www.iccylf.com/ylf_members/rahul-kyal)).
- **Not to confuse with:** **Jai Vinayak Group** ([jaivinayakgroup.com](https://www.jaivinayakgroup.com), a separate Kolkata developer with its own [AmbitionBox page](https://www.ambitionbox.com/reviews/jai-vinayak-group-reviews)); "Vinayak Builders" listings on [99acres](https://www.99acres.com/vinayak-builders-projects-in-kolkata-bcffid); Vinayak Outsourcing (Chhattisgarh); and the many "Vinayak Residency / Karnish Park" style listings on homes247, which are other companies. We used none of their facts.
- Remaining doubt: low. The hackathon page gives no URL, but the logo plus tagline match exactly.

---

## 2. Business model

**Divisions**

| Line | Evidence | Notes |
|---|---|---|
| Residential development (core) | All 7 ongoing projects are residential ([Ongoing](https://vinayakgroup.org/ongoing-projects)) | Mid-premium to luxury flats and villas |
| Commercial | One commercial development in Burrabazar; an early mall in Vizag (1990s) ([News](https://vinayakgroup.org/news-updates), [About](https://vinayakgroup.org/about)) | Small |
| Civil construction / infrastructure for others | **Not found.** No EPC, government contracts or infra projects | They act as developer and run the build with their own engineers and contractors (see §3) |
| Joint ventures | With **PS Group**: Vaanya, Navyom, Blossom County. Blossom County brochure also names Srijan ([MagicBricks](https://www.magicbricks.com/ps-vaanya-new-town-kolkata-pdpid-4d4235333635383133), [Squareyards](https://www.squareyards.com/kolkata-residential-property/ps-vinayak-navyom-phase-i/111413/project), [CRISIL brochure](https://www.crisil.com/content/dam/crisil/our-businesses/crest/kolkata/blossom-county/pdf/blossom-county-brochure.pdf)) | So they also report progress and money to JV partners |

**Live projects** ([Ongoing](https://vinayakgroup.org/ongoing-projects), [21 Acres page](https://vinayakgroup.org/project-details/vinayak-21-acres), [Vinayak blog](https://vinayakgroup.org/blog/a-homecoming-guide-to-booking-an-under-construction-property-in-kolkata-this-festive-season))

| Project | Where | Size | RERA | Completion (registered) |
|---|---|---|---|---|
| **Vinayak 21 Acres** | Off Newtown AA-III (Hatishala) | 5 towers G+21, 750+ flats; IGBC Platinum precertified | WBRERA/P/SOU/2026/004147 & 004275 | 31 Mar 2032 |
| Vinayak 21 Acres Villa | same | 51 villas in phase I, from ₹2.70 cr; RERA on 4 Sep 2026 ([Synergy](https://synergyinfracon.com/developers/vinayak-group)) | - | - |
| Vinayak Amara | Newtown AA-II | 3/4 BHK | WBRERA/P/NOR/2024/001720 | Jul 2029 |
| Vaanya (with PS) | Newtown AA-II | 4 towers G+35, 9 acres | WBRERA/P/NOR/2023/000089 | end 2027/2028 (sources differ) |
| Vinayak Aquina | Newtown AA-I | 2 towers G+25, 132 flats | WBRERA/P/SOU/2023/000103 | Jul 2027 |
| Vinayak Vista | Laketown | 2-5 BHK | - | Dec 2026 ([Housivity](https://housivity.com/buy-vinayak-vista-by-vinayak-group-in-lake-town-kolkata-pid-680b3683a96545786e6df316)) |
| Navyom (with PS) | Off New Alipore | 7.3 acres, 4-6 BHK | HIRA/P/KOL/2020/001014 | Listings said Aug-Sep 2025 ([Housing](https://housing.com/buy-ps-navyom-phase-i-by-ps-group-in-new-alipore-kolkata-pid-251700)) but it is still on the "ongoing" page. **ASSUMPTION: possible delay, not confirmed** |

**Customers:** homebuyers (B2C), including NRIs (their blog targets NRI buyers). No government clients found. 2BHK from ~₹76 lakh; villas ₹2.7-3.3 cr ([Moneycontrol](https://www.moneycontrol.com/news/business/press-release/vinayak-group-launches-rs-2-000-crore-residential-township-project-in-kolkata-s-newtown-13930409.html)).

**How they win work (= how they get land and buyers)**
- Land: "forte being land acquisitions at an extraordinary pace" ([About](https://vinayakgroup.org/about)). Joint development with landowners and JVs with PS Group.
- Buyers: channel partners (Vinayak Sangam partner meet, Oct 2026, with awards to brokers) ([FB](https://www.facebook.com/VinayakGroupDevelopers/posts/the-people-behind-our-success-deserve-the-spotlight-at-vinayak-group-our-channel/1740876321375142), [IG](https://www.instagram.com/reel/DeURYJ6mik1)); listing portals; YouTube/IG buyer-testimonial videos ([YouTube](https://www.youtube.com/c/VinayakGroupDeveloper)); a site-visit booking button on each project page.
- 21 Acres: "over 75% of the launched inventory sold within 2 months", "prices appreciating close to 25%" ([News](https://vinayakgroup.org/news-updates)); "650+ homes sold in 4 months" ([FB video](https://www.facebook.com/VinayakGroupDevelopers/videos/650-homes-4-months-countless-dreams-taking-shape-what-makes-this-milestone-speci/1588078225845864)).

---

## 3. How their teams work today

Little is published about internal process. Below: evidence first, then industry pattern (from [tavily-research](#12-skills-used)), clearly marked.

| Team | What we know | How it likely works (ASSUMPTION from industry norms) |
|---|---|---|
| **Owners / head office** | Anurag Kyal runs day-to-day operations; Umesh Kyal finance; Rishi Kyal purchasing ([About](https://vinayakgroup.org/about)) | Family directors approve purchases, payments and price lists; they want one view across ~7 sites |
| **Project managers (civil)** | e.g. a "Project Manager CIVIL" since 2021, 24 yrs experience, ex-Shrachi / Hiland ([LinkedIn](https://in.linkedin.com/in/mintu-das-21620028a)) | One PM per project, managing contractors, schedule and quality |
| **Site / project engineers** | "Senior Project Engineer"; skills include **aluminium (MIVAN) shuttering** for high-rises ([LinkedIn](https://www.linkedin.com/in/bibaswan-mandal-40088699)). AmbitionBox lists Civil Site Engineer, Site Engineer, Project Engineer roles, ₹2.7-5.3 L/yr ([AmbitionBox](https://www.ambitionbox.com/salaries/vinayak-group-salaries/kolkata-location)). A **Quality Engineer** posted about laser-guided internal plaster (seen in an engineer's LinkedIn activity) | Daily progress via WhatsApp groups, photos, Excel DPR. Industry: 45-90 min per DPR; month-end plan-vs-actual "can take two days" ([Banamind](https://banamind.ai/blog/construction-daily-report-whatsapp-30-seconds), [SiteSetu](https://sitesetu.app/blog/construction-progress-tracking-software)) |
| **Contractors / labour** | Not published | Labour via thekedars on hazri sheets, piece-rate work orders, BOCW registers ([NIAS study](http://eprints.nias.res.in/3029/1/Migrant_Construction_Labour_NIAS_IITH-2025.pdf)). RA bills from the measurement book against the BOQ ([BuilderXPro](https://builderxpro.com/blog/construction-billing-ra-bills-guide)) |
| **Purchase / stores** | Purchase dept led by Rishi Kyal ([About](https://vinayakgroup.org/about)) | Indent → PO → GRN → invoice, but often "send 10 bags cement urgent" on WhatsApp ([SiteSetu](https://sitesetu.app/blog/reduce-construction-material-wastage-india)) |
| **Sales / pre-sales** | Sales line, WhatsApp chat on site, channel partners, social media agency Marko & Brando ([Contact](https://vinayakgroup.org/contact-us)); FB replies are templated ("please contact us at 917620368888") ([FB](https://www.facebook.com/VinayakGroupDevelopers/videos/the-co-founders-and-directors-of-vinayak-group-share-insights-about-the-path-to-/1696027524652974)) | Leads from portals, partners and ads; site visits; booking |
| **Post-sales / CRM** | AmbitionBox lists a "Post Sales Executive" role ([AmbitionBox](https://www.ambitionbox.com/salaries/vinayak-group-salaries/kolkata-location)); "Outstanding Customer Experience Centre" award ([News](https://vinayakgroup.org/news-updates)) | Construction-linked demand letters, payment follow-up, bank NOCs for loan tranches, buyer queries, handover and snags ([HNA](https://hnaproptech.com/blog/construction-linked-payment-plan-explained), [ICICI](https://www.icici.bank.in/knowledge-hub/blog/when-and-why-are-home-loan-disbursed-in-tranches)) |
| **Accounts / legal / compliance** | AGM Accounts role on AmbitionBox; Rahul Kyal oversees legal and compliance ([About](https://vinayakgroup.org/about)) | WBRERA quarterly update within 7 days of each quarter: bookings plus **construction status of each building and floor with photos** (WB RERA Rule 16(d), [Legitquest](https://www.legitquest.com/act/west-bengal-real-estate-regulation-and-development-rules-2021/cec0)); 70% escrow tracking ([RERACertified](https://reracertified.in/blog/rera-70-percent-escrow-rule)) |

---

## 4. Known operational problems (with evidence)

**Vinayak-specific (thin; public record is clean)**
- We found **no WBRERA order, consumer case or news story** naming Vinayak or Kyal Developers. We searched WBRERA case-law sites and the news. Absence of evidence ≠ no complaints.
- **Navyom:** listings gave possession Aug-Sep 2025, yet the project is still under "ongoing" in Nov 2026 ([Housing](https://housing.com/buy-ps-navyom-phase-i-by-ps-group-in-new-alipore-kolkata-pid-251700), [JLL Homes](https://www.jllhomes.co.in/apartments-new/kolkata/ps-navyom), [Ongoing](https://vinayakgroup.org/ongoing-projects)). **ASSUMPTION: possibly late. Ask, don't accuse.**
- **Growth vs team size:** 5.7M sq ft under construction plus a 2,000-flat township with ~165 people ([LinkedIn](https://in.linkedin.com/company/vinayakgroup)). Headcount up ~39% in a year ([Tavily record](https://tavily.com/knowledge/company/uuEzK5GIdQnR)), so new staff need onboarding and the work is stretched (ASSUMPTION).
- **Employee pain points:** AmbitionBox ratings are lowest for salary, promotions and skill development (~3.0/5); 9-hour site days (10am-7pm), Mon-Sat ([AmbitionBox civil engineer](https://ambitionbox.com/reviews/vinayak-group-reviews/civil-engineer), [site engineer](https://ambitionbox.com/reviews/vinayak-group-reviews/site-engineer)). Small sample.
- **Inconsistent self-reported numbers:** the website says 3,000+ homes delivered "never delayed" but also 7,000+ families ([About](https://vinayakgroup.org/about)); founded 1987 vs 1988; "35+ years" vs "38 years". This points to scattered internal data (weak signal).

**Industry pains that apply to them** (Kolkata / India)

| Pain | Evidence |
|---|---|
| Delays | Kolkata large projects take **5.7 yrs** on average, the longest of the big cities ([ET Realty/Anarock](https://realty.economictimes.indiatimes.com/news/residential/average-time-to-complete-large-residential-projects-dip-20-in-last-decade/111743096)); **>60% of WBRERA complaints** in 2025-26 are delayed possession ([TheBusinessSalary](https://thebusinesssalary.com/what-happens-if-a-builder-delays-property-possession)) |
| Cost overruns | Causes: design changes 68.5%, material price swings 59.3%, approval delays 57.4% ([JournalPressIndia](https://www.journalpressindia.com/siteadmin/upload_paper/1752228946_Chapter44_Cost%20Overrun%20Analysis.pdf)); West Bengal cement up ₹20/bag YoY ([Business Standard](https://www.business-standard.com/industry/news/cement-prices-rise-sharply-as-fuel-gypsum-costs-continue-to-escalate-125082700894_1.html)) |
| Material wastage | 15-18% of materials wasted on typical sites; cement up to 14% vs a 2-3.5% norm ([SiteSetu](https://sitesetu.app/blog/reduce-construction-material-wastage-india)) |
| Reporting on WhatsApp | ">80% of sites run on WhatsApp, Excel, paper" ([Koncite at ICTDD 2026](https://www.facebook.com/RealtyNXT/videos/at-ictdd-2026-mahesh-patil-founder-of-koncite-spoke-about-a-problem-most-people-/1517478309825432)) |
| Quality / snags | Typical new home: 101 defects, 29% high severity ([SnagEasy](https://www.snageasy.in/blog/why-home-inspection-needed-new-flat-defects)) |
| Safety | Jun 2026 Kolkata warehouse collapse (16 dead) led to a suspension of ongoing commercial construction in the KMC area and a building-plan audit ([The Hindu](https://www.thehindu.com/news/national/west-bengal/kolkata-warehouse-collapse-death-toll-updates/article71149972.ece)). Site safety and documentation are now under a spotlight |
| WBRERA portal friction | Quarterly-update deadlines extended 4 times in 2025; site technical issues ([WBRERA notifications](https://rera.wb.gov.in/notification.php)) |

---

## 5. Tech and AI today

| Signal | Finding | Source |
|---|---|---|
| ERP / project software | **None named publicly.** ASSUMPTION: Tally or an Indian real-estate ERP (Farvision is common: 900+ developers) | [Farvision](https://farvisionerp.com) |
| Detected tech | AutoCAD, TDS; marketing stack (Hootsuite, Facebook) | [Tavily record](https://tavily.com/knowledge/company/uuEzK5GIdQnR) |
| Website | Built by agency Marko & Brando. Has a WhatsApp chat widget, a per-project "Construction Updates" tab and site-visit booking; "many developers including Vinayak publish monthly construction updates online" | [21 Acres page](https://vinayakgroup.org/project-details/vinayak-21-acres), [Blog](https://vinayakgroup.org/blog/a-homecoming-guide-to-booking-an-under-construction-property-in-kolkata-this-festive-season) |
| Construction tech | MIVAN aluminium formwork experience; laser-guided plaster; IGBC green certification | [Engineer LinkedIn](https://www.linkedin.com/in/bibaswan-mandal-40088699), [Moneycontrol](https://www.moneycontrol.com/news/business/press-release/vinayak-group-launches-rs-2-000-crore-residential-township-project-in-kolkata-s-newtown-13930409.html) |
| AI initiatives | **None found** before this hackathon role. The VCH3 role is the first public AI hire signal | [calaiclub.com/vch3](https://calaiclub.com/vch3) |
| Job posts | No open tech roles listed (LinkedIn / Tavily: 0 open roles). Roles seen: site/civil engineers, PM civil, quality engineer, front office exec, post-sales exec, AGM accounts | [AmbitionBox salaries](https://www.ambitionbox.com/salaries/vinayak-group-salaries/kolkata-location), [Tavily](https://tavily.com/knowledge/company/uuEzK5GIdQnR) |
| Hackathon stack fit | Sarvam AI is a VCH3 partner (Bengali/Hindi voice and text): relevant for site staff | [calaiclub.com/vch3](https://calaiclub.com/vch3) |

What it means: **greenfield**. No AI yet, data probably spread across WhatsApp, Excel and an accounting tool. A small tool that removes a daily manual step will look valuable. A tool that needs a big system migration will not.

---

## 6. Real voices

| # | Who | Quote | Link |
|---|---|---|---|
| 1 | Rahul Kyal, Director (on 21 Acres) | "we see strong demand for integrated developments that offer both lifestyle value and future appreciation potential" | [Moneycontrol](https://www.moneycontrol.com/news/business/press-release/vinayak-group-launches-rs-2-000-crore-residential-township-project-in-kolkata-s-newtown-13930409.html) |
| 2 | Vinayak Group (own news page) | treats "every home sale as the start of a relationship, not the end of a transaction" | [News](https://vinayakgroup.org/news-updates) |
| 3 | Vinayak Group (About) | "3000+ Homes delivered... either before time or on time but never delayed" | [About](https://vinayakgroup.org/about) |
| 4 | Employee, Civil Engineer (AmbitionBox) | "Best working culture in kolkata... Salary always on time." | [AmbitionBox](https://ambitionbox.com/reviews/vinayak-group-reviews/civil-engineer) |
| 5 | Koncite founder, ICTDD 2026 (industry) | "Over 80% of construction sites still run on WhatsApp groups, Excel sheets, and paper." | [RealtyNXT FB](https://www.facebook.com/RealtyNXT/videos/at-ictdd-2026-mahesh-patil-founder-of-koncite-spoke-about-a-problem-most-people-/1517478309825432) |
| 6 | Kolkata buyer, r/KolkataHousing (not about Vinayak) | "the real risk is delay, layout changes, possession uncertainty, construction quality" | [Reddit](https://www.reddit.com/r/KolkataHousing/comments/1ub5c6n/underconstruction_vs_readytomove_flats_in_kolkata) |
| 7 | Buyer, r/indianrealestate (not about Vinayak) | "The builder was launching new projects but wasn't even deploying manpower to finish" | [Reddit](https://www.reddit.com/r/indianrealestate/comments/1j5f4j9/for_those_who_bought_their_first_flat_and) |
| 8 | Buyer, r/indianrealestate (not about Vinayak) | "possession was delayed by 2.5 years... Persistent seepage" | [Reddit](https://www.reddit.com/r/indianrealestate) |
| 9 | Synergy Infracon, a channel partner writing about Vinayak | buyers should ask about "water supply during peak hours, parking allocation, lift waiting times and delayed handover of common areas" | [Synergy](https://synergyinfracon.com/developers/vinayak-group) |

Note: no Vinayak-specific buyer complaints surfaced in the last 30 days (Reddit, HN) or on review sites. Voices 6-8 are about Kolkata and Indian builders in general.

---

## 7. Likely problem-statement areas (ranked for a 6-hour build)

Ranking logic: the brief says "civil and construction"; the area must be doable in 6 hours with a demo dataset; and it must touch their current pressure (21 Acres scale-up, 7 live sites, ~165 staff). Pains only, no solutions.

| Rank | Area | The pain | Evidence |
|---|---|---|---|
| **1** | **Site progress reporting → DPR / plan-vs-actual / RERA quarterly update** | Engineers send photos and messages on WhatsApp, someone rebuilds a DPR, then management and JV partners want plan-vs-actual. WBRERA wants floor-by-floor status with photos every quarter. The website promises monthly construction updates to buyers. The same data gets rewritten for 4 audiences | Brief names "civil and construction"; [WB RERA Rule 16(d)](https://www.legitquest.com/act/west-bengal-real-estate-regulation-and-development-rules-2021/cec0); Construction Updates tab on [project pages](https://vinayakgroup.org/project-details/vinayak-21-acres); [Koncite](https://www.facebook.com/RealtyNXT/videos/at-ictdd-2026-mahesh-patil-founder-of-koncite-spoke-about-a-problem-most-people-/1517478309825432); [Banamind](https://banamind.ai/blog/construction-daily-report-whatsapp-30-seconds) |
| **2** | **Post-sales buyer communication & collections** | 650+ new 21 Acres buyers, plus 6 other projects. Each slab milestone triggers demand letters, payment follow-ups, bank paperwork for loan tranches and "what's the status of my tower?" calls. A customer-experience award they want to keep | [FB 650 homes](https://www.facebook.com/VinayakGroupDevelopers/videos/650-homes-4-months-countless-dreams-taking-shape-what-makes-this-milestone-speci/1588078225845864), [CX award](https://vinayakgroup.org/news-updates), [CLP explainer](https://hnaproptech.com/blog/construction-linked-payment-plan-explained), Post Sales Exec role ([AmbitionBox](https://www.ambitionbox.com/salaries/vinayak-group-salaries/kolkata-location)) |
| **3** | **Material indent, stock and wastage across sites** | Purchase is centralised under a director while 7 sites ask for cement and steel ad hoc. Prices are rising in West Bengal. Wastage is hard to see | [About](https://vinayakgroup.org/about) (Rishi Kyal purchasing), [SiteSetu](https://sitesetu.app/blog/reduce-construction-material-wastage-india), [Business Standard](https://www.business-standard.com/industry/news/cement-prices-rise-sharply-as-fuel-gypsum-costs-continue-to-escalate-125082700894_1.html) |
| **4** | **Contractor work measurement & RA-bill checking** | Claimed vs certified quantities, BOQ matching, retention and advance deductions; disputes and month-end reconstruction | [BuilderXPro](https://builderxpro.com/blog/construction-billing-ra-bills-guide), [Onsite](https://onsiteteams.com/about) |
| **5** | **Channel-partner lead → site visit → booking** | Partners drive most sales; leads repeat across portals; enquiry-to-booking is typically 1-3%; FB replies are templated | [Apex](https://apexinfluence.in/real-estate-channel-partners), [Erino](https://erino.io/blog/how-indian-real-estate-developers-manage-the-customer-journey-from-enquiry-to-sale), [Vinayak Sangam](https://www.facebook.com/VinayakGroupDevelopers/posts/the-people-behind-our-success-deserve-the-spotlight-at-vinayak-group-our-channel/1740876321375142) |

Wildcards: quality and snag inspection before handover (Vista is due Dec 2026); site safety checklists (after the 2026 Kolkata collapse); labour attendance and BOCW registers; a general "AI assistant for every team" (the brief is broad: "across the business").

---

## 8. Users and job titles who'd use a solution

| User | Where | Device / language (ASSUMPTION) | Daily job touching the pain |
|---|---|---|---|
| Site engineer / Sr project engineer | On site | Android phone, Bengali/Hindi/English | Progress photos, DPR, material requests, contractor measurement |
| Site supervisor / foreman / munshi | On site | Basic Android, Bengali/Hindi, low literacy possible | Labour count, work done today |
| Project Manager (Civil) | Site + HO | Phone + laptop | Plan-vs-actual, contractor follow-up, quality |
| Quality engineer | Site | Phone | Checklists, snags, photo proof |
| Store keeper | Site store | Phone / register | GRN, issue slips, stock |
| Purchase team (under Rishi Kyal) | HO | Laptop, Excel | Indents → PO, vendor rates |
| Accounts / billing | HO | Laptop, Tally (ASSUMPTION) | RA bills, demand letters, escrow |
| Sales exec / channel-partner manager | HO + site office | Phone, WhatsApp | Leads, site visits, bookings |
| Post-sales / CRM exec | HO | Laptop + WhatsApp | Demand letters, payment chasing, buyer queries, bank NOCs |
| Directors (Anurag, Rishi, Rahul Kyal) | HO | Phone | One-screen view of all sites, money, sales |
| Homebuyer (incl. NRI) | Anywhere | Phone | "Where is my flat? What do I owe? When is possession?" |

---

## 9. Data they probably have (and what a dataset might look like)

All ASSUMPTION unless linked.

| Data | Likely format | Example columns |
|---|---|---|
| Daily progress | WhatsApp photos + Excel DPR | date, project, tower, floor, activity (slab/brickwork/plaster), qty done, unit, labour count by trade, remarks, photo |
| Schedule / milestones | MS Project or Excel | tower, floor, activity, planned start/end, actual start/end, % complete |
| RERA quarterly update | WBRERA portal ([rera.wb.gov.in](https://rera.wb.gov.in/notification.php)) | quarter, units booked, construction status per building and floor, photos, approvals |
| BOQ / rate analysis | Excel | item code, description, unit, qty, rate, amount |
| Measurement / RA bills | Paper MB + Excel | contractor, work order, item, claimed qty, certified qty, rate, retention %, deductions |
| Material indent / GRN / stock | Excel or ERP | date, site, material, qty requested, approved, received, issued, balance, vendor, rate |
| Labour attendance | Contractor hazri sheets | date, contractor, trade, headcount, hours, wage |
| Drawings | AutoCAD / PDF ([Tavily](https://tavily.com/knowledge/company/uuEzK5GIdQnR)) | drawing no, revision, date |
| Sales / bookings | CRM or Excel | lead source (partner/portal), site-visit date, unit, price, booking date, partner name, commission |
| Customer ledger / CLP | Accounts | buyer, unit, milestone, demand date, amount due, paid, bank, loan tranche, overdue days |
| Buyer queries | WhatsApp / phone / email | date, buyer, unit, query type, response time |

**What the organisers might hand out:** a CSV of DPRs or site photos for one tower; a BOQ + measurement sheet; a buyer payment ledger tied to construction milestones; or a set of WhatsApp-style site messages (Bengali/Hindi/English mix).

---

## 10. Hidden expectations

- **Cheap Android phones and patchy 4G** on site (Hatishala, Newtown AA-III is still developing). It should work offline or sync later.
- **Bengali + Hindi + English mix.** Supervisors and labour contractors are often Bengali or Bihari migrants ([LSE/EPW](https://personal.lse.ac.uk/ghatak/Ghatak_Halder_EPW_2026.pdf)). Use voice notes and photos, not long forms. Sarvam AI is a hackathon partner.
- **WhatsApp is the operating system.** Meet users there, or import from it.
- **Show ₹ or hours saved** (e.g. DPR time, days to reconcile, overdue collections, wasted cement bags). Family owners think in money and delay.
- **Simple enough for site staff**: one screen, few taps, a person can learn it in 5 minutes.
- **Fits what they have** (Excel/Tally exports, RERA formats). No rip-and-replace.
- **Trust and brand:** "Soch Apnepan Ki" and a customer-experience award. Anything buyer-facing must be polite, accurate and in the buyer's language.
- **Multi-project view** (7 sites + JV partners) for the directors.

---

## 11. Five questions for the Vinayak table (10:00-11:00)

1. "Who will use this first: site engineers, the purchase team, or post-sales? And what tool do they use for it today (WhatsApp, Excel, Tally, an ERP)?"
2. "Is there a dataset? If not, can we see a sample DPR, BOQ or demand letter format, even with the numbers changed?"
3. "On 21 Acres, what eats the most hours right now: site reporting, buyer follow-up, or material requests?"
4. "Should it work in Bengali or Hindi, and does it need to run on site phones with weak network?"
5. "How will you judge it in the 16:45 pitch? Which number matters most to you: time saved, cost saved, delays caught, or buyer satisfaction?"

---

## 12. Skills used

| Skill | Used? | What for / result |
|---|---|---|
| tavily-entity | Used | Pinned the right entity: logo tagline match, Kyal Developers CIN, address, directors; ruled out Jai Vinayak Group and the others |
| tavily-research | Used (pro run) | Industry workflow and pain report: DPR, labour/BOCW, materials, RA bills, snags, WBRERA, CLP, software. Sources cited in §3-4 |
| tavily-search | Used | Website pages, RERA numbers, news (Moneycontrol, FB/IG), AmbitionBox, LinkedIn staff, Reddit voices, Tracxn |
| last30days | Used (ran engine) | Reddit + HN for the last 30 days: "Nothing solid this window" for Vinayak; only generic r/ConstructionManagers / r/indianrealestate posts. No SSL errors, but Polymarket was unreachable and YouTube/X were not configured. Voices came from tavily-search instead |
| WebSearch | Used (3 queries) | Gaps: AmbitionBox review text, buyer reviews (most hits were other "Vinayak" firms, so excluded), Navyom possession date |
| product-brainstorming | Used (problem exploration only) | Ranked the 5 likely pain areas in §7; no solutions |
| Skipped | - | No code (by rule). AmbitionBox pages could not be extracted directly; we relied on search snippets |
