"use client";

import { useState, type DragEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpTrayIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ReceiptRefundIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import type { Expense, Company, AuthUser } from "./types";
import { compactCurrency } from "./types";

const CURRENCY_OPTIONS = [
  "USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD", "CHF", "CNY", "SGD",
  "AED", "MXN", "BRL", "ZAR", "HKD", "NOK", "SEK", "DKK", "NZD", "THB",
];

const CATEGORIES = [
  "Travel", "Meals & Entertainment", "Accommodation", "Transport",
  "Office Supplies", "Cloud Services", "Marketing", "Training",
  "Software & Tools", "Client Gifts", "Miscellaneous",
];

interface EmployeeViewProps {
  user: AuthUser;
  company: Company;
  expenses: Expense[];
  isBusy: boolean;
  expenseForm: {
    amount: string;
    currency: string;
    category: string;
    description: string;
    expenseDate: string;
    receiptText: string;
  };
  setExpenseForm: (updater: (prev: EmployeeViewProps["expenseForm"]) => EmployeeViewProps["expenseForm"]) => void;
  onSubmitExpense: (e: FormEvent<HTMLFormElement>) => void;
  onScanReceiptImage: (file: File) => void;
  ocrProgress: number;
  ocrStatus: string;
}

function statusConfig(status: Expense["status"]) {
  if (status === "approved") return { label: "Approved", icon: CheckCircleIcon, className: "bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]" };
  if (status === "rejected") return { label: "Rejected", icon: XCircleIcon, className: "bg-rose-50 text-rose-700 border-rose-200" };
  return { label: "Pending", icon: ClockIcon, className: "bg-amber-50 text-amber-700 border-amber-200" };
}

export function EmployeeView({
  user,
  company,
  expenses,
  isBusy,
  expenseForm,
  setExpenseForm,
  onSubmitExpense,
  onScanReceiptImage,
  ocrProgress,
  ocrStatus,
}: EmployeeViewProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const totalApproved = expenses.filter(e => e.status === "approved").reduce((s, e) => s + e.companyAmount, 0);
  const totalPending = expenses.filter(e => e.status === "pending").reduce((s, e) => s + e.companyAmount, 0);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
    const selected = event.dataTransfer.files?.[0];
    if (selected) {
      onScanReceiptImage(selected);
    }
  }

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#22c55e] mb-1">/ Employee View</p>
        <h1 className="font-playfair text-3xl font-bold text-[#1a1a1a]">My Expenses</h1>
        <p className="text-sm text-gray-500 mt-1">{user.name} · {company.name} · Base: <span className="font-semibold">{company.baseCurrency}</span></p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Submitted", value: String(expenses.length), sub: "expense reports", color: "default" as const },
          { label: "Approved", value: compactCurrency(totalApproved, company.baseCurrency), sub: `${expenses.filter(e => e.status === "approved").length} claims`, color: "green" as const },
          { label: "Awaiting", value: compactCurrency(totalPending, company.baseCurrency), sub: `${expenses.filter(e => e.status === "pending").length} pending`, color: "amber" as const },
          { label: "Rejected", value: String(expenses.filter(e => e.status === "rejected").length), sub: "to review", color: "rose" as const },
        ].map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        {/* Submit Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm overflow-hidden">
            {/* Form header */}
            <div className="px-6 py-5 border-b border-[#e5e7eb] relative overflow-hidden">
              {/* Corner marker */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#22c55e]/40" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#22c55e]/40" />
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0fdf4] text-[#22c55e]">
                  <ArrowUpTrayIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#1a1a1a]">Submit Expense</h2>
                  <p className="text-[11px] font-mono text-gray-400 mt-0.5 uppercase tracking-wider">Auto-converted to {company.baseCurrency}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={onSubmitExpense} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">Amount</Label>
                    <Input
                      id="expAmount" required type="number" min="0" step="0.01" placeholder="0.00"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm(c => ({ ...c, amount: e.target.value }))}
                      className="h-10 rounded-xl border-gray-200 focus-visible:ring-[#22c55e]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">Currency</Label>
                    <select
                      className="flex h-10 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22c55e]"
                      value={expenseForm.currency}
                      onChange={(e) => setExpenseForm(c => ({ ...c, currency: e.target.value }))}
                    >
                      {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">Category</Label>
                  <select
                    className="flex h-10 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22c55e]"
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm(c => ({ ...c, category: e.target.value }))}
                    required
                  >
                    <option value="">Select category…</option>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">Expense Date</Label>
                  <Input
                    id="expDate" required type="date"
                    value={expenseForm.expenseDate}
                    onChange={(e) => setExpenseForm(c => ({ ...c, expenseDate: e.target.value }))}
                    className="h-10 rounded-xl border-gray-200 focus-visible:ring-[#22c55e]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">Description</Label>
                  <Input
                    id="expDesc" required placeholder="Dinner with the Singapore team…"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm(c => ({ ...c, description: e.target.value }))}
                    className="h-10 rounded-xl border-gray-200 focus-visible:ring-[#22c55e]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">
                    Receipt Notes <span className="normal-case font-normal text-gray-400">(optional)</span>
                  </Label>
                  <Textarea
                    id="expReceipt"
                    placeholder="Paste extracted text from receipt, invoice number…"
                    value={expenseForm.receiptText}
                    onChange={(e) => setExpenseForm(c => ({ ...c, receiptText: e.target.value }))}
                    rows={3}
                    className="resize-none text-sm rounded-xl border-gray-200 focus-visible:ring-[#22c55e]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">
                    Receipt Image <span className="normal-case font-normal text-gray-400">(OCR autofill)</span>
                  </Label>
                  <div
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragActive(true);
                    }}
                    onDragLeave={() => setIsDragActive(false)}
                    onDrop={handleDrop}
                    className={`rounded-xl border-2 border-dashed p-3 transition-colors ${
                      isDragActive ? "border-[#22c55e] bg-[#f0fdf4]" : "border-gray-200 bg-[#fafafa]"
                    }`}
                  >
                    <p className="text-[11px] text-gray-500">Drag and drop receipt image/PDF here, or choose a file below.</p>
                  </div>
                  <Input
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    onChange={(e) => {
                      const selected = e.target.files?.[0];
                      if (selected) {
                        onScanReceiptImage(selected);
                      }
                      e.currentTarget.value = "";
                    }}
                    className="h-10 rounded-xl border-gray-200 focus-visible:ring-[#22c55e]"
                  />
                  <p className="text-[11px] text-gray-400">Upload a receipt photo or PDF to auto-fill amount, date, and description.</p>

                  {ocrStatus && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5">
                      <p className="text-[11px] text-emerald-800">{ocrStatus}</p>
                      {ocrProgress > 0 && ocrProgress < 100 && (
                        <div className="mt-2 h-1.5 w-full rounded-full bg-emerald-100 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${ocrProgress}%` }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isBusy}
                  className="w-full h-11 rounded-xl bg-[#18392b] hover:bg-[#0f2219] text-white font-semibold text-sm border-none shadow-none"
                >
                  {isBusy ? "Submitting…" : "Submit for Approval"}
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Expense History */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#e5e7eb] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#22c55e]/40" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#22c55e]/40" />
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[#1a1a1a]">Expense History</h2>
                  <p className="text-[11px] font-mono text-gray-400 mt-0.5 uppercase tracking-wider">
                    {expenses.length} total records
                  </p>
                </div>
                <Badge className="bg-gray-100 text-gray-600 border-gray-200 border text-[11px] font-mono">
                  {expenses.length}
                </Badge>
              </div>
            </div>

            {expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <ReceiptRefundIcon className="h-12 w-12 mb-3 text-gray-200" />
                <p className="font-semibold text-gray-400 font-playfair">No expenses yet</p>
                <p className="text-sm mt-1 text-gray-400">Submit your first expense using the form</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {expenses.map((expense) => {
                  const { label, icon: Icon, className } = statusConfig(expense.status);
                  const isForeign = expense.originalCurrency !== expense.companyCurrency;
                  return (
                    <div key={expense.id} className="p-4 px-6 hover:bg-[#fafafa] transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f0fdf4] text-[#22c55e] mt-0.5">
                            <CurrencyDollarIcon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-[#1a1a1a]">{expense.category}</span>
                              <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${className}`}>
                                <Icon className="h-3 w-3" />
                                {label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{expense.description}</p>
                            <p className="text-[11px] font-mono text-gray-400 mt-1">{expense.expenseDate}</p>
                            {expense.approvalTasks && expense.approvalTasks.filter(t => t.actedAt).map((task, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1">
                                {task.status === "approved"
                                  ? <CheckCircleIcon className="h-3 w-3 text-[#22c55e]" />
                                  : <XCircleIcon className="h-3 w-3 text-rose-500" />
                                }
                                <span className="capitalize">
                                  {task.approverName ?? task.approverTitle ?? task.approverRole} · {task.status}
                                </span>
                                {task.actedAt && (
                                  <span>{new Date(task.actedAt).toLocaleString()}</span>
                                )}
                                {task.comment && <span className="truncate">&ldquo;{task.comment}&rdquo;</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-[#1a1a1a] text-sm font-mono">
                            {compactCurrency(expense.companyAmount, expense.companyCurrency)}
                          </p>
                          {isForeign && (
                            <p className="text-[11px] text-gray-400 font-mono">
                              {compactCurrency(expense.originalAmount, expense.originalCurrency)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: {
  label: string; value: string; sub: string;
  color: "default" | "green" | "amber" | "rose";
}) {
  const styles = {
    default: "bg-white border-[#e5e7eb] text-[#1a1a1a]",
    green:   "bg-[#f0fdf4] border-[#bbf7d0] text-[#166534]",
    amber:   "bg-amber-50 border-amber-100 text-amber-800",
    rose:    "bg-rose-50 border-rose-100 text-rose-700",
  };
  return (
    <div className={`rounded-2xl border p-4 relative overflow-hidden ${styles[color]}`}>
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-20" />
      <p className="text-[10px] font-mono uppercase tracking-[0.15em] opacity-60">{label}</p>
      <p className="font-playfair text-2xl font-bold mt-1 truncate">{value}</p>
      <p className="text-[11px] opacity-50 mt-0.5">{sub}</p>
    </div>
  );
}
