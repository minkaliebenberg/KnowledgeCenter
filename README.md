# CrownRing Knowledge Center: Prototype

A clickable proof of concept for a **Knowledge Center** in the CrownRing internal website. It replaces today's SharePoint setup (restricted Word masters → PDFs in open folders) with one place for onboarding, ongoing training, reference documents, and controlled publishing.

> **Prototype only.** It runs in the browser with no backend. Folder names and document titles mirror the real SharePoint library, but **all document text is placeholder** and every person except Minka is fictional.

**Live demo:** https://minkaliebenberg.github.io/KnowledgeCenter/

Use the **"viewing as"** dropdown in the dark bar to switch between people and roles. **Reset demo** restores the starting data.

## The areas

| Area | Who sees it | What it does |
|---|---|---|
| **Learn** | Everyone | One progress bar and an ordered **To do** list: process updates first, then onboarding, department and ongoing modules. Completed items stay open for review. |
| **Refer** | Everyone, filtered by department | Search bar plus the same folders as SharePoint (Policies & Procedures, Reference Materials, Guidebooks, Sales Training Guides, CES). Shows current versions only. |
| **Navigate** | Everyone, filtered by department | How-to guides for the systems we use (Zoho Desk, DesignBuddy). A landing page of systems; each system has Start here, guide sections and an FAQ. Reference only, with no tracking. |
| **Ask** | Everyone | AI assistant (**simulated**). It answers only from current documents and how-to guides, links the source, and says so when it can't find an answer. |
| **My Team** | Supervisors (their team), L&D (everyone) | Onboarding, department training and outstanding update acknowledgements per person. |
| **Manage** | L&D only | **Register** (every document with version, status, owner and next review, like the Documentation Map) and **Roadmap** (employee requests → ideas → planned → in progress → under review → completed). Each document page holds its version history (the archive), change log, acknowledgement tracking and links. |

## 5-minute demo

1. **Priya (new hire):** Learn shows her progress and to-do list. Open *Jewellery Fundamentals*: the lessons come straight from Know documents. Pass the quiz.
2. **Jordan (experienced):** the top of his to-do list is the *Heirloom Remount* v2.2 update. Open it, see what changed, and acknowledge.
3. **Ask:** try "What is a memo?", then "What is the parental leave policy?" (a no-answer case that can be sent to L&D).
4. **Dana (supervisor):** My Team shows who's behind.
5. **Minka (L&D):** Manage → Register → filter **Review overdue**. Open *Freight Charges* to see the four documents that link to it. Click **New version**, choose **Major**, add to learning queues and publish. The old version moves into its history, and the acknowledgement tracker appears.
6. **Roadmap:** add an employee request to the roadmap, and open *NC Fully Mounted Service* (Under review) to publish it.

## Files

```
index.html          Built single-file version (what GitHub Pages serves)
src/                Source: index.html, css/styles.css, js/data.js, js/store.js, js/app.js
build.py            Rebuilds index.html from src/
docs/REQUIREMENTS.md  Business rules (start here)
docs/DATA-MODEL.md    Proposed database tables and API
```

The business rules live in `src/js/store.js`. They're short and commented, and they belong on the server in production.
