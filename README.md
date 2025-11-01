# Expenses Manager (React + Vite + Tailwind)

A small demo app to manage expenses (transactions, debit, credit) with a dashboard and simple navigation.

Getting started

1. Install dependencies

```bash
# Windows (cmd.exe)
npm install
```

2. Run the dev server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

Notes
- Uses React Router for navigation
- Uses a small context reducer for state; data is in-memory (no backend)
- Tailwind is configured — run the dev server to see styles

New features added:
- Richer sample data with categories and dates
- Dashboard now shows totals by category and a 6-month monthly summary
- Add Transaction form accepts date and category
 - Dark mode (toggle in the header) — preference is persisted to localStorage
 - New `account` field for transactions (e.g. ABCBank, CreditCardA). Dashboard shows totals by account and Add form lets you select an account.

Next steps (optional)
- Persist transactions to localStorage or a backend
- Add edit and filtering
- Add tests and CI
