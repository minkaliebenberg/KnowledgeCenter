# Knowledge Center: Requirements & Business Rules

Owner: Minka, Learning & Development Lead · Status: proof of concept · Last updated: 2026-11-09

## 1. Goals

- **Simple for employees, organized for L&D.** Minimal text and clutter, so employees actually use it.
- **Self-directed, continuous training.** The to-do list never "finishes". New updates and launches keep landing there.
- **A reliable record** that each employee completed training and acknowledged each important change. The record survives later updates.
- **Write once.** Training lessons are pulled from Know documents, so nothing is maintained twice.
- **Fix SharePoint's permission problems.** Access comes from the internal website's roles, not folder permissions.

## 2. Roles & access

| Role | Learn | Know | Ask | My Team | Manage |
|---|---|---|---|---|---|
| Employee | ✓ | ✓ own dept + company-wide | ✓ | – | – |
| Supervisor | ✓ | ✓ | ✓ | ✓ their team | – |
| L&D Admin | ✓ | ✓ all | ✓ | ✓ everyone | ✓ |
| SME (flag on any user) | | | | | Submits draft content for their department. Can't publish. |

Reuse the internal website's existing users and departments. Enforce Manage server-side.

## 3. Learn

- **One progress bar** (% of required items complete) and **one ordered to-do list**. No visible stage breakdown.
- Order: **pushed updates first**, then modules by stage: Onboarding (company foundation, products & industry) → Department → Ongoing. Stages exist only to set the order and for supervisor reporting.
- Completed items sit in a collapsed **Completed** list and always stay open for review.
- **Module** = an ordered list of Know documents (shown at their current version) plus a short quiz. Pass mark 80%, unlimited retries.
- A module can target several departments. Completing it once counts everywhere.
- **Department transfer:** past completions are kept. Only the new department's modules are added.

### Pushed updates
An update is required for a user when **all** of these are true:
1. The document applies to their department.
2. They started before the version was published.
3. They don't have an unfinished module that already teaches that document.

The update screen shows L&D's **summary of changes** (held in the queue, not in the document), an optional word-level comparison, and a link to the full document. The user ticks "I've read and understand" and clicks **Acknowledge**, which creates a dated record. Only the newest pushed version is required. Older acknowledgements are kept.

## 4. Know

- A search bar, then **folder tiles that match the SharePoint library**: Policies & Procedures, Reference Materials, Guidebooks, Sales Training Guides, CES. Below them, a short **Recently updated** list.
- A folder opens as a simple file list (name, type, date).
- Documents are filtered by department tags. Search covers only **current, active** versions.
- The document page shows: title, type, version and date; PDF and "Question?" buttons; the content; **Related** documents (its links); and a collapsed version history.

## 5. Ask (AI assistant): future phase, simulated here

**Must:**
- Use only **current, active** documents the user can see. **Never** archived versions or drafts.
- Give a short answer with a **link to the source** document and section.
- **Say so** when it can't find an answer. It must never guess. It offers to send the question to L&D, which lands in Manage → Roadmap → Requests.

**Suggested approach:** retrieval-augmented generation. Chunk documents by section, store `doc_id`, `version`, `status` and `departments` with each chunk, filter before searching, and re-index on publish.

## 6. Manage (L&D only): mirrors the Documentation Map spreadsheet

### Register
- A table of every document: **Document · Folder · Type · Version · Status · Owner · Next review**.
- Filters: Active · Drafts & review · Review overdue · Archived · All. There's also search.
- Statuses: Draft, Under review (SME submission), Active, Archived (retired document, hidden from Know and Ask).
- Types: SOP, Policy, Manual, Quick Reference, Process / Workflow, Directory, Form, Video, Decision Map, Glossary.
- **Review dates:** "Overdue" and "Soon" (within 60 days) flags. Publishing resets the next review to +1 year.

### Document page
- **Versions table** = archive + change log. Each version shows its date, change type (New / Minor / Major / Pushed), summary, and a read-only view of archived versions with who acknowledged them.
- **Acknowledgement tracker** for the current pushed version: X of Y, plus who's outstanding.
- **Details:** owner/SME, shown to (departments), next review, source of truth.
- **Links:** "Linked from" and "Links to" (Documentation Map's Outgoing/Incoming Links). When publishing a new version, L&D is warned which documents link to this one.
- Archive / restore the whole document.

### Publishing
1. The SME submits a draft. L&D reviews it for structure, standards and formatting. The SME is accountable for accuracy.
2. Choose the change type:
   - **Minor** (typos, formatting, clarification): `x.y → x.y+1`. Silent, so nothing goes to learning queues.
   - **Major** (process or policy change): `x.y → x+1.0`. **Optionally** pushed to learning queues, with a required summary.
   - **New document**: `1.0`, optionally pushed (for example, a launch everyone must read).
3. The previous version is archived automatically, never deleted.

### Roadmap
- Columns: **Requests** (from employees) → Idea → Planned → In progress → Under review → Completed.
- Item fields: priority, work (Create New / Update Existing / Format Drafted), effort, type, notes, linked document.
- Requests can be added to the roadmap or dismissed. Publishing a document marks its roadmap item Completed.

## 7. Content format: decision needed
Documents are stored as **sections** (heading + text). That's what makes search, section links, change comparisons and the AI assistant work.
- **Recommended:** keep writing in Word using the existing templates (`TEMPLATE - Procedures.dotx`, `TEMPLATE - Module.dotx`) and upload the .docx. The site converts it into sections and a PDF, and keeps the .docx as the official master.
- Alternative: write directly in a web editor.
- Non-text files (Excel price lists, images, videos) can be attached to a document as downloads.

## 8. Out of scope for v1
Role-specific paths, certificates, due dates and reminders, multilingual content, and analytics.
