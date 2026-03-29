# Nova Reimbursement Management

Production-style reimbursement management system built with Next.js App Router, Bun, and MongoDB.

It supports a full company lifecycle:

- First-time workspace bootstrap (company + first admin)
- Role-based operations for admin, manager, and employee
- Multi-currency expense submission and conversion
- Configurable approval workflows (manager-first, user/role approvers, required approvers)
- Conditional completion logic (percentage, specific approver, title, OR/AND)
- Admin override actions for exceptional handling
- OCR text parsing for receipt prefill
- Audit trail across submission and approval actions

## Table of Contents

- Overview
- Tech Stack
- Repository Structure
- Getting Started
- Environment Variables
- Product Flows
- Demo Data and Credentials
- Approval Workflow Model
- API Reference
- OCR Design
- Security and Access Rules
- Development Commands
- Troubleshooting

## Overview

Nova is designed for teams that need a practical expense approval engine rather than only static forms.

Key capabilities:

- Employees submit expenses in original currency
- Amounts are converted into company base currency
- Approval tasks are generated from company workflow configuration
- Approvers can approve/reject in sequence with optional parallel approvals on same sequence
- Conditional rules can auto-complete approval when policy criteria are met
- Audit logs are preserved for traceability

## Tech Stack

- Next.js 16 (App Router + Route Handlers)
- React 19
- Bun (package manager and runtime scripts)
- MongoDB + Mongoose
- Zod for request/schema validation
- bcryptjs for password hashing
- Tailwind CSS v4

## Repository Structure

- app
	- API route handlers and pages
- components
	- Dashboard role views and UI primitives
- lib
	- Domain logic (workflow, auth, serialization, OCR, validation)
	- Mongoose models
- scripts
	- Local data seeding script

High-value files:

- app/page.tsx
	- Main authenticated dashboard container
- components/dashboard/admin-view.tsx
	- Admin UX: user management + simplified workflow builder
- lib/workflow.ts
	- Approval task generation and progression logic
- app/api/expenses/*
	- Expense submission and approval actions

## Getting Started

### 1. Prerequisites

- Bun installed
- MongoDB connection available (local or Atlas)

### 2. Install dependencies

```bash
bun install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Update values in .env.local:

- MONGODB_URI (required)
- MONGODB_DB_NAME (optional)

### 4. Start development server

```bash
bun run dev
```

Open http://localhost:3000

### 5. Bootstrap workspace

If no company exists yet:

- Use /signin to create company and first admin

If a company already exists:

- Use /login to sign in

## Environment Variables

- MONGODB_URI
	- Required. MongoDB connection URI.
- MONGODB_DB_NAME
	- Optional. Explicit database name override.

## Product Flows

### Auth and Bootstrap

- GET /api/auth/bootstrap-status checks whether first-time setup is needed
- POST /api/auth/signup is only intended for first setup
- POST /api/auth/login creates session cookie
- POST /api/auth/logout clears session
- GET /api/auth/me returns current user + company snapshot

### Expense Submission

- Employee creates expense with amount/currency/date/category/description
- System converts amount to company currency
- Workflow engine snapshots current workflow and creates approval tasks
- Expense enters pending state with currentSequence gate

### Approval Lifecycle

- Approver can act only when task is pending and active for current sequence
- Required approver rejection fails expense
- Optional approver rejection can continue based on remaining policy criteria
- Conditional rule can finish approval early when satisfied
- Admin can override to approved/rejected at any time

## Demo Data and Credentials

Seed sample workspace and users:

```bash
bun run db:seed
```

Preserve existing seed workspace and append data only when missing:

```bash
bun run db:seed:keep
```

Default demo password for seeded users:

- Password@123

Seeded demo users:

- admin@mockreimbursements.com
- michael@mockreimbursements.com
- sarah@mockreimbursements.com
- (plus finance/cfo and additional employees)

Note: Login page includes one-click demo credential autofill.

## Approval Workflow Model

Workflow configuration supports:

- isManagerApproverRequired
	- Always include employee manager in chain when enabled
- approverSteps
	- Ordered steps by sequence
	- Step type can be role or specific user
	- Each step can be required or optional
- conditionalRule
	- enabled
	- percentageThreshold
	- specificApproverUserId
	- specificApproverTitle
	- operator: OR or AND

Admin experience:

- Primary: simplified form-based workflow builder
- Advanced: optional raw JSON editor toggle for power users

Example payload:

```json
{
	"isManagerApproverRequired": true,
	"approverSteps": [
		{
			"sequence": 1,
			"type": "role",
			"role": "manager",
			"label": "Finance and Ops Review",
			"required": true
		},
		{
			"sequence": 2,
			"type": "user",
			"userId": "69c8f7329e804527fbbd1654",
			"label": "CFO Sign-off",
			"required": true
		}
	],
	"conditionalRule": {
		"enabled": true,
		"percentageThreshold": 60,
		"specificApproverUserId": "69c8f7329e804527fbbd1654",
		"specificApproverTitle": "CFO",
		"operator": "OR"
	}
}
```

## API Reference

### Auth

- GET /api/auth/bootstrap-status
- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

### Users and Workflow (admin-focused)

- GET /api/users
- POST /api/users
- GET /api/users/:userId
- PATCH /api/users/:userId
- GET /api/workflow
- PUT /api/workflow

### Expenses

- GET /api/expenses
- POST /api/expenses
- GET /api/expenses/:expenseId
- GET /api/expenses/pending
- POST /api/expenses/:expenseId/approve
- POST /api/expenses/:expenseId/reject
- POST /api/expenses/:expenseId/override
- POST /api/expenses/ocr

### Reference

- GET /api/reference/countries
- GET /api/reference/convert?amount=&fromCurrency=&toCurrency=

## OCR Design

Core OCR text parser:

- lib/ocr.ts

OCR endpoint:

- POST /api/expenses/ocr

Submission path also parses receiptText automatically:

- POST /api/expenses

Current OCR behavior is text-first parsing. If image OCR provider integration is added later, the parser contract can remain stable.

## Security and Access Rules

- Session cookie is HTTP-only and server-managed
- Role-restricted APIs guard admin and manager operations
- Expense creation is restricted to employee role
- Self-approval is blocked
- Manager relationships are validated to avoid invalid hierarchies

## Development Commands

- Start dev server

```bash
bun run dev
```

- Lint

```bash
bun run lint
```

- Build

```bash
bun run build
```

- Start production server after build

```bash
bun run start
```

## Troubleshooting

### Workspace already configured on /signin

Expected behavior. Use /login for existing workspace access.

### Manager approval error for employee

If manager approval is enabled, each employee needs a manager assignment. Update in Admin panel under user management.

### Next.js warning about inferred workspace root

If multiple lockfiles exist in parent folders, Next.js may warn about inferred root. This is non-blocking locally; configure turbopack.root if needed.

### Failed API due to invalid workflow JSON

Use the simplified workflow builder in Admin view. Keep raw JSON editing for advanced changes only.
