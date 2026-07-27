## Getting Started

Zeronix Portal walks a sale through one continuous pipeline:

**Lead → Company/Contact → Deal → Quote → Sales Order → Delivery → Invoice → Payment Receipt**

alongside a parallel buying side (**Supplier → Purchase → Payment Made**) and a **Marketing** side for email campaigns. Most list pages share the same building blocks, so once you're comfortable with one module the rest will feel familiar:

- **Filters and search** sit at the top of every list — use them before scrolling.
- **"+ New" / "Add"** opens a side panel or modal to create a record without leaving the list.
- Records with a status badge (Draft, Sent, Approved, Paid, etc.) can usually be **duplicated** or **converted** to the next stage via a button or the row's actions menu (⋯).
- Anywhere you see a document (Quote, Sales Order, Delivery, Invoice, Purchase), you can **view, download as PDF, or send it by email** directly from the detail page.

---

## Dashboard

Your homepage after login. Shows a 6-month trend chart, this month's revenue, a feed of recent activity across the team, and a staff leaderboard. Use it as a quick daily check-in — it doesn't require any setup.

---

## Leads

**Purpose:** capture a potential customer before they're a real account.

- Leads are created by staff — manually (**+ New Lead**), by **bulk import** (VCF/CSV file under *Leads → Import*), or automatically via **Google Contacts sync** (see [Settings](#settings)).
- Each lead tracks `source`, `status`, and an assigned owner.
- When a lead is ready to become a real customer, open it and click **Convert**. This creates a Company/Customer record (and optionally a Deal) and marks the lead as converted — the lead itself stays in the list for history, it isn't deleted.
- There is no public "request a quote" form anymore — every lead in the system was put there by your team on purpose.

---

## Companies and Contacts

**Purpose:** the account (Company) and the people who work there (Contacts).

- **Companies** is what used to be called "Customers" — it's the account record: billing details, industry, address, and a running set of computed stats (outstanding balance, overdue invoices, open deals/quotes/invoices) shown right on the profile so you don't have to go digging.
- Open a company's profile to see its full timeline: every quote, sales order, delivery, invoice, deal, and activity note in one place.
- **Contacts** is a separate module for the individual people at a company — a company can have several contacts (e.g. Purchasing Manager, Accounts Payable), each with their own email/phone/designation, and one marked **Primary**. When you create a Quote or Deal you'll pick which contact it's for.
- Use **Companies → Import** to bulk-create company accounts from a spreadsheet.

---

## Deals Pipeline

**Purpose:** track an active sales opportunity from first contact to close.

- Open **Deals** for a Kanban board — drag a card between stage columns (e.g. New → Qualified → Proposal → Won/Lost) to update its status; the board saves automatically as you drop a card.
- Each deal card shows its value, the assigned salesperson, and how long it's been sitting in its current stage.
- Click a card to open the full deal: activity log, attached files, linked contacts, tags, and a **next action** reminder you can set for yourself or a teammate.
- When a deal is ready to be priced, create a **Quote** directly from it — the quote comes back linked to the deal so the whole history stays connected.
- Use the pipeline stats bar above the board to see total value and count per stage at a glance.

---

## Calendar

A shared view of deal next-actions, follow-ups, and any dated activity across your team, so you can plan the day without opening each deal individually.

---

## Quotes

**Purpose:** a priced proposal sent to a customer for approval.

- Create a quote from scratch, or from a Deal's detail page so it's automatically linked.
- The quote editor is a split view: line items with product/quantity/price/discount on one side, a live document preview on the other — what you see is what the customer will see.
- **Send Email** emails the quote (as a PDF) straight to the customer contact, using your own configured SMTP identity.
- Customers can approve a quote from their portal; you'll see the status flip to **Approved** automatically.
- Once approved, click **Convert to Sales Order** to move it to the next stage — no re-typing line items.
- Quotes can be **duplicated** (handy for near-identical repeat orders) and support attachments and tags for your own organization.

---

## Sales Orders

**Purpose:** the confirmed order a customer has committed to, sitting between an approved Quote and the physical Delivery.

- Usually created via **Convert to Sales Order** from a Quote, but can also be created directly.
- Once goods are ready to go out, click **Convert to Delivery** to generate the delivery record with the same line items.

---

## Deliveries

**Purpose:** track what physically shipped and confirm it arrived.

- A delivery can come from a Sales Order (normal flow) or be created straight from an Invoice for a "bill first, deliver later" order.
- Mark a delivery **Delivered** once it's out the door; customers can confirm receipt from their own portal, which stamps `customer_confirmed_at` on the record so you have proof of delivery.
- From a delivered order, click **Convert to Invoice** to bill the customer.

---

## Invoices

**Purpose:** the bill sent to the customer, and the source of truth for what's owed.

- Same split-view editor as Quotes (line items + live preview), with payment terms and a due date.
- The invoice detail page shows **amount paid** and **balance** computed live from linked Payment Receipts — you never have to update these manually.
- **Send Email** delivers the invoice PDF to the customer; customers can also view/download it from their portal without logging in, via a numbered link.
- Record a payment against an invoice from **Payment Receipts** (below) — the invoice balance updates immediately.
- Invoices can also be converted backward into a Sales Order or Delivery if you need to formalize paperwork after the fact.

---

## Payment Receipts

**Purpose:** record money received from a customer against one or more invoices.

- Create a receipt, pick the invoice(s) it pays down, and the amounts allocate automatically. The related invoice's **balance** and **status** (Paid / Partially Paid) update instantly.
- Every receipt can be downloaded or emailed as a PDF confirmation for the customer's records.

---

## Suppliers and Purchases

**Purpose:** the buying side — mirrors Quotes/Invoices but for what you purchase from suppliers.

- **Suppliers** holds your vendor list and the products each supplier can provide, including price history so you can spot when a supplier's pricing has moved.
- **Purchases** (Purchase Bills) records what you've bought — line items, discount, shipping, and a running **amount paid / balance**, same split-view editor and duplicate/attachments support as Invoices.
- Receiving stock against a purchase bill logs a **stock movement**, which is what keeps each product's stock quantity accurate (see [Products and Stock](#products-and-stock)).

---

## Expenses and Payments Made

**Purpose:** general business spending and tracking what you've paid suppliers.

- **Expenses** is a simple ledger — category, amount, date, and how it was paid. Use it for anything that isn't tied to a specific purchase bill (rent, subscriptions, fuel, etc.).
- **Payments Made** records money paid out against Purchase Bills, the mirror image of Payment Receipts on the buy side — it updates each bill's balance the same way.

---

## Products and Stock

- The product catalog holds SKU, pricing, category/brand, and specs.
- Each product tracks a running **stock quantity**; the app flags a product as **low stock** automatically once it drops to 5 units or below — watch for that badge on the product list.
- Stock only moves through recorded transactions (receiving a purchase, fulfilling a delivery) — don't expect a manual "set stock" field; adjust it by recording the transaction that actually happened.

---

## Team and Users

**Purpose:** manage the people who log into your workspace (Admins only).

- Add staff accounts, set their role, and — for non-admin staff — tick which modules they're allowed to see; that list drives what shows up in their sidebar.
- Each staff member can set their **own SMTP credentials** under their profile so that emails they send (quotes, invoices) go out looking like they came from them personally, not a shared company inbox.
- **Attendance** tracks clock-in/out per staff member; **Attendance Report** (under Workforce) gives you an exportable summary.

---

## Marketing Automation

**Purpose:** run email campaigns to your leads/customers without leaving the CRM.

- **Templates** — build reusable HTML emails with the rich-text editor; every edit is versioned, so you can restore an older version if a change goes wrong.
- **Segments** — define an audience (e.g. "Leads from the last 30 days" or "Customers with no orders this quarter") that a campaign can target; preview who's included before you send.
- **Campaigns** — the wizard walks you through picking a template, a segment, and a send schedule (immediate or scheduled). Always use **Test Send** first to check a live inbox before launching to the full audience.
- Once launched, a campaign can be **paused, resumed, or cancelled** while it's still sending.
- **Queue** shows what's currently sending/retrying — campaigns are drained gradually in the background, not all at once.
- **Suppressions** lists anyone who unsubscribed or bounced; they're automatically excluded from future campaigns, no action needed from you.
- **Reports** and **Activity** show opens, clicks, bounces, and unsubscribes per campaign, and an overall trend.
- Configure your sending identity once under *Marketing → Settings* (SMTP account) — every campaign uses it unless you override it per-campaign.

---

## Reports

A dedicated reporting area, separate from the Dashboard, for pulling numbers you'd otherwise have to calculate by hand: sales totals, sales by staff member, an accounts-receivable aging report, a CRM funnel/pipeline summary, and (Admins only) a profit & loss report with real cost/margin data.

---

## Attendance

Staff clock in and out from here (or the mobile bottom nav on phones); Admins get an **Attendance Report** page under the Workforce sidebar group with exportable statistics per staff member.

---

## Settings

- **Workspace Settings** — company-wide preferences (currency, document numbering, general configuration).
- **Document Designer** — customize the HTML template used for Quote/Invoice/Purchase Bill/Delivery PDFs.
- **Google Contacts** — connect your Google account once; the app syncs your Google contacts in as Leads automatically going forward. You can trigger a manual re-sync or disconnect at any time from this page.
- **SMTP / Email** — each staff member can also set personal SMTP credentials from their own profile so outgoing mail is sent as them (see [Team and Users](#team-and-users)).

---

## Notifications and Search

- The bell icon keeps a live badge of unread notifications (new leads, quote approvals, overdue invoices, etc.) without needing to refresh the page.
- Press **⌘K** / **Ctrl+K** anywhere in the workspace to open global search and jump straight to a customer, deal, quote, or invoice by name/number.
