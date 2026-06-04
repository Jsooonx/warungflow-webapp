# WarungFlow

An ultra-dense, high-performance operational tracking dashboard and order management system for WhatsApp-based sellers. Specially designed to streamline post-sale workflows, reduce manual copy-paste fatigue, and track customer lifecycles in real-time.

---

## Features

* **Secure Workspace Integration** – Split-pane authentication powered by Supabase. Supports local browser-based guest storage with one-click migration to cloud databases upon registration.
* **Operational Dashboard** – High-density KPIs overview (Total Orders, Pending Payments, Processing, Packing, Shipped, Done) with automated **"Need Attention"** widgets highlighting stuck or incomplete orders.
* **Dense Order Management Logs** – Fast, searchable, and sortable database view of order items. Direct in-row quick-status changes, editing, deletion, and quick-action WhatsApp prompt integrations.
* **Automated Customer CRM** – Compiled automatically from order logs. Keep track of customer metrics like purchase history, total lifetime spend, phone numbers, and detailed order logs within a flyout sliding drawer.
* **WhatsApp Template Generator** – Instantly populated customer notification templates (Payment Confirmation, Shipping/Receipt Alert, Processing Alert) that copy to clipboard and open WhatsApp Web/Mobile chat in one click.
* **Micro-Animations & Transitions** – Built with fluid loaders, high-fidelity responsive layouts, custom toasts, and viewport-aware transitions using Lenis and CSS utilities.

---

## Technology Stack

* **Frontend Framework:** [React 19](https://react.dev/) + [Vite](https://vite.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Styling Engine:** [Tailwind CSS v4](https://tailwindcss.com/)
* **Database & Auth:** [Supabase SDK](https://supabase.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Animations & Scrolling:** [Lenis Smooth Scroll](https://lenis.darkroom.engineering/)

---

## Getting Started

### 1. Prerequisites
Make sure you have Node.js installed (v18+ recommended) along with `npm` or `yarn`.

### 2. Environment Setup
Create a `.env` file in the root directory based on `.env.example`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Installation
Install the project dependencies:
```bash
npm install
```

### 4. Development Server
Run the local dev server with Hot Module Replacement (HMR):
```bash
npm run dev
```

### 5. Production Build
Build the optimized production assets:
```bash
npm run build
```

---

## Project Structure

```text
├── _specs/              # Product and technical specifications
├── public/              # Static assets and icons
├── src/
│   ├── components/      # Reusable view components (Dashboard, Orders, Form, CRM, Auth, Sidebar)
│   ├── hooks/           # Custom React hooks (state management, hash router, auth session)
│   ├── services/        # Supabase API handlers and client configurations
│   ├── types/           # TypeScript interfaces and type definitions
│   ├── App.tsx          # Main application router and state coordinator
│   ├── index.css        # Tailwind configurations and design tokens
│   └── main.tsx         # Application entry point
├── eslint.config.js     # Code quality and style linter configurations
├── vite.config.ts       # Vite compilation settings
└── tsconfig.json        # TypeScript configurations
```
