# CrownRing Knowledge Center: Prototype

A clickable proof of concept for a **Knowledge Center** module to be added to the CrownRing internal website. It replaces the current SharePoint setup (restricted Word masters → exported PDFs in open folders) with one system for onboarding, continuous learning, reference documentation, and controlled publishing.

> **This is a prototype.** It runs in the browser with sample data and no backend. Its purpose is to show *how it should work*. It's not production code. All company content in it is placeholder text.

## Run it

No build step and no dependencies. Pick one:

- **GitHub Pages:** Settings → Pages → Deploy from branch → `main` / root. Then open the Pages URL.
- **Locally:** `python3 -m http.server` in this folder, then open http://localhost:8000. (You can also open `index.html` directly.)

Use the **"viewing as"** switcher in the dark bar at the top to change roles. **Reset demo** restores the sample data.

## The four areas

| Area | Who sees it | What it does |
|---|---|---|
| **Learn** | Everyone | Staged training queue with a progress bar: Company Foundation → Products & Industry → Department Learning Path → Ongoing Learning. Lessons are pulled live from Know documents. Short quizzes, a permanent learning record, and update acknowledgements. |
| **Know** | Everyone (filtered by department) | Searchable knowledge base in 6 categories. Shows only current, published versions, and each document has a change log. |
| **Ask** | Everyone | AI assistant (**simulated** here). It answers only from current, approved docs for the user's department, always links the source, and says so when it can't find an answer. |
| **My Team** | Supervisors (their reports), L&D (everyone) | Onboarding and path progress, plus outstanding update acknowledgements per person. |
| **Manage** | L&D admin only | Document library (masters), SME review queue, publishing with **minor/silent** vs **major/pushed** changes, archive with acknowledgement records, learning-path map, and an employee requests inbox. |

Every user also gets **Suggest a topic**, which sends questions, documentation requests and topic ideas to L&D. SMEs can submit content through it as well.

## Suggested demo script (5 minutes)

1. **Priya (new CS hire):** Learn shows her progress, the "Up next" item, and the Department Path locked until she finishes Products & Industry. Open *Jewellery Fundamentals*: the lessons come from Know documents. Pass the quiz.
2. **Jordan (experienced CS rep):** Learn has an **update** for the RMA procedure. Open it to see the plain-language summary and the exact wording changes, then acknowledge it.
3. **Ask** (any user): try "Who approves a rush order?" and then "What is the parental leave policy?". The second one is a no-answer case, and the user can send the question to L&D.
4. **Dana (CS supervisor):** My Team shows who has finished onboarding and who still owes an update acknowledgement.
5. **Minka (L&D):** Manage → Document library → *Rush Order Policy* → New version. Edit a section, choose **Major**, push it to queues, write a summary, and publish. Then check the Archive (the old version is kept with its records). Review queue → *Aurora Bridal* → publish it as a launch pushed to everyone.
6. **Department transfer:** as Minka, go to My Team → Jordan → change his department to Shipping. Switch to Jordan: his company-wide and shared modules carry over, and only the Shipping units are new.

## Files

```
index.html          Page shell
css/styles.css      All styling (colour tokens at the top, with dark mode)
js/data.js          Sample data: departments, users, documents + versions, modules, completions
js/store.js         Business rules (who sees what, what's required, versioning, Ask retrieval)
js/app.js           Views + hash router
docs/REQUIREMENTS.md  Functional requirements & business rules (for the developer)
docs/DATA-MODEL.md    Proposed database tables / API endpoints
```

## For the web developer

Start with **`docs/REQUIREMENTS.md`** and **`docs/DATA-MODEL.md`**. The prototype's code isn't meant to be lifted as-is. The important parts are the business rules in `js/store.js` (they're short and commented), and those belong on the server.
