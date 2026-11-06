/* =============================================================================
   CrownRing Knowledge Center — SEED DATA (prototype only)
   -----------------------------------------------------------------------------
   Everything in this file is SAMPLE content used to demonstrate the flows.
   In production this would live in a database (see docs/DATA-MODEL.md).
   Company facts, procedures and names below are placeholders, not real policy.
   ========================================================================== */

window.SEED = {
  today: '2026-11-03',

  departments: [
    { id: 'CS', name: 'Customer Service' },
    { id: 'OP', name: 'Order Processing' },
    { id: 'AR', name: 'Accounting' },
    { id: 'SH', name: 'Shipping & Receiving' },
  ],

  categories: [
    { id: 'company',   name: 'Company & Culture',            icon: '◆' },
    { id: 'product',   name: 'Product & Industry Knowledge', icon: '◇' },
    { id: 'systems',   name: 'Systems & Tools',              icon: '▣' },
    { id: 'policies',  name: 'Policies & Procedures',        icon: '☰' },
    { id: 'quality',   name: 'Quality & Manufacturing',      icon: '✦' },
    { id: 'reference', name: 'Reference & Troubleshooting',  icon: '?' },
  ],

  /* role: employee | supervisor | admin.  sme: subject-matter expert for a dept */
  users: [
    { id: 'u1', name: 'Priya Shah',   role: 'employee',   dept: 'CS', supervisor: 'u3', start: '2026-10-20', title: 'Customer Service Representative', deptHistory: [] },
    { id: 'u4', name: 'Jordan Reyes', role: 'employee',   dept: 'CS', supervisor: 'u3', start: '2025-03-10', title: 'Customer Service Representative', deptHistory: [] },
    { id: 'u2', name: 'Marcus Lee',   role: 'employee',   dept: 'OP', supervisor: 'u7', start: '2024-06-01', title: 'Order Processing Coordinator',    deptHistory: [{ dept: 'CS', from: '2024-06-01', to: '2026-09-01' }] },
    { id: 'u6', name: 'Sam Novak',    role: 'employee',   dept: 'OP', supervisor: 'u7', start: '2021-02-15', title: 'Senior Order Coordinator', sme: 'OP', deptHistory: [] },
    { id: 'u3', name: 'Dana Okafor',  role: 'supervisor', dept: 'CS', supervisor: null, start: '2022-01-10', title: 'Customer Service Supervisor', sme: 'CS', deptHistory: [] },
    { id: 'u7', name: 'Rob Tran',     role: 'supervisor', dept: 'OP', supervisor: null, start: '2020-05-04', title: 'Order Processing Supervisor', deptHistory: [] },
    { id: 'u5', name: 'Minka',        role: 'admin',      dept: 'CS', supervisor: null, start: '2023-04-03', title: 'Learning & Development Lead', deptHistory: [] },
  ],

  /* ---------------------------------------------------------------------------
     DOCUMENTS — the single source of truth. Learn modules and Ask both read
     from here. depts: ['ALL'] or a list of department ids (display filter).
     versions[]: newest last. Only status 'current' is shown to employees;
     'archived' versions are kept for the record and never used by Ask.
     type: initial | minor (silent) | major (pushed to learning queues)
  --------------------------------------------------------------------------- */
  documents: [
    {
      id: 'D1', title: 'Our Story, Mission & Values', category: 'company', depts: ['ALL'],
      owner: 'u5', status: 'published', tags: ['history', 'culture', 'values', 'mission'],
      versions: [{ v: '1.0', date: '2025-01-15', type: 'initial', by: 'u5', status: 'current', summary: 'Initial release.',
        sections: [
          { h: 'Where we come from', body: 'SAMPLE CONTENT — replace with the real company history.\n\nCrownRing began as a small bench-jewellery workshop and grew into a full-service manufacturer producing fine jewellery for independent and national retailers across North America.' },
          { h: 'Our mission', body: 'To craft fine jewellery our retail partners are proud to sell, delivered accurately and on time, backed by service that makes us easy to work with.' },
          { h: 'Our values', body: '- **Craftsmanship** — every piece is inspected before it leaves the building.\n- **Accuracy** — small details (sizes, stamps, stones) matter to the end customer.\n- **Partnership** — retailers are long-term partners, not transactions.\n- **Ownership** — if you see a problem, raise it; if you own a task, close the loop.' },
        ] }],
    },
    {
      id: 'D2', title: 'Attendance, Hours & Time Off', category: 'policies', depts: ['ALL'],
      owner: 'u5', status: 'published', tags: ['attendance', 'sick', 'vacation', 'hours', 'late', 'absence'],
      versions: [{ v: '1.0', date: '2025-01-15', type: 'initial', by: 'u5', status: 'current', summary: 'Initial release.',
        sections: [
          { h: 'Office hours', body: 'Administrative office hours are 8:30 a.m. to 4:30 p.m., Monday to Friday, with a 30-minute unpaid lunch.' },
          { h: 'Reporting an absence or late arrival', body: 'If you will be absent or more than 10 minutes late, message your supervisor **before 8:30 a.m.** on the day. A message to a co-worker does not count as notice.' },
          { h: 'Requesting vacation', body: '- Submit vacation requests in the HR portal at least **two weeks** in advance.\n- Requests during the November–December holiday peak need supervisor approval and may be limited.\n- Approval is not confirmed until you receive it in writing through the portal.' },
        ] }],
    },
    {
      id: 'D3', title: 'Communication Expectations', category: 'company', depts: ['ALL'],
      owner: 'u5', status: 'published', tags: ['email', 'teams', 'response time', 'communication'],
      versions: [{ v: '1.0', date: '2025-02-01', type: 'initial', by: 'u5', status: 'current', summary: 'Initial release.',
        sections: [
          { h: 'Which channel to use', body: '- **Internal website tasks** — anything tied to an order, RMA or account.\n- **Teams chat** — quick internal questions.\n- **Email** — anything a retailer sees, or that needs a record.' },
          { h: 'Response times', body: 'Reply to retailer emails within **one business day**, even if only to confirm you are looking into it. Internal Teams messages should be acknowledged the same day.' },
          { h: 'Professional tone', body: 'Write to retailers as a partner: clear, polite and specific. Always include the order or RMA number in the subject line.' },
        ] }],
    },
    {
      id: 'D4', title: 'Jewellery Terminology Glossary', category: 'reference', depts: ['ALL'],
      owner: 'u5', status: 'published', tags: ['glossary', 'terms', 'vocabulary', 'definitions'],
      versions: [{ v: '1.0', date: '2025-02-10', type: 'initial', by: 'u5', status: 'current', summary: 'Initial release.',
        sections: [
          { h: 'Common terms', body: '- **Shank** — the band of a ring that goes around the finger.\n- **Head** — the part of a ring that holds the centre stone.\n- **Prong** — a small metal claw that holds a stone in place.\n- **Bezel** — a metal rim that surrounds a stone completely.\n- **Pavé** — many small stones set close together so the surface appears paved.\n- **Finding** — a component such as a clasp, jump ring or earring post.\n- **Stamp / hallmark** — markings showing metal quality (e.g. 14K) and maker.' },
          { h: 'Order and production terms', body: '- **SKU / style number** — the unique identifier for a design.\n- **Memo** — goods sent to a retailer on consignment, not sold.\n- **RMA** — Return Merchandise Authorization, required before any return.\n- **Casting** — pouring molten metal into a mould to form a piece.' },
        ] }],
    },
    {
      id: 'D5', title: 'Precious Metals & Karat Guide', category: 'product', depts: ['ALL'],
      owner: 'u5', status: 'published', tags: ['gold', 'karat', 'platinum', 'silver', 'metal', '10k', '14k', '18k'],
      versions: [{ v: '1.0', date: '2025-02-10', type: 'initial', by: 'u5', status: 'current', summary: 'Initial release.',
        sections: [
          { h: 'Gold karats', body: 'Karat describes how much of the metal is pure gold, out of 24 parts.\n\n- **10K** — 41.7% gold\n- **14K** — 58.3% gold\n- **18K** — 75.0% gold\n\nHigher karat means richer colour and higher value, but a softer metal.' },
          { h: 'Gold colours', body: 'Yellow, white and rose gold differ by the alloy mixed with the gold. White gold is usually rhodium-plated for a bright white finish, and may need re-plating over time.' },
          { h: 'Platinum and silver', body: '- **Platinum (950)** — dense, naturally white, hypoallergenic; heavier and more expensive.\n- **Sterling silver (925)** — 92.5% silver; affordable, but tarnishes.' },
        ] }],
    },
    {
      id: 'D6', title: 'Ring Construction & Setting Styles', category: 'product', depts: ['ALL'],
      owner: 'u5', status: 'published', tags: ['ring', 'setting', 'prong', 'bezel', 'channel', 'pave', 'construction', 'size'],
      versions: [{ v: '1.0', date: '2025-03-01', type: 'initial', by: 'u5', status: 'current', summary: 'Initial release.',
        sections: [
          { h: 'Parts of a ring', body: 'A ring is made of the **shank** (band), the **head** (holds the centre stone) and often **side stones** set into the shank.' },
          { h: 'Setting styles', body: '- **Prong** — claws hold the stone; maximises light.\n- **Bezel** — metal rim; very secure, modern look.\n- **Channel** — stones set between two walls of metal.\n- **Pavé** — tiny stones set closely across the surface.' },
          { h: 'Ring sizing', body: 'Standard production sizes run from 3 to 13 in quarter sizes. Pieces with stones set all the way around (eternity bands) **cannot be resized** and must be made to size.' },
        ] }],
    },
    {
      id: 'D7', title: 'Business Model & Retailer Relationships', category: 'product', depts: ['ALL'],
      owner: 'u5', status: 'published', tags: ['retailer', 'business model', 'memo', 'wholesale', 'accounts'],
      versions: [{ v: '1.0', date: '2025-03-01', type: 'initial', by: 'u5', status: 'current', summary: 'Initial release.',
        sections: [
          { h: 'How we make money', body: 'We sell **wholesale** to retailers, who sell to the public. We do not sell directly to consumers. If a consumer contacts us, refer them politely to their retailer.' },
          { h: 'Types of retail accounts', body: '- **Independent retailers** — single or small groups of stores; often custom and special orders.\n- **Key accounts** — national chains with their own ordering rules and portals.' },
          { h: 'Memo vs. purchase', body: 'Goods on **memo** remain our property until the retailer sells or returns them. Memo items must be tracked carefully and are never invoiced until sold.' },
        ] }],
    },
    {
      id: 'D8', title: 'Order Entry Procedure', category: 'policies', depts: ['CS', 'OP'],
      owner: 'u6', status: 'published', tags: ['order', 'entry', 'po', 'purchase order', 'new order', 'special order'],
      versions: [
        { v: '1.0', date: '2025-04-01', type: 'initial', by: 'u6', status: 'archived', summary: 'Initial release.',
          sections: [
            { h: 'Before you start', body: 'Confirm the retailer account is active.' },
            { h: 'Entering the order', body: 'Enter style number, metal, size and quantity. Save the order.' },
          ] },
        { v: '1.1', date: '2025-09-12', type: 'minor', by: 'u5', status: 'archived', summary: 'Formatting and typo corrections.',
          sections: [
            { h: 'Before you start', body: 'Confirm the retailer account is active and not on credit hold.' },
            { h: 'Entering the order', body: 'Enter the style number, metal, size and quantity. Save the order.' },
          ] },
        { v: '2.0', date: '2026-08-15', type: 'major', by: 'u6', status: 'current', pushed: true,
          summary: 'The retailer PO number is now a REQUIRED field, and special orders must have the "Special" flag set before saving. Orders without a PO number will be held by Accounting.',
          sections: [
            { h: 'Before you start', body: 'Confirm the retailer account is active and **not on credit hold**. If it is on hold, do not enter the order — forward the request to Accounting.' },
            { h: 'Entering the order', body: '- Enter the **retailer PO number** (required — orders without one are held).\n- Enter style number, metal, ring size and quantity.\n- If anything is non-standard (custom size, stone upgrade, engraving), tick **Special order**.\n- Save, then email the order confirmation to the retailer.' },
            { h: 'Common mistakes', body: '- Entering the size in the notes field instead of the size field.\n- Forgetting the Special flag — the order then goes to stock picking instead of production.' },
          ] },
      ],
    },
    {
      id: 'D9', title: 'Returns & Repairs (RMA) Procedure', category: 'policies', depts: ['CS', 'OP', 'SH'],
      owner: 'u3', status: 'published', tags: ['return', 'rma', 'repair', 'warranty', 'damaged', 'refund'],
      versions: [
        { v: '2.0', date: '2025-06-01', type: 'major', by: 'u3', status: 'archived', pushed: true, summary: 'RMA numbers now generated in the internal website.',
          sections: [
            { h: 'Issuing an RMA', body: 'Create the RMA in the internal website and email the RMA number to the retailer.' },
            { h: 'Receiving the return', body: 'Shipping logs the package against the RMA number.' },
          ] },
        { v: '3.0', date: '2026-10-28', type: 'major', by: 'u3', status: 'current', pushed: true,
          summary: 'Retailers must now send photos of the item before an RMA is approved, and RMAs expire after 30 days. Shipping must photograph every return on arrival.',
          sections: [
            { h: 'Issuing an RMA', body: '- Ask the retailer for **photos of the item** and a description of the issue.\n- Create the RMA in the internal website and attach the photos.\n- Email the RMA number to the retailer. **RMAs expire after 30 days.**\n- No item may be returned without an RMA number on the outside of the package.' },
            { h: 'Receiving the return', body: 'Shipping & Receiving logs the package against the RMA number and **photographs the item on arrival** before it goes to Quality for assessment.' },
            { h: 'Repairs vs. credits', body: 'Quality decides whether an item is repaired, replaced or credited. Customer Service communicates the decision to the retailer within **two business days** of the assessment.' },
          ] },
      ],
    },
    {
      id: 'D10', title: 'Customer Service Call Handling Standards', category: 'policies', depts: ['CS'],
      owner: 'u3', status: 'published', tags: ['phone', 'call', 'greeting', 'escalation', 'customer'],
      versions: [{ v: '1.0', date: '2025-05-01', type: 'initial', by: 'u3', status: 'current', summary: 'Initial release.',
        sections: [
          { h: 'Greeting', body: 'Answer within three rings: "Thank you for calling CrownRing, this is [name], how can I help you?"' },
          { h: 'Verifying the caller', body: 'Confirm the **retailer account number** and the caller\'s name before discussing any order or pricing.' },
          { h: 'Escalations', body: 'If a retailer asks for a manager, or the issue involves a credit over $500, transfer to the Customer Service Supervisor. Log the escalation on the account.' },
        ] }],
    },
    {
      id: 'D11', title: 'Rush Order Policy', category: 'policies', depts: ['CS', 'OP', 'SH'],
      owner: 'u6', status: 'published', tags: ['rush', 'urgent', 'expedite', 'fast', 'deadline', 'turnaround'],
      versions: [
        { v: '1.0', date: '2025-07-01', type: 'initial', by: 'u6', status: 'archived', summary: 'Initial release.',
          sections: [
            { h: 'What counts as a rush', body: 'Any order needed in under 5 business days.' },
            { h: 'Approval', body: 'Rush orders need Order Processing Supervisor approval.' },
          ] },
        { v: '1.1', date: '2026-10-05', type: 'minor', by: 'u5', status: 'current', pushed: false, summary: 'Clarified wording; no change to the process.',
          sections: [
            { h: 'What counts as a rush', body: 'Any order the retailer needs shipped in **fewer than 5 business days** (standard production is 10 business days).' },
            { h: 'Approval', body: 'Rush orders require approval from the **Order Processing Supervisor** before you confirm a date with the retailer. A rush fee may apply.' },
            { h: 'Shipping a rush', body: 'Rush orders ship by overnight courier and are marked with a red RUSH label.' },
          ] },
      ],
    },
    {
      id: 'D12', title: 'Quality Inspection Checkpoints', category: 'quality', depts: ['OP', 'SH'],
      owner: 'u6', status: 'published', tags: ['quality', 'inspection', 'qc', 'check', 'stamp', 'defect'],
      versions: [
        { v: '1.0', date: '2025-05-15', type: 'initial', by: 'u6', status: 'archived', summary: 'Initial release.',
          sections: [{ h: 'Final inspection', body: 'Check size, stamp and stones before packing.' }] },
        { v: '2.0', date: '2026-10-30', type: 'major', by: 'u6', status: 'current', pushed: true,
          summary: 'A second sign-off is now required for any piece with a centre stone over 1 ct, and the inspection checklist is now completed in the internal website instead of on paper.',
          sections: [
            { h: 'Final inspection checklist', body: '- Size matches the order.\n- Metal stamp (e.g. 14K) and maker\'s mark are present and legible.\n- All stones present, secure and free of chips.\n- Finish is clean, with no tool marks.\n\nComplete the checklist **in the internal website** (paper checklists are retired).' },
            { h: 'High-value pieces', body: 'Any piece with a **centre stone over 1 ct** requires a second inspector\'s sign-off before packing.' },
          ] },
      ],
    },
    {
      id: 'D13', title: 'Insured Parcel Packing & Shipping', category: 'policies', depts: ['SH'],
      owner: 'u5', status: 'published', tags: ['shipping', 'packing', 'courier', 'insurance', 'parcel'],
      versions: [{ v: '1.0', date: '2025-05-20', type: 'initial', by: 'u5', status: 'current', summary: 'Initial release.',
        sections: [
          { h: 'Packing', body: 'Pack each order in a plain, unbranded box. Never write "jewellery" or the company name on the outside of the parcel.' },
          { h: 'Insurance', body: 'Every parcel is insured for its full wholesale value and requires a signature on delivery.' },
        ] }],
    },
    {
      id: 'D14', title: 'Invoicing & Credit Notes', category: 'policies', depts: ['AR'],
      owner: 'u5', status: 'published', tags: ['invoice', 'credit', 'credit note', 'billing', 'payment'],
      versions: [{ v: '1.0', date: '2025-06-10', type: 'initial', by: 'u5', status: 'current', summary: 'Initial release.',
        sections: [
          { h: 'When to invoice', body: 'Invoices are generated automatically when an order ships. Memo goods are invoiced only when the retailer reports them as sold.' },
          { h: 'Issuing a credit note', body: 'Credit notes require an approved RMA decision from Quality. Credits over $500 also require the Accounting Supervisor\'s approval.' },
        ] }],
    },
    {
      id: 'D15', title: 'Internal Website: Order Lookup Quick Reference', category: 'systems', depts: ['CS', 'OP', 'AR', 'SH'],
      owner: 'u5', status: 'published', tags: ['system', 'website', 'lookup', 'search', 'order status', 'tool'],
      versions: [{ v: '1.0', date: '2025-04-01', type: 'initial', by: 'u5', status: 'current', summary: 'Initial release.',
        sections: [
          { h: 'Finding an order', body: 'Use the search bar at the top of the Orders page. You can search by order number, retailer PO number or retailer account number.' },
          { h: 'Order statuses', body: '- **Entered** — saved, not yet released.\n- **Pending production** — waiting for the shop floor.\n- **In production** — being made.\n- **QC** — in final inspection.\n- **Shipped** — tracking number available on the order.' },
        ] }],
    },
    {
      id: 'D16', title: 'Troubleshooting: Order Stuck in "Pending Production"', category: 'reference', depts: ['CS', 'OP'],
      owner: 'u6', status: 'published', tags: ['stuck', 'pending', 'delay', 'troubleshooting', 'late order'],
      versions: [{ v: '1.0', date: '2025-08-01', type: 'initial', by: 'u6', status: 'current', summary: 'Initial release.',
        sections: [
          { h: 'Check these first', body: '- Is the **Special order** flag set? Special orders wait for a production review.\n- Is the account on **credit hold**? Held accounts are not released.\n- Is a **PO number** missing? Orders without one are held by Accounting.' },
          { h: 'Still stuck?', body: 'If none of the above apply and the order has been pending for more than 3 business days, message the Order Processing Supervisor with the order number.' },
        ] }],
    },
    {
      id: 'D17', title: 'New Collection Launch: Aurora Bridal', category: 'product', depts: ['ALL'],
      owner: 'u6', status: 'in_review', tags: ['aurora', 'bridal', 'collection', 'launch', 'new product'],
      versions: [{ v: '0.1', date: '2026-10-31', type: 'draft', by: 'u6', status: 'draft', summary: 'Draft submitted by SME for L&D review.',
        sections: [
          { h: 'About the collection', body: 'SAMPLE — Aurora Bridal is a new line of engagement rings and matching bands available in 14K and 18K, white, yellow and rose gold.' },
          { h: 'What to tell retailers', body: 'Launch kits ship to key accounts first. Independent retailers can pre-order from the start of next month.' },
        ] }],
    },
  ],

  /* ---------------------------------------------------------------------------
     LEARNING MODULES. Lessons are references to documents — content is pulled
     live from the Know library, so L&D never writes it twice.
     stage: foundation | products | path | ongoing
     depts: ['ALL'] or list (a shared departmental module counts for every
     listed dept, so switching departments never repeats it).
  --------------------------------------------------------------------------- */
  modules: [
    { id: 'M1', stage: 'foundation', depts: ['ALL'], title: 'Welcome to CrownRing', minutes: 10, docs: ['D1'],
      intro: 'Start here. Learn where we come from and what we value.',
      quiz: [
        { q: 'Who are our direct customers?', options: ['Members of the public', 'Retailers', 'Other manufacturers'], a: 1, docRef: 'D7' },
        { q: 'Which value means "if you own a task, close the loop"?', options: ['Craftsmanship', 'Partnership', 'Ownership'], a: 2, docRef: 'D1' },
      ] },
    { id: 'M2', stage: 'foundation', depts: ['ALL'], title: 'Workplace Policies & Communication', minutes: 15, docs: ['D2', 'D3'],
      intro: 'The day-to-day expectations that apply to everyone.',
      quiz: [
        { q: 'You will be 20 minutes late. When must you tell your supervisor?', options: ['When you arrive', 'Before 8:30 a.m.', 'By end of day'], a: 1, docRef: 'D2' },
        { q: 'How quickly should you reply to a retailer email?', options: ['Within one business day', 'Within one week', 'Only when resolved'], a: 0, docRef: 'D3' },
      ] },
    { id: 'M3', stage: 'products', depts: ['ALL'], title: 'Our Business & Retailers', minutes: 10, docs: ['D7'],
      intro: 'How our business works and who we serve.',
      quiz: [
        { q: 'When is a memo item invoiced?', options: ['When it ships', 'When the retailer reports it sold', 'At month end'], a: 1, docRef: 'D7' },
      ] },
    { id: 'M4', stage: 'products', depts: ['ALL'], title: 'Jewellery Fundamentals', minutes: 25, docs: ['D5', 'D6', 'D4'],
      intro: 'Metals, ring construction and the vocabulary you will hear every day.',
      quiz: [
        { q: 'What percentage of 14K gold is pure gold?', options: ['41.7%', '58.3%', '75.0%'], a: 1, docRef: 'D5' },
        { q: 'Which setting surrounds the stone with a metal rim?', options: ['Prong', 'Bezel', 'Pavé'], a: 1, docRef: 'D6' },
        { q: 'Can an eternity band be resized?', options: ['Yes, up to 2 sizes', 'No, it must be made to size', 'Only in platinum'], a: 1, docRef: 'D6' },
      ] },

    /* Shared departmental module — appears in every listed department's path */
    { id: 'M5', stage: 'path', depts: ['CS', 'OP', 'AR', 'SH'], title: 'Internal Website Basics', minutes: 10, docs: ['D15'],
      intro: 'Find any order and understand what its status means.',
      quiz: [
        { q: 'Which status means an order is in final inspection?', options: ['Entered', 'QC', 'Pending production'], a: 1, docRef: 'D15' },
      ] },

    /* Customer Service path */
    { id: 'M6', stage: 'path', depts: ['CS'], title: 'Order Entry for Customer Service', minutes: 20, docs: ['D8'],
      intro: 'Enter orders correctly the first time.',
      quiz: [
        { q: 'Which field is required on every order?', options: ['Engraving', 'Retailer PO number', 'Courier'], a: 1, docRef: 'D8' },
        { q: 'A retailer wants a custom size. What must you tick?', options: ['Rush', 'Special order', 'Memo'], a: 1, docRef: 'D8' },
      ] },
    { id: 'M7', stage: 'path', depts: ['CS'], title: 'Call Handling Standards', minutes: 10, docs: ['D10'],
      intro: 'How we answer, verify and escalate.',
      quiz: [
        { q: 'What must you confirm before discussing an order?', options: ['The retailer account number and caller name', 'The retailer\'s address', 'Nothing'], a: 0, docRef: 'D10' },
      ] },
    { id: 'M8', stage: 'path', depts: ['CS'], title: 'Returns, Repairs & Rush Orders', minutes: 20, docs: ['D9', 'D11'],
      intro: 'Handle the requests that need the most care.',
      quiz: [
        { q: 'How long is an RMA valid?', options: ['7 days', '30 days', '90 days'], a: 1, docRef: 'D9' },
        { q: 'Who approves a rush order?', options: ['Any CS rep', 'Order Processing Supervisor', 'Shipping'], a: 1, docRef: 'D11' },
      ] },

    /* Order Processing path */
    { id: 'M9', stage: 'path', depts: ['OP'], title: 'Order Entry & Release', minutes: 20, docs: ['D8', 'D16'],
      intro: 'Enter, check and release orders to production.',
      quiz: [
        { q: 'An order is stuck in Pending Production. What do you check first?', options: ['Special flag, credit hold, PO number', 'The courier', 'The retailer\'s website'], a: 0, docRef: 'D16' },
      ] },
    { id: 'M10', stage: 'path', depts: ['OP'], title: 'Rush Orders & Quality Checkpoints', minutes: 20, docs: ['D11', 'D12'],
      intro: 'Protect delivery dates and quality.',
      quiz: [
        { q: 'Which pieces need a second inspector sign-off?', options: ['All rings', 'Centre stone over 1 ct', 'Anything in 18K'], a: 1, docRef: 'D12' },
      ] },

    /* Accounting path */
    { id: 'M11', stage: 'path', depts: ['AR'], title: 'Invoicing & Credits', minutes: 15, docs: ['D14', 'D7'],
      intro: 'When we bill, and when we credit.',
      quiz: [
        { q: 'What is needed before issuing a credit note?', options: ['A phone call', 'An approved RMA decision from Quality', 'Nothing'], a: 1, docRef: 'D14' },
      ] },

    /* Shipping path */
    { id: 'M12', stage: 'path', depts: ['SH'], title: 'Packing, Shipping & Receiving Returns', minutes: 20, docs: ['D13', 'D9', 'D12'],
      intro: 'Get every parcel out safely and log every return.',
      quiz: [
        { q: 'What must NOT appear on the outside of a parcel?', options: ['The RMA number', 'The word "jewellery" or our company name', 'The address'], a: 1, docRef: 'D13' },
      ] },

    /* Ongoing — advanced / refresher learning */
    { id: 'M13', stage: 'ongoing', depts: ['CS'], title: 'Advanced: Handling Difficult Escalations', minutes: 15, docs: ['D10', 'D9'], added: '2026-09-15',
      intro: 'Refresher and advanced practice for experienced reps.',
      quiz: [
        { q: 'A credit over $500 is requested. Who takes the call?', options: ['You', 'Customer Service Supervisor', 'Shipping'], a: 1, docRef: 'D10' },
      ] },
    { id: 'M14', stage: 'ongoing', depts: ['ALL'], title: 'Annual Refresher: Communication Standards', minutes: 5, docs: ['D3'], added: '2026-10-01',
      intro: 'A quick yearly check-in on how we communicate.',
      quiz: [
        { q: 'What goes in the subject line of every retailer email?', options: ['Your name', 'The order or RMA number', 'Nothing in particular'], a: 1, docRef: 'D3' },
      ] },
  ],

  /* ---------------------------------------------------------------------------
     COMPLETION RECORDS. kind: module | update.  For updates, ref = docId@version.
     These are never deleted — archived document versions keep their records.
  --------------------------------------------------------------------------- */
  completions: [
    // Priya — new hire, part way through foundation/products
    { user: 'u1', kind: 'module', ref: 'M1', date: '2026-10-21', score: 100 },
    { user: 'u1', kind: 'module', ref: 'M2', date: '2026-10-22', score: 100 },
    { user: 'u1', kind: 'module', ref: 'M3', date: '2026-10-27', score: 100 },

    // Jordan — experienced CS rep, has one update waiting
    ...['M1','M2','M3','M4','M5','M6','M7','M8'].map((m, i) => ({ user: 'u4', kind: 'module', ref: m, date: '2025-03-' + String(12 + i).padStart(2, '0'), score: 100 })),
    { user: 'u4', kind: 'update', ref: 'D8@2.0', date: '2026-08-18' },
    { user: 'u4', kind: 'module', ref: 'M14', date: '2026-10-03', score: 100 },

    // Marcus — moved CS -> OP; keeps company-wide + shared module credit
    ...['M1','M2','M3','M4','M5','M6','M7','M8'].map((m, i) => ({ user: 'u2', kind: 'module', ref: m, date: '2024-06-' + String(3 + i).padStart(2, '0'), score: 100 })),
    { user: 'u2', kind: 'update', ref: 'D8@2.0', date: '2026-08-16' },
    { user: 'u2', kind: 'update', ref: 'D9@2.0', date: '2025-06-03' },

    // Sam — OP SME, fully trained, two updates waiting
    ...['M1','M2','M3','M4','M5','M9','M10'].map((m, i) => ({ user: 'u6', kind: 'module', ref: m, date: '2025-01-' + String(10 + i).padStart(2, '0'), score: 100 })),
    { user: 'u6', kind: 'update', ref: 'D8@2.0', date: '2026-08-15' },
    { user: 'u6', kind: 'update', ref: 'D9@2.0', date: '2025-06-02' },
    { user: 'u6', kind: 'module', ref: 'M14', date: '2026-10-02', score: 100 },

    // Dana — CS supervisor, all done
    ...['M1','M2','M3','M4','M5','M6','M7','M8','M13','M14'].map((m, i) => ({ user: 'u3', kind: 'module', ref: m, date: '2025-01-' + String(10 + i).padStart(2, '0'), score: 100 })),
    { user: 'u3', kind: 'update', ref: 'D8@2.0', date: '2026-08-15' },
    { user: 'u3', kind: 'update', ref: 'D9@2.0', date: '2025-06-01' },
    { user: 'u3', kind: 'update', ref: 'D9@3.0', date: '2026-10-28' },

    // Rob — OP supervisor
    ...['M1','M2','M3','M4','M5','M9','M10','M14'].map((m, i) => ({ user: 'u7', kind: 'module', ref: m, date: '2024-01-' + String(10 + i).padStart(2, '0'), score: 100 })),
    { user: 'u7', kind: 'update', ref: 'D8@2.0', date: '2026-08-15' },
    { user: 'u7', kind: 'update', ref: 'D9@2.0', date: '2025-06-04' },
    { user: 'u7', kind: 'update', ref: 'D12@2.0', date: '2026-10-30' },
    { user: 'u7', kind: 'update', ref: 'D9@3.0', date: '2026-10-29' },
  ],

  /* Suggestions / questions / content submissions from any employee */
  submissions: [
    { id: 'S1', user: 'u1', type: 'question', date: '2026-10-29', status: 'new',
      text: 'Is there a guide for what to do when a retailer sends a return without an RMA number?' },
    { id: 'S2', user: 'u6', type: 'content', date: '2026-10-31', status: 'in_progress', docId: 'D17',
      text: 'Submitted draft content for the Aurora Bridal launch. Technical details confirmed with production.' },
    { id: 'S3', user: 'u4', type: 'topic', date: '2026-10-15', status: 'planned',
      text: 'Would love a module on gemstone basics — retailers ask about stone treatments a lot.' },
  ],
};
