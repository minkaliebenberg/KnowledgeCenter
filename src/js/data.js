/* =============================================================================
   CrownRing Knowledge Center — SEED DATA (prototype only)
   -----------------------------------------------------------------------------
   Folder names and document titles mirror the real SharePoint library and the
   L&D Documentation Map. ALL DOCUMENT TEXT IS PLACEHOLDER — the real content
   lives in SharePoint. People (other than Minka) are fictional.
   In production this would live in a database (see docs/DATA-MODEL.md).
   ========================================================================== */
(function () {
  // compact helpers for seed content
  const sec = (h, body) => ({ h, body });
  const ver = (v, date, type, summary, sections, extra) => Object.assign({ v, date, type, summary, sections, status: 'archived', by: 'u5' }, extra || {});
  const doc = (o) => Object.assign({ status: 'active', sourceOfTruth: false, links: [], tags: [], depts: ['NC'], owner: 'u5' }, o, {
    versions: o.versions.map((x, i, a) => Object.assign(x, { status: i === a.length - 1 ? (o.status === 'draft' || o.status === 'review' ? 'draft' : 'current') : 'archived' })),
  });
  const ph = 'Placeholder text — see the SharePoint version for the real content.';

  window.SEED = {
    today: '2026-11-09',

    departments: [
      { id: 'NC', name: 'Noam Carver Team' },
      { id: 'CS', name: 'Customer Service' },
      { id: 'PR', name: 'Production' },
      { id: 'AR', name: 'Accounting' },
    ],

    /* Know folders = the SharePoint library folders */
    folders: [
      { id: 'pp',    name: 'Policies & Procedures', icon: '📋' },
      { id: 'ref',   name: 'Reference Materials',   icon: '📎' },
      { id: 'guide', name: 'Guidebooks',            icon: '📘' },
      { id: 'sales', name: 'Sales Training Guides', icon: '💍' },
      { id: 'ces',   name: 'CES',                   icon: '⭐' },
    ],

    /* Document types — same list as the Documentation Map dropdowns */
    types: ['SOP', 'Policy', 'Manual', 'Quick Reference', 'Process / Workflow', 'Directory', 'Form', 'Video', 'Decision Map', 'Glossary'],

    users: [
      { id: 'u1', name: 'Priya Shah',   role: 'employee',   dept: 'NC', supervisor: 'u3', start: '2026-10-26', title: 'Customer Experience Specialist', deptHistory: [] },
      { id: 'u4', name: 'Jordan Reyes', role: 'employee',   dept: 'NC', supervisor: 'u3', start: '2025-03-10', title: 'Customer Experience Specialist', deptHistory: [] },
      { id: 'u2', name: 'Marcus Lee',   role: 'employee',   dept: 'NC', supervisor: 'u3', start: '2024-06-03', title: 'Customer Experience Specialist', deptHistory: [{ dept: 'CS', from: '2024-06-03', to: '2026-09-01' }] },
      { id: 'u8', name: 'Alex Martin',  role: 'employee',   dept: 'CS', supervisor: 'u7', start: '2025-08-11', title: 'Customer Service Representative', deptHistory: [] },
      { id: 'u6', name: 'Sam Novak',    role: 'employee',   dept: 'PR', supervisor: 'u7', start: '2021-02-15', title: 'Production Coordinator', sme: 'PR', deptHistory: [] },
      { id: 'u9', name: 'Taylor Brooks',role: 'employee',   dept: 'AR', supervisor: 'u7', start: '2023-09-05', title: 'Accounting Clerk', sme: 'AR', deptHistory: [] },
      { id: 'u3', name: 'Dana Okafor',  role: 'supervisor', dept: 'NC', supervisor: null, start: '2022-01-10', title: 'Noam Carver Team Supervisor', sme: 'NC', deptHistory: [] },
      { id: 'u7', name: 'Rob Tran',     role: 'supervisor', dept: 'PR', supervisor: null, start: '2020-05-04', title: 'Operations Supervisor', deptHistory: [] },
      { id: 'u5', name: 'Minka',        role: 'admin',      dept: 'NC', supervisor: null, start: '2023-04-03', title: 'Learning & Development Lead', deptHistory: [] },
    ],

    /* ---------------------------------------------------------------------------
       DOCUMENTS. status: active | draft | review | retired
       versions[]: oldest first. type: initial | minor | major. pushed = sent to
       learning queues. links = documents this one references (Documentation
       Map "Outgoing Links"). nextReview = Documentation Map "Next Review".
    --------------------------------------------------------------------------- */
    documents: [
      /* ---------------- Policies & Procedures ---------------- */
      doc({ id: 'D1', title: 'Bridal Cancellation Procedure', folder: 'pp', type: 'SOP', depts: ['NC', 'CS'], nextReview: '2026-10-31',
        tags: ['cancel', 'cancellation', 'bridal', 'order'],
        versions: [
          ver('1.0', '2025-06-12', 'initial', 'Initial release.', [sec('Purpose', ph)]),
          ver('1.1', '2025-10-23', 'minor', 'Clarified wording in step 2.', [
            sec('Purpose', 'How to cancel a bridal order and what to tell the retailer. ' + ph),
            sec('Steps', '- Confirm the order status in the internal website.\n- If the order is already in production, check with your supervisor before cancelling.\n- Cancel the order and send the retailer a confirmation by email.'),
          ]),
        ] }),
      doc({ id: 'D2', title: 'CrownRing Setting Policy', folder: 'pp', type: 'Policy', depts: ['ALL'], sourceOfTruth: true, nextReview: '2026-11-30',
        tags: ['setting', 'stone', 'customer stone', 'policy', 'risk'],
        versions: [ver('1.0', '2025-11-18', 'initial', 'Initial release.', [
          sec('Purpose', 'Explains when we can set stones supplied by retailers or consumers. ' + ph),
          sec('Customer-supplied stones', 'Every customer-supplied stone is inspected and documented before setting. Customers are informed that setting carries a small risk for some stone types.'),
        ])] }),
      doc({ id: 'D3', title: 'Heirloom Remount Service - Internal SOP', folder: 'pp', type: 'SOP', depts: ['NC'], nextReview: '2027-07-26',
        tags: ['heirloom', 'remount', 'customer stone', 'ra', 'quote'], links: ['D2', 'D20', 'D19'],
        versions: [
          ver('1.0', '2025-09-02', 'initial', 'Initial release.', [sec('Purpose', ph)]),
          ver('2.0', '2025-11-18', 'major', 'Service now follows the new CrownRing Setting Policy.', [
            sec('Purpose', 'How we remount a customer\'s heirloom stones into a new Noam Carver setting. ' + ph),
            sec('Quote preparation', 'Prepare the quote using Group Ships and Freight Charges.'),
          ], { pushed: true }),
          ver('2.1', '2026-01-27', 'minor', 'Formatting updates.', [
            sec('Purpose', 'How we remount a customer\'s heirloom stones into a new Noam Carver setting. ' + ph),
            sec('Quote preparation', 'Prepare the quote using **Group Ships** and **Freight Charges**.'),
          ]),
          ver('2.2', '2026-10-30', 'major', 'Generate the RA using the Loose Diamond option. Crown Setting section: added a step to confirm the stone count with the retailer.', [
            sec('Purpose', 'How we remount a customer\'s heirloom stones into a new Noam Carver setting. ' + ph),
            sec('1. Receiving the stones', '- Generate the RA using the **Loose Diamond** option.\n- Log every stone received.'),
            sec('2. Quote preparation', 'Prepare the quote using **Group Ships** and **Freight Charges**.'),
            sec('3. Crown Setting', '- **Confirm the stone count with the retailer** before setting.\n- Follow the CrownRing Setting Policy.'),
          ], { pushed: true }),
        ] }),
      doc({ id: 'D4', title: 'How To - Scan Ring', folder: 'pp', type: 'SOP', depts: ['NC', 'PR'], nextReview: '2027-05-31',
        tags: ['scan', 'ring', 'scanner'],
        versions: [ver('1.0', '2025-07-04', 'initial', 'Initial release.', [sec('Steps', '- Clean the ring.\n- Place it on the scanner mount.\n- Save the scan to the order folder. ' + ph)])] }),
      doc({ id: 'D5', title: 'How To - Scan Stone', folder: 'pp', type: 'SOP', depts: ['NC', 'PR'], nextReview: '2027-05-31',
        tags: ['scan', 'stone', 'diamond', 'scanner'],
        versions: [ver('1.0', '2025-07-04', 'initial', 'Initial release.', [sec('Steps', '- Place the stone table-down in the holder.\n- Capture the scan and record the measurements. ' + ph)])] }),
      doc({ id: 'D6', title: 'Memo Procedure', folder: 'pp', type: 'SOP', depts: ['NC', 'CS', 'AR'], links: ['D19'], nextReview: '2027-05-31',
        tags: ['memo', 'consignment', 'shipping'],
        versions: [
          ver('1.0', '2026-01-27', 'initial', 'Initial release.', [sec('Steps', ph)]),
          ver('1.1', '2026-05-26', 'minor', 'Added a description of what a memo is.', [
            sec('What is a memo?', 'A **memo** is merchandise sent to a retailer on consignment. It stays our property until the retailer sells it or sends it back, and it is only invoiced once sold.'),
            sec('Creating a memo', '- Create the memo in the internal website.\n- Attach the retailer\'s request. ' + ph),
            sec('Shipping individually', 'See **Freight Charges** for shipping costs.'),
          ]),
        ] }),
      doc({ id: 'D7', title: 'Procedure - Rendering Manifest', folder: 'pp', type: 'SOP', depts: ['NC'], links: ['D28'], nextReview: '2027-07-27',
        tags: ['rendering', 'manifest', 'cad', 'cad pending', 'render'],
        versions: [
          ver('1.0', '2026-01-28', 'initial', 'Initial release (as "CAD Pending Procedure").', [sec('Steps', ph)]),
          ver('1.1', '2026-07-26', 'minor', 'Formatting.', [sec('Steps', ph)]),
          ver('1.2', '2026-07-26', 'major', 'Renamed from "CAD Pending Procedure". Training content moved to Module - Rendering Manifest.', [
            sec('Description', 'How to submit and track a rendering request. For full training see **Module - Rendering Manifest**.'),
            sec('Steps', '- Complete the rendering manifest for the order.\n- Submit it to CAD.\n- Track the status until the render is approved. ' + ph),
          ], { pushed: true }),
        ] }),
      doc({ id: 'D8', title: 'Procedure - Repair & Remake - Worn Consumer Product', folder: 'pp', type: 'SOP', depts: ['NC', 'CS'], nextReview: '2027-08-31',
        tags: ['repair', 'remake', 'worn', 'damaged'], links: ['D22'],
        versions: [ver('1.0', '2026-08-26', 'initial', 'Initial release.', [
          sec('Purpose', 'Deciding whether a worn piece is repaired or remade. ' + ph),
          sec('Steps', '- Request photos from the retailer.\n- Check the piece against the **NC Repair & Return Guide**.\n- Quality decides repair or remake.'),
        ])] }),
      doc({ id: 'D9', title: 'Replication & Matching Band Service - Internal SOP', folder: 'pp', type: 'SOP', depts: ['NC'], links: ['D20', 'D19'], nextReview: '2026-11-30',
        tags: ['replication', 'matching band', 'band', 'copy'],
        versions: [
          ver('1.0', '2025-09-11', 'initial', 'Initial release.', [sec('Purpose', ph)]),
          ver('1.1', '2025-09-23', 'minor', 'Typo fixes.', [sec('Purpose', ph)]),
          ver('1.2', '2025-11-28', 'minor', 'Formatting updated to the new template.', [
            sec('Purpose', 'How we replicate a ring or make a band to match an existing ring. ' + ph),
            sec('2. Quote preparation', 'Use **Group Ships** and **Freight Charges** when quoting.'),
          ]),
        ] }),
      doc({ id: 'D10', title: 'Templates & Disclaimers', folder: 'pp', type: 'Quick Reference', depts: ['NC', 'CS'], nextReview: '2026-11-30',
        tags: ['template', 'disclaimer', 'email', 'wording'],
        versions: [
          ver('2.0', '2025-03-10', 'major', 'Restructured.', [sec('Templates', ph)]),
          ver('2.1', '2025-06-02', 'minor', 'Wording.', [sec('Templates', ph)]),
          ver('2.2', '2025-09-15', 'minor', 'Wording.', [sec('Templates', ph)]),
          ver('2.3', '2025-11-20', 'minor', 'Added two disclaimers.', [sec('Email templates', 'Approved wording for common retailer emails. ' + ph), sec('Disclaimers', ph)]),
        ] }),
      doc({ id: 'D11', title: 'Ticket System Procedure', folder: 'pp', type: 'SOP', depts: ['ALL'], nextReview: '2026-08-26',
        tags: ['ticket', 'zoho', 'request'],
        versions: [ver('1.0', '2025-07-25', 'initial', 'Initial release.', [
          sec('Creating a ticket', '- Open a ticket for every retailer request.\n- Choose the right department.\n- Close the ticket once the retailer is answered. ' + ph),
        ])] }),
      doc({ id: 'D12', title: 'Wax Procedure', folder: 'pp', type: 'SOP', depts: ['NC', 'PR'], links: ['D19'], nextReview: '2027-05-31',
        tags: ['wax', 'model', 'try-on'],
        versions: [
          ver('1.0', '2025-08-15', 'initial', 'Initial release.', [sec('Steps', ph)]),
          ver('1.1', '2026-02-05', 'minor', 'Typo fixes.', [sec('Steps', ph)]),
          ver('1.2', '2026-05-26', 'minor', 'Under "Create a web", changed wording.', [sec('Steps', ph)]),
          ver('1.3', '2026-05-26', 'minor', 'Added a link to the Freight Charges document.', [
            sec('Purpose', 'How to request a wax model for a retailer. ' + ph),
            sec('Create a web', ph),
            sec('Shipping individually', 'See **Freight Charges**.'),
          ]),
        ] }),
      doc({ id: 'D13', title: 'Vacation & Sick Form', folder: 'pp', type: 'Form', depts: ['ALL'], nextReview: '2027-04-30',
        tags: ['vacation', 'sick', 'time off', 'absence', 'form'],
        versions: [ver('1.0', '2026-03-15', 'initial', 'Updated 2026 fillable form.', [
          sec('How to use this form', '- Fill in the form and send it to your supervisor.\n- Submit vacation requests at least two weeks ahead. ' + ph),
        ])] }),

      /* ---------------- Reference Materials ---------------- */
      doc({ id: 'D14', title: 'Bridal Workflow', folder: 'ref', type: 'Process / Workflow', nextReview: '2026-12-31', tags: ['bridal', 'workflow', 'process'],
        versions: [ver('1.0', '2022-12-15', 'initial', 'Initial release.', [sec('Workflow', 'Quote → Rendering → Approval → Production → QC → Shipping. ' + ph)])] }),
      doc({ id: 'D15', title: 'Quote Workflow', folder: 'ref', type: 'Process / Workflow', nextReview: '2026-12-31', tags: ['quote', 'workflow'],
        versions: [ver('1.0', '2022-12-15', 'initial', 'Initial release.', [sec('Workflow', ph)])] }),
      doc({ id: 'D16', title: 'Carlex G4 Inlay Width', folder: 'ref', type: 'Quick Reference', depts: ['NC', 'PR'], owner: 'u3', nextReview: '2027-10-27', tags: ['carlex', 'inlay', 'width'],
        versions: [ver('1.0', '2026-10-26', 'initial', 'Initial release.', [sec('Inlay widths', ph)], { by: 'u3' })] }),
      doc({ id: 'D17', title: 'Directory - Internal Contacts', folder: 'ref', type: 'Directory', depts: ['ALL'], nextReview: '2027-11-27', tags: ['directory', 'contacts', 'who', 'email', 'extension'],
        versions: [ver('1.0', '2026-11-02', 'initial', 'Initial release.', [sec('Contacts', 'Who to contact in each department, with emails and extensions. ' + ph)])] }),
      doc({ id: 'D18', title: 'Directory - Sales Reps', folder: 'ref', type: 'Directory', depts: ['NC', 'CS'], nextReview: '2027-11-27', tags: ['sales rep', 'directory', 'territory'],
        versions: [
          ver('1.0', '2026-10-26', 'initial', 'Initial release.', [sec('Sales reps', ph)]),
          ver('1.1', '2026-11-02', 'minor', 'Added phone numbers.', [sec('Sales reps', 'Each rep\'s territory, email and phone number. ' + ph)]),
        ] }),
      doc({ id: 'D19', title: 'Freight Charges', folder: 'ref', type: 'Quick Reference', depts: ['NC', 'CS', 'AR'], sourceOfTruth: true, nextReview: '2027-04-30', tags: ['freight', 'shipping', 'courier', 'charge', 'cost'],
        versions: [ver('1.0', '2025-04-15', 'initial', 'Initial release.', [sec('Freight charges', 'The shipping charges applied to retailer orders by service level. ' + ph)])] }),
      doc({ id: 'D20', title: 'Group Ships', folder: 'ref', type: 'Quick Reference', depts: ['NC', 'CS'], sourceOfTruth: true, nextReview: '2027-01-31', tags: ['group ship', 'shipping', 'buying group'],
        versions: [ver('1.0', '2025-01-20', 'initial', 'Updated 2025.', [sec('Group ships', 'Which retailers ship together and on which days. ' + ph)])] }),
      doc({ id: 'D21', title: 'NC Warranty', folder: 'ref', type: 'Quick Reference', depts: ['NC', 'CS'], sourceOfTruth: true, tags: ['warranty', 'guarantee', 'coverage'],
        versions: [ver('1.0', '2024-05-01', 'initial', 'Initial release.', [
          sec('What the warranty covers', 'Manufacturing defects in Noam Carver pieces. ' + ph),
          sec('What it does not cover', 'Normal wear, loss, and damage from accidents. ' + ph),
        ])] }),
      doc({ id: 'D22', title: 'NC Repair & Return Guide', folder: 'ref', type: 'Quick Reference', depts: ['NC', 'CS'], nextReview: '2027-12-31', tags: ['repair', 'return', 'ra', 'rma'],
        versions: [ver('1.0', '2024-12-10', 'initial', 'Updated Dec 2024.', [
          sec('Returns', 'Every return needs an RA number before it is shipped back. ' + ph),
          sec('Repairs', ph),
        ])] }),
      doc({ id: 'D23', title: 'NC CAD Prong Tolerances - Center Stones', folder: 'ref', type: 'Quick Reference', depts: ['NC', 'PR'], owner: 'u3', nextReview: '2027-10-27', tags: ['prong', 'tolerance', 'cad', 'center stone'],
        versions: [ver('1.0', '2026-10-26', 'initial', 'Initial release.', [sec('CAD tolerances', ph)], { by: 'u3' })] }),
      doc({ id: 'D24', title: 'NC Finished Prong Tolerances - Center Stones', folder: 'ref', type: 'Quick Reference', depts: ['NC', 'PR'], owner: 'u3', links: ['D23'], nextReview: '2027-10-27', tags: ['prong', 'tolerance', 'finished', 'center stone'],
        versions: [ver('1.0', '2026-10-26', 'initial', 'New quick reference: finished prong tolerances for center stones. Use it alongside the CAD tolerances.', [
          sec('Finished tolerances', 'The acceptable prong sizes on finished pieces, by center stone size. ' + ph),
        ], { by: 'u3', pushed: true })] }),
      doc({ id: 'D25', title: 'Price List - Center Stones', folder: 'ref', type: 'Quick Reference', sourceOfTruth: true, nextReview: '2027-09-30', tags: ['price', 'center stone', 'diamond'],
        versions: [ver('1.0', '2025-09-18', 'initial', 'Initial release.', [sec('Prices', ph)])] }),
      doc({ id: 'D26', title: 'Traditional Bands Guide', folder: 'ref', type: 'Quick Reference', depts: ['ALL'], nextReview: '2027-06-30', tags: ['band', 'wedding band', 'traditional', 'width', 'profile'],
        versions: [ver('1.0', '2026-06-08', 'initial', 'Initial release.', [
          sec('Band profiles', '- **Flat** — straight edges, modern look.\n- **Half-round** — domed outside, flat inside.\n- **Comfort fit** — rounded inside for easier wear.'),
          sec('Widths', 'Common widths run from 2 mm to 8 mm. ' + ph),
        ])] }),
      doc({ id: 'D43', title: 'Who to Email for Changes', folder: 'ref', type: 'Quick Reference', status: 'retired', tags: ['email', 'changes'],
        versions: [ver('1.0', '2024-01-10', 'initial', 'Initial release. Replaced by Directory - Internal Contacts.', [sec('Contacts', ph)])] }),

      /* ---------------- Guidebooks ---------------- */
      doc({ id: 'D27', title: 'Module - Bridal Quotes', folder: 'guide', type: 'Manual', links: ['D3', 'D28', 'D32', 'D30', 'D7', 'D9', 'D10', 'D12', 'D29'], nextReview: '2027-08-27', tags: ['quote', 'bridal', 'pricing'],
        versions: [ver('1.0', '2026-08-26', 'initial', 'Initial release (replaces part of the NC Quoting binder).', [
          sec('Quote overview', 'Every bridal quote is built from: model details, gold charge, labor charge, side diamonds, and any customizations. ' + ph),
          sec('Crown providing the center', ph),
          sec('Final pricing', ph),
        ])] }),
      doc({ id: 'D28', title: 'Module - Rendering Manifest', folder: 'guide', type: 'Manual', links: ['D7', 'D30', 'D9'], sourceOfTruth: true, nextReview: '2027-07-27', tags: ['rendering', 'manifest', 'cad'],
        versions: [ver('1.0', '2026-07-26', 'initial', 'Initial release.', [
          sec('What is a rendering manifest?', 'The request we send to CAD so they can create a render for the retailer to approve. ' + ph),
          sec('Request types', ph),
        ])] }),
      doc({ id: 'D29', title: 'NC General Knowledge', folder: 'guide', type: 'Manual', depts: ['ALL'], nextReview: '2026-09-30', tags: ['general', 'knowledge', 'diamond', 'metal', 'karat', 'gold'],
        versions: [ver('1.0', '2025-02-14', 'initial', 'Updated Feb 2025.', [
          sec('Metals', '- **14K gold** is 58.3% pure gold.\n- **18K gold** is 75% pure gold.\n- **Platinum** is naturally white and very durable.'),
          sec('Side diamond info', ph),
        ])] }),
      doc({ id: 'D30', title: 'NC Quoting', folder: 'guide', type: 'Manual', links: ['D29'], nextReview: '2026-08-31', tags: ['quote', 'quoting', 'pricing', 'custom'],
        versions: [ver('1.0', '2025-01-20', 'initial', 'Initial release.', [
          sec('Quote types', '- Empty mountings\n- MFit & MyCaroline\n- Full custom'),
          sec('Gold and labor charges', ph),
        ])] }),
      doc({ id: 'D31', title: 'NC CAD Guidebook', folder: 'guide', type: 'Manual', depts: ['NC', 'PR'], nextReview: '2026-10-31', tags: ['cad', 'design'],
        versions: [ver('1.0', '2024-07-10', 'initial', 'Initial release.', [sec('Overview', ph)])] }),
      doc({ id: 'D32', title: 'Noam Carver Fee Guide - Internal', folder: 'guide', type: 'Quick Reference', nextReview: '2027-07-31', tags: ['fee', 'fees', 'service', 'charge'],
        versions: [
          ver('2.0', '2026-04-30', 'major', 'Combined fees and quotes.', [sec('Fees', ph)]),
          ver('2.1', '2026-07-06', 'minor', 'Changed "Free" to "Complimentary".', [sec('Fees', ph)]),
          ver('2.2', '2026-07-17', 'minor', 'Quick Reference: updated formatting.', [sec('Quick reference', ph), sec('Service fees', ph)]),
        ] }),

      /* ---------------- Sales Training Guides ---------------- */
      doc({ id: 'D33', title: 'Noam Carver Sales Training Guide', folder: 'sales', type: 'Manual', depts: ['NC', 'CS'], tags: ['sales', 'noam carver', 'brand'],
        versions: [ver('1.0', '2025-05-09', 'initial', 'Initial release.', [sec('The brand', ph), sec('Selling points', ph)])] }),
      doc({ id: 'D34', title: 'Ultimate Wedding Band Guide', folder: 'sales', type: 'Manual', depts: ['NC', 'CS'], tags: ['wedding band', 'band', 'sales'],
        versions: [ver('1.0', '2025-05-09', 'initial', 'Initial release.', [sec('Choosing a band', ph)])] }),
      doc({ id: 'D35', title: 'Noam Carver Wedding Day - Sales Training Guide', folder: 'sales', type: 'Manual', depts: ['NC', 'CS'], tags: ['wedding day', 'collection', 'sales'],
        versions: [ver('1.0', '2026-10-22', 'initial', 'Initial release.', [sec('About the collection', ph), sec('How to sell it', ph)])] }),

      /* ---------------- CES ---------------- */
      doc({ id: 'D36', title: 'Anatomy of a Ring', folder: 'ces', type: 'Quick Reference', depts: ['ALL'], tags: ['shank', 'head', 'prong', 'gallery', 'ring parts', 'anatomy'],
        versions: [ver('1.0', '2025-07-20', 'initial', 'Initial release.', [
          sec('Parts of a ring', '- **Shank** — the band that goes around the finger.\n- **Head** — the part that holds the center stone.\n- **Prongs** — small claws that hold the stone.\n- **Gallery** — the side profile under the head.'),
        ])] }),
      doc({ id: 'D37', title: 'Departments and their Duties', folder: 'ces', type: 'Quick Reference', depts: ['ALL'], tags: ['department', 'duties', 'who does what', 'organization'],
        versions: [ver('1.0', '2025-07-20', 'initial', 'Initial release.', [
          sec('Who does what', '- **Noam Carver Team** — quotes, custom requests and retailer support for the brand.\n- **Customer Service** — orders, returns and general retailer questions.\n- **Production** — CAD, casting, setting and quality.\n- **Accounting** — invoices, credits and memos.'),
        ])] }),
      doc({ id: 'D38', title: 'Procedure to Follow on Rush', folder: 'ces', type: 'SOP', depts: ['NC', 'CS'], tags: ['rush', 'urgent', 'expedite', 'approval'],
        versions: [ver('1.0', '2025-07-20', 'initial', 'Initial release.', [
          sec('What counts as a rush', 'Any order the retailer needs faster than the standard production time. ' + ph),
          sec('Approval', 'Rush orders must be **approved by your supervisor** before you confirm a date with the retailer.'),
        ])] }),
      doc({ id: 'D39', title: 'Repair Fee', folder: 'ces', type: 'Quick Reference', depts: ['NC', 'CS'], tags: ['repair', 'fee'],
        versions: [ver('1.0', '2025-07-20', 'initial', 'Initial release.', [sec('Repair fees', ph)])] }),

      /* ---------------- Drafts / in review (not visible to employees) ---------------- */
      doc({ id: 'D40', title: 'NC Fully Mounted Service - Internal Guide', folder: 'ref', type: 'Quick Reference', status: 'review', owner: 'u3', tags: ['fully mounted', 'service'],
        versions: [ver('0.1', '2026-10-26', 'draft', 'Submitted by SME for L&D formatting.', [
          sec('About the service', 'Fully mounted pieces ship with the center stone already set. ' + ph),
          sec('How to quote it', ph),
        ], { by: 'u3' })] }),
      doc({ id: 'D41', title: 'Procedure - Invoice Receiving & Matching', folder: 'pp', type: 'SOP', status: 'draft', owner: 'u9', depts: ['AR'], tags: ['invoice', 'matching'],
        versions: [ver('0.1', '2026-10-15', 'draft', 'Draft in progress.', [sec('Steps', ph)], { by: 'u9' })] }),
    ],

    /* ---------------------------------------------------------------------------
       LEARNING MODULES — lessons reference documents (no duplicated content).
       stage only controls ORDER in the to-do list: foundation → products → path → ongoing
    --------------------------------------------------------------------------- */
    modules: [
      { id: 'M1', stage: 'foundation', depts: ['ALL'], title: 'Welcome to CrownRing', minutes: 10, docs: ['D37', 'D17'],
        quiz: [{ q: 'Which team handles invoices, credits and memos?', options: ['Production', 'Accounting', 'Customer Service'], a: 1, docRef: 'D37' }] },
      { id: 'M2', stage: 'foundation', depts: ['ALL'], title: 'Workplace Essentials', minutes: 10, docs: ['D13', 'D11'],
        quiz: [{ q: 'When should a ticket be closed?', options: ['When it is created', 'Once the retailer is answered', 'At the end of the week'], a: 1, docRef: 'D11' }] },
      { id: 'M3', stage: 'products', depts: ['ALL'], title: 'Jewellery Fundamentals', minutes: 20, docs: ['D36', 'D29', 'D26'],
        quiz: [
          { q: 'Which part of a ring holds the center stone?', options: ['Shank', 'Head', 'Gallery'], a: 1, docRef: 'D36' },
          { q: 'How much pure gold is in 14K gold?', options: ['41.7%', '58.3%', '75%'], a: 1, docRef: 'D29' },
        ] },
      { id: 'M4', stage: 'products', depts: ['ALL'], title: 'CrownRing Setting Policy', minutes: 5, docs: ['D2'],
        quiz: [{ q: 'What happens to a customer-supplied stone before setting?', options: ['Nothing', 'It is inspected and documented', 'It is re-polished'], a: 1, docRef: 'D2' }] },

      { id: 'M5', stage: 'path', depts: ['NC', 'CS'], title: 'Repairs, Returns & Warranty', minutes: 15, docs: ['D22', 'D21', 'D8'],
        quiz: [{ q: 'What does a return need before it is shipped back?', options: ['An RA number', 'A photo of the box', 'Nothing'], a: 0, docRef: 'D22' }] },
      { id: 'M6', stage: 'path', depts: ['NC'], title: 'Quoting Basics', minutes: 30, docs: ['D30', 'D27', 'D32'],
        quiz: [{ q: 'Which is NOT one of the NC quote types?', options: ['Empty mountings', 'Full custom', 'Memo'], a: 2, docRef: 'D30' }] },
      { id: 'M7', stage: 'path', depts: ['NC'], title: 'Rendering Manifest', minutes: 15, docs: ['D28', 'D7'],
        quiz: [{ q: 'Who receives the rendering manifest?', options: ['The retailer', 'CAD', 'Accounting'], a: 1, docRef: 'D28' }] },
      { id: 'M8', stage: 'path', depts: ['NC'], title: 'Custom Services', minutes: 20, docs: ['D3', 'D9'],
        quiz: [{ q: 'Which RA option do you use when receiving heirloom stones?', options: ['Repair', 'Loose Diamond', 'Memo'], a: 1, docRef: 'D3' }] },
      { id: 'M9', stage: 'path', depts: ['NC'], title: 'Memos & Rush Orders', minutes: 10, docs: ['D6', 'D38'],
        quiz: [
          { q: 'When is a memo item invoiced?', options: ['When it ships', 'Once the retailer sells it', 'Never'], a: 1, docRef: 'D6' },
          { q: 'Who approves a rush order?', options: ['You', 'Your supervisor', 'The retailer'], a: 1, docRef: 'D38' },
        ] },
      { id: 'M10', stage: 'path', depts: ['CS'], title: 'Customer Service Essentials', minutes: 15, docs: ['D20', 'D18', 'D10'],
        quiz: [{ q: 'Where do you find approved email wording?', options: ['Templates & Disclaimers', 'Group Ships', 'NC Warranty'], a: 0, docRef: 'D10' }] },
      { id: 'M11', stage: 'path', depts: ['PR'], title: 'Production Essentials', minutes: 20, docs: ['D12', 'D4', 'D5', 'D31'],
        quiz: [{ q: 'Where do you save a ring scan?', options: ['Your desktop', 'The order folder', 'Email it to CAD'], a: 1, docRef: 'D4' }] },
      { id: 'M12', stage: 'path', depts: ['AR'], title: 'Accounting Essentials', minutes: 10, docs: ['D6', 'D19'],
        quiz: [{ q: 'When is a memo item invoiced?', options: ['When it ships', 'Once the retailer sells it', 'Never'], a: 1, docRef: 'D6' }] },

      { id: 'M13', stage: 'ongoing', depts: ['NC', 'CS'], title: 'New Collection: Wedding Day', minutes: 15, docs: ['D35', 'D34'], added: '2026-10-22',
        quiz: [{ q: 'Which guide covers the Wedding Day collection?', options: ['NC Quoting', 'Noam Carver Wedding Day - Sales Training Guide', 'Group Ships'], a: 1, docRef: 'D35' }] },
    ],

    completions: [
      // Priya — new hire
      { user: 'u1', kind: 'module', ref: 'M1', date: '2026-10-27', score: 100 },
      { user: 'u1', kind: 'module', ref: 'M2', date: '2026-10-28', score: 100 },

      // Jordan — experienced, 2 updates waiting + new collection
      ...['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9'].map((m, i) => ({ user: 'u4', kind: 'module', ref: m, date: '2025-03-' + String(12 + i).padStart(2, '0'), score: 100 })),
      { user: 'u4', kind: 'update', ref: 'D3@2.0', date: '2025-11-20' },
      { user: 'u4', kind: 'update', ref: 'D7@1.2', date: '2026-07-28' },

      // Marcus — moved CS -> NC; keeps everything shared
      ...['M1', 'M2', 'M3', 'M4', 'M5', 'M10'].map((m, i) => ({ user: 'u2', kind: 'module', ref: m, date: '2024-06-' + String(5 + i).padStart(2, '0'), score: 100 })),
      { user: 'u2', kind: 'module', ref: 'M6', date: '2026-09-10', score: 100 },

      // Alex — CS
      ...['M1', 'M2', 'M3', 'M4', 'M5', 'M10'].map((m, i) => ({ user: 'u8', kind: 'module', ref: m, date: '2025-08-' + String(12 + i).padStart(2, '0'), score: 100 })),

      // Sam — Production
      ...['M1', 'M2', 'M3', 'M4', 'M11'].map((m, i) => ({ user: 'u6', kind: 'module', ref: m, date: '2025-01-' + String(10 + i).padStart(2, '0'), score: 100 })),
      { user: 'u6', kind: 'update', ref: 'D24@1.0', date: '2026-10-27' },

      // Taylor — Accounting
      ...['M1', 'M2', 'M3', 'M4', 'M12'].map((m, i) => ({ user: 'u9', kind: 'module', ref: m, date: '2025-02-' + String(10 + i).padStart(2, '0'), score: 100 })),

      // Dana — NC supervisor, all done
      ...['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M13'].map((m, i) => ({ user: 'u3', kind: 'module', ref: m, date: '2025-01-' + String(10 + i).padStart(2, '0'), score: 100 })),
      { user: 'u3', kind: 'update', ref: 'D3@2.0', date: '2025-11-18' },
      { user: 'u3', kind: 'update', ref: 'D7@1.2', date: '2026-07-26' },
      { user: 'u3', kind: 'update', ref: 'D3@2.2', date: '2026-10-30' },
      { user: 'u3', kind: 'update', ref: 'D24@1.0', date: '2026-10-26' },

      // Minka — L&D (has completed everything)
      ...['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M13'].map((m, i) => ({ user: 'u5', kind: 'module', ref: m, date: '2025-02-' + String(3 + i).padStart(2, '0'), score: 100 })),
      { user: 'u5', kind: 'update', ref: 'D3@2.2', date: '2026-10-30' },
      { user: 'u5', kind: 'update', ref: 'D24@1.0', date: '2026-10-26' },

      // Rob — Operations supervisor
      ...['M1', 'M2', 'M3', 'M4', 'M11'].map((m, i) => ({ user: 'u7', kind: 'module', ref: m, date: '2024-01-' + String(10 + i).padStart(2, '0'), score: 100 })),
      { user: 'u7', kind: 'update', ref: 'D24@1.0', date: '2026-10-28' },
    ],

    /* Requests from employees (Suggest / Ask "send to L&D" / document questions) */
    submissions: [
      { id: 'S1', user: 'u1', type: 'question', date: '2026-10-29', status: 'new', text: 'Is there a guide for what to do when a retailer sends a return without an RA number?' },
      { id: 'S2', user: 'u4', type: 'topic', date: '2026-10-15', status: 'new', text: 'Could we get a glossary? New people ask about terms like "gallery" and "Frankenstein" a lot.' },
    ],

    /* Roadmap — mirrors the Documentation Map "Roadmap" tab */
    roadmap: [
      { id: 'R1', title: 'Decision Map - Repair VS Re-order', status: 'idea', priority: 'Med', work: 'Create New', effort: 'Large', type: 'Decision Map' },
      { id: 'R2', title: 'Glossary', status: 'idea', priority: 'Med', work: 'Update Existing', effort: 'Major', type: 'Glossary' },
      { id: 'R3', title: 'Module - Return Authorization', status: 'idea', priority: 'Low', work: 'Update Existing', effort: 'Med', type: 'Manual' },
      { id: 'R4', title: 'Training Hub - Zoho', status: 'idea', priority: 'Low', work: 'Create New', effort: 'Major', type: 'Video' },
      { id: 'R5', title: 'Guidebook - Bridal Quoting', status: 'planned', priority: 'High', work: 'Create New', effort: 'Major', type: 'Manual', notes: 'Combine Module - Bridal Quotes, Heirloom Remount and fee guides.' },
      { id: 'R6', title: 'Module - Rendering Manifest v1.1', status: 'planned', priority: 'High', work: 'Update Existing', effort: 'Small', type: 'Manual', docId: 'D28', notes: 'Update "Assigned to" and "Requested by".' },
      { id: 'R7', title: 'NC General Knowledge v2.0', status: 'planned', priority: 'Low', work: 'Update Existing', effort: 'Major', type: 'Manual', docId: 'D29', notes: 'Consider breaking sections into their own documents.' },
      { id: 'R8', title: 'Procedure - Invoice Receiving & Matching', status: 'progress', priority: 'Low', work: 'Format Drafted', effort: 'Small', type: 'SOP', docId: 'D41' },
      { id: 'R9', title: 'NC Fully Mounted Service - Internal Guide', status: 'review', priority: 'Med', work: 'Format Drafted', effort: 'Small', type: 'Manual', docId: 'D40', notes: 'Format SME document.' },
      { id: 'R10', title: 'Heirloom Remount Service - Internal SOP v2.2', status: 'done', priority: 'High', work: 'Update Existing', effort: 'Small', type: 'SOP', docId: 'D3' },
      { id: 'R11', title: 'NC Finished Prong Tolerances - Center Stones', status: 'done', priority: 'Med', work: 'Update Existing', effort: 'Minor', type: 'Quick Reference', docId: 'D24' },
    ],
  };

  /* ---------------------------------------------------------------------------
     NAVIGATE — how-to guides for the systems we use. Pure reference: no
     completion tracking. Each guide is one task ("How to…"). Guides are
     searchable by Ask, and documents in Refer can link to them.
     ALL GUIDE TEXT IS PLACEHOLDER.
  --------------------------------------------------------------------------- */
  const g = (id, title, steps, o) => Object.assign({ id, title, steps, video: null, tip: '', related: [], docs: [] }, o || {});
  window.SEED.systems = [
    { id: 'zoho', name: 'Zoho Desk', mono: 'Z', depts: ['NC', 'CS'], owner: 'u5', url: 'https://www.zoho.com/desk/',
      tagline: 'Our helpdesk for every retailer email, call and request.',
      when: 'Any time a retailer contacts us. Every request becomes a ticket so nothing gets lost and anyone on the team can pick it up.',
      startHere: ['z1', 'z2', 'z5', 'z8', 'z10', 'z15'],
      sections: [
        { title: 'Helpdesk basics', guides: ['z1', 'z2', 'z3', 'z4'] },
        { title: 'Getting set up', guides: ['z5', 'z6', 'z7'] },
        { title: 'A ticket from start to finish', guides: ['z8', 'z9', 'z10', 'z11', 'z12', 'z13', 'z14', 'z15'] },
        { title: 'Special situations', guides: ['z16', 'z17', 'z18', 'z19'] },
        { title: 'Working smarter', guides: ['z20', 'z21'] },
      ],
      faq: [
        { q: 'A retailer replied to a closed ticket. What happens?', a: 'Their reply reopens the ticket automatically and it goes back to the owner. Placeholder answer.' },
        { q: 'Two people replied to the same ticket at the same time. How do I avoid that?', a: 'Check the agent collision indicator at the top of the ticket before replying. Placeholder answer.' },
        { q: 'Should I reply from Outlook instead?', a: 'No. Always reply from Zoho Desk so the conversation stays on the ticket. Placeholder answer.' },
      ],
      guides: [
        g('z1', 'What is a ticket?', ['A ticket is one request from one retailer, with the whole conversation attached.', 'Every email, call or chat becomes a ticket.', 'Tickets have an owner, a status and a due date, so nothing falls through the cracks.'], { video: '2 min', related: ['z2', 'z3'] }),
        g('z2', 'The life of a ticket', ['**New** — the request has arrived and no one owns it yet.', '**Open** — someone owns it and is working on it.', '**On Hold** — waiting on the retailer or another department.', '**Closed** — the retailer has their answer.'], { video: '2 min', related: ['z13', 'z15'] }),
        g('z3', 'Key terms', ['**Contact** — the person who wrote to us.', '**Account** — the retailer (store) they belong to.', '**Owner** — the person responsible for the ticket.', '**Reply** vs **internal comment** — replies go to the retailer, comments stay inside the team.'], { related: ['z1'] }),
        g('z4', 'How our team uses Zoho Desk', ['Every retailer request gets a ticket.', 'Take ownership before you reply.', 'Use approved wording from Templates & Disclaimers.', 'Close the ticket once the retailer has their answer.'], { docs: ['D11', 'D10'], tip: 'These are our team rules, not Zoho settings. The full procedure is in Refer.' }),
        g('z5', 'How to log in and find your way around', ['Open Zoho Desk and sign in with your work account.', 'The left bar switches between Tickets, Contacts and Accounts.', 'The top bar holds search and your department switcher.'], { video: '3 min', related: ['z6', 'z8'] }),
        g('z6', 'How to set up your email signature', ['Click your profile picture, then **Personal settings**.', 'Open **Signature** and paste the approved signature.', 'Save, then send yourself a test reply.'], { video: '1 min', docs: ['D10'] }),
        g('z7', 'How to manage your notifications', ['Open **Personal settings → Notifications**.', 'Turn on alerts for tickets assigned to you.', 'Turn off alerts you do not need.'], { video: '1 min' }),
        g('z8', 'How to find your tickets', ['Use the view menu to switch to **My Open Tickets**.', 'Filter by status or priority.', 'Use the search bar for a PO number, retailer or contact name.'], { video: '3 min', related: ['z20'], tip: 'Search by PO number is the fastest way to find a specific order.' }),
        g('z9', 'How to take ownership of a ticket', ['Open the ticket.', 'Set **Owner** to yourself.', 'The ticket now shows in your views and nobody else will pick it up.'], { video: '1 min' }),
        g('z10', 'How to reply to a retailer', ['Open the ticket and click **Reply**.', 'Write your answer, or start from a template.', 'Check the To and CC fields, then **Send**.'], { video: '2 min', related: ['z11', 'z12'], docs: ['D10'] }),
        g('z11', 'How to use templates (macros)', ['Open the ticket.', 'Click **Apply Macro** at the bottom.', 'Pick the template, review the text and send.'], { video: '2 min', docs: ['D10'] }),
        g('z12', 'How to add an internal comment', ['Click **Comment** instead of Reply.', 'Mention a colleague with @ to notify them.', 'Comments are never sent to the retailer.'], { video: '1 min' }),
        g('z13', 'How to update status and priority', ['Use the fields on the left of the ticket.', 'Set **On Hold** while you wait on someone else.', 'Raise the priority for rush or urgent requests.'], { video: '1 min', docs: ['D38'] }),
        g('z14', 'How to transfer a ticket to another department', ['Open the ticket.', 'Change the **Department** field.', 'Add an internal comment explaining why.'], { video: '1 min' }),
        g('z15', 'How to close or reopen a ticket', ['Set the status to **Closed** once the retailer has their answer.', 'To reopen, change the status back to **Open**.'], { video: '1 min', related: ['z2'] }),
        g('z16', 'How to log a phone call', ['Click **New ticket**.', 'Choose **Phone** as the channel.', 'Summarise the call and assign it.'], { video: '2 min' }),
        g('z17', 'How to merge duplicate tickets', ['Select both tickets in the list.', 'Click **Merge** and choose which one to keep.', 'The conversations are combined into one ticket.'], { video: '1 min' }),
        g('z18', 'How to handle spam and misdirected emails', ['Mark obvious spam as **Spam**.', 'Transfer misdirected emails to the right department.'], {}),
        g('z19', 'How to cover for a colleague', ['Filter by their name as owner.', 'Reassign urgent tickets to yourself.', 'Leave an internal comment so they know when they return.'], {}),
        g('z20', 'How to save a custom view', ['Set up the filters you use most.', 'Click **Save as view** and name it.'], { video: '1 min' }),
        g('z21', 'Keyboard shortcuts', ['Placeholder: the most useful shortcuts for replying, commenting and moving between tickets.'], {}),
      ] },

    { id: 'designbuddy', name: 'DesignBuddy', mono: 'DB', depts: ['NC'], owner: null, ownerLabel: 'DesignBuddy creator (management)', url: 'https://ludovickninja.github.io/DesignBuddyDesktop/',
      tagline: 'Our in-house toolkit for quoting custom projects.',
      when: 'When quoting custom work: stone counts, metal weights, conversions, and the forms that go with a custom request.',
      startHere: ['d0', 'd1', 'd4', 'd11'],
      sections: [
        { title: 'Getting started', guides: ['d0'] },
        { title: 'Stone Counts', guides: ['d1', 'd2', 'd3'] },
        { title: 'Weights', guides: ['d4', 'd5', 'd6', 'd7'] },
        { title: 'Informations', guides: ['d8', 'd9', 'd10'] },
        { title: 'Forms', guides: ['d11', 'd12', 'd13'] },
        { title: 'GPTs', guides: ['d14'] },
        { title: 'Tools (beta)', guides: ['d15', 'd16'] },
      ],
      faq: [
        { q: 'Is the stone count exact?', a: 'It is an estimate to help quote. Final counts are confirmed in CAD. Placeholder answer.' },
        { q: 'Can I use it in French?', a: 'Yes — switch the language in the sidebar.' },
      ],
      guides: [
        g('d0', 'What is DesignBuddy?', ['A set of calculators and forms built to speed up custom quoting.', 'Use the sidebar to move between Stone Counts, Weights, Informations, Forms, GPTs and Tools.'], { video: '2 min' }),
        g('d1', 'Stone Count: Full Eternity', ['Choose the coverage: **Full**, **Three Quarter** or **Semi**.', 'Select the finger size region (e.g. US).', 'Enter the finger size, band thickness and spacing between stones (default 0.2 mm).', 'Enter the melee diameter.', 'Read **Total Stones Needed**.'], { video: '3 min', docs: ['D26', 'D27'], tip: 'Use it for an estimate while quoting; CAD confirms the final count.' }),
        g('d2', 'Stone Count: Halos', ['Placeholder: choose the center stone shape and size, then the melee size, to estimate the halo stone count.'], { video: '3 min', docs: ['D27'] }),
        g('d3', 'Stone Count: Hidden Halos', ['Placeholder: same as Halos, for hidden halo designs.'], { video: '2 min' }),
        g('d4', 'Weight: Karat Conversion', ['Placeholder: convert a known weight from one karat or metal to another.'], { video: '2 min', docs: ['D29'] }),
        g('d5', 'Weight: Wedding Band', ['Placeholder: estimate band weight from profile, width, thickness and size.'], { video: '2 min', docs: ['D26'] }),
        g('d6', 'Weight: Width Conversion', ['Placeholder: estimate how weight changes when the band width changes.'], { video: '2 min' }),
        g('d7', 'Weight: Diamond Sizes', ['Placeholder: look up diamond size to carat weight.'], { video: '2 min', docs: ['D25'] }),
        g('d8', 'Useful Links & FAQ', ['Placeholder: what you will find in Useful Links and the built-in FAQ.'], {}),
        g('d9', 'Jewelry News Feed', ['Placeholder: industry news, and how it can help in conversations with retailers.'], {}),
        g('d10', 'Contact Repository', ['Placeholder: where to find supplier and partner contacts.'], { docs: ['D17'] }),
        g('d11', 'Rush Requests form', ['Placeholder: when to submit a rush request and what happens after you submit it.'], { docs: ['D38'] }),
        g('d12', 'Stone Order Form', ['Placeholder: when to order stones and the details you need first.'], {}),
        g('d13', 'Employee Suggestions form', ['Placeholder: share ideas to improve DesignBuddy.'], {}),
        g('d14', 'Design Buddy Chat (GPT)', ['Placeholder: what to ask it, its limits, and when to double-check its answer.'], { tip: 'Always confirm pricing and policy answers against the documents in Refer.' }),
        g('d15', 'Style Match (work in progress)', ['Placeholder: beta tool — what it does today.'], {}),
        g('d16', '3DM to GLB', ['Placeholder: convert a CAD file so it can be viewed in a browser.'], {}),
      ] },
  ];

  /* Per-person Refer shortcuts (seeded so the demo shows them) */
  window.SEED.favorites = { u4: ['D19', 'D10', 'D38', 'D32'], u3: ['D3', 'D9'] };
  window.SEED.recent = { u4: ['D3', 'D6', 'D30', 'D21'], u3: ['D24', 'D11'] };

  /* Documents in Refer that link out to how-to guides */
  const docGuides = { D11: ['zoho:z4', 'zoho:z8'], D10: ['zoho:z11'], D38: ['designbuddy:d11'], D26: ['designbuddy:d5'], D27: ['designbuddy:d1'] };
  window.SEED.documents.forEach((d) => { d.guides = docGuides[d.id] || []; });
})();
