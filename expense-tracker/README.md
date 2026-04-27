# Kharcha   — Personal Expense Tracker

A clean, production‑style expense tracker built with **Next.js 14 (App Router)**, **MongoDB**, and **Tailwind CSS**.

---

## Features

- Add, view, filter, and sort expenses
- Interactive **Top Categories** pie chart (hover for totals, click to open category page)
- Category detail pages with full expense metadata
- Click any expense row to **edit or delete**
- JWT auth (HttpOnly cookie) with login/register
- Direct password change by email (no token flow)
- Idempotent creates (safe under retries)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 |
| Database | MongoDB |
| ODM | Mongoose |
| Styling | Tailwind CSS |
| Testing | Jest |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB local **or** MongoDB Atlas

### Install

```bash
npm install
```

### Environment

Create `.env.local` from the template:

```bash
cp .env.example .env.local
```

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Mongo connection string |
| `MONGODB_DB` | Expenses DB (default: `expense-tracker`) |
| `MONGODB_USERS_DB` | Users DB (default: `expenses-user`) |
| `JWT_SECRET` | Secret for signing auth cookies |

### Run

```bash
npm run dev
```

---

## App Flows

**Auth**

- Register, login, logout
- Password change uses **email + new password** (no reset token)

**Expenses**

- Add expenses from the left panel
- Click a row to edit/delete
- Use the pie chart to jump to a category page

---

## API Endpoints

**Auth**

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password` (direct email-based password change)

**Expenses**

- `GET /api/expenses?category=&sort=`
- `POST /api/expenses`
- `PUT /api/expenses/:id`
- `DELETE /api/expenses/:id`

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── expenses/
│   │       ├── route.ts       # GET + POST
│   │       └── [id]/
│   │           └── route.ts   # PUT + DELETE
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx               # Dashboard
│   ├── login/                 # Auth UI
│   └── category/[category]/   # Category details
├── components/
│   ├── AddExpenseForm.tsx
│   └── ExpenseList.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useExpenses.ts
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   ├── db.ts
│   └── types.ts
├── models/
│   ├── Expense.ts
│   └── User.ts
└── __tests__/
    └── expense.test.ts
```

---

## Notes

- The “forgot password” endpoint is **direct email-based** and meant for local/dev usage.
- For production, replace it with a secure token + email flow.
