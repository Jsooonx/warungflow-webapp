# Warungify

Warungify is an operations workspace for sellers who run their business through WhatsApp. It turns messy chat-based orders into a structured workflow: capture the order, track payment and packing, follow up through WhatsApp, monitor daily bottlenecks, and keep a customer history without maintaining spreadsheets by hand.

The product is currently designed for controlled beta testing. Public visitors apply through a beta form, approved sellers receive access through WhatsApp, and only approved accounts can open the workspace dashboard.

## Product Flow

1. **Apply for beta access**
   Sellers join the beta waitlist through the landing page CTA. The application is handled through Google Form and Google Sheet so the intake questions and approval process can stay flexible during early testing.

2. **Approve in batches**
   The owner reviews responses in Google Sheet, marks selected sellers as approved, and sends a WhatsApp approval message using a generated click-to-chat link. Approved emails are added to the Supabase allowlist.

3. **Create an account**
   Approved sellers create a Warungify account with Supabase Auth. Email verification is still required, but operational communication happens through WhatsApp.

4. **Enter the workspace**
   The app checks the user's profile status after login. Approved users enter the dashboard; pending or waitlisted users see a review status screen instead.

5. **Run daily operations**
   Sellers create orders, update statuses, send WhatsApp follow-ups, monitor stuck work, and review customer history from one workspace.

## Core Features

- **Beta-gated workspace**
  Public signup is protected by an approval gate. User profiles carry a beta status (`pending`, `approved`, `waitlist`, or `rejected`), and the dashboard only opens for approved accounts.

- **Supabase-backed auth and database**
  Orders, templates, and profile data are stored in Supabase with Row Level Security. Each user gets their own isolated workspace.

- **Operations dashboard**
  The dashboard highlights today's work queue, bottleneck aging, WhatsApp follow-up needs, invoice reminders, KPI cards, and recent order activity.

- **Order management**
  Sellers can create, edit, search, filter, delete, and update order statuses across the full lifecycle: pending payment, paid, packing, shipped, done, or cancelled.

- **Magic Paste order input**
  Chat-style order text can be pasted into the order form and parsed into structured fields such as name, phone, product, price, and notes.

- **WhatsApp actions**
  Order rows include quick WhatsApp actions that copy the relevant message and open the buyer chat. Templates cover payment confirmation, processing updates, shipping updates, and invoice messages.

- **Paid order invoice flow**
  Paid orders can generate a simple text invoice for WhatsApp. Invoice IDs use the order date and sequence for that day, and the dashboard can remind the seller when a paid invoice has not been sent yet.

- **Customer history**
  Customer records are derived from order data. The customer view shows lifetime order count, spending, WhatsApp number, last order date, and related order history.

- **Responsive workspace**
  Desktop uses a sidebar-driven operations layout, while mobile switches to a compact top bar and bottom navigation so the dashboard remains usable on phones.

- **Microinteractions**
  The app uses lightweight toasts, row highlights, status saved pulses, form error focus, dashboard entry animations, landing CTA text rolls, and subtle tab/showcase motion.

## Data and Security Model

- **One user, one workspace**
  The current beta model assumes one Supabase user owns one workspace.

- **Row Level Security**
  Orders and templates are protected with RLS policies scoped to `auth.uid()`.

- **Approval gate**
  `profiles.beta_status` controls dashboard access. Client-side users can read their own profile and update only safe profile fields; beta approval fields are not client-writable.

- **Pre-signup allowlist**
  `beta_approved_emails` lets the owner approve an email before the user creates an account. When the user signs up with that email, the profile trigger automatically marks the account as approved.

- **Local migration**
  If old local browser orders exist, approved users can import them once into the Supabase-backed workspace.

## Beta Intake Workflow

The beta intake process is documented in:

```text
docs/beta-intake-workflow.md
```

It includes:

- Google Form question list
- Google Sheet approval columns
- Apps Script auto-close after 100 responses
- WhatsApp approval link formula
- Supabase SQL for pre-signup allowlisting and batch approval

## Technical Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Supabase Auth and Postgres
- Lucide React icons
- Lenis smooth scrolling

## Beta Operations

Before opening a beta batch, the production database must include the latest schema for approval fields, the pre-signup allowlist, auth triggers, and hardened profile policies.

The landing page points applicants to the beta form through `VITE_BETA_APPLICATION_URL`. Once a seller is approved in the response sheet, their email is added to the Supabase allowlist and the approval message is sent through WhatsApp.

For the current beta, Warungify intentionally does not include a public admin panel. Intake review, batch approval, and notification tracking happen in Google Sheet so the process can stay lightweight while the product is still learning from early users.
