# QuickBill Restaurant POS

A modern point-of-sale (POS) and billing application built with React + TypeScript (frontend) and Express + MongoDB (backend). It supports staff/admin roles, multi-currency pricing, order history, printing bills, and a small admin panel.

Quick references:
- Frontend entry: [index.tsx](index.tsx)
- Main app: [App.tsx](App.tsx)
- API client: [`api`](services/api.ts)
- Auth provider/hooks: [`AuthProvider`](context/AuthContext.tsx), [`useAuth`](context/AuthContext.tsx)
- Shared types: [types.ts](types.ts)
- Constants: [`CURRENCIES`, `TAX_RATE`](constants.ts)
- Vite config / proxy: [vite.config.ts](vite.config.ts)
- Backend entry: [backend/server.js](backend/server.js)
- Backend DB connector: [backend/config/db.js](backend/config/db.js)
- Backend API routes: [backend/routes/admin.js](backend/routes/admin.js), [backend/routes/logs.js](backend/routes/logs.js), [backend/routes/profile.js](backend/routes/profile.js)

Features
- Staff/admin roles and JWT-based auth (see [`middleware/auth`](backend/middleware/auth.js) used by the backend).
- Menu management UI ([components/MenuList.tsx](components/MenuList.tsx), [components/MenuItem.tsx](components/MenuItem.tsx)).
- Order creation, tax calculation, currency conversion (see [constants.ts](constants.ts) and [types.ts](types.ts)).
- Payment modal & bill printing ([components/PaymentModal.tsx](components/PaymentModal.tsx), [components/BillModal.tsx](components/BillModal.tsx)).
- Admin panel: users, menu, orders, logs ([components/AdminPanel.tsx](components/AdminPanel.tsx), [components/admin/AdminUsers.tsx](components/admin/AdminUsers.tsx), [components/admin/AdminMenu.tsx](components/admin/AdminMenu.tsx), [components/admin/AdminOrders.tsx](components/admin/AdminOrders.tsx), [components/admin/AdminLogs.tsx](components/admin/AdminLogs.tsx)).

Prerequisites
- Node.js (v16+ recommended)
- MongoDB access (Atlas or local)

Quick start (frontend)
1. Install dependencies and run dev server:
```bash
npm install
npm run dev<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1K8lEu6RxLGHm53XFDt40byydeQ4Dy1_B

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
