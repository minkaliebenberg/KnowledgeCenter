# Proposed Data Model & API

This is stack-agnostic, so map it to whatever the internal website already uses. `users` and `departments` should be the **existing** tables.

## Tables

```text
departments          (existing)  id, name
users                (existing)  id, name, role[employee|supervisor|admin], department_id,
                                 supervisor_id, start_date, sme_department_id NULL
user_department_history          user_id, department_id, from_date, to_date

folders                          id, name, icon, sort_order     -- Policies & Procedures, Reference Materials, ...

documents                        id, title, folder_id, type[SOP|Policy|Manual|Quick Reference|...],
                                 owner_user_id (SME), status[draft|review|active|retired],
                                 next_review_date, source_of_truth BOOL, tags[]
document_links                   from_document_id, to_document_id, section   -- Outgoing/Incoming Links
document_audiences               document_id, department_id | 'ALL'      -- display filter

document_versions                id, document_id, version ('2.0'), status[draft|current|archived],
                                 change_type[initial|minor|major], pushed_to_queue BOOL,
                                 change_summary TEXT,            -- shown to employees in the queue
                                 published_at, published_by, master_file_url (.docx, restricted),
                                 pdf_url
document_sections                id, version_id, sort_order, heading, body_html
  -- RULE: at most one 'current' version per document. Publishing flips the old one to 'archived'.

modules                          id, title, intro, stage[foundation|products|path|ongoing],
                                 est_minutes, pass_mark (default 80), added_at, active BOOL
module_audiences                 module_id, department_id | 'ALL'   (future: role_id)
module_lessons                   module_id, document_id, sort_order   -- references the DOCUMENT, not a version
quiz_questions                   id, module_id, prompt, options JSON, correct_index, source_document_id

completions                      id, user_id, kind[module|update], module_id NULL,
                                 document_version_id NULL,           -- for update acknowledgements
                                 completed_at, score NULL
  -- never deleted; archived versions keep their acknowledgement records

roadmap_items                    id, title, status[idea|planned|progress|review|done|cancelled],
                                 priority[High|Med|Low], work[Create New|Update Existing|Format Drafted],
                                 effort[Minor|Small|Med|Large|Major], type, notes, document_id NULL

submissions                      id, user_id, type[question|topic|request|content|ask_unanswered],
                                 text, document_id NULL, status[new|in_progress|planned|done|declined],
                                 created_at
```

## Key queries (the business rules)

**Visible documents for a user (Know + Ask):**
`documents.status = active` AND current version exists AND (audience = ALL OR audience = user.department_id). Admins see all.

**Required modules:** modules whose audience is ALL or the user's department, ordered by stage (no locking).

**Required updates:** for each visible document whose *current* version has `pushed_to_queue = true`:
include it if `user.start_date < version.published_at` AND there is no unfinished required module that has this document as a lesson.

**Progress:** completed required items ÷ total required items (modules + required updates).

## Suggested API (REST)

```text
GET  /kc/me/queue                       stages, modules, updates, progress
GET  /kc/modules/:id                    module + lessons (current version sections) + quiz (no answers)
POST /kc/modules/:id/attempts           {answers[]} → {score, passed}; records completion if passed
GET  /kc/updates/:versionId             summary, diff vs previous version
POST /kc/updates/:versionId/ack
GET  /kc/me/record                      transcript

GET  /kc/docs?folder=&q=              visible current docs
GET  /kc/docs/:id                       current version + change log

POST /kc/ask {question}                 → {answer, citations[{docId, version, sectionId}]} | {found:false}

GET  /kc/team                           (supervisor/admin) progress per report
GET  /kc/team/:userId

-- admin only --
GET/POST/PATCH /kc/admin/documents
POST /kc/admin/documents/:id/versions   {sections|docxFile, change_type, pushed, summary, audiences}
GET  /kc/admin/archive
GET/PATCH /kc/admin/submissions
GET/POST/PATCH /kc/admin/roadmap
GET  /kc/admin/documents/:id/acks       who has / hasn't acknowledged the current pushed version
GET/POST/PATCH /kc/admin/modules
POST /kc/submissions                    (any user) suggest a topic / ask L&D
```

## Ask (phase 2) indexing
On publish, delete the document's old chunks from the vector index and insert chunks of the new current version, with metadata `{document_id, version, section_id, audiences}`. Filter by audience **before** similarity search. Archived versions are never indexed.
