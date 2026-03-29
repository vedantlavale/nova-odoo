# Reimbursement Management (Next.js + Bun + MongoDB)

Backend-first implementation of a reimbursement platform with:

- First-login company bootstrap and admin creation
- Role-based access (`admin`, `manager`, `employee`)
- Employee expense submission with currency conversion
- Multi-level sequential approvals
- Conditional approvals (`percentage`, `specific approver`, `hybrid OR/AND`)
- Admin workflow configuration and override
- Receipt OCR text parsing for expense prefill

## Stack

- Next.js 16 (App Router, Route Handlers)
- Bun (package/runtime)
- MongoDB + Mongoose
- Zod validation
- bcryptjs password hashing

## Quick Start

1. Install dependencies:

```bash
bun install
```

2. Configure environment:

```bash
cp .env.example .env.local
```

3. Set `MONGODB_URI` (and optional `MONGODB_DB_NAME`).

4. Run:

```bash
bun dev
```

5. Open `http://localhost:3000`.

## Environment Variables

- `MONGODB_URI` (required)
- `MONGODB_DB_NAME` (optional)

## Backend Design

### Core Collections

1. `companies`
- Base org metadata
- Country + base currency
- Approval workflow config

2. `users`
- Role (`admin` / `manager` / `employee`)
- Optional title (supports rules like `CFO`)
- Manager relationship (`managerId`)

3. `sessions`
- Cookie-based login sessions (`rm_session`)
- Expiry-backed records

4. `expenses`
- Original amount/currency + converted company amount/currency
- Embedded approval tasks (`sequence`, `approver`, `status`, `comment`)
- Conditional rule snapshot (copied at submission time)
- Audit log events

### Approval Engine

When an expense is created:

1. Build approval tasks:
- Optional manager-first step (`isManagerApproverRequired`)
- Then configured sequential steps (`user` or `role`)

2. Persist `currentSequence` to gate who can act.

3. On approve:
- Mark approver task approved
- Evaluate conditional rule snapshot:
	- Percentage threshold
	- Specific user/title
	- Hybrid `OR` / `AND`
- If rule passes, auto-approve and skip remaining pending tasks
- Else advance sequence after all current-step tasks resolve

4. On reject:
- Reject expense
- Skip remaining pending tasks

5. Admin override:
- Force `approved` or `rejected` at any point

## API Surface

### Auth

- `GET /api/auth/bootstrap-status`
- `POST /api/auth/signup` (first-time setup)
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Users and Workflow

- `GET /api/users`
- `POST /api/users` (admin)
- `GET /api/users/:userId`
- `PATCH /api/users/:userId` (admin)
- `GET /api/workflow`
- `PUT /api/workflow` (admin)

### Expenses

- `GET /api/expenses`
- `POST /api/expenses`
- `GET /api/expenses/:expenseId`
- `GET /api/expenses/pending`
- `POST /api/expenses/:expenseId/approve`
- `POST /api/expenses/:expenseId/reject`
- `POST /api/expenses/:expenseId/override` (admin)
- `POST /api/expenses/ocr`

### Reference APIs

- `GET /api/reference/countries`
	- Source: `https://restcountries.com/v3.1/all?fields=name,currencies`
- `GET /api/reference/convert?amount=&fromCurrency=&toCurrency=`
	- Source: `https://api.exchangerate-api.com/v4/latest/{BASE_CURRENCY}`

## Example Workflow Payload

```json
{
	"isManagerApproverRequired": true,
	"approverSteps": [
		{ "sequence": 1, "type": "user", "userId": "660000000000000000000001", "label": "Finance" },
		{ "sequence": 2, "type": "user", "userId": "660000000000000000000002", "label": "Director" }
	],
	"conditionalRule": {
		"enabled": true,
		"percentageThreshold": 60,
		"specificApproverTitle": "CFO",
		"operator": "OR"
	}
}
```

## OCR Behavior

`POST /api/expenses/ocr` currently accepts OCR text and extracts likely:

- Amount
- Currency
- Date
- Merchant
- Category hint
- Line items

This is a backend parsing layer; if you add image OCR later (for example Tesseract or external OCR provider), route output contract can stay unchanged.

## Notes

- Session cookie is HTTP-only and server-managed.
- Build verified with `bun run build`.
- Lint verified with `bun run lint`.
