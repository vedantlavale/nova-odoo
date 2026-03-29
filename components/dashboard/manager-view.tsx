"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  UserCircleIcon,
  CurrencyDollarIcon,
  InboxIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import type { Expense, Company, AuthUser } from "./types";
import { compactCurrency } from "./types";

interface ManagerViewProps {
  user: AuthUser;
  company: Company;
  pendingExpenses: Expense[];
  allUsers: AuthUser[];
  isBusy: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  canOverride?: boolean;
  onOverrideApprove?: (id: string) => void;
  onOverrideReject?: (id: string) => void;
  onRefresh: () => void;
}

export function ManagerView({
  user,
  company,
  pendingExpenses,
  allUsers,
  isBusy,
  onApprove,
  onReject,
  canOverride = false,
  onOverrideApprove,
  onOverrideReject,
  onRefresh,
}: ManagerViewProps) {
  const getUserName = (id: string) => allUsers.find(u => u.id === id)?.name ?? "Unknown";
  const totalPendingAmount = pendingExpenses.reduce((s, e) => s + e.companyAmount, 0);

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#22c55e] mb-1">/ Manager View</p>
        <h1 className="font-playfair text-3xl font-bold text-[#1a1a1a]">Approvals to Review</h1>
        <p className="text-sm text-gray-500 mt-1">Reviewing as <span className="font-semibold text-[#1a1a1a]">{user.name}</span>{user.title ? ` · ${user.title}` : ""}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-400/30" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-amber-600/60">Awaiting Review</p>
          <p className="font-playfair text-3xl font-bold text-amber-800 mt-1">{pendingExpenses.length}</p>
          <p className="text-[11px] text-amber-600/60 mt-0.5">requests</p>
        </div>
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gray-300/50" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Total Exposure</p>
          <p className="font-playfair text-2xl font-bold text-[#1a1a1a] mt-1 truncate">{compactCurrency(totalPendingAmount, company.baseCurrency)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">pending approval</p>
        </div>
        <div className="col-span-2 md:col-span-1 rounded-2xl border border-[#e5e7eb] bg-[#18392b] p-4 text-white flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#a7f3d0]/60">Base Currency</p>
            <p className="font-playfair text-2xl font-bold mt-0.5">{company.baseCurrency}</p>
            <p className="text-[11px] text-[#a7f3d0]/60 mt-0.5">{company.name}</p>
          </div>
          <button
            onClick={onRefresh}
            disabled={isBusy}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-40"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isBusy ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Approval Queue */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[#e5e7eb] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#22c55e]/40" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#22c55e]/40" />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#1a1a1a]">Pending Approvals</h2>
              <p className="text-[11px] font-mono text-gray-400 mt-0.5 uppercase tracking-wider">
                All expenses awaiting your decision
              </p>
            </div>
            {pendingExpenses.length > 0 && (
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 border text-[10px] font-mono uppercase tracking-wider">
                {pendingExpenses.length} pending
              </Badge>
            )}
          </div>
        </div>

        {pendingExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <InboxIcon className="h-12 w-12 mb-3 text-gray-200" />
            <p className="font-playfair text-xl font-bold text-gray-400">All caught up!</p>
            <p className="text-sm mt-1 text-gray-400">No expenses are waiting for your approval.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {/* Table header */}
            <div className="hidden md:grid md:grid-cols-12 px-6 py-3 bg-[#fafafa] border-b border-gray-50">
              {["Request", "Submitted By", "Category", "Amount", "Actions"].map((h, i) => (
                <div key={h} className={`text-[10px] font-mono uppercase tracking-widest text-gray-400 ${
                  i === 0 ? "col-span-4" : i === 1 ? "col-span-2" : i === 2 ? "col-span-2" :
                  i === 3 ? "col-span-2 text-right" : "col-span-2 text-right"
                }`}>{h}</div>
              ))}
            </div>

            {pendingExpenses.map((expense) => {
              const isForeign = expense.originalCurrency !== expense.companyCurrency;
              return (
                <div key={expense.id} className="px-6 py-4 hover:bg-[#fafafa] transition-colors">
                  {/* Mobile */}
                  <div className="md:hidden space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[#1a1a1a]">{expense.category}</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 uppercase tracking-wider">
                            <ClockIcon className="h-3 w-3" /> Pending
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{expense.description}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-mono text-gray-400">
                          <UserCircleIcon className="h-3.5 w-3.5" />
                          {getUserName(expense.employeeId)} · {expense.expenseDate}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4 font-mono">
                        <p className="font-bold text-[#1a1a1a] text-sm">{compactCurrency(expense.companyAmount, expense.companyCurrency)}</p>
                        {isForeign && <p className="text-[11px] text-gray-400">{compactCurrency(expense.originalAmount, expense.originalCurrency)}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {canOverride ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => onOverrideApprove?.(expense.id)}
                            disabled={isBusy}
                            className="flex-1 bg-[#18392b] hover:bg-[#0f2219] text-white h-9 rounded-xl border-none shadow-none"
                          >
                            <CheckIcon className="h-4 w-4 mr-1.5" /> Force Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onOverrideReject?.(expense.id)}
                            disabled={isBusy}
                            className="flex-1 text-rose-600 hover:bg-rose-50 border-rose-200 h-9 rounded-xl shadow-none"
                          >
                            <XMarkIcon className="h-4 w-4 mr-1.5" /> Force Reject
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" onClick={() => onApprove(expense.id)} disabled={isBusy}
                            className="flex-1 bg-[#18392b] hover:bg-[#0f2219] text-white h-9 rounded-xl border-none shadow-none">
                            <CheckIcon className="h-4 w-4 mr-1.5" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => onReject(expense.id)} disabled={isBusy}
                            className="flex-1 text-rose-600 hover:bg-rose-50 border-rose-200 h-9 rounded-xl shadow-none">
                            <XMarkIcon className="h-4 w-4 mr-1.5" /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Desktop */}
                  <div className="hidden md:grid md:grid-cols-12 items-center gap-2">
                    <div className="col-span-4">
                      <p className="font-semibold text-sm text-[#1a1a1a]">{expense.description || expense.category}</p>
                      <p className="text-[11px] font-mono text-gray-400 mt-0.5">{expense.expenseDate}</p>
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5 text-sm text-gray-600">
                      <UserCircleIcon className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="truncate text-[13px]">{getUserName(expense.employeeId)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="inline-block text-[11px] font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded-lg uppercase tracking-wider truncate max-w-30">
                        {expense.category}
                      </span>
                    </div>
                    <div className="col-span-2 text-right font-mono">
                      <p className="font-bold text-[#1a1a1a] text-sm">{compactCurrency(expense.companyAmount, expense.companyCurrency)}</p>
                      {isForeign && (
                        <p className="text-[11px] text-gray-400">
                          <CurrencyDollarIcon className="inline h-3 w-3" /> {compactCurrency(expense.originalAmount, expense.originalCurrency)}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2 flex gap-2 justify-end">
                      {canOverride ? (
                        <>
                          <button
                            onClick={() => onOverrideApprove?.(expense.id)}
                            disabled={isBusy}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f0fdf4] text-[#22c55e] hover:bg-[#dcfce7] transition-colors disabled:opacity-40"
                            title="Force approve"
                          >
                            <CheckIcon className="h-4 w-4" strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => onOverrideReject?.(expense.id)}
                            disabled={isBusy}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-40"
                            title="Force reject"
                          >
                            <XMarkIcon className="h-4 w-4" strokeWidth={2.5} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => onApprove(expense.id)} disabled={isBusy}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f0fdf4] text-[#22c55e] hover:bg-[#dcfce7] transition-colors disabled:opacity-40"
                            title="Approve">
                            <CheckIcon className="h-4 w-4" strokeWidth={2.5} />
                          </button>
                          <button onClick={() => onReject(expense.id)} disabled={isBusy}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-40"
                            title="Reject">
                            <XMarkIcon className="h-4 w-4" strokeWidth={2.5} />
                          </button>
                        </>
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
  );
}
