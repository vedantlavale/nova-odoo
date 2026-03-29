"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  ArrowRightIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

const DEMO_PASSWORD = "Password@123";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@mockreimbursements.com" },
  { label: "Manager (Ops)", email: "michael@mockreimbursements.com" },
  { label: "Employee", email: "sarah@mockreimbursements.com" },
] as const;

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } };

async function callApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  const payload = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !payload.success) throw new Error(payload.success ? "Request failed." : payload.error.message);
  return payload.data;
}

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function applyDemoCreds(email: string) {
    setForm({ email, password: DEMO_PASSWORD });
    setError("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await callApi("/api/auth/login", { method: "POST", body: JSON.stringify(form) });
      router.push("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#18392b] relative overflow-hidden flex-col justify-between p-12">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Corner markers */}
        <div className="absolute top-8 left-8 w-4 h-4 border-t border-l border-[#22c55e]/60" />
        <div className="absolute top-8 right-8 w-4 h-4 border-t border-r border-[#22c55e]/60" />
        <div className="absolute bottom-8 left-8 w-4 h-4 border-b border-l border-[#22c55e]/60" />
        <div className="absolute bottom-8 right-8 w-4 h-4 border-b border-r border-[#22c55e]/60" />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="text-[#22c55e]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 rotate-45">
                <path d="M11 2h2v7.5l6.5-3.75 1 1.73-6.5 3.75 6.5 3.75-1 1.73-6.5-3.75V22h-2v-7.5l-6.5 3.75-1-1.73 6.5-3.75-6.5-3.75 1-1.73 6.5 3.75V2z" />
              </svg>
            </div>
            <span className="font-playfair font-black italic text-2xl text-white tracking-tight">Nova</span>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#22c55e] mb-4">/ Expense Intelligence</p>
          <h2 className="font-playfair text-4xl xl:text-5xl font-bold text-white leading-[1.1] mb-6">
            Approve expenses<br />in seconds, not days.
          </h2>
          <p className="text-[#a7f3d0]/70 text-base leading-relaxed max-w-sm">
            Multi-currency routing, dynamic approval chains, and real-time policy enforcement — all in one workspace.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-10 pt-10 border-t border-white/10">
            {[
              { n: "89%", label: "Faster payouts" },
              { n: "93%", label: "Auto-approved" },
              { n: "4hr", label: "Setup time" },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-black text-[#22c55e] font-mono">{s.n}</p>
                <p className="text-[11px] text-[#a7f3d0]/60 uppercase tracking-widest font-mono mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer quote */}
        <div className="relative z-10 border-l-2 border-[#22c55e]/40 pl-4">
          <p className="text-[#a7f3d0]/70 text-sm italic leading-relaxed">
            &ldquo;We went from chasing managers on Slack to fully automated cross-currency settlements.&rdquo;
          </p>
          <p className="text-[11px] text-[#22c55e] font-mono uppercase tracking-widest mt-2">— Head of Finance</p>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 relative">
        {/* Subtle grid on the right too */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Mobile logo */}
        <div className="lg:hidden mb-10 self-start relative z-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-[#22c55e]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 rotate-45">
                <path d="M11 2h2v7.5l6.5-3.75 1 1.73-6.5 3.75 6.5 3.75-1 1.73-6.5-3.75V22h-2v-7.5l-6.5 3.75-1-1.73 6.5-3.75-6.5-3.75 1-1.73 6.5 3.75V2z" />
              </svg>
            </div>
            <span className="font-playfair font-black italic text-xl text-gray-900">Nova</span>
          </Link>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="mb-8">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#22c55e] mb-3">/ Welcome back</p>
            <h1 className="font-playfair text-4xl font-bold text-[#1a1a1a] leading-tight">Sign in to<br />your workspace</h1>
            <p className="text-gray-500 mt-3 text-sm">Enter your credentials to access Nova.</p>
          </div>

          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
            <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-emerald-700">Demo Credentials</p>
            <p className="mt-1 text-xs text-emerald-900/80">Use any demo account below. Password for all: <span className="font-mono">{DEMO_PASSWORD}</span></p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <Button
                  key={account.email}
                  type="button"
                  onClick={() => applyDemoCreds(account.email)}
                  className="h-9 rounded-lg bg-white text-[#18392b] border border-emerald-200 hover:bg-emerald-100 shadow-none"
                >
                  {account.label}
                </Button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-mono uppercase tracking-[0.15em] text-gray-500">
                Email Address
              </Label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  required
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => setForm(c => ({ ...c, email: e.target.value }))}
                  className="pl-10 h-12 rounded-xl border-gray-200 bg-white focus-visible:ring-[#22c55e] focus-visible:border-[#22c55e]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-mono uppercase tracking-[0.15em] text-gray-500">
                Password
              </Label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm(c => ({ ...c, password: e.target.value }))}
                  className="pl-10 h-12 rounded-xl border-gray-200 bg-white focus-visible:ring-[#22c55e] focus-visible:border-[#22c55e]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={busy}
              className="w-full h-12 rounded-xl bg-[#18392b] hover:bg-[#0f2219] text-white font-semibold text-sm mt-2 group border-none shadow-none"
            >
              {busy ? "Signing in…" : (
                <>
                  Sign In
                  <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              First time here?{" "}
              <Link href="/signin" className="text-[#22c55e] font-semibold hover:underline">
                Create your company workspace
              </Link>
            </p>
          </div>

          <p className="text-center text-[11px] text-gray-400 font-mono mt-8">
            © 2026 Nova · Expense Intelligence
          </p>
        </div>
      </div>
    </div>
  );
}
