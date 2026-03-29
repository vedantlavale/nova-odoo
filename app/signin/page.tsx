"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  ArrowRightIcon,
  BuildingOffice2Icon,
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  GlobeAltIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

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

const STEPS = ["Company", "Admin Account"] as const;

type CountryOption = {
  country: string;
  currencyCode: string;
};

export default function SignInPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(true);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [form, setForm] = useState({
    companyName: "",
    country: "India",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    title: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function loadBootstrapStatus() {
      try {
        const data = await callApi<{ needsSetup: boolean }>("/api/auth/bootstrap-status");
        setNeedsSetup(data.needsSetup);

        if (!data.needsSetup) {
          setError("Workspace is already set up. Sign in, then create additional users from the Admin panel.");
          setStep(0);
        }
      } catch {
        setError("Unable to verify setup status. Please try again.");
      } finally {
        setCheckingSetup(false);
      }
    }

    void loadBootstrapStatus();
  }, []);

  useEffect(() => {
    async function loadCountries() {
      try {
        const data = await callApi<{ countries: CountryOption[] }>("/api/reference/countries");
        setCountries(data.countries);

        const hasIndia = data.countries.some((entry) => entry.country === "India");
        if (!hasIndia && data.countries[0]) {
          setForm((current) => ({ ...current, country: data.countries[0].country }));
        }
      } catch {
        setError("Unable to load countries. Please refresh and try again.");
      } finally {
        setLoadingCountries(false);
      }
    }

    void loadCountries();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (checkingSetup) {
      return;
    }

    if (!needsSetup) {
      router.push("/login");
      return;
    }

    if (step === 0) { setStep(1); return; }

    if (form.password !== form.confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const signupPayload = {
        companyName: form.companyName,
        country: form.country,
        name: form.name,
        email: form.email,
        password: form.password,
        title: form.title,
      };
      await callApi("/api/auth/signup", { method: "POST", body: JSON.stringify(signupPayload) });
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
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f172a] relative overflow-hidden flex-col justify-between p-12">
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Corner markers */}
        <div className="absolute top-8 left-8 w-4 h-4 border-t border-l border-[#22c55e]/50" />
        <div className="absolute top-8 right-8 w-4 h-4 border-t border-r border-[#22c55e]/50" />
        <div className="absolute bottom-8 left-8 w-4 h-4 border-b border-l border-[#22c55e]/50" />
        <div className="absolute bottom-8 right-8 w-4 h-4 border-b border-r border-[#22c55e]/50" />

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

        {/* Center */}
        <div className="relative z-10">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#22c55e] mb-4">/ Setup in minutes</p>
          <h2 className="font-playfair text-4xl xl:text-5xl font-bold text-white leading-[1.1] mb-6">
            Your company&apos;s<br />expense hub starts here.
          </h2>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            Create your workspace, invite your team, and define approval workflows in a single afternoon.
          </p>

          {/* Feature bullets */}
          <div className="mt-10 space-y-4">
            {[
              "Multi-currency expense routing",
              "Sequential & parallel approval chains",
              "Real-time policy validation",
              "Full audit trail on every receipt",
            ].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#22c55e]/20 text-[#22c55e]">
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                </div>
                <span className="text-slate-300 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom badge */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
            <div className="h-2 w-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-[11px] text-slate-400 font-mono uppercase tracking-widest">Free to start · No credit card</span>
          </div>
        </div>
      </div>

      {/* Right signup panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 relative">
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
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#22c55e] mb-3">/ Create workspace</p>
            <h1 className="font-playfair text-4xl font-bold text-[#1a1a1a] leading-tight">
              {step === 0 ? "Tell us about\nyour company" : "Create your\nadmin account"}
            </h1>
            <p className="text-gray-500 mt-3 text-sm">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold font-mono transition-all ${
                  i < step ? "bg-[#22c55e] text-white" :
                  i === step ? "bg-[#18392b] text-white" :
                  "bg-gray-100 text-gray-400"
                }`}>
                  {i < step ? <CheckCircleIcon className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-[11px] font-mono uppercase tracking-widest ${i === step ? "text-gray-900 font-bold" : "text-gray-400"}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`h-px w-8 ${i < step ? "bg-[#22c55e]" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 0 ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-mono uppercase tracking-[0.15em] text-gray-500">Company Name</Label>
                  <div className="relative">
                    <BuildingOffice2Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      required
                      placeholder="Acme Corp"
                      value={form.companyName}
                      onChange={(e) => setForm(c => ({ ...c, companyName: e.target.value }))}
                      className="pl-10 h-12 rounded-xl border-gray-200 focus-visible:ring-[#22c55e] focus-visible:border-[#22c55e]"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-mono uppercase tracking-[0.15em] text-gray-500">Country <span className="normal-case font-normal text-gray-400 ml-1">(sets base currency)</span></Label>
                  <div className="relative">
                    <GlobeAltIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      required
                      value={form.country}
                      onChange={(e) => setForm(c => ({ ...c, country: e.target.value }))}
                      disabled={loadingCountries}
                      className="w-full pl-10 pr-4 h-12 rounded-xl border border-gray-200 bg-white text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22c55e] focus-visible:border-[#22c55e] disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      {loadingCountries ? (
                        <option value="">Loading countries...</option>
                      ) : (
                        countries.map((entry) => (
                          <option key={`${entry.country}-${entry.currencyCode}`} value={entry.country}>
                            {entry.country} ({entry.currencyCode})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-mono uppercase tracking-[0.15em] text-gray-500">Full Name</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        required
                        placeholder="Jane Doe"
                        value={form.name}
                        onChange={(e) => setForm(c => ({ ...c, name: e.target.value }))}
                        className="pl-10 h-12 rounded-xl border-gray-200 focus-visible:ring-[#22c55e]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-mono uppercase tracking-[0.15em] text-gray-500">Job Title</Label>
                    <Input
                      placeholder="CEO, CTO..."
                      value={form.title}
                      onChange={(e) => setForm(c => ({ ...c, title: e.target.value }))}
                      className="h-12 rounded-xl border-gray-200 focus-visible:ring-[#22c55e]"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-mono uppercase tracking-[0.15em] text-gray-500">Work Email</Label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      required
                      type="email"
                      placeholder="jane@acme.com"
                      value={form.email}
                      onChange={(e) => setForm(c => ({ ...c, email: e.target.value }))}
                      className="pl-10 h-12 rounded-xl border-gray-200 focus-visible:ring-[#22c55e]"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-mono uppercase tracking-[0.15em] text-gray-500">Password</Label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      required
                      type="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm(c => ({ ...c, password: e.target.value }))}
                      className="pl-10 h-12 rounded-xl border-gray-200 focus-visible:ring-[#22c55e]"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-mono uppercase tracking-[0.15em] text-gray-500">Confirm Password</Label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      required
                      type="password"
                      placeholder="••••••••"
                      value={form.confirmPassword}
                      onChange={(e) => setForm(c => ({ ...c, confirmPassword: e.target.value }))}
                      className="pl-10 h-12 rounded-xl border-gray-200 focus-visible:ring-[#22c55e]"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-1">
              {step > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(0)}
                  className="flex-1 h-12 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 shadow-none"
                >
                  Back
                </Button>
              )}
              <Button
                type="submit"
                disabled={busy || checkingSetup || !needsSetup}
                className="flex-1 h-12 rounded-xl bg-[#18392b] hover:bg-[#0f2219] text-white font-semibold text-sm group border-none shadow-none"
              >
                {checkingSetup ? "Checking workspace…" : busy ? "Creating workspace…" : step === 0 ? (
                  <>
                    Continue
                    <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                ) : (
                  <>
                    Create Workspace
                    <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have a workspace?{" "}
              <Link href="/login" className="text-[#22c55e] font-semibold hover:underline">
                Sign in here
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
