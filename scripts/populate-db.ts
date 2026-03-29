import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { connectToDatabase } from "../lib/db";
import { CompanyModel } from "../lib/models/company";
import { ExpenseModel } from "../lib/models/expense";
import { SessionModel } from "../lib/models/session";
import { UserModel } from "../lib/models/user";

const COMPANY_NAME = "Mock Reimbursements Inc";
const COMPANY_COUNTRY = "India";
const COMPANY_CURRENCY = "INR";
const DEFAULT_USER_PASSWORD = "Password@123";

const shouldKeepExisting = process.argv.includes("--keep-existing");

function daysAgo(totalDays: number) {
  return new Date(Date.now() - totalDays * 24 * 60 * 60 * 1000);
}

function toInr(amount: number) {
  return Number(amount.toFixed(2));
}

async function removePreviousSeedData() {
  const previousCompanies = await CompanyModel.find({ name: COMPANY_NAME }).select("_id").lean();

  if (!previousCompanies.length) {
    return;
  }

  const companyIds = previousCompanies.map((company) => company._id);

  await Promise.all([
    ExpenseModel.deleteMany({ companyId: { $in: companyIds } }),
    SessionModel.deleteMany({ companyId: { $in: companyIds } }),
    UserModel.deleteMany({ companyId: { $in: companyIds } }),
    CompanyModel.deleteMany({ _id: { $in: companyIds } }),
  ]);

  console.log(`Deleted existing seed data for ${COMPANY_NAME}.`);
}

async function createSeedData() {
  if (!shouldKeepExisting) {
    await removePreviousSeedData();
  }

  const existingCompany = await CompanyModel.findOne({ name: COMPANY_NAME });
  if (existingCompany && shouldKeepExisting) {
    console.log("Seed company already exists and --keep-existing was provided. Exiting.");
    return;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_USER_PASSWORD, 12);

  const company = await CompanyModel.create({
    name: COMPANY_NAME,
    country: COMPANY_COUNTRY,
    baseCurrency: COMPANY_CURRENCY,
    workflowConfig: {
      isManagerApproverRequired: true,
      approverSteps: [],
      conditionalRule: {
        enabled: true,
        percentageThreshold: 60,
        specificApproverTitle: "CFO",
        operator: "OR",
      },
    },
  });

  const admin = await UserModel.create({
    companyId: company._id,
    name: "Anika Sharma",
    email: "admin@mockreimbursements.com",
    passwordHash,
    role: "admin",
    title: "Administrator",
    managerId: null,
    isActive: true,
  });

  const managerOps = await UserModel.create({
    companyId: company._id,
    name: "Michael Scott",
    email: "michael@mockreimbursements.com",
    passwordHash,
    role: "manager",
    title: "Operations Manager",
    managerId: null,
    isActive: true,
  });

  const managerFinance = await UserModel.create({
    companyId: company._id,
    name: "Mitchell Green",
    email: "mitchell@mockreimbursements.com",
    passwordHash,
    role: "manager",
    title: "Finance Manager",
    managerId: null,
    isActive: true,
  });

  const cfo = await UserModel.create({
    companyId: company._id,
    name: "Carla Gomez",
    email: "cfo@mockreimbursements.com",
    passwordHash,
    role: "manager",
    title: "CFO",
    managerId: null,
    isActive: true,
  });

  const employeeA = await UserModel.create({
    companyId: company._id,
    name: "Sarah Lee",
    email: "sarah@mockreimbursements.com",
    passwordHash,
    role: "employee",
    title: "Sales Executive",
    managerId: managerOps._id,
    isActive: true,
  });

  const employeeB = await UserModel.create({
    companyId: company._id,
    name: "Arjun Patel",
    email: "arjun@mockreimbursements.com",
    passwordHash,
    role: "employee",
    title: "Software Engineer",
    managerId: managerOps._id,
    isActive: true,
  });

  const employeeC = await UserModel.create({
    companyId: company._id,
    name: "Nina Roy",
    email: "nina@mockreimbursements.com",
    passwordHash,
    role: "employee",
    title: "Accountant",
    managerId: managerFinance._id,
    isActive: true,
  });

  company.workflowConfig = {
    isManagerApproverRequired: true,
    approverSteps: [
      {
        sequence: 1,
        type: "role",
        role: "manager",
        label: "Finance and Ops Review",
      },
      {
        sequence: 2,
        type: "user",
        userId: cfo._id,
        label: "CFO Sign-off",
      },
    ],
    conditionalRule: {
      enabled: true,
      percentageThreshold: 60,
      specificApproverUserId: cfo._id,
      specificApproverTitle: "CFO",
      operator: "OR",
    },
  };

  await company.save();

  const conditionalSnapshot = {
    enabled: true,
    percentageThreshold: 60,
    specificApproverUserId: cfo._id,
    specificApproverTitle: "CFO",
    operator: "OR" as const,
  };

  const pendingExpense = {
    companyId: company._id,
    employeeId: employeeA._id,
    employeeManagerId: managerOps._id,
    status: "pending" as const,
    category: "Travel",
    description: "Client visit taxi reimbursements",
    expenseDate: daysAgo(2),
    originalAmount: 4200,
    originalCurrency: "INR",
    companyAmount: toInr(4200),
    companyCurrency: "INR",
    approvalTasks: [
      {
        sequence: 1,
        approverId: managerOps._id,
        approverRole: "manager" as const,
        approverTitle: managerOps.title,
        status: "pending" as const,
      },
      {
        sequence: 2,
        approverId: managerFinance._id,
        approverRole: "manager" as const,
        approverTitle: managerFinance.title,
        status: "pending" as const,
      },
      {
        sequence: 3,
        approverId: cfo._id,
        approverRole: "manager" as const,
        approverTitle: cfo.title,
        status: "pending" as const,
      },
    ],
    currentSequence: 1,
    conditionalRuleSnapshot: conditionalSnapshot,
    auditLogs: [
      {
        actorId: employeeA._id,
        action: "expense.submitted",
        comment: "Initial submission",
        createdAt: daysAgo(2),
      },
    ],
  };

  const waitingFinanceExpense = {
    companyId: company._id,
    employeeId: employeeB._id,
    employeeManagerId: managerOps._id,
    status: "pending" as const,
    category: "Meals",
    description: "Team dinner after release",
    expenseDate: daysAgo(4),
    originalAmount: 190,
    originalCurrency: "USD",
    companyAmount: toInr(15770),
    companyCurrency: "INR",
    approvalTasks: [
      {
        sequence: 1,
        approverId: managerOps._id,
        approverRole: "manager" as const,
        approverTitle: managerOps.title,
        status: "approved" as const,
        comment: "Looks good.",
        actedAt: daysAgo(3),
      },
      {
        sequence: 2,
        approverId: managerFinance._id,
        approverRole: "manager" as const,
        approverTitle: managerFinance.title,
        status: "pending" as const,
      },
      {
        sequence: 3,
        approverId: cfo._id,
        approverRole: "manager" as const,
        approverTitle: cfo.title,
        status: "pending" as const,
      },
    ],
    currentSequence: 2,
    conditionalRuleSnapshot: conditionalSnapshot,
    auditLogs: [
      {
        actorId: employeeB._id,
        action: "expense.submitted",
        comment: "Submitted after client meeting.",
        createdAt: daysAgo(4),
      },
      {
        actorId: managerOps._id,
        action: "expense.approved.step",
        comment: "Manager approved.",
        createdAt: daysAgo(3),
      },
    ],
  };

  const approvedSequentialExpense = {
    companyId: company._id,
    employeeId: employeeC._id,
    employeeManagerId: managerFinance._id,
    status: "approved" as const,
    category: "Supplies",
    description: "Office stationery purchase",
    expenseDate: daysAgo(12),
    originalAmount: 3100,
    originalCurrency: "INR",
    companyAmount: toInr(3100),
    companyCurrency: "INR",
    approvalTasks: [
      {
        sequence: 1,
        approverId: managerFinance._id,
        approverRole: "manager" as const,
        approverTitle: managerFinance.title,
        status: "approved" as const,
        comment: "Approved.",
        actedAt: daysAgo(11),
      },
      {
        sequence: 2,
        approverId: managerOps._id,
        approverRole: "manager" as const,
        approverTitle: managerOps.title,
        status: "approved" as const,
        comment: "Approved from ops.",
        actedAt: daysAgo(10),
      },
      {
        sequence: 3,
        approverId: cfo._id,
        approverRole: "manager" as const,
        approverTitle: cfo.title,
        status: "approved" as const,
        comment: "Final sign-off.",
        actedAt: daysAgo(9),
      },
    ],
    currentSequence: 3,
    conditionalRuleSnapshot: conditionalSnapshot,
    decisionReason: "sequential" as const,
    approvedAt: daysAgo(9),
    auditLogs: [
      {
        actorId: employeeC._id,
        action: "expense.submitted",
        comment: "Submitted expense.",
        createdAt: daysAgo(12),
      },
      {
        actorId: cfo._id,
        action: "expense.approved.final",
        comment: "Sequential chain complete.",
        createdAt: daysAgo(9),
      },
    ],
  };

  const approvedConditionalExpense = {
    companyId: company._id,
    employeeId: employeeA._id,
    employeeManagerId: managerOps._id,
    status: "approved" as const,
    category: "Travel",
    description: "Flight ticket to regional sales conference",
    expenseDate: daysAgo(15),
    originalAmount: 520,
    originalCurrency: "USD",
    companyAmount: toInr(43160),
    companyCurrency: "INR",
    approvalTasks: [
      {
        sequence: 1,
        approverId: managerOps._id,
        approverRole: "manager" as const,
        approverTitle: managerOps.title,
        status: "approved" as const,
        comment: "Business purpose confirmed.",
        actedAt: daysAgo(14),
      },
      {
        sequence: 2,
        approverId: managerFinance._id,
        approverRole: "manager" as const,
        approverTitle: managerFinance.title,
        status: "approved" as const,
        comment: "Budget available.",
        actedAt: daysAgo(13),
      },
      {
        sequence: 3,
        approverId: cfo._id,
        approverRole: "manager" as const,
        approverTitle: cfo.title,
        status: "skipped" as const,
        comment: "Auto-approved due to 60% rule.",
        actedAt: daysAgo(13),
      },
    ],
    currentSequence: 2,
    conditionalRuleSnapshot: conditionalSnapshot,
    decisionReason: "conditional" as const,
    approvedAt: daysAgo(13),
    auditLogs: [
      {
        actorId: employeeA._id,
        action: "expense.submitted",
        comment: "Submitted for conference travel.",
        createdAt: daysAgo(15),
      },
      {
        actorId: managerFinance._id,
        action: "expense.approved.conditional",
        comment: "Threshold met, auto-approved.",
        createdAt: daysAgo(13),
      },
    ],
  };

  const rejectedExpense = {
    companyId: company._id,
    employeeId: employeeB._id,
    employeeManagerId: managerOps._id,
    status: "rejected" as const,
    category: "Entertainment",
    description: "Post-event party bill",
    expenseDate: daysAgo(20),
    originalAmount: 11800,
    originalCurrency: "INR",
    companyAmount: toInr(11800),
    companyCurrency: "INR",
    approvalTasks: [
      {
        sequence: 1,
        approverId: managerOps._id,
        approverRole: "manager" as const,
        approverTitle: managerOps.title,
        status: "approved" as const,
        comment: "Forwarding to finance.",
        actedAt: daysAgo(19),
      },
      {
        sequence: 2,
        approverId: managerFinance._id,
        approverRole: "manager" as const,
        approverTitle: managerFinance.title,
        status: "rejected" as const,
        comment: "This category is outside policy.",
        actedAt: daysAgo(18),
      },
      {
        sequence: 3,
        approverId: cfo._id,
        approverRole: "manager" as const,
        approverTitle: cfo.title,
        status: "skipped" as const,
      },
    ],
    currentSequence: 2,
    conditionalRuleSnapshot: conditionalSnapshot,
    decisionReason: "sequential" as const,
    rejectedAt: daysAgo(18),
    finalComment: "Rejected at finance review.",
    auditLogs: [
      {
        actorId: employeeB._id,
        action: "expense.submitted",
        comment: "Submitted reimbursement.",
        createdAt: daysAgo(20),
      },
      {
        actorId: managerFinance._id,
        action: "expense.rejected.step",
        comment: "Not compliant with policy.",
        createdAt: daysAgo(18),
      },
    ],
  };

  const ocrGeneratedExpense = {
    companyId: company._id,
    employeeId: employeeC._id,
    employeeManagerId: managerFinance._id,
    status: "approved" as const,
    category: "Meals",
    description: "Client lunch at Olive Bistro",
    expenseDate: daysAgo(6),
    originalAmount: 74,
    originalCurrency: "EUR",
    companyAmount: toInr(6672),
    companyCurrency: "INR",
    receiptUrl: "https://example.com/mock-receipts/olive-bistro-001.jpg",
    ocrData: {
      merchantName: "Olive Bistro",
      parsedDate: daysAgo(6),
      parsedAmount: 74,
      detectedCurrency: "EUR",
      categoryGuess: "Meals",
      lineItems: ["Lunch combo", "Coffee", "Taxes"],
      rawText: "Olive Bistro\nTotal: 74.00 EUR\nDate: 2026-03-23",
      confidence: 0.94,
    },
    approvalTasks: [
      {
        sequence: 1,
        approverId: managerFinance._id,
        approverRole: "manager" as const,
        approverTitle: managerFinance.title,
        status: "approved" as const,
        comment: "Receipt parsed correctly.",
        actedAt: daysAgo(5),
      },
      {
        sequence: 2,
        approverId: cfo._id,
        approverRole: "manager" as const,
        approverTitle: cfo.title,
        status: "approved" as const,
        comment: "Approved by CFO.",
        actedAt: daysAgo(4),
      },
    ],
    currentSequence: 2,
    conditionalRuleSnapshot: conditionalSnapshot,
    decisionReason: "conditional" as const,
    approvedAt: daysAgo(4),
    auditLogs: [
      {
        actorId: employeeC._id,
        action: "expense.submitted",
        comment: "Created from OCR receipt extraction.",
        createdAt: daysAgo(6),
      },
      {
        actorId: cfo._id,
        action: "expense.approved.step",
        comment: "CFO approved this reimbursement.",
        createdAt: daysAgo(4),
      },
    ],
  };

  await ExpenseModel.insertMany([
    pendingExpense,
    waitingFinanceExpense,
    approvedSequentialExpense,
    approvedConditionalExpense,
    rejectedExpense,
    ocrGeneratedExpense,
  ]);

  const credentialRows = [
    ["Admin", admin.email],
    ["Ops Manager", managerOps.email],
    ["Finance Manager", managerFinance.email],
    ["CFO", cfo.email],
    ["Employee", employeeA.email],
    ["Employee", employeeB.email],
    ["Employee", employeeC.email],
  ];

  console.log("Mock database population completed.");
  console.log(`Company: ${company.name} (${company.baseCurrency})`);
  console.log(`Default password for all seeded users: ${DEFAULT_USER_PASSWORD}`);
  console.log("Seeded user logins:");

  for (const [label, email] of credentialRows) {
    console.log(`- ${label}: ${email}`);
  }
}

async function run() {
  await connectToDatabase();
  await createSeedData();
}

run()
  .catch((error) => {
    console.error("Failed to populate mock data:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

