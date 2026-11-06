# Knowledge Center: Requirements & Business Rules

Owner: Minka, Learning & Development Lead · Status: proof of concept · Last updated: 2026-11-03

## 1. Goals

- **Simple for employees, organized for L&D.** Employees get one place to learn, look things up, and ask questions. L&D gets one controlled place to manage documentation.
- **Self-directed, continuous training.** The training queue is an ongoing responsibility. It doesn't end when onboarding does.
- **A reliable record.** It proves that each employee completed training and acknowledged each important change, and that record survives when the document is later updated.
- **Write once.** Training content is pulled from the knowledge base, so L&D never maintains the same content twice.
- **Fix today's SharePoint problems.** Access depends on roles in the internal website, not on folder permissions.

## 2. Roles & access

| Role | Learn | Know | Ask | My Team | Manage |
|---|---|---|---|---|---|
| Employee | ✓ own queue | ✓ own dept + company-wide | ✓ | – | – |
| Supervisor | ✓ | ✓ | ✓ | ✓ direct reports | – |
| L&D Admin | ✓ | ✓ all depts | ✓ | ✓ everyone | ✓ |
| SME *(flag on any user)* | – | – | – | – | Can submit draft content for their department. Can't publish. |

- Roles should reuse the internal website's existing login, user and department records. **No separate accounts.**
- Manage must be hidden from the navigation **and** enforced server-side.

## 3. Learn

### 3.1 Stages
| # | Stage | Audience | Unlock rule |
|---|---|---|---|
| 1 | Company Foundation (history, culture, org, policies, communication, terminology) | All | Always open |
| 2 | Products & Industry (business model, retailers, jewellery fundamentals, brands/collections) | All | After stage 1 |
| 3 | Department Learning Path (processes, systems, policies + quizzes) | User's dept | After stage 2 |
| 4 | Ongoing Learning (refreshers, launches, advanced paths) | User's dept / All | Modules unlock after stage 3. **Pushed updates are never locked.** |

- A visible progress bar shows the % of required items completed across all stages.
- **Completed modules always stay accessible** for review.
- Future: role-specific paths within a department. The data model already allows this; see `audience`.

### 3.2 Modules
- A module = intro text + an ordered list of **Know documents** (lessons) + a short quiz.
- Lessons always show the **current published version** of each document.
- Quiz pass mark is **80%** (configurable). Retakes are unlimited. The best or first passing score is recorded.
- A module can target several departments ("shared"). Completing it once counts for all of them.

### 3.3 Department transfers
- When an employee changes department, all past completions stay on their record.
- The new requirements are company-wide modules (already done), plus the new department's path and ongoing items. Shared modules they already completed are **not** repeated.
- Department history is stored with dates.

### 3.4 Pushed updates (the "queue" for changes)
When L&D publishes a document version and chooses **push to learning queues**, an update item is required for a user when **all** of these are true:
1. The document applies to the user's department (or to All).
2. The user started before the version was published.
3. The user does **not** have an unfinished module that already teaches that document. (They'll learn the new version there, so it would be redundant.)

An update item shows:
- The **summary of changes** written by L&D. This lives in the queue, not in the document.
- An optional word-level "what changed" view comparing the new version to the previous one.
- A link to the full current document.
- An "I have read and understand" checkbox and an **Acknowledge** button, which creates a dated completion record.

If a pushed version is superseded before someone acknowledges it, only the newest version stays in their queue. Existing acknowledgement records are never deleted.

## 4. Know
- Six categories: Company & Culture · Product & Industry Knowledge · Systems & Tools · Policies & Procedures · Quality & Manufacturing · Reference & Troubleshooting. These should be admin-configurable.
- Each document is tagged with departments, which act as a **display filter**. Employees see company-wide documents plus their own department's.
- Search covers titles, tags and body text, and **only current published versions**. Drafts and archived versions are never shown.
- Each document page shows: sections with anchors, the version and date, the departments it applies to, the SME, which modules teach it, a change log of version summaries, print/PDF, and "Question about this document?".

## 5. Ask (AI assistant): future phase, simulated in the prototype
**Must:**
- Retrieve only from **current, published** documents the user is allowed to see. **Never** use archived or draft versions.
- Identify the relevant policy or procedure and give a **concise** answer grounded in it.
- **Link directly** to the source document and section, including the version and date.
- **Say so** when no reliable answer exists. It must not invent policy or guess. It offers to send the question to L&D, and those questions land in Manage → Requests.

**Suggested implementation:** retrieval-augmented generation (RAG). Chunk documents by section, embed them, store them with `doc_id`, `version`, `status` and `departments` metadata, and filter on `status = current` and the user's departments **before** retrieval. The system prompt should require citations and allow an "I don't know" answer. Re-index on publish.

## 6. Manage (L&D only)
Same mental model as today's SharePoint folders:

| SharePoint today | Knowledge Center |
|---|---|
| Restricted folder: master Word docs | **Document library**: master content + optional attached .docx master |
| Restricted folder: archived versions | **Archive**: every superseded version, read-only, with acknowledgement records |
| Open folder: current PDFs | **Published**: current version, shown in Know (PDF available via print/export) |

### 6.1 Workflow
1. **SME submits** content (draft) for their department. SMEs are accountable for technical accuracy.
2. **L&D reviews**: structure, writing standards, formatting, organization. L&D can edit, return it to the SME, or publish.
3. **Publish**, choosing the type of change:
   - **Minor** (formatting, typos, clarification): `x.y → x.y+1`. Silent, so **nothing is added to learning queues**.
   - **Major** (process or policy change): `x.y → x+1.0`. **Optionally** pushed to learning queues, with a required plain-language summary of changes.
   - **New document**: `1.0`. Optionally pushed (for example, a new product launch everyone must read).
4. The previous current version is **automatically archived**. It's never deleted.

### 6.2 Other Manage features
- Document metadata: title, category, departments (display filter), SME/owner, tags.
- A learning path map showing which modules use which documents.
- A Requests inbox for employee questions, topic ideas, documentation requests, SME submissions, and unanswered Ask questions, with a status for each.
- (Future) Review reminders, such as "document not reviewed in 12 months".

## 7. Content format: decision needed
The prototype stores documents as **structured sections** (heading + body). That's what makes search, section links, word-level change comparisons and the AI assistant possible. Options for production:
- **A. Author in the web editor** (rich text). Simplest pipeline. PDF is generated on demand.
- **B. Upload the Word master**, which the site converts (for example, with Pandoc or Mammoth) into HTML sections plus a PDF. This keeps L&D's Word workflow. Formatting must follow a template so the conversion is clean.
- **Recommendation:** start with **B** using a standard Word template, and keep the .docx attached to each version as the official master.

## 8. Out of scope for v1
Role-specific paths within a department, certificates, due dates and reminders, multilingual content, and analytics dashboards.
