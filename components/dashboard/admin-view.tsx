"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  UserPlusIcon,
  UsersIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import type { AuthUser, Company, Role } from "./types";

type WorkflowStepInput = {
  sequence: number;
  type: "user" | "role";
  role?: Role;
  userId?: string;
  label?: string;
  required?: boolean;
};

type WorkflowConfigInput = {
  isManagerApproverRequired: boolean;
  approverSteps: WorkflowStepInput[];
  conditionalRule: {
    enabled: boolean;
    percentageThreshold?: number;
    specificApproverUserId?: string;
    specificApproverTitle?: string;
    operator: "OR" | "AND";
  };
};

const DEFAULT_WORKFLOW_CONFIG: WorkflowConfigInput = {
  isManagerApproverRequired: true,
  approverSteps: [],
  conditionalRule: {
    enabled: false,
    operator: "OR",
  },
};

function isRole(value: unknown): value is Role {
  return value === "admin" || value === "manager" || value === "employee";
}

function parseWorkflowJson(workflowJson: string): WorkflowConfigInput {
  if (!workflowJson.trim()) {
    return DEFAULT_WORKFLOW_CONFIG;
  }

  try {
    const parsed = JSON.parse(workflowJson) as Record<string, unknown>;
    const approverSteps = Array.isArray(parsed.approverSteps) ? parsed.approverSteps : [];
    const conditionalRule =
      typeof parsed.conditionalRule === "object" && parsed.conditionalRule !== null
        ? (parsed.conditionalRule as Record<string, unknown>)
        : {};

    return {
      isManagerApproverRequired: parsed.isManagerApproverRequired !== false,
      approverSteps: approverSteps.reduce<WorkflowStepInput[]>((acc, step, index) => {
        if (!step || typeof step !== "object") {
          return acc;
        }

        const stepRecord = step as Record<string, unknown>;
        const sequenceRaw = stepRecord.sequence;
        const sequence =
          typeof sequenceRaw === "number" && Number.isFinite(sequenceRaw) && sequenceRaw > 0
            ? Math.trunc(sequenceRaw)
            : index + 1;
        const type = stepRecord.type === "user" ? "user" : "role";
        const role = isRole(stepRecord.role) ? stepRecord.role : undefined;
        const userId = typeof stepRecord.userId === "string" ? stepRecord.userId : undefined;
        const label = typeof stepRecord.label === "string" ? stepRecord.label : undefined;
        const required = stepRecord.required !== false;

        acc.push({
          sequence,
          type,
          role,
          userId,
          label,
          required,
        });

        return acc;
      }, []),
      conditionalRule: {
        enabled: conditionalRule.enabled === true,
        percentageThreshold:
          typeof conditionalRule.percentageThreshold === "number" && Number.isFinite(conditionalRule.percentageThreshold)
            ? conditionalRule.percentageThreshold
            : undefined,
        specificApproverUserId:
          typeof conditionalRule.specificApproverUserId === "string" ? conditionalRule.specificApproverUserId : undefined,
        specificApproverTitle:
          typeof conditionalRule.specificApproverTitle === "string" ? conditionalRule.specificApproverTitle : undefined,
        operator: conditionalRule.operator === "AND" ? "AND" : "OR",
      },
    };
  } catch {
    return DEFAULT_WORKFLOW_CONFIG;
  }
}

interface AdminViewProps {
  company: Company;
  users: AuthUser[];
  workflowJson: string;
  isBusy: boolean;
  newUserForm: {
    name: string;
    email: string;
    password: string;
    role: Role;
    managerId: string;
    title: string;
  };
  setNewUserForm: (updater: (prev: AdminViewProps["newUserForm"]) => AdminViewProps["newUserForm"]) => void;
  onCreateUser: (e: FormEvent<HTMLFormElement>) => void;
  onUpdateUser: (
    userId: string,
    payload: {
      role?: Role;
      managerId?: string | null;
      title?: string;
      isActive?: boolean;
    },
  ) => void;
  onWorkflowChange: (val: string) => void;
  onWorkflowSave: () => void;
}

const ROLE_BADGE: Record<Role, { label: string; className: string }> = {
  admin:    { label: "Admin",    className: "bg-purple-50 text-purple-700 border-purple-200" },
  manager:  { label: "Manager",  className: "bg-blue-50 text-blue-700 border-blue-200" },
  employee: { label: "Employee", className: "bg-gray-50 text-gray-600 border-gray-200" },
};

export function AdminView({
  company,
  users,
  workflowJson,
  isBusy,
  newUserForm,
  setNewUserForm,
  onCreateUser,
  onUpdateUser,
  onWorkflowChange,
  onWorkflowSave,
}: AdminViewProps) {
  const managers = users.filter(u => u.role === "manager" || u.role === "admin");
  const activeUsers = users.filter((entry) => entry.isActive);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [editRole, setEditRole] = useState<Role>("employee");
  const [editManagerId, setEditManagerId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [showAdvancedWorkflow, setShowAdvancedWorkflow] = useState(false);

  const selectedUser = useMemo(
    () => users.find((entry) => entry.id === selectedUserId) ?? null,
    [users, selectedUserId],
  );

  const availableManagers = useMemo(
    () => managers.filter((entry) => entry.id !== selectedUserId),
    [managers, selectedUserId],
  );

  const workflowConfig = useMemo(() => parseWorkflowJson(workflowJson), [workflowJson]);

  function updateWorkflowConfig(nextConfig: WorkflowConfigInput) {
    onWorkflowChange(JSON.stringify(nextConfig, null, 2));
  }

  function updateWorkflowStep(index: number, updater: (currentStep: WorkflowStepInput) => WorkflowStepInput) {
    const nextSteps = workflowConfig.approverSteps.map((step, stepIndex) => {
      if (stepIndex !== index) {
        return step;
      }

      return updater(step);
    });

    updateWorkflowConfig({
      ...workflowConfig,
      approverSteps: nextSteps,
    });
  }

  function addWorkflowStep() {
    const lastSequence = workflowConfig.approverSteps.reduce((max, step) => Math.max(max, step.sequence), 0);

    updateWorkflowConfig({
      ...workflowConfig,
      approverSteps: [
        ...workflowConfig.approverSteps,
        {
          sequence: lastSequence + 1,
          type: "role",
          role: "manager",
          label: "",
          required: true,
        },
      ],
    });
  }

  function removeWorkflowStep(index: number) {
    updateWorkflowConfig({
      ...workflowConfig,
      approverSteps: workflowConfig.approverSteps.filter((_, stepIndex) => stepIndex !== index),
    });
  }

  function handleSelectedUserChange(nextUserId: string) {
    setSelectedUserId(nextUserId);

    const nextUser = users.find((entry) => entry.id === nextUserId);
    if (!nextUser) {
      setEditRole("employee");
      setEditManagerId("");
      setEditTitle("");
      setEditIsActive(true);
      return;
    }

    setEditRole(nextUser.role);
    setEditManagerId(nextUser.managerId ?? "");
    setEditTitle(nextUser.title ?? "");
    setEditIsActive(nextUser.isActive);
  }

  function handleSaveUserUpdates() {
    if (!selectedUserId) {
      return;
    }

    const payload: {
      role?: Role;
      managerId?: string | null;
      title?: string;
      isActive?: boolean;
    } = {
      role: editRole,
      title: editTitle.trim() || undefined,
      isActive: editIsActive,
    };

    if (editRole === "employee") {
      payload.managerId = editManagerId || null;
    } else {
      payload.managerId = null;
    }

    onUpdateUser(selectedUserId, payload);
  }

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#22c55e] mb-1">/ Admin View</p>
        <h1 className="font-playfair text-3xl font-bold text-[#1a1a1a]">Administration</h1>
        <p className="text-sm text-gray-500 mt-1">{company.name} · {company.country} · Base currency: <span className="font-semibold text-[#1a1a1a]">{company.baseCurrency}</span></p>
      </div>

      {/* Company Stats Header */}
      <div className="bg-[#18392b] rounded-2xl p-6 text-white relative overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />
        {/* Corner markers */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-[#22c55e]/40" />
        <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-[#22c55e]/40" />
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-[#22c55e]/40" />
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-[#22c55e]/40" />

        <div className="relative z-10 flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <GlobeAltIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#a7f3d0]/60">Company Workspace</p>
              <h2 className="font-playfair text-2xl font-bold">{company.name}</h2>
              <p className="text-[#a7f3d0]/60 text-sm">{company.country}</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
            <div className="h-2 w-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#a7f3d0]">Admin Portal</span>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
          {[
            { n: users.length, label: "Total Users" },
            { n: users.filter(u => u.role === "manager").length, label: "Managers" },
            { n: users.filter(u => u.role === "employee").length, label: "Employees" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="font-playfair text-3xl font-bold">{s.n}</p>
              <p className="text-[11px] font-mono uppercase tracking-widest text-[#a7f3d0]/60 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Provision User */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#e5e7eb] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#22c55e]/40" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#22c55e]/40" />
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0fdf4] text-[#22c55e]">
                <UserPlusIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1a1a1a]">Provision New User</h3>
                <p className="text-[11px] font-mono text-gray-400 mt-0.5 uppercase tracking-wider">Create user and assign role</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <form onSubmit={onCreateUser} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">Full Name</Label>
                  <Input required placeholder="Sarah Johnson" value={newUserForm.name}
                    onChange={(e) => setNewUserForm(c => ({ ...c, name: e.target.value }))}
                    className="h-10 rounded-xl border-gray-200 focus-visible:ring-[#22c55e]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">Work Email</Label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input required type="email" placeholder="sarah@company.com" value={newUserForm.email}
                      onChange={(e) => setNewUserForm(c => ({ ...c, email: e.target.value }))}
                      className="pl-9 h-10 rounded-xl border-gray-200 focus-visible:ring-[#22c55e]" />
                  </div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">Password</Label>
                  <Input required type="password" placeholder="••••••••" value={newUserForm.password}
                    onChange={(e) => setNewUserForm(c => ({ ...c, password: e.target.value }))}
                    className="h-10 rounded-xl border-gray-200 focus-visible:ring-[#22c55e]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">Role</Label>
                  <select
                    className="flex h-10 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22c55e]"
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm(c => ({ ...c, role: e.target.value as Role, managerId: "" }))}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">Job Title <span className="normal-case font-normal text-gray-400">(optional)</span></Label>
                  <Input placeholder="Senior Engineer" value={newUserForm.title}
                    onChange={(e) => setNewUserForm(c => ({ ...c, title: e.target.value }))}
                    className="h-10 rounded-xl border-gray-200 focus-visible:ring-[#22c55e]" />
                </div>
                {newUserForm.role === "employee" && (
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">Reporting Manager</Label>
                    <select
                      className="flex h-10 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22c55e]"
                      value={newUserForm.managerId}
                      onChange={(e) => setNewUserForm(c => ({ ...c, managerId: e.target.value }))}
                    >
                      <option value="">No Manager</option>
                      {managers.map(m => (
                        <option key={m.id} value={m.id}>{m.name}{m.title ? ` (${m.title})` : ""}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <Button type="submit" disabled={isBusy}
                className="w-full h-11 rounded-xl bg-[#18392b] hover:bg-[#0f2219] text-white font-semibold text-sm border-none shadow-none">
                {isBusy ? "Creating…" : "Provision License"}
              </Button>
            </form>
          </div>
        </div>

        {/* Workflow Config */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#e5e7eb] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#22c55e]/40" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#22c55e]/40" />
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                <Cog6ToothIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1a1a1a]">Approval Workflow</h3>
                <p className="text-[11px] font-mono text-gray-400 mt-0.5 uppercase tracking-wider">Easy mode configuration</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <p className="text-xs text-gray-500 leading-relaxed">
              Use simple controls to define who approves expenses. We will generate the technical JSON for you automatically.
            </p>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={workflowConfig.isManagerApproverRequired}
                onChange={(e) =>
                  updateWorkflowConfig({
                    ...workflowConfig,
                    isManagerApproverRequired: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-gray-300 text-[#22c55e] focus:ring-[#22c55e]"
              />
              Always require the submitter&apos;s manager to approve first
            </label>

            <div className="space-y-3 rounded-xl border border-gray-200 p-4 bg-[#fafafa]">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-[#1a1a1a]">Approver chain</h4>
                <Button
                  type="button"
                  onClick={addWorkflowStep}
                  className="h-8 rounded-lg bg-white text-[#18392b] border border-gray-200 hover:bg-gray-50"
                >
                  Add step
                </Button>
              </div>

              {workflowConfig.approverSteps.length === 0 && (
                <p className="text-xs text-gray-500">No extra approvers configured yet.</p>
              )}

              <div className="space-y-3">
                {workflowConfig.approverSteps.map((step, index) => (
                  <div key={`${step.sequence}-${index}`} className="rounded-xl border border-gray-200 bg-white p-3 space-y-3">
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">Order</Label>
                        <Input
                          type="number"
                          min={1}
                          value={step.sequence}
                          onChange={(e) => {
                            const nextSequence = Number.parseInt(e.target.value, 10);
                            updateWorkflowStep(index, (currentStep) => ({
                              ...currentStep,
                              sequence: Number.isNaN(nextSequence) || nextSequence < 1 ? 1 : nextSequence,
                            }));
                          }}
                          className="h-10 rounded-xl border-gray-200 focus-visible:ring-[#22c55e]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">Type</Label>
                        <select
                          className="flex h-10 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22c55e]"
                          value={step.type}
                          onChange={(e) => {
                            const nextType = e.target.value as "user" | "role";
                            const fallbackUserId = activeUsers[0]?.id ?? "";
                            updateWorkflowStep(index, (currentStep) =>
                              nextType === "user"
                                ? {
                                    ...currentStep,
                                    type: "user",
                                    userId: currentStep.userId ?? fallbackUserId,
                                    role: undefined,
                                  }
                                : {
                                    ...currentStep,
                                    type: "role",
                                    role: currentStep.role ?? "manager",
                                    userId: undefined,
                                  },
                            );
                          }}
                        >
                          <option value="role">Role</option>
                          <option value="user">Specific user</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">Required</Label>
                        <label className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={step.required !== false}
                            onChange={(e) =>
                              updateWorkflowStep(index, (currentStep) => ({
                                ...currentStep,
                                required: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 rounded border-gray-300 text-[#22c55e] focus:ring-[#22c55e]"
                          />
                          Must approve
                        </label>
                      </div>
                    </div>

                    {step.type === "role" ? (
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">Role approver</Label>
                        <select
                          className="flex h-10 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22c55e]"
                          value={step.role ?? "manager"}
                          onChange={(e) =>
                            updateWorkflowStep(index, (currentStep) => ({
                              ...currentStep,
                              role: e.target.value as Role,
                            }))
                          }
                        >
                          <option value="manager">Manager</option>
                          <option value="admin">Administrator</option>
                          <option value="employee">Employee</option>
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">Specific approver</Label>
                        <select
                          className="flex h-10 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22c55e]"
                          value={step.userId ?? ""}
                          onChange={(e) =>
                            updateWorkflowStep(index, (currentStep) => ({
                              ...currentStep,
                              userId: e.target.value,
                            }))
                          }
                        >
                          <option value="">Select user…</option>
                          {activeUsers.map((entry) => (
                            <option key={entry.id} value={entry.id}>
                              {entry.name} ({entry.role})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">Label (optional)</Label>
                      <Input
                        value={step.label ?? ""}
                        onChange={(e) =>
                          updateWorkflowStep(index, (currentStep) => ({
                            ...currentStep,
                            label: e.target.value,
                          }))
                        }
                        placeholder="Finance review"
                        className="h-10 rounded-xl border-gray-200 focus-visible:ring-[#22c55e]"
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={() => removeWorkflowStep(index)}
                      className="h-9 rounded-lg bg-white text-[#991b1b] border border-red-200 hover:bg-red-50"
                    >
                      Remove step
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-gray-200 p-4 bg-[#fafafa]">
              <h4 className="text-sm font-semibold text-[#1a1a1a]">Smart completion rule (optional)</h4>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={workflowConfig.conditionalRule.enabled}
                  onChange={(e) =>
                    updateWorkflowConfig({
                      ...workflowConfig,
                      conditionalRule: {
                        ...workflowConfig.conditionalRule,
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-[#22c55e] focus:ring-[#22c55e]"
                />
                Enable early completion logic
              </label>

              {workflowConfig.conditionalRule.enabled && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">Rule logic</Label>
                    <select
                      className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22c55e]"
                      value={workflowConfig.conditionalRule.operator}
                      onChange={(e) =>
                        updateWorkflowConfig({
                          ...workflowConfig,
                          conditionalRule: {
                            ...workflowConfig.conditionalRule,
                            operator: e.target.value === "AND" ? "AND" : "OR",
                          },
                        })
                      }
                    >
                      <option value="OR">Any enabled condition can pass</option>
                      <option value="AND">All enabled conditions must pass</option>
                    </select>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">Minimum approval %</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={workflowConfig.conditionalRule.percentageThreshold ?? ""}
                        onChange={(e) => {
                          const value = e.target.value.trim();
                          const parsedValue = Number.parseInt(value, 10);

                          updateWorkflowConfig({
                            ...workflowConfig,
                            conditionalRule: {
                              ...workflowConfig.conditionalRule,
                              percentageThreshold: value === "" || Number.isNaN(parsedValue) ? undefined : parsedValue,
                            },
                          });
                        }}
                        placeholder="e.g. 60"
                        className="h-10 rounded-xl border-gray-200 focus-visible:ring-[#22c55e]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">Specific user can satisfy rule</Label>
                      <select
                        className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22c55e]"
                        value={workflowConfig.conditionalRule.specificApproverUserId ?? ""}
                        onChange={(e) =>
                          updateWorkflowConfig({
                            ...workflowConfig,
                            conditionalRule: {
                              ...workflowConfig.conditionalRule,
                              specificApproverUserId: e.target.value || undefined,
                            },
                          })
                        }
                      >
                        <option value="">None</option>
                        {activeUsers.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.name} ({entry.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">Specific title can satisfy rule</Label>
                    <Input
                      value={workflowConfig.conditionalRule.specificApproverTitle ?? ""}
                      onChange={(e) =>
                        updateWorkflowConfig({
                          ...workflowConfig,
                          conditionalRule: {
                            ...workflowConfig.conditionalRule,
                            specificApproverTitle: e.target.value.trim() ? e.target.value : undefined,
                          },
                        })
                      }
                      placeholder="e.g. CFO"
                      className="h-10 rounded-xl border-gray-200 focus-visible:ring-[#22c55e]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Button
                type="button"
                onClick={() => setShowAdvancedWorkflow((current) => !current)}
                className="w-full h-10 rounded-xl bg-white text-[#18392b] border border-gray-200 hover:bg-gray-50"
              >
                {showAdvancedWorkflow ? "Hide raw JSON" : "Show raw JSON"}
              </Button>

              {showAdvancedWorkflow && (
                <Textarea
                  value={workflowJson}
                  onChange={(e) => onWorkflowChange(e.target.value)}
                  rows={10}
                  className="font-mono text-xs leading-relaxed bg-white resize-none border-gray-200 rounded-xl focus-visible:ring-[#22c55e]"
                  placeholder='{ "isManagerApproverRequired": true, "approverSteps": [] }'
                />
              )}
            </div>

            <Button
              onClick={onWorkflowSave}
              disabled={isBusy}
              className="w-full h-11 rounded-xl bg-[#18392b] hover:bg-[#0f2219] text-white font-semibold text-sm border-none shadow-none"
            >
              {isBusy ? "Saving…" : "Save Workflow Rules"}
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Existing User */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[#e5e7eb] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#22c55e]/40" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#22c55e]/40" />
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0fdf4] text-[#22c55e]">
              <UsersIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1a1a1a]">Manage Existing User</h3>
              <p className="text-[11px] font-mono text-gray-400 mt-0.5 uppercase tracking-wider">
                Change role, manager, title, and active state
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">Select User</Label>
            <select
              className="flex h-10 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22c55e]"
              value={selectedUserId}
              onChange={(e) => handleSelectedUserChange(e.target.value)}
            >
              <option value="">Choose a user…</option>
              {users.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name} ({entry.role})
                </option>
              ))}
            </select>
          </div>

          {selectedUser && (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">Role</Label>
                  <select
                    className="flex h-10 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22c55e]"
                    value={editRole}
                    onChange={(e) => {
                      const nextRole = e.target.value as Role;
                      setEditRole(nextRole);
                      if (nextRole !== "employee") {
                        setEditManagerId("");
                      }
                    }}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">Job Title</Label>
                  <Input
                    placeholder="Team Lead"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-10 rounded-xl border-gray-200 focus-visible:ring-[#22c55e]"
                  />
                </div>
              </div>

              {editRole === "employee" && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400">
                    Reporting Manager
                  </Label>
                  <select
                    className="flex h-10 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22c55e]"
                    value={editManagerId}
                    onChange={(e) => setEditManagerId(e.target.value)}
                  >
                    <option value="">Select manager…</option>
                    {availableManagers.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.name} ({entry.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#22c55e] focus:ring-[#22c55e]"
                />
                User is active
              </label>

              <Button
                type="button"
                disabled={isBusy}
                onClick={handleSaveUserUpdates}
                className="w-full h-11 rounded-xl bg-[#18392b] hover:bg-[#0f2219] text-white font-semibold text-sm border-none shadow-none"
              >
                {isBusy ? "Updating…" : "Save User Changes"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Users Directory */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[#e5e7eb] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#22c55e]/40" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#22c55e]/40" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0fdf4] text-[#22c55e]">
                <UsersIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1a1a1a]">Team Directory</h3>
                <p className="text-[11px] font-mono text-gray-400 mt-0.5 uppercase tracking-wider">{company.name} · {users.length} members</p>
              </div>
            </div>
            <Badge className="bg-[#f0fdf4] text-[#166534] border-[#bbf7d0] border text-[10px] font-mono">{users.length} total</Badge>
          </div>
        </div>
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <UsersIcon className="h-10 w-10 mb-3 text-gray-200" />
            <p className="font-playfair font-bold text-gray-400">No users yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            <div className="hidden md:grid md:grid-cols-12 px-6 py-3 bg-[#fafafa] border-b border-gray-50">
              {["Name & Title", "Email", "Role", "Status"].map((h, i) => (
                <div key={h} className={`text-[10px] font-mono uppercase tracking-widest text-gray-400 ${
                  i === 0 ? "col-span-4" : i === 1 ? "col-span-4" : i === 2 ? "col-span-2" : "col-span-2 text-right"
                }`}>{h}</div>
              ))}
            </div>
            {users.map((u) => {
              const rb = ROLE_BADGE[u.role];
              const managerName = u.managerId ? users.find(m => m.id === u.managerId)?.name : null;
              return (
                <div key={u.id} className="px-6 py-3.5 hover:bg-[#fafafa] transition-colors">
                  {/* Mobile */}
                  <div className="md:hidden flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#1a1a1a]">{u.name}</span>
                        {u.title && <span className="text-xs text-gray-400">· {u.title}</span>}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-gray-400 mt-0.5">
                        <EnvelopeIcon className="h-3.5 w-3.5" />{u.email}
                      </div>
                      {managerName && <p className="text-[11px] text-gray-400 mt-0.5">↳ {managerName}</p>}
                    </div>
                    <Badge className={`text-[10px] border font-mono ${rb.className}`}>{rb.label}</Badge>
                  </div>
                  {/* Desktop */}
                  <div className="hidden md:grid md:grid-cols-12 items-center gap-2">
                    <div className="col-span-4">
                      <p className="font-semibold text-sm text-[#1a1a1a]">{u.name}</p>
                      {u.title && <p className="text-[11px] text-gray-500">{u.title}</p>}
                      {managerName && <p className="text-[11px] font-mono text-gray-400">↳ {managerName}</p>}
                    </div>
                    <div className="col-span-4 flex items-center gap-1.5">
                      <EnvelopeIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-600 truncate">{u.email}</span>
                    </div>
                    <div className="col-span-2">
                      <Badge className={`text-[10px] border font-mono uppercase tracking-wider ${rb.className}`}>{rb.label}</Badge>
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full ${
                        u.isActive ? "bg-[#f0fdf4] text-[#166534]" : "bg-gray-100 text-gray-500"
                      }`}>
                        <CheckBadgeIcon className="h-3 w-3" />
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
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
