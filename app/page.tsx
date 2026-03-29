"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { LandingPage } from "@/components/landing-page";
import { EmployeeView } from "@/components/dashboard/employee-view";
import { ManagerView } from "@/components/dashboard/manager-view";
import { AdminView } from "@/components/dashboard/admin-view";
import type { Role, AuthUser, Company, Expense } from "@/components/dashboard/types";

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } };

async function callApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !payload.success) {
    const message = payload.success ? "Request failed." : payload.error.message;
    throw new Error(message);
  }
  return payload.data;
}

const TODAY = new Date().toISOString().slice(0, 10);
type DashboardTab = "employee" | "manager" | "admin";

export default function Home() {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("employee");

  const [user, setUser] = useState<AuthUser | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pendingExpenses, setPendingExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [workflowJson, setWorkflowJson] = useState("");

  const [expenseForm, setExpenseForm] = useState({
    amount: "", currency: "USD", category: "", description: "", expenseDate: TODAY, receiptText: "",
  });
  const [newUserForm, setNewUserForm] = useState({
    name: "", email: "", password: "", role: "employee" as Role, managerId: "", title: "",
  });

  useEffect(() => {
    if (user) {
      if (user.role === "admin") setActiveTab("admin");
      else if (user.role === "manager") setActiveTab("manager");
      else setActiveTab("employee");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const [showLanding, setShowLanding] = useState(true);

  // Bootstrap
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsBusy(true);
      try {
        const setup = await callApi<{ needsSetup: boolean }>("/api/auth/bootstrap-status");
        if (cancelled) return;
        setNeedsSetup(setup.needsSetup);
        if (setup.needsSetup) {
          // No company yet: redirect to signup wizard
          router.push("/signin");
          return;
        }
        try {
          const me = await callApi<{ user: AuthUser; company: Company }>("/api/auth/me");
          if (cancelled) return;
          setUser(me.user);
          setCompany(me.company);
          const pendingEndpoint =
            me.user.role === "admin" ? "/api/expenses?status=pending" : "/api/expenses/pending";
          const [expData, pendData] = await Promise.all([
            callApi<{ expenses: Expense[] }>("/api/expenses"),
            callApi<{ expenses: Expense[] }>(pendingEndpoint),
          ]);
          if (!cancelled) { setExpenses(expData.expenses); setPendingExpenses(pendData.expenses); }
          try { const ud = await callApi<{ users: AuthUser[] }>("/api/users"); if (!cancelled) setUsers(ud.users); } catch { /**/ }
          try { const wd = await callApi<{ workflowConfig: unknown }>("/api/workflow"); if (!cancelled) setWorkflowJson(JSON.stringify(wd.workflowConfig, null, 2)); } catch { /**/ }
          // Has session → hide landing page, show dashboard
          if (!cancelled) setShowLanding(false);
        } catch {
          // No session: stay on landing page, don't redirect
          if (!cancelled) setShowLanding(true);
        }
      } catch (err) {
        if (!cancelled) showToast((err as Error).message, "error");
      } finally {
        if (!cancelled) setIsBusy(false);
      }
    };
    void run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshExpenses() {
    const d = await callApi<{ expenses: Expense[] }>("/api/expenses");
    setExpenses(d.expenses);
  }
  async function refreshPendingExpenses() {
    const endpoint = user?.role === "admin" ? "/api/expenses?status=pending" : "/api/expenses/pending";
    const d = await callApi<{ expenses: Expense[] }>(endpoint);
    setPendingExpenses(d.expenses);
  }
  async function refreshUsers() {
    try { const d = await callApi<{ users: AuthUser[] }>("/api/users"); setUsers(d.users); } catch { setUsers([]); }
  }
  async function refreshWorkflow() {
    try { const d = await callApi<{ workflowConfig: unknown }>("/api/workflow"); setWorkflowJson(JSON.stringify(d.workflowConfig, null, 2)); } catch { setWorkflowJson(""); }
  }

  async function handleLogout() {
    setIsBusy(true);
    try {
      await callApi<{ message: string }>("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setIsBusy(false); }
  }

  async function handleExpenseSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setIsBusy(true);
    try {
      await callApi<{ expense: Expense }>("/api/expenses", {
        method: "POST",
        body: JSON.stringify({
          amount: Number(expenseForm.amount), currency: expenseForm.currency,
          category: expenseForm.category, description: expenseForm.description,
          expenseDate: expenseForm.expenseDate,
          receiptText: expenseForm.receiptText || undefined,
        }),
      });
      setExpenseForm(c => ({ ...c, amount: "", category: "", description: "", receiptText: "" }));
      await Promise.all([refreshExpenses(), refreshPendingExpenses()]);
      showToast("Expense submitted for approval.");
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setIsBusy(false); }
  }

  async function handleApproval(expenseId: string, action: "approve" | "reject") {
    const comment = window.prompt(`${action === "approve" ? "✅ Approve" : "❌ Reject"} — add a comment (optional):`, "") ?? "";
    setIsBusy(true);
    try {
      await callApi<{ expense: Expense }>(`/api/expenses/${expenseId}/${action}`, { method: "POST", body: JSON.stringify({ comment }) });
      await Promise.all([refreshExpenses(), refreshPendingExpenses()]);
      showToast(`Expense ${action}d.`);
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setIsBusy(false); }
  }

  async function handleOverride(expenseId: string, action: "approved" | "rejected") {
    const comment =
      window
        .prompt(
          action === "approved"
            ? "Admin override: approve this expense. Reason (required):"
            : "Admin override: reject this expense. Reason (required):",
          "",
        )
        ?.trim() ?? "";

    if (!comment) {
      showToast("Override comment is required.", "error");
      return;
    }

    setIsBusy(true);
    try {
      await callApi<{ expense: Expense }>(`/api/expenses/${expenseId}/override`, {
        method: "POST",
        body: JSON.stringify({ action, comment }),
      });
      await Promise.all([refreshExpenses(), refreshPendingExpenses()]);
      showToast(action === "approved" ? "Expense override-approved." : "Expense override-rejected.");
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setIsBusy(true);
    try {
      await callApi<{ user: AuthUser }>("/api/users", {
        method: "POST",
        body: JSON.stringify({
          name: newUserForm.name, email: newUserForm.email, password: newUserForm.password,
          role: newUserForm.role,
          managerId: newUserForm.role === "employee" ? newUserForm.managerId || undefined : undefined,
          title: newUserForm.title || undefined,
        }),
      });
      setNewUserForm({ name: "", email: "", password: "", role: "employee", managerId: "", title: "" });
      await refreshUsers();
      showToast("User provisioned successfully.");
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setIsBusy(false); }
  }

  async function handleUpdateUser(
    userId: string,
    payload: {
      role?: Role;
      managerId?: string | null;
      title?: string;
      isActive?: boolean;
    },
  ) {
    setIsBusy(true);
    try {
      await callApi<{ user: AuthUser }>(`/api/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      await refreshUsers();
      showToast("User updated successfully.");
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleWorkflowSave() {
    setIsBusy(true);
    try {
      const parsed = JSON.parse(workflowJson);
      await callApi<{ workflowConfig: unknown }>("/api/workflow", { method: "PUT", body: JSON.stringify(parsed) });
      showToast("Workflow saved successfully.");
      await refreshWorkflow();
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setIsBusy(false); }
  }

  const availableTabs = useMemo((): DashboardTab[] => {
    if (!user) return [];
    if (user.role === "employee") return ["employee"];
    if (user.role === "manager") return ["manager"];
    return ["manager", "admin"];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  // Initial check not done yet → brief loader
  if (needsSetup === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="text-[#22c55e] animate-spin" style={{ animationDuration: "3s" }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 rotate-45">
              <path d="M11 2h2v7.5l6.5-3.75 1 1.73-6.5 3.75 6.5 3.75-1 1.73-6.5-3.75V22h-2v-7.5l-6.5 3.75-1-1.73 6.5-3.75-6.5-3.75 1-1.73 6.5 3.75V2z" />
            </svg>
          </div>
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-gray-400">Loading…</p>
        </div>
      </main>
    );
  }

  // Unauthenticated (and setup exists): show landing page
  if (showLanding || !user) {
    return <LandingPage onLoginClick={() => router.push("/login")} />;
  }

  const TAB_CONFIG: Record<DashboardTab, { label: string; icon: typeof UserGroupIcon }> = {
    employee: { label: "My Expenses", icon: BriefcaseIcon },
    manager: { label: "Approvals", icon: UserGroupIcon },
    admin: { label: "Administration", icon: ShieldCheckIcon },
  };

  return (
    <main className="min-h-screen bg-[#fafafa] pb-16">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg border max-w-sm ${
          toast.type === "error"
            ? "bg-rose-50 text-rose-700 border-rose-200"
            : "bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]"
        }`}>
          {toast.type === "success" ? <CheckCircleIcon className="h-4 w-4 shrink-0 text-[#22c55e]" /> : <ArrowPathIcon className="h-4 w-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Top Navigation — Nova branded */}
      <header className="sticky top-0 z-30 border-b border-[#e5e7eb] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="text-[#22c55e]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 rotate-45">
                <path d="M11 2h2v7.5l6.5-3.75 1 1.73-6.5 3.75 6.5 3.75-1 1.73-6.5-3.75V22h-2v-7.5l-6.5 3.75-1-1.73 6.5-3.75-6.5-3.75 1-1.73 6.5 3.75V2z" />
              </svg>
            </div>
            <div>
              <span className="font-playfair font-black italic text-lg text-gray-900 tracking-tight">Nova</span>
              {company && <span className="hidden sm:inline ml-2 text-xs text-gray-400">· {company.name}</span>}
            </div>
          </Link>

          {/* Tab Nav (Desktop) */}
          <nav className="hidden md:flex items-center gap-0.5 bg-gray-100/80 rounded-xl p-1 border border-gray-200/50">
            {availableTabs.map((tab) => {
              const { label, icon: Icon } = TAB_CONFIG[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                    activeTab === tab
                      ? "bg-white text-[#1a1a1a] shadow-sm border border-gray-200/80"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {tab === "manager" && pendingExpenses.length > 0 && (
                    <span className="ml-0.5 flex h-4.5 min-w-4.5 px-1 items-center justify-center rounded-full bg-[#22c55e] text-white text-[10px] font-bold">
                      {pendingExpenses.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User info + Logout */}
          <div className="flex items-center gap-3">
            {isBusy && <ArrowPathIcon className="h-4 w-4 animate-spin text-gray-400" />}
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#18392b] text-white text-sm font-bold font-mono">
                {user.name[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-tight">{user.name}</p>
                <Badge className={`text-[10px] px-1.5 py-0 capitalize border ${
                  user.role === "admin" ? "bg-purple-50 text-purple-700 border-purple-200" :
                  user.role === "manager" ? "bg-blue-50 text-blue-700 border-blue-200" :
                  "bg-gray-50 text-gray-600 border-gray-200"
                }`}>{user.role}</Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleLogout()}
              disabled={isBusy}
              className="gap-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Sign out</span>
            </Button>
          </div>
        </div>

        {/* Mobile tab strip */}
        <div className="md:hidden border-t border-gray-100 px-4 flex gap-1 py-1 overflow-x-auto">
          {availableTabs.map((tab) => {
            const { label, icon: Icon } = TAB_CONFIG[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-[#18392b] text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {tab === "manager" && pendingExpenses.length > 0 && (
                  <span className="ml-0.5 flex h-4 items-center justify-center rounded-full bg-[#22c55e] text-white text-[9px] font-bold px-1">
                    {pendingExpenses.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Page content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-8 pt-8">
        {activeTab === "employee" && (
          <EmployeeView
            user={user}
            company={company!}
            expenses={expenses}
            isBusy={isBusy}
            expenseForm={expenseForm}
            setExpenseForm={setExpenseForm}
            onSubmitExpense={(e) => void handleExpenseSubmit(e)}
          />
        )}
        {activeTab === "manager" && (user.role === "manager" || user.role === "admin") && (
          <ManagerView
            user={user}
            company={company!}
            pendingExpenses={pendingExpenses}
            allUsers={users}
            isBusy={isBusy}
            onApprove={(id) => void handleApproval(id, "approve")}
            onReject={(id) => void handleApproval(id, "reject")}
            canOverride={user.role === "admin"}
            onOverrideApprove={(id) => void handleOverride(id, "approved")}
            onOverrideReject={(id) => void handleOverride(id, "rejected")}
            onRefresh={() => void Promise.all([refreshExpenses(), refreshPendingExpenses(), refreshUsers()])}
          />
        )}
        {activeTab === "admin" && user.role === "admin" && (
          <AdminView
            company={company!}
            users={users}
            workflowJson={workflowJson}
            isBusy={isBusy}
            newUserForm={newUserForm}
            setNewUserForm={setNewUserForm}
            onCreateUser={(e) => void handleCreateUser(e)}
            onUpdateUser={(id, payload) => void handleUpdateUser(id, payload)}
            onWorkflowChange={setWorkflowJson}
            onWorkflowSave={() => void handleWorkflowSave()}
          />
        )}
      </div>
    </main>
  );
}
